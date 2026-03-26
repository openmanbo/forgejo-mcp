import { ForgejoClient, ForgejoError } from "./forgejo-client.js";
import { Issue, Repository, User, Comment, Notification } from "./types.js";

type Params = Record<string, unknown>;

/**
 * Format an issue summary for display in MCP tool results.
 */
function formatIssue(issue: Issue): string {
  const type =
    issue.pull_request !== undefined ? "Pull Request" : "Issue";
  const labels =
    issue.labels?.length > 0
      ? issue.labels.map((l) => l.name).join(", ")
      : "none";
  const assignees =
    issue.assignees && issue.assignees.length > 0
      ? issue.assignees.map((a) => a.login).join(", ")
      : "none";
  const repo = issue.repository ? ` [${issue.repository.full_name}]` : "";
  return [
    `${type} #${issue.number}${repo}: ${issue.title}`,
    `  State: ${issue.state}`,
    `  Author: ${issue.user.login}`,
    `  Labels: ${labels}`,
    `  Assignees: ${assignees}`,
    `  Comments: ${issue.comments}`,
    `  Created: ${issue.created_at}`,
    `  Updated: ${issue.updated_at}`,
    `  URL: ${issue.html_url}`,
    issue.body ? `  Body:\n${issue.body.slice(0, 500)}${issue.body.length > 500 ? "\n  [...]" : ""}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Format a repository summary for display.
 */
function formatRepo(repo: Repository): string {
  return [
    `${repo.full_name}`,
    `  Description: ${repo.description || "(none)"}`,
    `  Stars: ${repo.stars_count}  Forks: ${repo.forks_count}  Open Issues: ${repo.open_issues_count}`,
    `  Private: ${repo.private}  Archived: ${repo.archived}`,
    `  Default branch: ${repo.default_branch}`,
    `  URL: ${repo.html_url}`,
    `  Updated: ${repo.updated_at}`,
  ].join("\n");
}

/**
 * Format a comment for display.
 */
function formatComment(comment: Comment): string {
  return [
    `Comment #${comment.id} by ${comment.user.login} at ${comment.created_at}`,
    comment.body,
    `  URL: ${comment.html_url}`,
  ].join("\n");
}

/**
 * Format a notification for display.
 */
function formatNotification(n: Notification): string {
  return [
    `[${n.unread ? "UNREAD" : "read"}] ${n.subject.type}: ${n.subject.title}`,
    `  Repo: ${n.repository.full_name}`,
    `  State: ${n.subject.state}`,
    `  Updated: ${n.updated_at}`,
    `  URL: ${n.subject.url}`,
  ].join("\n");
}

/**
 * Dispatch a tool call to the appropriate Forgejo API handler and return the
 * result as a human-readable string.
 */
