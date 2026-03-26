#!/usr/bin/env node
/**
 * Forgejo MCP Server
 *
 * A Model Context Protocol (MCP) server that lets AI agents interact with a
 * Forgejo instance using a personal access token.
 *
 * Configuration (environment variables):
 *   FORGEJO_URL   – Base URL of the Forgejo instance (e.g. https://codeberg.org)
 *   FORGEJO_TOKEN – Personal access token with the required scopes
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ForgejoClient, ForgejoError } from "./forgejo-client.js";
import { TOOLS } from "./tools.js";
import { handleTool } from "./handlers.js";

function getConfig(): { baseUrl: string; token: string } {
  const baseUrl = process.env.FORGEJO_URL;
  const token = process.env.FORGEJO_TOKEN;

  if (!baseUrl) {
    console.error(
      "Error: FORGEJO_URL environment variable is required.\n" +
        "Example: FORGEJO_URL=https://codeberg.org",
    );
    process.exit(1);
  }
  if (!token) {
    console.error(
      "Error: FORGEJO_TOKEN environment variable is required.\n" +
        "Generate a token at: <your-forgejo-instance>/user/settings/applications",
    );
    process.exit(1);
  }

  return { baseUrl, token };
}

async function main(): Promise<void> {
  const config = getConfig();
  const client = new ForgejoClient(config);

  const server = new Server(
    { name: "forgejo-mcp", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {} } },
  );

  // Register the resource list handler
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "forgejo://server/info",
        name: "Forgejo Server Info",
        description:
          "Connected Forgejo instance URL and authenticated user details",
        mimeType: "application/json",
      },
    ],
  }));

  // Register the resource read handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    if (uri === "forgejo://server/info") {
      let payload: Record<string, unknown>;
      try {
        const user = await client.get<Record<string, unknown>>("/user");
        payload = { url: config.baseUrl, user };
      } catch (err) {
        if (err instanceof ForgejoError) {
          payload = {
            url: config.baseUrl,
            error: `${err.message} (status ${err.status})`,
          };
        } else {
          throw err;
        }
      }
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(payload, null, 2),
          },
        ],
      };
    }
    throw new Error(`Unknown resource: ${uri}`);
  });

  // Register the tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Register the tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const result = await handleTool(client, name, (args ?? {}) as Record<string, unknown>);
    return {
      content: [{ type: "text", text: result }],
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Forgejo MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
