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

const server = new McpServer({ name: "transmitly", version: "1.0.0" });

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

await server.connect(new StdioServerTransport());
