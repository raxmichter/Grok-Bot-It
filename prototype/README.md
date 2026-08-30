# grokbotit.com — design prototype handoff

A Product Hunt-style community for Grok Bots. People connect X, post the bots they've built,
upvote them, add them, and argue in the replies. Free, no ads, no company behind it.

**This repo is a working design prototype, not a production app.** Every screen and interaction
is real and clickable; all data is in-memory. Read `## What needs a backend` before estimating.

---

## Files

| Path | What it is |
| --- | --- |
| `Grokbotit.dc.html` | The entire prototype. One file: markup + logic + data. Open it directly in a browser. |
| `support.js` | Runtime that renders the file. Do not edit. |
| `assets/grokbotit-mark.svg` | The grokbotit logo — an orange orb with two chevron eyes. Original mark. |
| `assets/grokbot-mark.png` | GrokBot's logo. Third-party mark, used only in "Add to Grok Bot" and the footer credit. |
| `assets/x-mark.png` | X's logo, transparent. Third-party mark, used only in Connect X / Share on. |
| `uploads/` | Original logo files as supplied. Source material, not referenced by the app. |

To view: open `Grokbotit.dc.html` in any modern browser. No build step, no server, no install.

---

## How the file is structured

It's a single component with two halves:

1. **Template** — the markup between `<x-dc>` and `</x-dc>`. All styling is inline. Holes are
   `{{ dotted.paths }}` only; they cannot contain expressions. `<sc-for>` loops, `<sc-if>` branches.
2. **Logic class** — `class Component extends DCLogic` inside `<script data-dc-script>`. Holds the
   seed data, all state, and a `renderVals()` method that returns every value the template reads.

Anything conditional or computed lives in `renderVals()` and is exposed by name. If you're porting
this to React/Next, `renderVals()` is effectively your view model and maps over almost 1:1.

---

## Design system

Nothing here came from a component library. These are the actual values in use — match them.

**Colour**

```
Ground        #000000   true black, page background
Surface       #0b0c0d   cards, panels
Surface alt   #0e0f10   raised cards, inputs
Hairline      #1a1c1f   dividers
Border        #26282c   card borders
Border strong #383b40   interactive borders
Accent        #ff4d14   upvotes, primary actions, active states
Accent light  #ff9166   accent text on dark
Accent deep   #4d2010   accent borders
Positive      #4ec98a   rank gains
Negative      #e0644f   rank losses, destructive
Warning       #c8871a   flagged / expired states
```

**Text ramp** — five steps, all ≥3.7:1 on black. Never invent a sixth.

```
#f2f4f5   primary — headings, names, values
#c9ced3   reading copy — long paragraphs
#9ba2a8   secondary — descriptions, body in cards
#7d848b   meta — timestamps, counts, hints
#676e75   quietest — legal, de-emphasised links
```

**Category colour** — five groups, each with a hue and a light variant. Category identity is
carried by colour everywhere it appears: tag pills, tiles, dots.

```
Assistants  #ff4d14 / #ff9166   Personal Assistant, Email, Scheduling, Notes, Reminders
Work        #3a7bd5 / #84b4f2   Writing, Research, Marketing, Sales, Recruiting, Finance,
                                Legal, Data, Product, Design, Operations
Building    #7b5bd6 / #af99f2   Dev, Code Review, Security, DevOps, Docs, Testing
On X        #d6486f / #f28fa9   Summarising, Fact Checking, Monitoring, Thread Writing,
                                Moderation, Translation
Interests   #2f9e6f / #6fd7a8   Space, Science, Sports, Markets, Gaming, Music, Film, Food,
                                Travel, Fitness, Health, Education, Language
```

41 categories, all of them real use cases. There are deliberately **no joke categories** — no
roasting, no shitposting. The directory is meant to read as something the GrokBot team would be
happy to be listed in, and the seed roster follows the same rule: every one of the 20 example bots
describes real work. If you add seed data, hold that line.

