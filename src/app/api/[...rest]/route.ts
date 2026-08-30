import { NextResponse } from "next/server";
import { z } from "zod";
import {
  allowDevAuth,
  attachSession,
  getSession,
  clearSessionCookie,
  twitterConfigured,
} from "@/lib/auth/session";
import { ME } from "@/lib/seed-data";
import { CATS } from "@/lib/categories";
import { sortHot, sortNew, sortTop } from "@/lib/ranking";
import {
  addBot,
  bootstrap,
  deleteBot,
  findOrCreateUser,
  getBot,
  listBots,
  postComment,
  publishBot,
  reportBot,
  saveProfile,
  searchBots,
  toggleFollow,
  toggleVote,
} from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function originOf(req: Request): string {
  return process.env.APP_URL || new URL(req.url).origin;
}

export async function GET(req: Request, ctx: { params: Promise<{ rest: string[] }> }) {
  const rest = (await ctx.params).rest ?? [];
  const path = rest.join("/");
  const url = new URL(req.url);
  try {
    if (path === "bootstrap") {
      const session = await getSession();
      return json(await bootstrap(session));
    }
    if (path === "auth/x") {
      return startX(req);
    }
    if (path === "auth/callback") {
      return callbackX(req);
    }
    if (path === "bots") {
      return json({ bots: await listBots() });
    }
    if (rest[0] === "bots" && rest[1] && rest.length === 2) {
      const bot = await getBot(rest[1]);
      if (!bot) return json({ error: "Not found" }, 404);
      return json({ bot });
    }
    if (path === "v1/search_bots") {
      const q = url.searchParams.get("query") || url.searchParams.get("q") || "";
      const category = url.searchParams.get("category") || undefined;
      const limit = Number(url.searchParams.get("limit") || "10");
      const bots = await searchBots(q, category, limit);
      return json({
        bots: bots.map((b) => ({
          name: b.name,
          handle: b.handle,
          description: b.desc,
          categories: b.tags,
          upvotes: b.up,
          adds: b.adds,
          id: b.id,
        })),
      });
    }
    if (path === "v1/get_bot") {
      const id = url.searchParams.get("id") || "";
      const bot = await getBot(id);
      if (!bot) return json({ error: "Not found" }, 404);
      return json({
        ...bot,
        description: bot.desc,
        categories: bot.tags,
        upvotes: bot.up,
        install: bot.link,
      });
    }
    if (path === "v1/list_categories") {
      const group = url.searchParams.get("group");
      const bots = await listBots();
      const items = CATS.filter((c) => !group || c.group === group).map((c) => ({
        ...c,
        count: bots.filter((b) => b.tags.includes(c.name)).length,
      }));
      return json({ categories: items });
    }
    if (path === "v1/top_bots") {
      const period = url.searchParams.get("period") || "hot";
      const category = url.searchParams.get("category") || undefined;
      let bots = await listBots();
      if (category) bots = bots.filter((b) => b.tags.includes(category));
      const sorted =
        period === "new" ? sortNew(bots) : period === "all-time" || period === "top" ? sortTop(bots) : sortHot(bots);
      return json({ bots: sorted.slice(0, 20) });
    }
    if (path === "v1/install_bot") {
      const id = url.searchParams.get("id") || "";
      const bot = await getBot(id);
      if (!bot) return json({ error: "Not found" }, 404);
      return json({ id: bot.id, url: bot.link });
    }
    return json({ error: "Not found" }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return json({ error: message }, 500);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ rest: string[] }> }) {
  const rest = (await ctx.params).rest ?? [];
  const path = rest.join("/");
  try {
    if (path === "auth/logout") {
      await clearSessionCookie();
      return json({ ok: true });
    }
    const session = await getSession();
    const body = await safeJson(req);

    if (rest[0] === "bots" && rest[1] && rest[2] === "vote" && rest.length === 3) {
      if (!session) return json({ error: "Sign in" }, 401);
      const on = await toggleVote(session.userId, rest[1]);
      return json({ on });
    }
    if (rest[0] === "bots" && rest[1] && rest[2] === "add" && rest.length === 3) {
      if (!session) return json({ error: "Sign in" }, 401);
      const added = await addBot(session.userId, rest[1]);
      return json({ added });
    }
    if (rest[0] === "bots" && rest[1] && rest[2] === "comments" && rest.length === 3) {
      if (!session) return json({ error: "Sign in" }, 401);
      const parsed = z.object({ body: z.string().min(2), parentId: z.string().optional() }).parse(body);
      const id = await postComment({
        userId: session.userId,
        botId: rest[1],
        body: parsed.body,
        parentId: parsed.parentId,
      });
      return json({ id });
    }
    if (path === "bots") {
      if (!session) return json({ error: "Sign in" }, 401);
      const parsed = z
        .object({
          name: z.string(),
          desc: z.string(),
          cats: z.array(z.string()),
          link: z.string(),
          editId: z.string().nullable().optional(),
        })
        .parse(body);
      const id = await publishBot({ user: session, ...parsed });
      return json({ id });
    }
    if (path === "follow") {
      if (!session) return json({ error: "Sign in" }, 401);
      const parsed = z.object({ handle: z.string() }).parse(body);
      const on = await toggleFollow(session.userId, parsed.handle);
      return json({ on });
    }
    if (path === "reports") {
      if (!session) return json({ error: "Sign in" }, 401);
      const parsed = z.object({ botId: z.string(), reason: z.string() }).parse(body);
      await reportBot(session.userId, parsed.botId, parsed.reason);
      return json({ ok: true });
    }
    return json({ error: "Not found" }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return json({ error: message }, 400);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ rest: string[] }> }) {
  const rest = (await ctx.params).rest ?? [];
  const path = rest.join("/");
  const session = await getSession();
  if (!session) return json({ error: "Sign in" }, 401);
  try {
    if (path === "me") {
      const body = await safeJson(req);
      const parsed = z
        .object({
          name: z.string().optional(),
          bio: z.string().optional(),
          settings: z.record(z.string(), z.boolean()).optional(),
        })
        .parse(body);
      await saveProfile(session.userId, parsed);
      return json({ ok: true });
    }
    return json({ error: "Not found" }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return json({ error: message }, 400);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ rest: string[] }> }) {
  const rest = (await ctx.params).rest ?? [];
  const session = await getSession();
  if (!session) return json({ error: "Sign in" }, 401);
  if (rest[0] === "bots" && rest[1] && rest.length === 2) {
    await deleteBot(session.userId, rest[1]);
    return json({ ok: true });
  }
  return json({ error: "Not found" }, 404);
}

