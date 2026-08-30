import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  xId: text("x_id"),
  handle: text("handle").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  initial: text("initial").notNull(),
  hue: text("hue").notNull(),
  bio: text("bio").notNull().default(""),
  karma: integer("karma").notNull().default(0),
  followers: integer("followers").notNull().default(0),
  followingCount: integer("following_count").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  onboarded: integer("onboarded").notNull().default(0),
  settingsJson: text("settings_json").notNull().default("{}"),
  createdAt: integer("created_at").notNull(),
});

export const bots = sqliteTable("bots", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  handle: text("handle").notNull(),
  hue: text("hue").notNull(),
  tagline: text("tagline").notNull(),
  desc: text("desc").notNull(),
  link: text("link").notNull(),
  makerId: text("maker_id").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  adds: integer("adds").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  deletedAt: integer("deleted_at"),
});

export const botTags = sqliteTable(
  "bot_tags",
  {
    botId: text("bot_id").notNull(),
    category: text("category").notNull(),
  },
  (t) => [primaryKey({ columns: [t.botId, t.category] })],
);

export const votes = sqliteTable(
  "votes",
  {
    userId: text("user_id").notNull(),
    botId: text("bot_id").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.botId] })],
);

export const adds = sqliteTable(
  "adds",
  {
    userId: text("user_id").notNull(),
    botId: text("bot_id").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.botId] })],
);

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  botId: text("bot_id").notNull(),
  userId: text("user_id").notNull(),
  parentId: text("parent_id"),
  body: text("body").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const commentLikes = sqliteTable(
  "comment_likes",
  {
    userId: text("user_id").notNull(),
    commentId: text("comment_id").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.commentId] })],
);

export const follows = sqliteTable(
  "follows",
  {
    followerId: text("follower_id").notNull(),
    handle: text("handle").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.handle] })],
);

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  botId: text("bot_id").notNull(),
  reason: text("reason").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  text: text("text").notNull(),
  initial: text("initial").notNull(),
  hue: text("hue").notNull(),
  createdAt: integer("created_at").notNull(),
  read: integer("read").notNull().default(0),
});

export const interests = sqliteTable(
  "interests",
  {
    userId: text("user_id").notNull(),
    category: text("category").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.category] })],
);
