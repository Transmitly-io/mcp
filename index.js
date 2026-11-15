#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const apiKey = process.env.TRANSMITLY_API_KEY;
if (!apiKey) {
  console.error("TRANSMITLY_API_KEY is required");
  process.exit(1);
}
const baseUrl = (process.env.TRANSMITLY_BASE_URL || "https://transmitly.io").replace(/\/$/, "");

async function api(method, path, body) {
  const res = await fetch(baseUrl + path, {
    method,
    headers: {
      authorization: `Bearer ${apiKey}`,
      accept: "application/json",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error?.message || `Request failed (${res.status})`);
  return data;
}

function result(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

const server = new McpServer({ name: "transmitly", version: "1.1.0" });

server.tool("list_inboxes", "List Transmitly inboxes in the workspace.", {}, async () => result(await api("GET", "/v1/inboxes")));

server.tool(
  "get_inbox",
  "Get an inbox and its recent threads. Optionally search by subject, participant, label or message text.",
  { inbox_id: z.string(), q: z.string().optional() },
  async ({ inbox_id, q }) => result(await api("GET", `/v1/inboxes/${encodeURIComponent(inbox_id)}${q ? `?q=${encodeURIComponent(q)}` : ""}`)),
);

server.tool(
  "get_thread",
  "Read one inbox thread and its messages.",
  { inbox_id: z.string(), thread_id: z.string() },
  async ({ inbox_id, thread_id }) => result(await api("GET", `/v1/inboxes/${encodeURIComponent(inbox_id)}/threads/${encodeURIComponent(thread_id)}`)),
);

server.tool(
  "reply_thread",
  "Reply inside an inbox thread. Requires a send-scoped API key.",
  { inbox_id: z.string(), thread_id: z.string(), text: z.string().optional(), html: z.string().optional(), from_name: z.string().optional() },
  async ({ inbox_id, thread_id, ...body }) => result(await api("POST", `/v1/inboxes/${encodeURIComponent(inbox_id)}/threads/${encodeURIComponent(thread_id)}/reply`, body)),
);

server.tool(
  "mark_thread_read",
  "Mark an inbox thread read.",
  { inbox_id: z.string(), thread_id: z.string() },
  async ({ inbox_id, thread_id }) => result(await api("PATCH", `/v1/inboxes/${encodeURIComponent(inbox_id)}/threads/${encodeURIComponent(thread_id)}`, { read: true })),
);

server.tool(
  "list_messages",
  "List accepted messages with optional status, stream, source and search filters.",
  {
    status: z.enum(["queued", "delivered", "bounced", "complained", "partial"]).optional(),
    stream: z.enum(["transactional", "marketing"]).optional(),
    source: z.enum(["api", "inbound_forward", "inbound_relay", "inbox_reply"]).optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  async ({ status, stream, source, q, limit }) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (stream) params.set("stream", stream);
    if (source) params.set("source", source);
    if (q) params.set("q", q);
    if (limit) params.set("limit", String(limit));
    const query = params.toString();
    return result(await api("GET", `/v1/messages${query ? `?${query}` : ""}`));
  },
);

server.tool(
  "get_message",
  "Read one accepted message, including its current delivery state.",
  { message_id: z.string() },
  async ({ message_id }) => result(await api("GET", `/v1/messages/${encodeURIComponent(message_id)}`)),
);

server.tool("list_domains", "List sending domains and their verification state.", {}, async () => result(await api("GET", "/v1/domains")));

server.tool(
  "get_domain_audit",
  "Run the live SPF, DKIM, DMARC, MX, MTA-STS, TLS-RPT and BIMI audit for a domain.",
  { domain_id: z.string() },
  async ({ domain_id }) => result(await api("GET", `/v1/domains/${encodeURIComponent(domain_id)}/audit`)),
);

server.tool("list_broadcasts", "List marketing broadcasts with recipient counts and status.", {}, async () => result(await api("GET", "/v1/broadcasts")));

server.tool(
  "get_broadcast",
  "Read a broadcast, its recipient snapshot and variant analytics.",
  { broadcast_id: z.string() },
  async ({ broadcast_id }) => result(await api("GET", `/v1/broadcasts/${encodeURIComponent(broadcast_id)}`)),
);

server.tool("list_segments", "List saved contact segments and their current contact counts.", {}, async () => result(await api("GET", "/v1/segments")));

server.tool(
  "get_segment",
  "Read a saved segment and preview matching contacts.",
  { segment_id: z.string() },
  async ({ segment_id }) => result(await api("GET", `/v1/segments/${encodeURIComponent(segment_id)}`)),
);

server.tool("list_automations", "List marketing automations with step and enrollment counts.", {}, async () => result(await api("GET", "/v1/automations")));

server.tool(
  "get_automation",
  "Read an automation and its wait, send and branch configuration.",
  { automation_id: z.string() },
  async ({ automation_id }) => result(await api("GET", `/v1/automations/${encodeURIComponent(automation_id)}`)),
);

server.tool(
  "get_usage",
  "Read current usage against the workspace plan.",
  {},
  async () => result(await api("GET", "/v1/usage")),
);

await server.connect(new StdioServerTransport());
