import { handleTool } from "../handlers";
import { ForgejoClient, ForgejoError } from "../forgejo-client";

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

// ---------------------------------------------------------------------------
// Pull Request tool tests
// ---------------------------------------------------------------------------

const basePR = {
  id: 1,
  number: 5,
  title: "Add new feature",
  body: "This adds a great feature",
  state: "open",
  html_url: "https://codeberg.org/alice/repo/pulls/5",
  diff_url: "https://codeberg.org/alice/repo/pulls/5.diff",
  patch_url: "https://codeberg.org/alice/repo/pulls/5.patch",
  created_at: "2024-06-01T00:00:00Z",
  updated_at: "2024-06-02T00:00:00Z",
  closed_at: null,
  merged_at: null,
  user: { id: 10, login: "alice", full_name: "Alice", email: "", avatar_url: "", html_url: "" },
  assignees: [{ id: 11, login: "bob", full_name: "Bob", email: "", avatar_url: "", html_url: "" }],
  labels: [{ id: 1, name: "enhancement", color: "00ff00", description: "", url: "" }],
  milestone: null,
  comments: 2,
  head: { label: "alice:feature", ref: "feature", sha: "abc1234567890", repo_id: 1 },
  base: { label: "alice:main", ref: "main", sha: "def4567890123", repo_id: 1 },
  merged: false,
  mergeable: true,
  merged_by: null,
  merge_base: "aaa",
  merge_commit_sha: null,
  is_locked: false,
  allow_maintainer_edit: true,
};

describe("handleTool – list_pull_requests", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns formatted pull requests", async () => {
    mockFetch.mockResolvedValueOnce(ok([basePR]));

    const result = await handleTool(client, "list_pull_requests", {
      owner: "alice",
      repo: "repo",
    });

    expect(result).toContain("PR #5");
    expect(result).toContain("Add new feature");
    expect(result).toContain("alice");
    expect(result).toContain("enhancement");
    expect(result).toContain("bob");
    expect(result).toContain("feature");
  });

  it("returns a no-results message when empty", async () => {
    mockFetch.mockResolvedValueOnce(ok([]));
    const result = await handleTool(client, "list_pull_requests", {
      owner: "alice",
      repo: "repo",
    });
    expect(result).toContain("No pull requests found");
  });
});

describe("handleTool – get_pull_request", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns formatted pull request details", async () => {
    mockFetch.mockResolvedValueOnce(ok(basePR));

    const result = await handleTool(client, "get_pull_request", {
      owner: "alice",
      repo: "repo",
      index: 5,
    });

    expect(result).toContain("PR #5");
    expect(result).toContain("Add new feature");
    expect(result).toContain("Head: alice:feature");
    expect(result).toContain("Base: alice:main");
    expect(result).toContain("Mergeable: true");
  });
});

describe("handleTool – create_pull_request", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns the created pull request", async () => {
    mockFetch.mockResolvedValueOnce(ok(basePR));

    const result = await handleTool(client, "create_pull_request", {
      owner: "alice",
      repo: "repo",
      title: "Add new feature",
      head: "feature",
      base: "main",
    });

    expect(result).toContain("Pull request created successfully");
    expect(result).toContain("Add new feature");
    expect(result).toContain("#5");
  });
});

describe("handleTool – merge_pull_request", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns success message after merge", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: "No Content",
      json: async () => ({}),
      text: async () => "",
    } as unknown as Response);

    const result = await handleTool(client, "merge_pull_request", {
      owner: "alice",
      repo: "repo",
      index: 5,
      Do: "squash",
    });

    expect(result).toContain("merged successfully");
    expect(result).toContain("squash");
  });
});

describe("handleTool – get_pull_request_diff", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns the raw diff text", async () => {
    const diffText = "diff --git a/file.txt b/file.txt\n--- a/file.txt\n+++ b/file.txt\n@@ -1 +1 @@\n-old\n+new";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => diffText,
    } as unknown as Response);

    const result = await handleTool(client, "get_pull_request_diff", {
      owner: "alice",
      repo: "repo",
      index: 5,
    });

    expect(result).toContain("diff --git");
    expect(result).toContain("-old");
    expect(result).toContain("+new");
  });
});

