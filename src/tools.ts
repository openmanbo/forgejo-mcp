import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * All MCP tool definitions for the Forgejo MCP server.
 */
export const TOOLS: Tool[] = [
  {
    name: "search_issues",
    description:
      "Search for issues and pull requests across all repositories on the Forgejo instance. " +
      "Uses GET /api/v1/repos/issues/search.",
    inputSchema: {
      type: "object",
      properties: {
        q: {
          type: "string",
          description: "Keyword to search in issue titles and bodies.",
        },
        type: {
          type: "string",
          enum: ["issues", "pulls"],
          description:
            "Filter by type: 'issues' for issues only, 'pulls' for pull requests only.",
        },
        state: {
          type: "string",
          enum: ["open", "closed"],
          description: "Filter by issue state. Defaults to open.",
        },
        labels: {
          type: "string",
          description: "Comma-separated list of label names to filter by.",
        },
        owner: {
          type: "string",
          description: "Filter issues by repository owner (user or org login).",
        },
        team: {
          type: "string",
          description:
            "Filter issues by team (requires 'owner' to be an organization).",
        },
        assigned: {
          type: "boolean",
          description: "Only return issues assigned to the authenticated user.",
        },
        created: {
          type: "boolean",
          description: "Only return issues created by the authenticated user.",
        },
        mentioned: {
          type: "boolean",
          description:
            "Only return issues that mention the authenticated user.",
        },
        review_requested: {
          type: "boolean",
          description:
            "Only return pull requests requesting a review from the authenticated user.",
        },
        since: {
          type: "string",
          description:
            "Only show issues updated after this date (ISO 8601 / RFC 3339).",
        },
        before: {
          type: "string",
          description:
            "Only show issues updated before this date (ISO 8601 / RFC 3339).",
        },
        page: {
          type: "integer",
          description: "Page number for pagination (1-based). Default: 1.",
          minimum: 1,
        },
        limit: {
          type: "integer",
          description: "Results per page (max 50). Default: 10.",
          minimum: 1,
          maximum: 50,
        },
      },
    },
  },
  {
    name: "list_issues",
    description:
      "List issues in a specific repository. Uses GET /api/v1/repos/{owner}/{repo}/issues.",
    inputSchema: {
      type: "object",
      required: ["owner", "repo"],
      properties: {
        owner: {
          type: "string",
          description: "Repository owner (user or org login).",
        },
        repo: {
          type: "string",
          description: "Repository name.",
        },
        state: {
          type: "string",
          enum: ["open", "closed", "all"],
          description: "Filter by state. Default: open.",
        },
        type: {
          type: "string",
          enum: ["issues", "pulls"],
          description: "Filter by type.",
        },
        labels: {
          type: "string",
          description: "Comma-separated list of label names.",
        },
        page: {
          type: "integer",
          description: "Page number for pagination (1-based).",
          minimum: 1,
        },
        limit: {
          type: "integer",
          description: "Results per page (max 50). Default: 10.",
          minimum: 1,
          maximum: 50,
        },
      },
    },
  },
  {
    name: "get_issue",
    description:
      "Get details of a specific issue or pull request. Uses GET /api/v1/repos/{owner}/{repo}/issues/{index}.",
    inputSchema: {
      type: "object",
      required: ["owner", "repo", "index"],
      properties: {
        owner: {
          type: "string",
          description: "Repository owner.",
        },
        repo: {
          type: "string",
          description: "Repository name.",
        },
        index: {
          type: "integer",
          description: "Issue or pull request number.",
          minimum: 1,
        },
      },
    },
  },
  {
    name: "create_issue",
    description:
      "Create a new issue in a repository. Uses POST /api/v1/repos/{owner}/{repo}/issues.",
    inputSchema: {
      type: "object",
      required: ["owner", "repo", "title"],
      properties: {
        owner: {
          type: "string",
          description: "Repository owner.",
        },
        repo: {
          type: "string",
          description: "Repository name.",
        },
        title: {
          type: "string",
          description: "Title of the issue.",
        },
        body: {
          type: "string",
          description: "Description / body of the issue (Markdown supported).",
        },
        assignees: {
          type: "array",
          items: { type: "string" },
          description: "List of user logins to assign to the issue.",
        },
        labels: {
          type: "array",
          items: { type: "integer" },
          description: "List of label IDs to attach.",
        },
        milestone: {
          type: "integer",
          description: "Milestone ID to associate with the issue.",
        },
      },
    },
  },
  {
    name: "edit_issue",
    description:
      "Edit an existing issue (change title, body, state, assignees, etc.). " +
      "Uses PATCH /api/v1/repos/{owner}/{repo}/issues/{index}.",
    inputSchema: {
      type: "object",
      required: ["owner", "repo", "index"],
      properties: {
        owner: { type: "string", description: "Repository owner." },
        repo: { type: "string", description: "Repository name." },
        index: {
          type: "integer",
          description: "Issue number.",
          minimum: 1,
        },
        title: { type: "string", description: "New title." },
        body: { type: "string", description: "New body." },
        state: {
          type: "string",
          enum: ["open", "closed"],
          description: "New state.",
        },
        assignees: {
          type: "array",
          items: { type: "string" },
          description: "New list of assignee logins (replaces existing).",
        },
        milestone: {
          type: "integer",
          description: "Milestone ID (use 0 to clear).",
        },
      },
    },
  },
  {
    name: "list_issue_comments",
    description:
      "List comments on an issue or pull request. " +
      "Uses GET /api/v1/repos/{owner}/{repo}/issues/{index}/comments.",
    inputSchema: {
      type: "object",
      required: ["owner", "repo", "index"],
      properties: {
        owner: { type: "string", description: "Repository owner." },
        repo: { type: "string", description: "Repository name." },
        index: {
          type: "integer",
          description: "Issue number.",
          minimum: 1,
        },
        page: { type: "integer", description: "Page number.", minimum: 1 },
        limit: {
          type: "integer",
          description: "Results per page (max 50).",
          minimum: 1,
          maximum: 50,
        },
      },
    },
  },
  {
    name: "create_comment",
    description:
      "Add a comment to an issue or pull request. " +
      "Uses POST /api/v1/repos/{owner}/{repo}/issues/{index}/comments.",
    inputSchema: {
      type: "object",
      required: ["owner", "repo", "index", "body"],
      properties: {
        owner: { type: "string", description: "Repository owner." },
        repo: { type: "string", description: "Repository name." },
        index: {
          type: "integer",
          description: "Issue number.",
          minimum: 1,
        },
        body: { type: "string", description: "Comment text (Markdown)." },
      },
    },
  },
  {
    name: "search_repos",
    description:
      "Search for repositories on the Forgejo instance. Uses GET /api/v1/repos/search.",
    inputSchema: {
      type: "object",
      properties: {
        q: {
          type: "string",
          description: "Keyword to search in repository name/description.",
        },
        topic: {
          type: "boolean",
          description: "Whether to search by topic.",
        },
        include_desc: {
          type: "boolean",
          description: "Include description in search.",
        },
        owner: {
          type: "string",
          description: "Filter by owner (user or org login).",
        },
        is_private: {
          type: "boolean",
          description: "Filter private or public repos.",
        },
        archived: {
          type: "boolean",
          description: "Include archived repositories.",
        },
        page: { type: "integer", description: "Page number.", minimum: 1 },
        limit: {
          type: "integer",
          description: "Results per page (max 50).",
          minimum: 1,
          maximum: 50,
        },
      },
    },
  },
  {
    name: "get_repo",
    description:
      "Get details of a specific repository. Uses GET /api/v1/repos/{owner}/{repo}.",
    inputSchema: {
      type: "object",
      required: ["owner", "repo"],
      properties: {
        owner: { type: "string", description: "Repository owner." },
        repo: { type: "string", description: "Repository name." },
      },
    },
  },
  {
    name: "get_user",
    description:
      "Get the profile of the currently authenticated user. Uses GET /api/v1/user.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_user_info",
    description:
      "Get the public profile of any user by login. Uses GET /api/v1/users/{username}.",
    inputSchema: {
      type: "object",
      required: ["username"],
      properties: {
        username: { type: "string", description: "The user's login name." },
      },
    },
  },
  {
    name: "list_notifications",
    description:
      "List notifications for the authenticated user. Uses GET /api/v1/notifications.",
    inputSchema: {
      type: "object",
      properties: {
        all: {
          type: "boolean",
          description:
            "If true, return all notifications including already read ones.",
        },
        since: {
          type: "string",
          description: "Only show notifications updated after this date.",
        },
        before: {
          type: "string",
          description: "Only show notifications updated before this date.",
        },
        page: { type: "integer", description: "Page number.", minimum: 1 },
        limit: {
          type: "integer",
          description: "Results per page (max 50).",
          minimum: 1,
          maximum: 50,
        },
      },
    },
  },
];