export async function handleTool(
  client: ForgejoClient,
  toolName: string,
  args: Params,
): Promise<string> {
  try {
    switch (toolName) {
      case "search_issues":
        return await searchIssues(client, args);
      case "list_issues":
        return await listIssues(client, args);
      case "get_issue":
        return await getIssue(client, args);
      case "create_issue":
        return await createIssue(client, args);
      case "edit_issue":
        return await editIssue(client, args);
      case "list_issue_comments":
        return await listIssueComments(client, args);
      case "create_comment":
        return await createComment(client, args);
      case "search_repos":
        return await searchRepos(client, args);
      case "get_repo":
        return await getRepo(client, args);
      case "get_user":
        return await getUser(client);
      case "get_user_info":
        return await getUserInfo(client, args);
      case "list_notifications":
        return await listNotifications(client, args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (err) {
    if (err instanceof ForgejoError) {
      return `Error ${err.status}: ${err.message}\nDetails: ${JSON.stringify(err.body, null, 2)}`;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

async function searchIssues(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const issues = await client.get<Issue[]>("/repos/issues/search", {
    q: args.q as string | undefined,
    type: args.type as string | undefined,
    state: (args.state as string | undefined) ?? "open",
    labels: args.labels as string | undefined,
    owner: args.owner as string | undefined,
    team: args.team as string | undefined,
    assigned: args.assigned as boolean | undefined,
    created: args.created as boolean | undefined,
    mentioned: args.mentioned as boolean | undefined,
    review_requested: args.review_requested as boolean | undefined,
    since: args.since as string | undefined,
    before: args.before as string | undefined,
    page: (args.page as number | undefined) ?? 1,
    limit: (args.limit as number | undefined) ?? 10,
  });

  if (!issues || issues.length === 0) {
    return "No issues found matching the given criteria.";
  }
  return `Found ${issues.length} issue(s):\n\n${issues.map(formatIssue).join("\n\n")}`;
}

async function listIssues(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { owner, repo } = args as { owner: string; repo: string };
  const issues = await client.get<Issue[]>(
    `/repos/${owner}/${repo}/issues`,
    {
      type: args.type as string | undefined,
      state: (args.state as string | undefined) ?? "open",
      labels: args.labels as string | undefined,
      page: (args.page as number | undefined) ?? 1,
      limit: (args.limit as number | undefined) ?? 10,
    },
  );

  if (!issues || issues.length === 0) {
    return `No issues found in ${owner}/${repo}.`;
  }
  return `Found ${issues.length} issue(s) in ${owner}/${repo}:\n\n${issues.map(formatIssue).join("\n\n")}`;
}

async function getIssue(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { owner, repo, index } = args as {
    owner: string;
    repo: string;
    index: number;
  };
  const issue = await client.get<Issue>(
    `/repos/${owner}/${repo}/issues/${index}`,
  );
  return formatIssue(issue);
}

async function createIssue(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { owner, repo, title, body, assignees, labels, milestone } =
    args as {
      owner: string;
      repo: string;
      title: string;
      body?: string;
      assignees?: string[];
      labels?: number[];
      milestone?: number;
    };
  const issue = await client.post<Issue>(`/repos/${owner}/${repo}/issues`, {
    title,
    body,
    assignees,
    labels,
    milestone,
  });
  return `Issue created successfully:\n\n${formatIssue(issue)}`;
}

async function editIssue(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { owner, repo, index, ...fields } = args as {
    owner: string;
    repo: string;
    index: number;
    [key: string]: unknown;
  };
  const issue = await client.patch<Issue>(
    `/repos/${owner}/${repo}/issues/${index}`,
    fields,
  );
  return `Issue updated successfully:\n\n${formatIssue(issue)}`;
}

async function listIssueComments(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { owner, repo, index } = args as {
    owner: string;
    repo: string;
    index: number;
  };
  const comments = await client.get<Comment[]>(
    `/repos/${owner}/${repo}/issues/${index}/comments`,
    {
      page: (args.page as number | undefined) ?? 1,
      limit: (args.limit as number | undefined) ?? 10,
    },
  );
  if (!comments || comments.length === 0) {
    return `No comments on issue #${index} in ${owner}/${repo}.`;
  }
  return `${comments.length} comment(s) on issue #${index}:\n\n${comments.map(formatComment).join("\n\n")}`;
}

async function createComment(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { owner, repo, index, body } = args as {
    owner: string;
    repo: string;
    index: number;
    body: string;
  };
  const comment = await client.post<Comment>(
    `/repos/${owner}/${repo}/issues/${index}/comments`,
    { body },
  );
  return `Comment posted successfully:\n\n${formatComment(comment)}`;
}

async function searchRepos(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const result = await client.get<{ data: Repository[] }>(
    "/repos/search",
    {
      q: args.q as string | undefined,
      topic: args.topic as boolean | undefined,
      include_desc: args.include_desc as boolean | undefined,
      owner: args.owner as string | undefined,
      is_private: args.is_private as boolean | undefined,
      archived: args.archived as boolean | undefined,
      page: (args.page as number | undefined) ?? 1,
      limit: (args.limit as number | undefined) ?? 10,
    },
  );
  const repos = result?.data ?? [];
  if (repos.length === 0) {
    return "No repositories found.";
  }
  return `Found ${repos.length} repository/repositories:\n\n${repos.map(formatRepo).join("\n\n")}`;
}

async function getRepo(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { owner, repo } = args as { owner: string; repo: string };
  const repository = await client.get<Repository>(`/repos/${owner}/${repo}`);
  return formatRepo(repository);
}

async function getUser(client: ForgejoClient): Promise<string> {
  const user = await client.get<User>("/user");
  return [
    `Login: ${user.login}`,
    `Full name: ${user.full_name || "(not set)"}`,
    `Email: ${user.email || "(not set)"}`,
    `Admin: ${user.is_admin ?? false}`,
    `Profile: ${user.html_url}`,
    `Avatar: ${user.avatar_url}`,
  ].join("\n");
}

async function getUserInfo(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { username } = args as { username: string };
  const user = await client.get<User>(`/users/${username}`);
  return [
    `Login: ${user.login}`,
    `Full name: ${user.full_name || "(not set)"}`,
    `Email: ${user.email || "(not set)"}`,
    `Profile: ${user.html_url}`,
    `Avatar: ${user.avatar_url}`,
  ].join("\n");
}

async function listNotifications(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const notifications = await client.get<Notification[]>("/notifications", {
    all: args.all as boolean | undefined,
    since: args.since as string | undefined,
    before: args.before as string | undefined,
    page: (args.page as number | undefined) ?? 1,
    limit: (args.limit as number | undefined) ?? 10,
  });
  if (!notifications || notifications.length === 0) {
    return "No notifications found.";
  }
  return `${notifications.length} notification(s):\n\n${notifications.map(formatNotification).join("\n\n")}`;
}
