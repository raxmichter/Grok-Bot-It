# grokbotit

A Product Hunt-style community for Grok Bots. People connect X, post the bots they have built, upvote them, add them, and argue in the replies. Free, no ads, no company behind it.

**Live:** [grokbotit.com](https://grokbotit.com)

The original design prototype lives in `prototype/` and is the visual source of truth. The Next.js app serves that UI, persists it through a SQLite/Turso backend, and exposes a public API plus `@grokbotit/mcp`.

## Stack

- Next.js 16 (App Router) on Vercel
- libSQL / Turso (local file in development)
- X OAuth 2.0 when `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` are set; otherwise a local Connect X session (set `ALLOW_DEV_AUTH=true`)
- Ranking: Hot is `upvotes / (ageHours + 2)`. One upvote per account. Adds are a separate install count.

## Develop

```bash
source ~/.nvm/nvm.sh
cp .env.example .env.local   # then set AUTH_SECRET
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Signed session cookie |
| `APP_URL` | Canonical origin (`https://grokbotit.com` in production) |
| `TURSO_DATABASE_URL` | `file:./data/grokbotit.db` locally, `libsql://…` in production |
| `TURSO_AUTH_TOKEN` | Turso token (production) |
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | X OAuth 2.0 |
| `ALLOW_DEV_AUTH` | If `true`, Connect X signs in the seeded builder without X |

## MCP

```
npx -y @grokbotit/mcp
```

Tools: `search_bots`, `get_bot`, `list_categories`, `top_bots`, `install_bot`. Read access is unauthenticated. Voting is not exposed.

Contact: hello@grokbotit.com
