export function hotScore(upvotes: number, ageHours: number): number {
  return upvotes / (ageHours + 2);
}

export function sortHot<T extends { up: number; ageH: number }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => hotScore(b.up, b.ageH) - hotScore(a.up, a.ageH),
  );
}

export function sortNew<T extends { ageH: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => a.ageH - b.ageH);
}

export function sortTop<T extends { up: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => b.up - a.up);
}

export function ageHoursSince(createdAtMs: number, nowMs = Date.now()): number {
  return Math.max(0, (nowMs - createdAtMs) / 3_600_000);
}

export function ageLabel(hours: number): string {
  if (hours < 1 / 60) return "now";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 24) {
    const h = Math.round(hours);
    return h === 1 ? "1h" : `${h}h`;
  }
  const d = Math.round(hours / 24);
  return d === 1 ? "1d" : `${d}d`;
}

export function snippet(text: string, max = 96): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  const base = space > max * 0.6 ? cut.slice(0, space) : cut;
  return base.replace(/[,.;:\s]+$/, "") + "…";
}

export function slugHandle(name: string): string {
  return "@" + name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14);
}

export function initialOf(name: string): string {
  const ch = name.trim()[0];
  return ch ? ch.toUpperCase() : "?";
}
