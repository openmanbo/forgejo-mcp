import { ForgejoClient, ForgejoError } from "./forgejo-client.js";
import {
  Issue,
  Repository,
  User,
  Comment,
  Notification,
  PullRequest,
  PullRequestReview,
  ChangedFile,
} from "./types.js";

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
 * Format a pull request summary for display.
 */
function formatPullRequest(pr: PullRequest): string {
  const labels =
    pr.labels?.length > 0
      ? pr.labels.map((l) => l.name).join(", ")
      : "none";
  const assignees =
    pr.assignees && pr.assignees.length > 0
      ? pr.assignees.map((a) => a.login).join(", ")
      : "none";
  return [
    `PR #${pr.number}: ${pr.title}`,
    `  State: ${pr.state}${pr.merged ? " (merged)" : ""}`,
    `  Author: ${pr.user.login}`,
    `  Head: ${pr.head.label} (${pr.head.sha.slice(0, 7)})`,
    `  Base: ${pr.base.label}`,
    `  Labels: ${labels}`,
    `  Assignees: ${assignees}`,
    `  Comments: ${pr.comments}`,
    `  Mergeable: ${pr.mergeable}`,
    `  Created: ${pr.created_at}`,
    `  Updated: ${pr.updated_at}`,
    `  URL: ${pr.html_url}`,
    pr.body ? `  Body:\n${pr.body.slice(0, 500)}${pr.body.length > 500 ? "\n  [...]" : ""}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Format a pull request review for display.
 */
function formatReview(review: PullRequestReview): string {
  return [
    `Review #${review.id} by ${review.reviewer.login}`,
    `  State: ${review.state}`,
    `  Submitted: ${review.submitted_at}`,
    `  Commit: ${review.commit_id.slice(0, 7)}`,
    review.body ? `  Body: ${review.body}` : "",
    `  URL: ${review.html_url}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Format a changed file for display.
 */
function formatChangedFile(file: ChangedFile): string {
  return [
    `${file.status}: ${file.filename}`,
    `  +${file.additions} -${file.deletions} (${file.changes} changes)`,
    file.previous_filename ? `  Renamed from: ${file.previous_filename}` : "",
  ]
    .filter(Boolean)
    .join("\n");
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
      case "mark_notification_read":
        return await markNotificationRead(client, args);
      case "mark_all_notifications_read":
        return await markAllNotificationsRead(client, args);
      case "list_pull_requests":
        return await listPullRequests(client, args);
      case "get_pull_request":
        return await getPullRequest(client, args);
      case "create_pull_request":
        return await createPullRequest(client, args);
      case "edit_pull_request":
        return await editPullRequest(client, args);
      case "merge_pull_request":
        return await mergePullRequest(client, args);
      case "get_pull_request_diff":
        return await getPullRequestDiff(client, args);
      case "get_pull_request_files":
        return await getPullRequestFiles(client, args);
      case "list_pull_request_reviews":
        return await listPullRequestReviews(client, args);
      case "update_pull_request_branch":
        return await updatePullRequestBranch(client, args);
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

// ---------------------------------------------------------------------------
// Pull Request implementations
// ---------------------------------------------------------------------------

async function listPullRequests(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { owner, repo } = args as { owner: string; repo: string };
  const pulls = await client.get<PullRequest[]>(
    `/repos/${owner}/${repo}/pulls`,
    {
      state: (args.state as string | undefined) ?? "open",
      sort: args.sort as string | undefined,
      labels: args.labels as string | undefined,
      milestone: args.milestone as number | undefined,
      page: (args.page as number | undefined) ?? 1,
      limit: (args.limit as number | undefined) ?? 10,
    },
  );

  if (!pulls || pulls.length === 0) {
    return `No pull requests found in ${owner}/${repo}.`;
  }
  return `Found ${pulls.length} pull request(s) in ${owner}/${repo}:\n\n${pulls.map(formatPullRequest).join("\n\n")}`;
}

async function getPullRequest(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { owner, repo, index } = args as {
    owner: string;
    repo: string;
    index: number;
  };
  const pr = await client.get<PullRequest>(
    `/repos/${owner}/${repo}/pulls/${index}`,
  );
  return formatPullRequest(pr);
}

async function createPullRequest(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { owner, repo, title, body, head, base, assignees, labels, milestone } =
    args as {
      owner: string;
      repo: string;
      title: string;
      body?: string;
      head: string;
      base: string;
      assignees?: string[];
      labels?: number[];
      milestone?: number;
    };
  const pr = await client.post<PullRequest>(`/repos/${owner}/${repo}/pulls`, {
    title,
    body,
    head,
    base,
    assignees,
    labels,
    milestone,
  });
  return `Pull request created successfully:\n\n${formatPullRequest(pr)}`;
}

async function editPullRequest(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { owner, repo, index, ...fields } = args as {
    owner: string;
    repo: string;
    index: number;
    [key: string]: unknown;
  };
  const pr = await client.patch<PullRequest>(
    `/repos/${owner}/${repo}/pulls/${index}`,
    fields,
  );
  return `Pull request updated successfully:\n\n${formatPullRequest(pr)}`;
}

async function mergePullRequest(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const {
    owner,
    repo,
    index,
    Do,
    merge_commit_id,
    merge_message_field,
    delete_branch_after_merge,
    force_merge,
    head_commit_id,
    merge_when_checks_succeed,
  } = args as {
    owner: string;
    repo: string;
    index: number;
    Do: string;
    merge_commit_id?: string;
    merge_message_field?: string;
    delete_branch_after_merge?: boolean;
    force_merge?: boolean;
    head_commit_id?: string;
    merge_when_checks_succeed?: boolean;
  };
  await client.post(`/repos/${owner}/${repo}/pulls/${index}/merge`, {
    Do,
    merge_commit_id,
    merge_message_field,
    delete_branch_after_merge,
    force_merge,
    head_commit_id,
    merge_when_checks_succeed,
  });
  return `Pull request #${index} in ${owner}/${repo} merged successfully using '${Do}' method.`;
}

async function getPullRequestDiff(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { owner, repo, index } = args as {
    owner: string;
    repo: string;
    index: number;
  };
  const diff = await client.getRaw(
    `/repos/${owner}/${repo}/pulls/${index}.diff`,
  );
  if (!diff || diff.trim().length === 0) {
    return `No diff found for pull request #${index} in ${owner}/${repo}.`;
  }
  return diff;
}

async function getPullRequestFiles(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { owner, repo, index } = args as {
    owner: string;
    repo: string;
    index: number;
  };
  const files = await client.get<ChangedFile[]>(
    `/repos/${owner}/${repo}/pulls/${index}/files`,
    {
      skip: args.skip as number | undefined,
      limit: (args.limit as number | undefined) ?? 10,
    },
  );

  if (!files || files.length === 0) {
    return `No changed files in pull request #${index} in ${owner}/${repo}.`;
  }
  return `${files.length} changed file(s) in PR #${index}:\n\n${files.map(formatChangedFile).join("\n\n")}`;
}

async function listPullRequestReviews(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { owner, repo, index } = args as {
    owner: string;
    repo: string;
    index: number;
  };
  const reviews = await client.get<PullRequestReview[]>(
    `/repos/${owner}/${repo}/pulls/${index}/reviews`,
    {
      page: (args.page as number | undefined) ?? 1,
      limit: (args.limit as number | undefined) ?? 10,
    },
  );

  if (!reviews || reviews.length === 0) {
    return `No reviews on pull request #${index} in ${owner}/${repo}.`;
  }
  return `${reviews.length} review(s) on PR #${index}:\n\n${reviews.map(formatReview).join("\n\n")}`;
}

async function updatePullRequestBranch(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const { owner, repo, index, style } = args as {
    owner: string;
    repo: string;
    index: number;
    style?: string;
  };
  await client.post(`/repos/${owner}/${repo}/pulls/${index}/update`, {
    style,
  });
  return `Pull request #${index} branch in ${owner}/${repo} updated successfully.`;
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

async function markNotificationRead(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const id = args.id as number;
  await client.patch(`/notifications/threads/${id}`);
  return `Notification thread ${id} marked as read.`;
}

async function markAllNotificationsRead(
  client: ForgejoClient,
  args: Params,
): Promise<string> {
  const body: Record<string, unknown> = {};
  if (args.last_read_at) {
    body.last_read_at = args.last_read_at as string;
  }
  await client.put("/notifications", body);
  return "All notifications marked as read.";
}
