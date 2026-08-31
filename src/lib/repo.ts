import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { CATS, isCategory } from "./categories";
import { ageHoursSince, ageLabel, initialOf, slugHandle, snippet } from "./ranking";
import { ME } from "./seed-data";
import type { Session } from "./auth/session";
import { ensureDb } from "./db";
import {
  adds,
  bots,
  botTags,
  commentLikes,
  comments,
  follows,
  notifications,
  reports,
  users,
  votes,
} from "./db/schema";

export type PublicUser = {
  id: string;
  name: string;
  handle: string;
  initial: string;
  hue: string;
  bio: string;
  karma: string;
  followers: string;
  following: string;
  streak: number;
  avatarUrl: string | null;
};

export type PublicBot = {
  id: string;
  name: string;
  handle: string;
  hue: string;
  tagline: string;
  desc: string;
  tags: string[];
  up: number;
  adds: number;
  ageH: number;
  age: string;
  maker: string;
  makerHandle: string;
  makerInitial: string;
  link: string;
};

function fmtNum(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("en-US");
}

function publicUser(u: typeof users.$inferSelect): PublicUser {
  return {
    id: u.id,
    name: u.name,
    handle: u.handle,
    initial: u.initial,
    hue: u.hue,
    bio: u.bio,
    karma: fmtNum(u.karma),
    followers: fmtNum(u.followers),
    following: fmtNum(u.followingCount),
    streak: u.streak,
    avatarUrl: u.avatarUrl,
  };
}

export async function listBots(): Promise<PublicBot[]> {
  const db = await ensureDb();
  const rows = await db
    .select()
    .from(bots)
    .leftJoin(users, eq(bots.makerId, users.id))
    .where(isNull(bots.deletedAt));
  const tags = await db.select().from(botTags);
  const tagsByBot = new Map<string, string[]>();
  for (const t of tags) {
    const list = tagsByBot.get(t.botId) ?? [];
    list.push(t.category);
    tagsByBot.set(t.botId, list);
  }
  const now = Date.now();
  return rows.map(({ bots: b, users: maker }) => {
    const ageH = ageHoursSince(b.createdAt, now);
    return {
      id: b.id,
      name: b.name,
      handle: b.handle,
      hue: b.hue,
      tagline: b.tagline,
      desc: b.desc,
      tags: tagsByBot.get(b.id) ?? [],
      up: b.upvotes,
      adds: b.adds,
      ageH,
      age: ageLabel(ageH),
      maker: maker?.name ?? "Unknown",
      makerHandle: maker?.handle ?? "@unknown",
      makerInitial: maker?.initial ?? "?",
      link: b.link,
    };
  });
}

export async function getBot(id: string): Promise<PublicBot | null> {
  const all = await listBots();
  return all.find((b) => b.id === id) ?? null;
}

export async function listMakers() {
  const db = await ensureDb();
  const rows = await db.select().from(users);
  const botRows = await db
    .select({ makerId: bots.makerId, n: sql<number>`count(*)` })
    .from(bots)
    .where(isNull(bots.deletedAt))
    .groupBy(bots.makerId);
  const botCount = new Map(botRows.map((r) => [r.makerId, Number(r.n)]));
  return rows
    .filter((u) => u.handle !== ME.handle)
    .map((u, i) => ({
      rank: i + 1,
      name: u.name,
      handle: u.handle,
      initial: u.initial,
      hue: u.hue,
      bots: botCount.get(u.id) ?? 0,
      karma: fmtNum(u.karma),
      badge: "Day One",
      followers: fmtNum(u.followers),
      following: fmtNum(u.followingCount),
      bio: u.bio,
    }))
    .sort((a, b) => b.bots - a.bots || a.name.localeCompare(b.name))
    .map((m, i) => ({ ...m, rank: i + 1 }));
}

