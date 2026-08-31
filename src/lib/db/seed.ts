import { count } from "drizzle-orm";
import { BOTS, COMMENTS, MAKERS, ME, NOTIFS } from "../seed-data";
import type { DB } from "./index";
import {
  bots,
  botTags,
  comments,
  notifications,
  users,
} from "./schema";

function uid(prefix: string, handle: string): string {
  return `${prefix}_${handle.replace(/^@/, "")}`;
}

export async function seedIfEmpty(db: DB): Promise<void> {
  if (process.env.SEED_DEMO !== "true") return;
  const [{ n }] = await db.select({ n: count() }).from(users);
  if (n > 0) return;

  const now = Date.now();
  const people: Array<{
    id: string;
    handle: string;
    name: string;
    initial: string;
    hue: string;
    bio: string;
    karma: number;
    followers: number;
    followingCount: number;
    streak: number;
    onboarded: number;
  }> = [];
  const addPerson = (p: {
    handle: string;
    name: string;
    initial: string;
    hue: string;
    bio?: string;
    karma?: number;
    followers?: number;
    followingCount?: number;
    streak?: number;
  }) => {
    if (people.some((x) => x.handle === p.handle)) return;
    people.push({
      id: uid("u", p.handle),
      handle: p.handle,
      name: p.name,
      initial: p.initial,
      hue: p.hue,
      bio: p.bio ?? "",
      karma: p.karma ?? 0,
      followers: p.followers ?? 0,
      followingCount: p.followingCount ?? 0,
      streak: p.streak ?? 0,
      onboarded: 1,
    });
  };
  addPerson({
    handle: ME.handle,
    name: ME.name,
    initial: ME.initial,
    hue: ME.hue,
    bio: ME.bio,
    karma: 2410,
    followers: 184,
    followingCount: 63,
    streak: ME.streak,
  });
  for (const m of MAKERS) {
    addPerson({
      handle: m.handle,
      name: m.name,
      initial: m.initial,
      hue: m.hue,
      bio: m.bio,
      karma:
        Number(String(m.karma).replace(/[^0-9.]/g, "")) *
        (String(m.karma).includes("k") ? 1000 : 1),
      followers: Number(String(m.followers).replace(/,/g, "")),
      followingCount: Number(String(m.following).replace(/,/g, "")),
    });
  }
  for (const b of BOTS) {
    addPerson({
      handle: b.makerHandle,
      name: b.maker,
      initial: b.makerInitial,
      hue: b.hue,
    });
  }
  for (const list of Object.values(COMMENTS)) {
    for (const c of list) {
      addPerson({ handle: c.handle, name: c.name, initial: c.initial, hue: c.hue });
      for (const r of c.replies) {
        addPerson({ handle: r.handle, name: r.name, initial: r.initial, hue: r.hue });
      }
    }
  }

  await db.insert(users).values(
    people.map((p) => ({
      ...p,
      karma: Math.round(p.karma),
      createdAt: now,
      settingsJson: JSON.stringify({
        replies: true,
        follows: true,
        milestones: true,
        digest: false,
        publicProfile: true,
      }),
    })),
  );

  const userByHandle = new Map(people.map((p) => [p.handle, p]));

  await db.insert(bots).values(
    BOTS.map((b) => ({
      id: b.id,
      name: b.name,
      handle: b.handle,
      hue: b.hue,
      tagline: b.tagline,
      desc: b.desc,
      link: `https://grok.com/bot/${b.id}`,
      makerId: userByHandle.get(b.makerHandle)?.id ?? uid("u", b.makerHandle),
      upvotes: b.up,
      adds: b.adds,
      createdAt: now - Math.round(b.ageH * 3_600_000),
    })),
  );

  await db.insert(botTags).values(
    BOTS.flatMap((b) => b.tags.map((category) => ({ botId: b.id, category }))),
  );

  const commentRows: Array<{
    id: string;
    botId: string;
    userId: string;
    parentId: string | null;
    body: string;
    upvotes: number;
    createdAt: number;
  }> = [];

  for (const [botId, list] of Object.entries(COMMENTS)) {
    for (const c of list) {
      const parentId = `${botId}-${c.id}`;
      const author = userByHandle.get(c.handle);
      commentRows.push({
        id: parentId,
        botId,
        userId: author?.id ?? uid("u", c.handle),
        parentId: null,
        body: c.body,
        upvotes: c.up,
        createdAt: now - 3_600_000,
      });
      c.replies.forEach((r, i) => {
        const ra = userByHandle.get(r.handle);
        commentRows.push({
          id: `${parentId}-r${i}`,
          botId,
          userId: ra?.id ?? uid("u", r.handle),
          parentId,
          body: r.body,
          upvotes: 0,
          createdAt: now - 1_800_000,
        });
      });
    }
  }
  if (commentRows.length) await db.insert(comments).values(commentRows);

  const meId = uid("u", ME.handle);
  await db.insert(notifications).values(
    NOTIFS.map((n, i) => ({
      id: `n${i}`,
      userId: meId,
      text: n.text,
      initial: n.initial,
      hue: n.hue,
      createdAt: now - i * 900_000,
      read: 0,
    })),
  );
}
