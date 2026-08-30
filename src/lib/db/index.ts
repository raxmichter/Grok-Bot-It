import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { seedIfEmpty } from "./seed";

export type DB = LibSQLDatabase<typeof schema>;

let client: Client | null = null;
let db: DB | null = null;
let ready: Promise<DB> | null = null;

function databaseUrl(): string {
  const env = process.env.TURSO_DATABASE_URL;
  if (env && !env.startsWith("file:")) return env;
  const dir = path.join(/* turbopackIgnore: true */ process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return `file:${path.join(dir, "grokbotit.db")}`;
}

function getClient(): Client {
  if (client) return client;
  client = createClient({
    url: databaseUrl(),
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return client;
}

export function getDb(): DB {
  if (db) return db;
  db = drizzle(getClient(), { schema });
  return db;
}

const DDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    x_id TEXT,
    handle TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    initial TEXT NOT NULL,
    hue TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    karma INTEGER NOT NULL DEFAULT 0,
    followers INTEGER NOT NULL DEFAULT 0,
    following_count INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    onboarded INTEGER NOT NULL DEFAULT 0,
    settings_json TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS bots (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    hue TEXT NOT NULL,
    tagline TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    link TEXT NOT NULL,
    maker_id TEXT NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    adds INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    deleted_at INTEGER
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS bots_link ON bots(link)`,
  `CREATE TABLE IF NOT EXISTS bot_tags (
    bot_id TEXT NOT NULL,
    category TEXT NOT NULL,
    PRIMARY KEY (bot_id, category)
  )`,
  `CREATE TABLE IF NOT EXISTS votes (
    user_id TEXT NOT NULL,
    bot_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, bot_id)
  )`,
  `CREATE TABLE IF NOT EXISTS adds (
    user_id TEXT NOT NULL,
    bot_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, bot_id)
  )`,
  `CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    bot_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    parent_id TEXT,
    body TEXT NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS comment_likes (
    user_id TEXT NOT NULL,
    comment_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, comment_id)
  )`,
  `CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT NOT NULL,
    handle TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (follower_id, handle)
  )`,
  `CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    bot_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    text TEXT NOT NULL,
    initial TEXT NOT NULL,
    hue TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    "read" INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS interests (
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    PRIMARY KEY (user_id, category)
  )`,
];

async function init(): Promise<DB> {
  const c = getClient();
  for (const stmt of DDL) {
    await c.execute(stmt);
  }
  const database = getDb();
  await seedIfEmpty(database);
  return database;
}

export function ensureDb(): Promise<DB> {
  if (!ready) ready = init();
  return ready;
}