export async function commentsFor(botId: string, session: Session | null) {
  const db = await ensureDb();
  const rows = await db
    .select()
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.botId, botId));
  const liked = new Set<string>();
  if (session) {
    const likes = await db
      .select()
      .from(commentLikes)
      .where(eq(commentLikes.userId, session.userId));
    for (const l of likes) liked.add(l.commentId);
  }
  const byId = new Map<
    string,
    {
      id: string;
      name: string;
      handle: string;
      initial: string;
      hue: string;
      age: string;
      up: number;
      body: string;
      parentId: string | null;
      createdAt: number;
      replies: Array<{
        name: string;
        handle: string;
        initial: string;
        hue: string;
        age: string;
        body: string;
      }>;
    }
  >();
  const now = Date.now();
  for (const { comments: c, users: u } of rows) {
    byId.set(c.id, {
      id: c.id,
      name: u?.name ?? "Unknown",
      handle: u?.handle ?? "@unknown",
      initial: u?.initial ?? "?",
      hue: u?.hue ?? "#7d848b",
      age: ageLabel(ageHoursSince(c.createdAt, now)),
      up: c.upvotes + (liked.has(c.id) ? 1 : 0),
      body: c.body,
      parentId: c.parentId,
      createdAt: c.createdAt,
      replies: [],
    });
  }
  const roots: Array<ReturnType<typeof byId.get> & object> = [];
  for (const c of byId.values()) {
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.replies.push({
        name: c.name,
        handle: c.handle,
        initial: c.initial,
        hue: c.hue,
        age: c.age,
        body: c.body,
      });
    } else if (!c.parentId) {
      roots.push(c);
    }
  }
  return roots.sort((a, b) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
}

function emptySessionState() {
  return {
    signedIn: false,
    me: null as PublicUser | null,
    votes: {} as Record<string, boolean>,
    adds: {} as Record<string, boolean>,
    follows: {} as Record<string, boolean>,
    likes: {} as Record<string, boolean>,
    settings: {
      replies: true,
      follows: true,
      milestones: true,
      digest: false,
      publicProfile: true,
    },
    notifications: [] as Array<{
      initial: string;
      hue: string;
      text: string;
      age: string;
    }>,
  };
}

export async function sessionState(session: Session | null) {
  const db = await ensureDb();
  if (!session) {
    return emptySessionState();
  }
  const [user] = await db.select().from(users).where(eq(users.id, session.userId));
  if (!user) {
    return emptySessionState();
  }
  const voteRows = await db.select().from(votes).where(eq(votes.userId, session.userId));
  const addRows = await db.select().from(adds).where(eq(adds.userId, session.userId));
  const followRows = await db.select().from(follows).where(eq(follows.followerId, session.userId));
  const likeRows = await db
    .select()
    .from(commentLikes)
    .where(eq(commentLikes.userId, session.userId));
  const notifRows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.userId))
    .orderBy(desc(notifications.createdAt));
  const now = Date.now();
  let settings = {
    replies: true,
    follows: true,
    milestones: true,
    digest: false,
    publicProfile: true,
  };
  try {
    settings = { ...settings, ...(JSON.parse(user?.settingsJson || "{}") as typeof settings) };
  } catch {
    /* keep defaults */
  }
  return {
    signedIn: true,
    me: user ? publicUser(user) : null,
    votes: Object.fromEntries(voteRows.map((v) => [v.botId, true])),
    adds: Object.fromEntries(addRows.map((v) => [v.botId, true])),
    follows: Object.fromEntries(followRows.map((v) => [v.handle, true])),
    likes: Object.fromEntries(likeRows.map((v) => [v.commentId, true])),
    settings,
    notifications: notifRows.slice(0, 8).map((n) => ({
      initial: n.initial,
      hue: n.hue,
      text: n.text,
      age: ageLabel(ageHoursSince(n.createdAt, now)),
    })),
  };
}

export async function bootstrap(session: Session | null) {
  const [botList, makers, state] = await Promise.all([
    listBots(),
    listMakers(),
    sessionState(session),
  ]);
  const commentMap: Record<string, unknown> = {};
  await Promise.all(
    botList.map(async (b) => {
      commentMap[b.id] = await commentsFor(b.id, session);
    }),
  );
  return {
    ...state,
    bots: botList,
    makers,
    comments: commentMap,
    categories: CATS,
  };
}

