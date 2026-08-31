import fs from "node:fs";
import path from "node:path";

type Boot = Record<string, unknown>;

function prototypeHtml(): string {
  const p = path.join(process.cwd(), "prototype", "Grokbotit.dc.html");
  return fs.readFileSync(p, "utf8");
}

function pathFor(route: string, param: string | null): string {
  if (route === "home") return "/";
  if (route === "bot" && param) return `/bot/${encodeURIComponent(param)}`;
  if (route === "category" && param) return `/category/${encodeURIComponent(param)}`;
  if (route === "profile" && param) {
    const h = param.replace(/^@/, "");
    return `/profile/${encodeURIComponent(h)}`;
  }
  if (route === "search") {
    return param ? `/search?q=${encodeURIComponent(param)}` : "/search";
  }
  return `/${route}`;
}

const HELPERS = `
function gbiParse(pathname, search) {
  const parts = (pathname || "/").replace(/\\/+$/, "").split("/").filter(Boolean);
  if (!parts.length) return { route: "home", param: null };
  const one = { submit:1, categories:1, leaderboard:1, settings:1, badges:1, how:1, guidelines:1, privacy:1, terms:1, mcp:1, ogcard:1 };
  if (one[parts[0]] && parts.length === 1) return { route: parts[0], param: null };
  if (parts[0] === "bot" && parts[1]) return { route: "bot", param: decodeURIComponent(parts[1]) };
  if (parts[0] === "category" && parts[1]) return { route: "category", param: decodeURIComponent(parts[1]) };
  if (parts[0] === "profile" && parts[1]) {
    const h = decodeURIComponent(parts[1]);
    return { route: "profile", param: h.charAt(0) === "@" ? h : "@" + h };
  }
  if (parts[0] === "search") {
    const q = new URLSearchParams(search || "").get("q") || (parts[1] ? decodeURIComponent(parts[1]) : "");
    return { route: "search", param: q };
  }
  return { route: "home", param: null };
}
function gbiPath(route, param) {
  if (route === "home") return "/";
  if (route === "bot" && param) return "/bot/" + encodeURIComponent(param);
  if (route === "category" && param) return "/category/" + encodeURIComponent(param);
  if (route === "profile" && param) return "/profile/" + encodeURIComponent(String(param).replace(/^@/, ""));
  if (route === "search") return param ? "/search?q=" + encodeURIComponent(param) : "/search";
  return "/" + route;
}
`;

