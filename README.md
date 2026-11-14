# Transmitly MCP

Read inbox conversations and reply from an MCP-compatible agent. The server is
read/reply only: it cannot create or delete inboxes.

```bash
TRANSMITLY_API_KEY=txk_... node index.js
```

Configure it in OpenCode:

```jsonc
{
  "mcp": {
    "servers": {
      "transmitly": {
        "type": "local",
        "command": ["node", "/path/to/mcp/transmitly/index.js"],
        "environment": { "TRANSMITLY_API_KEY": "{env:TRANSMITLY_API_KEY}" }
      }
    }
  }
}
```

Tools: `list_inboxes`, `get_inbox`, `get_thread`, `reply_thread`,
`mark_thread_read`. Use a key with `send` scope to reply; an admin-scoped key is
not required.

Set `TRANSMITLY_BASE_URL` for local testing.