async function safeJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text) return {};
  return JSON.parse(text) as unknown;
}

async function startX(req: Request) {
  const origin = originOf(req);
  if (twitterConfigured()) {
    const clientId = process.env.TWITTER_CLIENT_ID!;
    const redirect = `${origin}/api/auth/callback`;
    const state = crypto.randomUUID();
    const challenge = Buffer.from(crypto.randomUUID() + crypto.randomUUID())
      .toString("base64url")
      .slice(0, 64);
    const url = new URL("https://twitter.com/i/oauth2/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirect);
    url.searchParams.set("scope", "users.read tweet.read offline.access");
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "plain");
    const res = NextResponse.redirect(url);
    res.cookies.set("gbi_oauth", `${state}.${challenge}`, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return res;
  }
  if (!allowDevAuth()) {
    return json({ error: "X OAuth is not configured" }, 501);
  }
  const user = await findOrCreateUser({
    handle: ME.handle,
    name: ME.name,
    hue: ME.hue,
  });
  const res = NextResponse.redirect(new URL("/", origin));
  await attachSession(res, { userId: user.id, handle: user.handle, name: user.name });
  return res;
}

async function callbackX(req: Request) {
  const origin = originOf(req);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !twitterConfigured()) {
    return NextResponse.redirect(new URL("/?auth=declined", origin));
  }
  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64"),
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: `${origin}/api/auth/callback`,
      code_verifier: state || "challenge",
    }),
  });
  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/?auth=declined", origin));
  }
  const token = (await tokenRes.json()) as { access_token?: string };
  const meRes = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!meRes.ok) {
    return NextResponse.redirect(new URL("/?auth=declined", origin));
  }
  const meJson = (await meRes.json()) as {
    data?: { id: string; name: string; username: string; profile_image_url?: string };
  };
  const data = meJson.data;
  if (!data) return NextResponse.redirect(new URL("/?auth=declined", origin));
  const user = await findOrCreateUser({
    xId: data.id,
    handle: data.username,
    name: data.name,
    avatarUrl: data.profile_image_url ?? null,
  });
  const res = NextResponse.redirect(new URL("/", origin));
  await attachSession(res, { userId: user.id, handle: user.handle, name: user.name });
  void state;
  return res;
}