export function renderSpa(opts: {
  pathname: string;
  search: string;
  origin: string;
  boot: Boot;
}): string {
  let html = prototypeHtml();
  html = html.replace("./support.js", "/support.js");
  html = html.replaceAll('src="assets/', 'src="/assets/');
  html = html.replaceAll("src='assets/", "src='/assets/");

  const parsed = (() => {
    const parts = opts.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    if (!parts.length) return { route: "home", param: null as string | null };
    if (parts[0] === "bot") return { route: "bot", param: parts[1] ?? null };
    if (parts[0] === "category") return { route: "category", param: decodeURIComponent(parts[1] ?? "") };
    if (parts[0] === "profile") {
      const h = decodeURIComponent(parts[1] ?? "");
      return { route: "profile", param: h.startsWith("@") ? h : `@${h}` };
    }
    if (parts[0] === "search") {
      const q = new URLSearchParams(opts.search).get("q") || "";
      return { route: "search", param: q };
    }
    return { route: parts[0], param: null as string | null };
  })();

  const bootJson = JSON.stringify(opts.boot).replace(/</g, "\\u003c");
  const injectHead = `<script>window.__GBI_BOOT=${bootJson};window.__GBI_PATH=${JSON.stringify(opts.pathname)};</script>`;
  html = html.replace("<head>", `<head>${injectHead}`);

  const bots = Array.isArray(opts.boot.bots) ? (opts.boot.bots as Array<Record<string, unknown>>) : [];
  const active = parsed.route === "bot" ? bots.find((b) => b.id === parsed.param) : null;
  const title = active
    ? `${active.name} · grokbotit`
    : "grokbotit — every Grok Bot worth running";
  const desc = active
    ? String(active.desc)
    : "A Product Hunt-style community for Grok Bots. Connect X, post the bots you've built, upvote them, and argue in the replies.";
  const ogImage = active
    ? `${opts.origin}/og/bot/${encodeURIComponent(String(active.id))}`
    : `${opts.origin}/og/bot/_site`;
  const canonical = `${opts.origin}${pathFor(parsed.route, parsed.param)}`;
  html = html.replace(
    "<head>",
    `<head>
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:image" content="${escapeHtml(ogImage)}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" href="/assets/grokbotit-mark.svg" type="image/svg+xml">
`,
  );

  html = html.replace(
    "const GROUPS = [",
    `${HELPERS}
const GROUPS = [`,
  );

  html = html.replace(
    "route:'home', param:null, signedIn:true",
    "route:(typeof window!=='undefined'&&gbiParse(location.pathname,location.search).route)||'home', param:(typeof window!=='undefined'&&gbiParse(location.pathname,location.search).param), signedIn:(typeof window!=='undefined'&&window.__GBI_BOOT)?!!window.__GBI_BOOT.signedIn:true",
  );

  html = html.replace(
    "meName:ME.name, meBio:ME.bio, vw:1280",
    "meName:ME.name, meBio:ME.bio, vw:(typeof window!=='undefined'&&window.innerWidth)||1280",
  );

  html = html.replace(
    `componentDidMount() {
    if (this.props.startSignedOut) this.setState({ signedIn:false, onboarded:false });
    if (typeof window !== 'undefined') {
      this._r = () => this.setState({ vw:window.innerWidth });
      this._r();
      window.addEventListener('resize', this._r);
    }
  }`,
    `componentDidMount() {
    if (this.props.startSignedOut) this.setState({ signedIn:false, onboarded:false });
    if (typeof window !== 'undefined') {
      this._r = () => this.setState({ vw:window.innerWidth });
      this._r();
      window.addEventListener('resize', this._r);
      this._pop = () => {
        const p = gbiParse(location.pathname, location.search);
        this.setState({ route:p.route, param:p.param, notifOpen:false });
      };
      window.addEventListener('popstate', this._pop);
      const p = gbiParse(location.pathname, location.search);
      this.setState({ route:p.route, param:p.param, vw:window.innerWidth });
      if (window.__GBI_BOOT && window.__GBI_BOOT.signedIn) {
        this.setState({
          signedIn:true,
          votes: window.__GBI_BOOT.votes || {},
          adds: window.__GBI_BOOT.adds || {},
          follows: window.__GBI_BOOT.follows || {},
          likes: window.__GBI_BOOT.likes || {},
          settings: Object.assign({}, this.state.settings, window.__GBI_BOOT.settings || {}),
          onboarded: true
        });
      }
    }
  }`,
  );

  html = html.replace(
    `componentWillUnmount() {
    clearTimeout(this._t); clearTimeout(this._b); clearTimeout(this._p);
    if (typeof window !== 'undefined' && this._r) window.removeEventListener('resize', this._r);
  }`,
    `componentWillUnmount() {
    clearTimeout(this._t); clearTimeout(this._b); clearTimeout(this._p);
    if (typeof window !== 'undefined' && this._r) window.removeEventListener('resize', this._r);
    if (typeof window !== 'undefined' && this._pop) window.removeEventListener('popstate', this._pop);
  }`,
  );

  html = html.replace(
    `go(route, param) {
    this.setState({ route, param:param || null, notifOpen:false, commentDraft:'', replyTo:null });
    if (typeof window !== 'undefined') window.scrollTo({ top:0, behavior:'smooth' });
  }`,
    `go(route, param) {
    this.setState({ route, param:param || null, notifOpen:false, commentDraft:'', replyTo:null });
    if (typeof window !== 'undefined') {
      const url = gbiPath(route, param || null);
      if (location.pathname + location.search !== url) history.pushState({ route, param }, '', url);
      window.scrollTo({ top:0, behavior:'smooth' });
    }
  }`,
  );

  html = html.replace(
    `allBots() { return this.props.dayOne ? this.state.userBots : this.state.userBots.concat(BOTS); }`,
    `allBots() {
    if (this.props.dayOne) return this.state.userBots;
    const remote = (typeof window !== 'undefined' && window.__GBI_BOOT && window.__GBI_BOOT.bots) || null;
    return this.state.userBots.concat(remote && remote.length ? remote : BOTS);
  }`,
  );

  html = html.replace(
    `commentsFor(id) {
    return (this.state.newComments[id] || []).concat(COMMENTS[id] || []);
  }`,
    `commentsFor(id) {
    const remote = (typeof window !== 'undefined' && window.__GBI_BOOT && window.__GBI_BOOT.comments && window.__GBI_BOOT.comments[id]) || COMMENTS[id] || [];
    return (this.state.newComments[id] || []).concat(remote);
  }`,
  );

  html = html.replace(
    `vote(b) {
    if (!this.requireAuth()) return;
    const on = !this.state.votes[b.id];
    clearTimeout(this._b); clearTimeout(this._p);
    this.setState(s => ({
      votes:Object.assign({}, s.votes, { [b.id]:on }),
      burst:on ? b.id : null, plusOne:on ? b.id : null,
      combo:on ? s.combo + 1 : 0
    }));
    if (on) {
      this._b = setTimeout(() => this.setState({ burst:null, plusOne:null }), 700);
    }
  }`,
    `vote(b) {
    if (!this.requireAuth()) return;
    const on = !this.state.votes[b.id];
    clearTimeout(this._b); clearTimeout(this._p);
    this.setState(s => ({
      votes:Object.assign({}, s.votes, { [b.id]:on }),
      burst:on ? b.id : null, plusOne:on ? b.id : null,
      combo:on ? s.combo + 1 : 0
    }));
    if (on) {
      this._b = setTimeout(() => this.setState({ burst:null, plusOne:null }), 700);
    }
    fetch('/api/bots/' + encodeURIComponent(b.id) + '/vote', { method:'POST' }).catch(() => {});
  }`,
  );

  html = html.replace(
    `addBot(b) {
    if (!this.requireAuth()) return;
    if (this.state.adds[b.id]) { this.toast(b.name + ' is already in your Grok Bots'); return; }
    this.setState(s => ({ adds:Object.assign({}, s.adds, { [b.id]:true }) }));
    this.toast('Added ' + b.name + ' to Grok Bot');
  }`,
    `addBot(b) {
    if (!this.requireAuth()) return;
    if (this.state.adds[b.id]) { this.toast(b.name + ' is already in your Grok Bots'); return; }
    this.setState(s => ({ adds:Object.assign({}, s.adds, { [b.id]:true }) }));
    this.toast('Added ' + b.name + ' to Grok Bot');
    fetch('/api/bots/' + encodeURIComponent(b.id) + '/add', { method:'POST' }).catch(() => {});
  }`,
  );

  html = html.replace(
    `toggleFollow(handle, name) {
    if (!this.requireAuth()) return;
    const on = !this.state.follows[handle];
    this.setState(s => ({ follows:Object.assign({}, s.follows, { [handle]:on }) }));
    this.toast(on ? 'Following ' + name : 'Unfollowed ' + name);
  }`,
    `toggleFollow(handle, name) {
    if (!this.requireAuth()) return;
    const on = !this.state.follows[handle];
    this.setState(s => ({ follows:Object.assign({}, s.follows, { [handle]:on }) }));
    this.toast(on ? 'Following ' + name : 'Unfollowed ' + name);
    fetch('/api/follow', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ handle }) }).catch(() => {});
  }`,
  );

  html = html.replace(
    `report() {
    const r = this.state.reportFor, reason = this.state.reportReason;
    if (!r || !reason) return;
    this.setState(s => ({ flags:Object.assign({}, s.flags, { [r.id]:(s.flags[r.id] || 0) + 1 }), reportFor:null, reportReason:null }));
    this.toast('Reported. Enough flags and it goes to the community queue.');
  }`,
    `report() {
    const r = this.state.reportFor, reason = this.state.reportReason;
    if (!r || !reason) return;
    this.setState(s => ({ flags:Object.assign({}, s.flags, { [r.id]:(s.flags[r.id] || 0) + 1 }), reportFor:null, reportReason:null }));
    this.toast('Reported. Enough flags and it goes to the community queue.');
    fetch('/api/reports', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ botId:r.id, reason }) }).catch(() => {});
  }`,
  );

  html = html.replace(
    "  renderVals() {",
    `  liveMe() {
    const boot = (typeof window !== 'undefined' && window.__GBI_BOOT) || {};
    return boot.me || ME;
  }
  makersLive() {
    const boot = (typeof window !== 'undefined' && window.__GBI_BOOT) || {};
    return boot.makers && boot.makers.length ? boot.makers : MAKERS;
  }

  renderVals() {`,
  );

  html = html.replace(
    "  renderVals() {\n    const st = this.state;",
    "  renderVals() {\n    const ME = this.liveMe();\n    const MAKERS = this.makersLive();\n    const st = this.state;",
  );

  html = html.replace(
    "signIn:() => { this.setState({ signedIn:true, signInOpen:false, authError:null, onboarded:st.interests.length > 0 }); this.toast('Connected as ' + ME.handle); },",
    "signIn:() => { location.href = '/api/auth/x'; },",
  );

  html = html.replace(
    "signOut:() => { this.setState({ signedIn:false, authError:null, onboarded:true }); this.go('home'); this.toast('Signed out'); },",
    "signOut:() => { fetch('/api/auth/logout', { method:'POST' }).then(() => { location.href = '/'; }); },",
  );

  html = html.replace(
    "notifications: NOTIFS.map(n => Object.assign({}, n, { pfpStyle:pfp(n.hue) })),",
    "notifications: ((typeof window!=='undefined'&&window.__GBI_BOOT&&window.__GBI_BOOT.notifications)||NOTIFS).map(n => Object.assign({}, n, { pfpStyle:pfp(n.hue) })),",
  );

  html = html.replace(
    `copyInstall:() => this.toast('Install command copied'),
      copyConfig:() => this.toast('MCP config copied'),
      copyRepo:() => this.toast('github.com/grokbotit/mcp copied'),`,
    `copyInstall:() => { navigator.clipboard.writeText('npx -y @grokbotit/mcp'); this.toast('Install command copied'); },
      copyConfig:() => { navigator.clipboard.writeText('{"mcpServers":{"grokbotit":{"command":"npx","args":["-y","@grokbotit/mcp"]}}}'); this.toast('MCP config copied'); },
      copyRepo:() => { navigator.clipboard.writeText('github.com/raxmichter/Grok-Bot-It'); this.toast('github.com/raxmichter/Grok-Bot-It copied'); },`,
  );

  html = html.replace(
    `this.setState(s => ({ newComments:Object.assign({}, s.newComments, { [activeBot.id]:[c].concat(s.newComments[activeBot.id] || []) }), commentDraft:'' }));
        this.toast('Reply posted');`,
    `this.setState(s => ({ newComments:Object.assign({}, s.newComments, { [activeBot.id]:[c].concat(s.newComments[activeBot.id] || []) }), commentDraft:'' }));
        this.toast('Reply posted');
        fetch('/api/bots/' + encodeURIComponent(activeBot.id) + '/comments', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ body:text }) }).catch(() => {});`,
  );

  html = html.replace(
    `this.setState(s => ({ userBots:s.userBots.filter(x => x.id !== b.id), manageFor:null }));
    this.toast(b.name + ' deleted');
    this.go('profile', ME.handle);`,
    `this.setState(s => ({ userBots:s.userBots.filter(x => x.id !== b.id), manageFor:null }));
    this.toast(b.name + ' deleted');
    fetch('/api/bots/' + encodeURIComponent(b.id), { method:'DELETE' }).catch(() => {});
    this.go('profile', this.liveMe().handle);`,
  );

  html = html.replace(
    "saveProfile:() => this.toast('Profile saved'),",
    "saveProfile:() => { fetch('/api/me', { method:'PATCH', headers:{'content-type':'application/json'}, body: JSON.stringify({ name:st.meName, bio:st.meBio, settings:st.settings }) }).catch(() => {}); this.toast('Profile saved'); },",
  );

  return html;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
