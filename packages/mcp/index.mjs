#!/usr/bin/env node
/**
 * Thin MCP stdio server over the public grokbotit API.
 * Read access is unauthenticated. Voting is not exposed.
 */
const BASE = process.env.GROKBOTIT_API || "https://grokbotit.com";

const tools = [
  {
    name: "search_bots",
    description: "Full-text search across listings.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        category: { type: "string" },
        limit: { type: "number" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_bot",
    description: "One listing in full.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "list_categories",
    description: "All categories with live counts.",
    inputSchema: {
      type: "object",
      properties: { group: { type: "string" } },
    },
  },
  {
    name: "top_bots",
    description: "Leaderboard slice: hot, new, or all-time.",
    inputSchema: {
      type: "object",
      properties: {
        period: { type: "string" },
        category: { type: "string" },
      },
      required: ["period"],
    },
  },
  {
    name: "install_bot",
    description: "Resolve a listing to its Grok Bot link.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
];

async function callTool(name, args) {
  const q = new URLSearchParams();
  if (name === "search_bots") {
    q.set("query", String(args.query || ""));
    if (args.category) q.set("category", String(args.category));
    if (args.limit) q.set("limit", String(args.limit));
    return get(`/api/v1/search_bots?${q}`);
  }
  if (name === "get_bot") return get(`/api/v1/get_bot?id=${encodeURIComponent(args.id)}`);
  if (name === "list_categories") {
    if (args.group) q.set("group", String(args.group));
    return get(`/api/v1/list_categories?${q}`);
  }
  if (name === "top_bots") {
    q.set("period", String(args.period || "hot"));
    if (args.category) q.set("category", String(args.category));
    return get(`/api/v1/top_bots?${q}`);
  }
  if (name === "install_bot") return get(`/api/v1/install_bot?id=${encodeURIComponent(args.id)}`);
  throw new Error("Unknown tool");
}

async function get(path) {
  const headers = {};
  if (process.env.GROKBOTIT_TOKEN) headers.authorization = `Bearer ${process.env.GROKBOTIT_TOKEN}`;
  const res = await fetch(BASE + path, { headers });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

function send(msg) {
  const body = JSON.stringify(msg);
  const buf = Buffer.from(body, "utf8");
  process.stdout.write(`Content-Length: ${buf.length}\r\n\r\n`);
  process.stdout.write(buf);
}

let buf = Buffer.alloc(0);
process.stdin.on("data", (chunk) => {
  buf = Buffer.concat([buf, chunk]);
  while (true) {
    const split = buf.indexOf("\r\n\r\n");
    if (split < 0) return;
    const header = buf.slice(0, split).toString("utf8");
    const match = /Content-Length:\s*(\d+)/i.exec(header);
    if (!match) {
      buf = buf.slice(split + 4);
      continue;
    }
    const len = Number(match[1]);
    const start = split + 4;
    if (buf.length < start + len) return;
    const json = JSON.parse(buf.slice(start, start + len).toString("utf8"));
    buf = buf.slice(start + len);
    handle(json).catch((err) => {
      send({ jsonrpc: "2.0", id: json.id, error: { code: -32000, message: String(err.message || err) } });
    });
  }
});

async function handle(msg) {
  if (msg.method === "initialize") {
    send({
      jsonrpc: "2.0",
      id: msg.id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "grokbotit", version: "0.1.0" },
      },
    });
    return;
  }
  if (msg.method === "notifications/initialized") return;
  if (msg.method === "tools/list") {
    send({ jsonrpc: "2.0", id: msg.id, result: { tools } });
    return;
  }
  if (msg.method === "tools/call") {
    const result = await callTool(msg.params.name, msg.params.arguments || {});
    send({
      jsonrpc: "2.0",
      id: msg.id,
      result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] },
    });
  }
}