**Type** — three faces, strict roles. This split matters; collapsing it was the main readability
problem during design.

```
Bricolage Grotesque   display only — page titles, bot names, the wordmark. 700-800.
Instrument Sans       everything with words in it — body, UI, buttons, hints, legal. 400-700.
IBM Plex Mono         numbers, handles, and short uppercase labels. Nothing else. 400-600.
```

**Size scale** — six steps. Nothing below 11px.
`11` micro labels (uppercase, tracked .12em) · `12` meta · `13` secondary · `14` UI default ·
`15` body · `17-18` lead. Display sizes use `clamp()`.

**Radius** `9` chips · `14` small cards · `16-18` cards · `20-22` large cards/modals · `999` pills

**Motion** — every animation is in the `<style>` block in `<helmet>`.
`fadeUp` list entry, staggered 55ms per item · `popIn` modals and tab indicators ·
`votePop` + `ringOut` + `plusUp` the upvote · `toastIn` toasts · `glowPulse` #1 rank ·
`blink` live dot · `barRise` streak bars · `floaty` idle logo · `marquee` reserved.
Hover on any card: `translateY(-2/3px)` with a border lighten, 220-280ms, `cubic-bezier(.34,1.2,.64,1)`.

---

## Data model

```
Bot      id, name, handle, hue, tagline, desc, tags[], up, adds, ageH, age,
         maker, makerHandle, makerInitial
Maker    rank, name, handle, initial, hue, bots, cred, badge, followers, following, bio
Comment  id, name, handle, initial, hue, age, up, body, replies[]
Category name, hue, light, group          (41 across 5 groups)
Badge    name, desc, hue, light, holders   (6; rarity is derived from holders)
```

Notes that carry real product decisions:

- `tagline` is a short line for list rows; `desc` is the full two-sentence description. A user-posted
  bot derives its tagline from `desc` via `snippet()`, which cuts at a word boundary and ellipsises.
- `adds` outrank upvotes conceptually — an add means someone installed the bot. It's shown as a
  bordered stat chip, not a footnote.
- A comment is flagged as the creator's by comparing `comment.handle === bot.makerHandle`. Never
  store this as a boolean; it has to stay derived or edited bots break it.
- Category counts are derived from the bot array, never stored. Two sources of truth for one number
  was a real bug during design.
- Reputation is called **cred**. Not karma — that reads as Reddit.
- Posting requires at least one category. Never reintroduce a hardcoded fallback tag — an earlier
  version fell back to `'Utility'`, which stopped existing when the categories were revised, and
  produced grey untinted pills plus an orphan category page.

---

## Routes

Held in `state.route` with an optional `state.param`. `go(route, param)` navigates and scrolls up.

```
home         feed. Tabs: Hot · New · Top · Following
bot          bot detail — votes, threaded replies, related bots     param: bot id
submit       3-step post flow, also serves edit mode                uses state.editId
profile      builder profile — Bots / Upvoted / Replies             param: handle
categories   40 categories in 5 groups
category     one category's ranked bots                             param: category name
leaderboard  podium, records strip, ranked list. Tabs: Bots · Builders
search       results split into Bots / Builders / Categories        param: query
settings     profile, notifications, connected account, danger zone
badges       badge gallery with rarity and how each is earned
how          how it works — mechanics and ranking explained
guidelines   community rules, do / don't
privacy      privacy policy
terms        terms of service
ogcard       1200×630 share card spec for link previews
mcp          MCP server docs — install, tools, limits
```

**Prototype tweaks.** Two props on the component switch demo state without editing anything:
`dayOne` (empty directory, cold-start state) and `startSignedOut` (visitor, sign-in gate active).
Both default to false.

Overlays sit outside the router: onboarding, sign-in modal (with declined / expired states),
report modal, notification dropdown, toasts, mobile bottom nav.

