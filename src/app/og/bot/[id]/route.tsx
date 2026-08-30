import { ImageResponse } from "next/og";
import { getBot, listBots } from "@/lib/repo";
import { CATS } from "@/lib/categories";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const bot = id === "_site" ? null : await getBot(id);
  const name = bot?.name ?? "grokbotit";
  const desc = bot?.desc ?? "Every Grok Bot worth running, ranked by the people who actually run them.";
  const up = bot ? bot.up.toLocaleString("en-US") : "";
  const adds = bot ? `${bot.adds.toLocaleString("en-US")} adds` : "";
  const maker = bot ? `by ${bot.makerHandle}` : "";
  let rankLine = "";
  if (bot?.tags[0]) {
    const all = await listBots();
    const cat = bot.tags[0];
    const ranked = all
      .filter((b) => b.tags.includes(cat))
      .sort((a, b) => b.up - a.up);
    const idx = ranked.findIndex((b) => b.id === bot.id);
    if (idx >= 0 && idx < 3) rankLine = `#${idx + 1} in ${cat}`;
  }
  const catHue = CATS.find((c) => c.name === bot?.tags[0])?.hue ?? "#ff4d14";
  void catHue;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#000",
          color: "#f2f4f5",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          position: "relative",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -90,
            top: -90,
            width: 340,
            height: 340,
            borderRadius: 170,
            background: "#ff4d14",
            opacity: 0.14,
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: "#ff4d14",
              display: "flex",
            }}
          />
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1.2, display: "flex" }}>
            grokbot<span style={{ color: "#ff4d14" }}>it</span>
          </div>
          {rankLine ? (
            <div style={{ fontSize: 18, color: "#8b9299", marginLeft: 10, display: "flex" }}>{rankLine}</div>
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 920 }}>
          <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: -2, lineHeight: 1.05, display: "flex" }}>{name}</div>
          <div style={{ fontSize: 26, color: "#9ba2a8", lineHeight: 1.4, display: "flex" }}>{desc}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {bot ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#ff4d14",
                color: "#fff",
                padding: "12px 22px",
                borderRadius: 999,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              ▲ {up}
            </div>
          ) : null}
          {adds ? <div style={{ fontSize: 20, color: "#7d848b" }}>{adds}</div> : null}
          {maker ? <div style={{ fontSize: 20, color: "#7d848b" }}>{maker}</div> : null}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