export async function toggleVote(userId: string, botId: string): Promise<boolean> {
  const db = await ensureDb();
  const existing = await db
    .select()
    .from(votes)
    .where(and(eq(votes.userId, userId), eq(votes.botId, botId)));
  const now = Date.now();
  if (existing.length) {
    await db.delete(votes).where(and(eq(votes.userId, userId), eq(votes.botId, botId)));
    await db
      .update(bots)
      .set({ upvotes: sql`${bots.upvotes} - 1` })
      .where(eq(bots.id, botId));
    return false;
  }
  await db.insert(votes).values({ userId, botId, createdAt: now });
  await db
    .update(bots)
    .set({ upvotes: sql`${bots.upvotes} + 1` })
    .where(eq(bots.id, botId));
  return true;
}

export async function addBot(userId: string, botId: string): Promise<boolean> {
  const db = await ensureDb();
  const existing = await db
    .select()
    .from(adds)
    .where(and(eq(adds.userId, userId), eq(adds.botId, botId)));
  if (existing.length) return false;
  await db.insert(adds).values({ userId, botId, createdAt: Date.now() });
  await db
    .update(bots)
    .set({ adds: sql`${bots.adds} + 1` })
    .where(eq(bots.id, botId));
  return true;
}

export async function toggleFollow(userId: string, handle: string): Promise<boolean> {
  const db = await ensureDb();
  const existing = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, userId), eq(follows.handle, handle)));
  if (existing.length) {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, userId), eq(follows.handle, handle)));
    return false;
  }
  await db.insert(follows).values({ followerId: userId, handle, createdAt: Date.now() });
  return true;
}

export async function publishBot(input: {
  user: Session;
  name: string;
  desc: string;
  cats: string[];
  link: string;
  editId?: string | null;
}) {
  const db = await ensureDb();
  const cats = input.cats.filter(isCategory).slice(0, 2);
  if (!cats.length) throw new Error("Pick at least one category");
  const [maker] = await db.select().from(users).where(eq(users.id, input.user.userId));
  if (!maker) throw new Error("Unknown user");
  const name = input.name.trim() || "Untitled Bot";
  const desc = input.desc.trim() || "A new Grok Bot, freshly posted and waiting for its first upvote.";
  if (input.editId) {
    await db
      .update(bots)
      .set({ name, desc, tagline: snippet(desc) })
      .where(and(eq(bots.id, input.editId), eq(bots.makerId, maker.id)));
    await db.delete(botTags).where(eq(botTags.botId, input.editId));
    await db.insert(botTags).values(cats.map((category) => ({ botId: input.editId!, category })));
    return input.editId;
  }
  const id = slugHandle(name).replace(/^@/, "") || `bot-${Date.now()}`;
  const existing = await db.select().from(bots).where(eq(bots.id, id));
  const finalId = existing.length ? `${id}-${Date.now()}` : id;
  const link = input.link.trim() || `https://grok.com/bot/${finalId}`;
  const dupes = await db.select().from(bots).where(eq(bots.link, link));
  if (dupes.length) throw new Error("That bot is already listed");
  await db.insert(bots).values({
    id: finalId,
    name,
    handle: slugHandle(name),
    hue: maker.hue,
    tagline: snippet(desc),
    desc,
    link,
    makerId: maker.id,
    upvotes: 1,
    adds: 0,
    createdAt: Date.now(),
  });
  await db.insert(botTags).values(cats.map((category) => ({ botId: finalId, category })));
  await db.insert(votes).values({ userId: maker.id, botId: finalId, createdAt: Date.now() });
  return finalId;
}

export async function deleteBot(userId: string, botId: string) {
  const db = await ensureDb();
  await db
    .update(bots)
    .set({ deletedAt: Date.now() })
    .where(and(eq(bots.id, botId), eq(bots.makerId, userId)));
}

