import { bootstrap } from "@/lib/repo";
import { getSession } from "@/lib/auth/session";
import { renderSpa } from "@/lib/spa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ slug?: string[] }> }) {
  const url = new URL(req.url);
  const slug = (await ctx.params).slug ?? [];
  if (slug[0] === "api") {
    return new Response("Not found", { status: 404 });
  }
  const session = await getSession();
  const boot = await bootstrap(session);
  const html = renderSpa({
    pathname: url.pathname,
    search: url.search,
    origin: process.env.APP_URL || url.origin,
    boot,
  });
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
