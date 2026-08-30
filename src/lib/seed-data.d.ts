export const GROUPS: Array<{
  name: string;
  hue: string;
  light: string;
  items: string[];
}>;

export const BOTS: Array<{
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
}>;

export const MAKERS: Array<{
  rank: number;
  name: string;
  handle: string;
  initial: string;
  hue: string;
  bots: number;
  karma: string;
  badge: string;
  followers: string;
  following: string;
  bio: string;
}>;

export const BADGES: Array<{
  name: string;
  desc: string;
  hue: string;
  light: string;
  holders: number;
}>;

export const COMMENTS: Record<
  string,
  Array<{
    id: string;
    name: string;
    handle: string;
    initial: string;
    hue: string;
    age: string;
    up: number;
    body: string;
    replies: Array<{
      name: string;
      handle: string;
      initial: string;
      hue: string;
      age: string;
      body: string;
    }>;
  }>
>;

export const NOTIFS: Array<{
  initial: string;
  hue: string;
  text: string;
  age: string;
}>;

export const ME: {
  name: string;
  handle: string;
  initial: string;
  hue: string;
  karma: string;
  followers: string;
  following: string;
  streak: number;
  bio: string;
};

export const REPORT_REASONS: Array<{
  id: string;
  label: string;
  hint: string;
}>;
