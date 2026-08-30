import { GROUPS } from "./seed-data";

export type Category = {
  name: string;
  hue: string;
  light: string;
  group: string;
};

export const CATS: Category[] = GROUPS.flatMap((g) =>
  g.items.map((name) => ({
    name,
    hue: g.hue,
    light: g.light,
    group: g.name,
  })),
);

const BY_NAME: Record<string, Category> = {};
for (const c of CATS) BY_NAME[c.name] = c;

export function catStyle(name: string): Category {
  return BY_NAME[name] ?? { name, hue: "#7d848b", light: "#9ba2a8", group: "" };
}

export function isCategory(name: string): boolean {
  return name in BY_NAME;
}
