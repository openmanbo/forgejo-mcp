# forgejo-mcp

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for
[Forgejo](https://forgejo.org/) that enables AI agents to interact with a Forgejo
instance as an authenticated user.

## Features

| Tool | Forgejo API endpoint | Description |
|------|----------------------|-------------|
| `search_issues` | `GET /api/v1/repos/issues/search` | Search issues & PRs across all repos |
| `list_issues` | `GET /api/v1/repos/{owner}/{repo}/issues` | List issues in a repository |
| `get_issue` | `GET /api/v1/repos/{owner}/{repo}/issues/{index}` | Get a single issue |
| `create_issue` | `POST /api/v1/repos/{owner}/{repo}/issues` | Create a new issue |
| `edit_issue` | `PATCH /api/v1/repos/{owner}/{repo}/issues/{index}` | Edit an issue |
| `list_issue_comments` | `GET /api/v1/repos/{owner}/{repo}/issues/{index}/comments` | List comments |
| `create_comment` | `POST /api/v1/repos/{owner}/{repo}/issues/{index}/comments` | Add a comment |
| `search_repos` | `GET /api/v1/repos/search` | Search repositories |
| `get_repo` | `GET /api/v1/repos/{owner}/{repo}` | Get repository info |
| `get_user` | `GET /api/v1/user` | Get authenticated user profile |
| `get_user_info` | `GET /api/v1/users/{username}` | Get any user's public profile |
| `list_notifications` | `GET /api/v1/notifications` | List notifications |
| `list_pull_requests` | `GET /api/v1/repos/{owner}/{repo}/pulls` | List pull requests in a repository |
| `get_pull_request` | `GET /api/v1/repos/{owner}/{repo}/pulls/{index}` | Get a single pull request |
| `create_pull_request` | `POST /api/v1/repos/{owner}/{repo}/pulls` | Create a new pull request |
| `edit_pull_request` | `PATCH /api/v1/repos/{owner}/{repo}/pulls/{index}` | Edit a pull request |
| `merge_pull_request` | `POST /api/v1/repos/{owner}/{repo}/pulls/{index}/merge` | Merge a pull request |
| `get_pull_request_diff` | `GET /api/v1/repos/{owner}/{repo}/pulls/{index}.diff` | Get PR diff as plain text |
| `get_pull_request_files` | `GET /api/v1/repos/{owner}/{repo}/pulls/{index}/files` | List files changed in a PR |
| `list_pull_request_reviews` | `GET /api/v1/repos/{owner}/{repo}/pulls/{index}/reviews` | List reviews on a PR |
| `update_pull_request_branch` | `POST /api/v1/repos/{owner}/{repo}/pulls/{index}/update` | Update a PR branch |

## Requirements

- Node.js ≥ 18
- A Forgejo personal access token

## Setup

1. **Install dependencies and build:**

   ```bash
   npm install
   npm run build
   ```

2. **Generate a Forgejo token:**  
   Go to `<your-forgejo-instance>/user/settings/applications` and create a
   token with the scopes you need (at minimum `read:issue` for searching).

3. **Configure environment variables:**

   ```bash
   export FORGEJO_URL=https://codeberg.org   # or your own instance
   export FORGEJO_TOKEN=your_token_here
   ```

## Running the server

```bash
npm start
# or directly:
node dist/index.js
```

The server communicates over **stdio** using the MCP protocol.

## Connecting to an MCP client

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "forgejo": {
      "command": "node",
      "args": ["/path/to/forgejo-mcp/dist/index.js"],
      "env": {
        "FORGEJO_URL": "https://codeberg.org",
        "FORGEJO_TOKEN": "your_token_here"
      }
    }
  }
}
```

### VS Code (`.vscode/mcp.json`)

```json
{
  "servers": {
    "forgejo": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "FORGEJO_URL": "https://codeberg.org",
        "FORGEJO_TOKEN": "${env:FORGEJO_TOKEN}"
      }
    }
  }
}
```

## Development

```bash
npm test        # run unit tests
npm run build   # compile TypeScript → dist/
```

## License

MIT
