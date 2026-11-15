# Transmitly MCP

Read Transmitly inboxes, campaigns, segments, automations and deliverability
state, and reply to inbox threads from an MCP-compatible agent. The server is
read/reply only: it cannot create, send, delete or change configuration.

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

Inbox tools: `list_inboxes`, `get_inbox`, `get_thread`, `reply_thread`,
`mark_thread_read`.

Read-only tools: `list_messages`, `get_message`, `list_domains`,
`get_domain_audit`, `list_broadcasts`, `get_broadcast`, `list_segments`,
`get_segment`, `list_automations`, `get_automation`, `get_usage`.

Use a key with `send` scope to reply; an admin-scoped key is not required. Read
endpoints require a workspace API key.

Set `TRANSMITLY_BASE_URL` for local testing.