export async function postComment(input: {
  userId: string;
  botId: string;
  body: string;
  parentId?: string | null;
}) {
  const db = await ensureDb();
  const id = `c${Date.now()}`;
  await db.insert(comments).values({
    id,
    botId: input.botId,
    userId: input.userId,
    parentId: input.parentId ?? null,
    body: input.body.trim(),
    upvotes: 0,
    createdAt: Date.now(),
  });
  return id;
}

export async function toggleCommentLike(userId: string, commentId: string): Promise<boolean> {
  const db = await ensureDb();
  const existing = await db
    .select()
    .from(commentLikes)
    .where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)));
  if (existing.length) {
    await db
      .delete(commentLikes)
      .where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)));
    await db
      .update(comments)
      .set({ upvotes: sql`${comments.upvotes} - 1` })
      .where(eq(comments.id, commentId));
    return false;
  }
  await db.insert(commentLikes).values({ userId, commentId, createdAt: Date.now() });
  await db
    .update(comments)
    .set({ upvotes: sql`${comments.upvotes} + 1` })
    .where(eq(comments.id, commentId));
  return true;
}

export async function reportBot(userId: string, botId: string, reason: string) {
  const db = await ensureDb();
  await db.insert(reports).values({
    id: `r${Date.now()}`,
    userId,
    botId,
    reason,
    createdAt: Date.now(),
  });
}

export async function searchBots(query: string, category?: string, limit = 20) {
  const all = await listBots();
  const q = query.trim().toLowerCase();
  let list = all;
  if (category) list = list.filter((b) => b.tags.includes(category));
  if (q) {
    list = list.filter((b) =>
      `${b.name} ${b.handle} ${b.desc} ${b.maker} ${b.makerHandle} ${b.tags.join(" ")}`
        .toLowerCase()
        .includes(q),
    );
  }
  return list.slice(0, Math.min(50, Math.max(1, limit)));
}

export async function findOrCreateUser(input: {
  xId?: string;
  handle: string;
  name: string;
  avatarUrl?: string | null;
  hue?: string;
}) {
  const db = await ensureDb();
  const handle = input.handle.startsWith("@") ? input.handle : `@${input.handle}`;
  const existing = await db.select().from(users).where(eq(users.handle, handle));
  if (existing[0]) return existing[0];
  const row = {
    id: `u_${handle.replace(/^@/, "")}_${Date.now()}`,
    xId: input.xId ?? null,
    handle,
    name: input.name,
    avatarUrl: input.avatarUrl ?? null,
    initial: initialOf(input.name),
    hue: input.hue ?? "#ff4d14",
    bio: "",
    karma: 0,
    followers: 0,
    followingCount: 0,
    streak: 0,
    onboarded: 0,
    settingsJson: JSON.stringify({
      replies: true,
      follows: true,
      milestones: true,
      digest: false,
      publicProfile: true,
    }),
    createdAt: Date.now(),
  };
  await db.insert(users).values(row);
  return row;
}

export async function userByHandle(handle: string) {
  const db = await ensureDb();
  const h = handle.startsWith("@") ? handle : `@${handle}`;
  const [row] = await db.select().from(users).where(eq(users.handle, h));
  return row ? publicUser(row) : null;
}

export async function saveProfile(
  userId: string,
  patch: { name?: string; bio?: string; settings?: Record<string, boolean> },
) {
  const db = await ensureDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return;
  let settingsJson = user.settingsJson;
  if (patch.settings) {
    let cur: Record<string, boolean> = {};
    try {
      cur = JSON.parse(user.settingsJson) as Record<string, boolean>;
    } catch {
      cur = {};
    }
    settingsJson = JSON.stringify({ ...cur, ...patch.settings });
  }
  await db
    .update(users)
    .set({
      name: patch.name ?? user.name,
      bio: patch.bio ?? user.bio,
      settingsJson,
    })
    .where(eq(users.id, userId));
}

