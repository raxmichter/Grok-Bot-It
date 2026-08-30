# grokbotit

Product Hunt-style directory for Grok Bots. The visual source of truth is `prototype/Grokbotit.dc.html`. Production serves that UI through Next.js with a libSQL backend.

- TypeScript strict. No `any`.
- Ranking: Hot is `upvotes / (ageHours + 2)`. One upvote per account. Category counts are derived.
- Do not expose voting on the MCP server.
- Third-party X / GrokBot marks only on Connect X, Add to Grok Bot, Share on, and the footer credit.
- Contact: hello@grokbotit.com