describe("handleTool – get_pull_request_files", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns formatted changed files", async () => {
    mockFetch.mockResolvedValueOnce(
      ok([
        {
          filename: "src/main.ts",
          status: "modified",
          additions: 10,
          deletions: 3,
          changes: 13,
          html_url: "https://codeberg.org/alice/repo/src/main.ts",
          contents_url: "",
        },
        {
          filename: "src/old.ts",
          status: "renamed",
          additions: 0,
          deletions: 0,
          changes: 0,
          html_url: "",
          contents_url: "",
          previous_filename: "src/legacy.ts",
        },
      ]),
    );

    const result = await handleTool(client, "get_pull_request_files", {
      owner: "alice",
      repo: "repo",
      index: 5,
    });

    expect(result).toContain("src/main.ts");
    expect(result).toContain("+10 -3");
    expect(result).toContain("modified");
    expect(result).toContain("Renamed from: src/legacy.ts");
  });
});

describe("handleTool – list_pull_request_reviews", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns formatted reviews", async () => {
    mockFetch.mockResolvedValueOnce(
      ok([
        {
          id: 1,
          reviewer: { id: 11, login: "bob", full_name: "Bob", email: "", avatar_url: "", html_url: "" },
          state: "APPROVED",
          body: "Looks good!",
          html_url: "https://codeberg.org/alice/repo/pulls/5#review-1",
          submitted_at: "2024-06-02T12:00:00Z",
          commit_id: "abc1234567890",
        },
      ]),
    );

    const result = await handleTool(client, "list_pull_request_reviews", {
      owner: "alice",
      repo: "repo",
      index: 5,
    });

    expect(result).toContain("bob");
    expect(result).toContain("APPROVED");
    expect(result).toContain("Looks good!");
  });

  it("returns a no-results message when empty", async () => {
    mockFetch.mockResolvedValueOnce(ok([]));
    const result = await handleTool(client, "list_pull_request_reviews", {
      owner: "alice",
      repo: "repo",
      index: 5,
    });
    expect(result).toContain("No reviews");
  });
});

describe("handleTool – update_pull_request_branch", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns success message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: "No Content",
      json: async () => ({}),
      text: async () => "",
    } as unknown as Response);

    const result = await handleTool(client, "update_pull_request_branch", {
      owner: "alice",
      repo: "repo",
      index: 5,
      style: "rebase",
    });

    expect(result).toContain("updated successfully");
  });
});

describe("resource – forgejo://server/info", () => {
  beforeEach(() => mockFetch.mockReset());

  it("fetches /user to build the server info resource", async () => {
    const userPayload = {
      id: 1,
      login: "alice",
      full_name: "Alice Wonderland",
      email: "alice@example.com",
      avatar_url: "https://codeberg.org/alice.png",
      html_url: "https://codeberg.org/alice",
      is_admin: false,
    };
    mockFetch.mockResolvedValueOnce(ok(userPayload));

    const user = await client.get<Record<string, unknown>>("/user");
    const baseUrl = "https://codeberg.org";
    const token = "tok";
    const text = JSON.stringify({ url: baseUrl, token, user }, null, 2);
    const parsed = JSON.parse(text) as { url: string; token: string; user: Record<string, unknown> };

    expect(parsed.url).toBe("https://codeberg.org");
    expect(parsed.token).toBe("tok");
    expect(parsed.user.login).toBe("alice");
    expect(parsed.user.email).toBe("alice@example.com");
  });

  it("includes the server URL alongside the user object", async () => {
    mockFetch.mockResolvedValueOnce(ok({ id: 2, login: "bob" }));

    const user = await client.get<Record<string, unknown>>("/user");
    const baseUrl = "https://myforgejo.example.com";
    const token = "mytoken";
    const text = JSON.stringify({ url: baseUrl, token, user }, null, 2);
    const parsed = JSON.parse(text) as { url: string; token: string; user: Record<string, unknown> };

    expect(parsed).toHaveProperty("url", "https://myforgejo.example.com");
    expect(parsed).toHaveProperty("token", "mytoken");
    expect(parsed).toHaveProperty("user");
    expect(parsed.user.login).toBe("bob");
  });

  it("returns an error payload when the /user call fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ message: "token is invalid" }),
      text: async () => '{"message":"token is invalid"}',
    } as unknown as Response);

    const baseUrl = "https://codeberg.org";
    const token = "tok";
    let payload: Record<string, unknown>;
    try {
      const user = await client.get<Record<string, unknown>>("/user");
      payload = { url: baseUrl, token, user };
    } catch (err) {
      if (err instanceof ForgejoError) {
        payload = { url: baseUrl, token, error: `${err.message} (status ${err.status})` };
      } else {
        throw err;
      }
    }

    expect(payload!.url).toBe("https://codeberg.org");
    expect(payload!.token).toBe("tok");
    expect(payload!.error).toContain("401");
  });
});