**Ranking** — `Hot` is `upvotes / (ageHours + 2)`, decaying continuously. `New` is age ascending.
`Top` is upvotes descending. `Following` filters to followed makers. One upvote per account,
no weighting, no editorial override. Nothing resets daily.

---

## The day-one state

The directory launches empty, so the cold start is a designed state rather than a fallback.
It triggers automatically whenever `allBots()` is empty; the `dayOne` prop forces it for demos.

What changes when `cold` is true:

- **The feed** is replaced by a statement panel — "Nobody has posted a Grok Bot yet" — that reframes
  the emptiness as the offer, plus a three-step explainer and a **dimmed ghost listing** showing what
  a real card looks like. The ghost's own copy teaches the norm ("describe mechanics, not benefits").
- **The Hot / New / Top / Following tabs are removed from the DOM.** Ranking controls with nothing to
  rank are worse than no controls.
- **The rail swaps job.** Trending categories and Builders to follow both disappear — with no data
  they would be fabricating. In their place: the Day One badge at 0 holders, and a prompt that all
  41 categories are unclaimed.
- **The leaderboard** gets its own "No rankings yet" panel; podium and records are suppressed.
- **Your own numbers read zero.** Cred, followers and following are 0, the streak shows "Not started"
  with empty bars, and no badges are awarded.

That last point matters more than it looks. `ME` is a hardcoded const with seeded stats, and every
one of those values has to be gated on `cold` or the empty state contradicts itself — a Streak 90
badge on a one-day-old directory destroys the credibility of the whole page. If you add any new
user-facing statistic, gate it on `cold` at the same time.

---

## Responsive

There are no CSS media queries — the file uses inline styles only, so breakpoints are driven from
JS. `state.vw` tracks `window.innerWidth` via a resize listener; `isMobile` is `< 760px`.

- **< 760px** — header nav collapses; the bottom tab bar appears (Feed · Browse · Post · Ranks · You)
  with a raised orange post button; the header's Post button hides to avoid duplicating it; toasts
  lift to clear the bar; the leaderboard podium stacks with #1 first.
- **< 1000px** — the feed's right rail stops being sticky once it stacks below the feed.
- Everything else is `flex-wrap` with generous `flex-basis` plus `clamp()` type, so it reflows
  continuously rather than snapping at breakpoints.

If you rebuild this in a framework with real CSS, convert these to media queries — the JS approach
is a constraint of the prototype format, not a recommendation.

---

## What needs a backend

Everything below is faked in-memory and resets on reload.

1. **X OAuth 2.0**, read-only, scoped to `users.read`. Store handle, display name, avatar URL.
   Nothing else — the privacy policy commits to this in writing. Needs refresh-token handling;
   the revoked-token UI already exists.
2. **Grok Bot link resolution.** Submit step 1 pretends to fetch the share card. Real version needs
   to resolve the link, confirm the bot exists, and pull name/description/avatar.
3. **Vote integrity.** One upvote per account per bot, enforced server-side. Rate limits. Detection
   for coordinated voting — the guidelines promise enforcement.
4. **Duplicate detection.** Submit warns on a repost, but only by substring-matching the link.
   Needs canonical bot IDs.
5. **Moderation queue.** Reporting and the community-review banner are built. The screen where
   flagged bots get reviewed is **not designed yet** — this is the largest remaining gap.
6. **Notifications.** The dropdown is static. Needs real events, read/unread, and the delivery
   preferences in Settings wired up.
7. **OG image generation.** `ogcard` is the spec; production needs it rendered per bot at 1200×630.
8. **Profile "Replies" tab** is intentionally empty — needs a comment-history model.
9. **The MCP server.** The `mcp` page documents a package that does not exist yet. See below.

The cold-start state needs no backend work — it is driven entirely by the bot count being zero, so
it will be correct on launch day for free, provided the `cold` gating above is preserved.

Also not yet designed: loading and skeleton states, error states beyond auth, and an accessibility
pass (keyboard nav through the feed, focus trapping in modals, labels on the vote buttons).

