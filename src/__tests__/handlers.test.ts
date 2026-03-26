import { handleTool } from "../handlers";
import { ForgejoClient } from "../forgejo-client";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

function ok(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

const client = new ForgejoClient({
  baseUrl: "https://codeberg.org",
  token: "tok",
});

describe("handleTool – search_issues", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns formatted issues", async () => {
    mockFetch.mockResolvedValueOnce(
      ok([
        {
          id: 1,
          number: 42,
          title: "Fix the bug",
          body: "Details here",
          state: "open",
          html_url: "https://codeberg.org/owner/repo/issues/42",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
          user: { id: 10, login: "alice", full_name: "Alice", email: "", avatar_url: "", html_url: "" },
          assignees: [],
          labels: [{ id: 1, name: "bug", color: "ee0701", description: "", url: "" }],
          milestone: null,
          comments: 3,
        },
      ]),
    );

    const result = await handleTool(client, "search_issues", {
      q: "bug",
      state: "open",
    });

    expect(result).toContain("Fix the bug");
    expect(result).toContain("#42");
    expect(result).toContain("alice");
    expect(result).toContain("bug");
    expect(result).toContain("Comments: 3");
  });

  it("returns a no-results message when empty", async () => {
    mockFetch.mockResolvedValueOnce(ok([]));
    const result = await handleTool(client, "search_issues", {});
    expect(result).toContain("No issues found");
  });

  it("passes correct query params to the API", async () => {
    mockFetch.mockResolvedValueOnce(ok([]));
    await handleTool(client, "search_issues", {
      q: "login",
      type: "pulls",
      assigned: true,
      page: 2,
      limit: 5,
    });
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("q=login");
    expect(url).toContain("type=pulls");
    expect(url).toContain("assigned=true");
    expect(url).toContain("page=2");
    expect(url).toContain("limit=5");
  });
});

describe("handleTool – get_repo", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns formatted repository info", async () => {
    mockFetch.mockResolvedValueOnce(
      ok({
        id: 1,
        name: "forgejo-mcp",
        full_name: "alice/forgejo-mcp",
        description: "An MCP server",
        private: false,
        fork: false,
        html_url: "https://codeberg.org/alice/forgejo-mcp",
        clone_url: "",
        ssh_url: "",
        stars_count: 5,
        forks_count: 2,
        open_issues_count: 1,
        default_branch: "main",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-10T00:00:00Z",
        owner: { id: 10, login: "alice", full_name: "Alice", email: "", avatar_url: "", html_url: "" },
        archived: false,
        empty: false,
      }),
    );

    const result = await handleTool(client, "get_repo", {
      owner: "alice",
      repo: "forgejo-mcp",
    });

    expect(result).toContain("alice/forgejo-mcp");
    expect(result).toContain("An MCP server");
    expect(result).toContain("Stars: 5");
  });
});

describe("handleTool – create_issue", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns the created issue details", async () => {
    mockFetch.mockResolvedValueOnce(
      ok({
        id: 99,
        number: 10,
        title: "New feature request",
        body: "Please add X",
        state: "open",
        html_url: "https://codeberg.org/alice/repo/issues/10",
        created_at: "2024-05-01T00:00:00Z",
        updated_at: "2024-05-01T00:00:00Z",
        user: { id: 10, login: "alice", full_name: "", email: "", avatar_url: "", html_url: "" },
        assignees: null,
        labels: [],
        milestone: null,
        comments: 0,
      }),
    );

    const result = await handleTool(client, "create_issue", {
      owner: "alice",
      repo: "repo",
      title: "New feature request",
      body: "Please add X",
    });

    expect(result).toContain("Issue created successfully");
    expect(result).toContain("New feature request");
    expect(result).toContain("#10");
  });
});

describe("handleTool – get_user", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns authenticated user info", async () => {
    mockFetch.mockResolvedValueOnce(
      ok({
        id: 1,
        login: "alice",
        full_name: "Alice Wonderland",
        email: "alice@example.com",
        avatar_url: "https://codeberg.org/alice.png",
        html_url: "https://codeberg.org/alice",
        is_admin: false,
      }),
    );

    const result = await handleTool(client, "get_user", {});
    expect(result).toContain("alice");
    expect(result).toContain("Alice Wonderland");
    expect(result).toContain("alice@example.com");
  });
});

describe("handleTool – unknown tool", () => {
  it("throws for an unknown tool name", async () => {
    await expect(
      handleTool(client, "nonexistent_tool", {}),
    ).rejects.toThrow("Unknown tool: nonexistent_tool");
  });
});