---

## The MCP server

The `mcp` route documents `@grokbotit/mcp` — a local MCP server that exposes the directory to
agents. **The page is a specification; the package is not written.** Building it is a small,
self-contained job and a good second workstream.

Install contract as documented:

```
npx -y @grokbotit/mcp
```

```json
{
  "mcpServers": {
    "grokbotit": {
      "command": "npx",
      "args": ["-y", "@grokbotit/mcp"],
      "env": { "GROKBOTIT_TOKEN": "optional — read access needs no token" }
    }
  }
}
```

Tools to implement:

| Tool | Args | Returns |
| --- | --- | --- |
| `search_bots` | query, category?, limit? | Ranked listings — name, handle, description, categories, upvotes, adds |
| `get_bot` | id | One listing in full, plus current category rank and install link |
| `list_categories` | group? | All 41 categories with live counts, grouped |
| `top_bots` | period, category? | Leaderboard slice — hot / new / all-time |
| `install_bot` | id | Resolves a listing to its Grok Bot link |

Rules the implementation must hold to — these are promises made on the page:

- **Read access is unauthenticated.** Search, listings, categories and leaderboards are public. A
  token is only required to post a bot from an agent.
- **Voting is not exposed at all.** No tool casts a vote, and no token grants that ability. One
  upvote per human account is the rule the entire ranking depends on; an agent-callable vote
  endpoint would destroy it. Do not add one, even behind a scope.
- **Rate limits:** 60 req/min unauthenticated, 600 with a token, responses cached 60s.
- **Stateless and local.** The server is a thin read client over the public API. No inbound network
  access, no local persistence.
- It resolves and describes listings; it does **not** execute bots. Bots run in Grok, on the user's
  own account.

---

## Extending it

**Add a category** — append to the right group's `items` array in `GROUPS`. Colour, tag pills,
tiles, counts, and the submit picker all follow automatically.

**Add a bot** — append to `BOTS`. Give it a `hue`, `tags` that exist in `GROUPS`, and an entry in
`COMMENTS` keyed by its id, or it renders with an empty reply state (which is correct behaviour).

**Add a statistic** — gate it on `cold` in the same expression that computes it. Two sources of
truth for one number has been the single most common bug in this file; it has been fixed three times
(category counts, bot counts, and the day-one user stats). Derive, never store.

**Add a screen** — add a route flag in `renderVals()` (`isFoo: route === 'foo'`), wrap the markup in
`<sc-if value="{{ isFoo }}">`, and add a nav or footer link calling `go('foo')`.

**Styling rules if you keep editing this file** — inline styles only, no classes, no stylesheets.
`<helmet>` may only hold fonts, `@keyframes`, and body resets. Compute anything conditional in
`renderVals()` and expose it as a named style string; never put an expression in a `{{ hole }}`.

---

## Brand and legal

- The grokbotit mark in `assets/grokbotit-mark.svg` is original and yours.
- The GrokBot and X marks are **third-party trademarks**. They appear only where they refer to the
  real thing: the Add to Grok Bot action, Connect X / Share on, and the footer credit. Do not use
  them in headers, favicons, or marketing as if they endorse the site.
- Every page footer carries the non-affiliation line. Keep it.
- Privacy Policy and Terms are written to match a free, no-data, no-revenue, no-company project.
  They are accurate to that description but were not written by a lawyer. Have one read them
  before launch.

---

## Suggested build order

1. X OAuth + onboarding — nothing works without identity.
2. Post a bot + the feed with Hot/New/Top. This is the product.
3. Upvotes with server-side integrity, then adds.
4. Replies, including the creator badge.
5. Profiles and following, then the Following tab.
6. Reporting plus the moderation queue you still need to design.
7. Leaderboard, badges, categories.
8. Search, settings, OG images.
9. The MCP server — independent of the web app, can run in parallel from step 3 onward.

Contact in the prototype is `hello@grokbotit.com`.
