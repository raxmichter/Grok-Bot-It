// Extracted from prototype/Grokbotit.dc.html — do not hand-edit.
const GROUPS = [
  { name:'Assistants', hue:'#ff4d14', light:'#ff9166', items:['Personal Assistant','Email','Scheduling','Notes','Reminders'] },
  { name:'Work', hue:'#3a7bd5', light:'#84b4f2', items:['Writing','Research','Marketing','Sales','Recruiting','Finance','Legal','Data','Product','Design','Operations'] },
  { name:'Building', hue:'#7b5bd6', light:'#af99f2', items:['Dev','Code Review','Security','DevOps','Docs','Testing'] },
  { name:'On X', hue:'#d6486f', light:'#f28fa9', items:['Summarising','Fact Checking','Monitoring','Thread Writing','Moderation','Translation'] },
  { name:'Interests', hue:'#2f9e6f', light:'#6fd7a8', items:['Space','Science','Sports','Markets','Gaming','Music','Film','Food','Travel','Fitness','Health','Education','Language'] }
];

const BOTS = [
  { id:'inbox-triage', name:'Inbox Triage', handle:'@inboxtriage', hue:'#ff4d14', tagline:'Returns the three emails that actually need you today.',
    desc:'Reads your morning inbox and returns the three messages that actually need you today, in priority order, each with a draft reply attached.',
    tags:['Personal Assistant','Email'], up:1341, adds:602, ageH:5, age:'5h', maker:'Ana Reyes', makerHandle:'@anareyes', makerInitial:'A' },
  { id:'context-collapse', name:'Context Collapse', handle:'@ctxcollapse', hue:'#7b5bd6', tagline:'Turns a sprawling quote-tweet chain into three neutral bullets.',
    desc:'Follows a quote-tweet chain across every branch, strips the adjectives out, and returns three neutral bullets naming who claimed what.',
    tags:['Summarising','Research'], up:1274, adds:512, ageH:1, age:'1h', maker:'Ana Reyes', makerHandle:'@anareyes', makerInitial:'A' },
  { id:'draft-trim', name:'Draft Trim', handle:'@drafttrim', hue:'#c8871a', tagline:'Cuts a draft by forty percent and shows you what it removed.',
    desc:'Cuts a draft by roughly forty percent without losing an argument, then shows a diff of exactly what it removed so you can put anything back.',
    tags:['Writing','Marketing'], up:1198, adds:544, ageH:2, age:'2h', maker:'Sam Whitlock', makerHandle:'@samwhit', makerInitial:'S' },
  { id:'contract-check', name:'Contract Check', handle:'@contractcheck', hue:'#8a8f1f', tagline:'Checks a token contract against known risk patterns.',
    desc:'Checks a token contract for the risk patterns that most often precede a failure and reports which are present. It does not give price guidance.',
    tags:['Markets','Security'], up:1189, adds:433, ageH:10, age:'10h', maker:'Dev Mirza', makerHandle:'@nullpointer', makerInitial:'D' },
  { id:'launch-review', name:'Launch Review', handle:'@launchreview', hue:'#3a7bd5', tagline:'Structured critique of a landing page or repo in one pass.',
    desc:'Reads a landing page or repository and returns a structured critique: positioning, clarity, the weakest claim, and the one thing to fix first.',
    tags:['Product','Marketing'], up:1102, adds:388, ageH:9, age:'9h', maker:'Dev Mirza', makerHandle:'@nullpointer', makerInitial:'D' },
  { id:'draft-check', name:'Draft Check', handle:'@draftcheck', hue:'#d6486f', tagline:'Flags the phrasing in a draft most likely to be misread.',
    desc:'Reviews a draft post before you publish it, flags the phrasing most likely to be misread out of context, and offers a clearer alternative.',
    tags:['Writing','Monitoring'], up:1084, adds:410, ageH:3, age:'3h', maker:'Kate Ostrom', makerHandle:'@orbital_kate', makerInitial:'K' },
  { id:'office-hours', name:'Office Hours', handle:'@officehours', hue:'#2f9e6f', tagline:'Explains one thing properly, then tests the part you skimmed.',
    desc:'Explains one concept at whatever level you ask for, then quizzes you on the part you skimmed. It will not move on until you get that part right.',
    tags:['Education','Language'], up:951, adds:517, ageH:21, age:'21h', maker:'Ana Reyes', makerHandle:'@anareyes', makerInitial:'A' },
  { id:'standup-draft', name:'Standup Draft', handle:'@standupdraft', hue:'#7b5bd6', tagline:'Writes your standup from yesterday\u2019s commits.',
    desc:'Reads yesterday\u2019s commits and open pull requests and writes your standup in three lines. Flags anything you committed to and did not finish.',
    tags:['Dev','Personal Assistant'], up:918, adds:471, ageH:11, age:'11h', maker:'Dev Mirza', makerHandle:'@nullpointer', makerInitial:'D' },
  { id:'lease-check', name:'Lease Check', handle:'@leasecheck', hue:'#3a7bd5', tagline:'Flags every clause in a lease that costs you money later.',
    desc:'Takes a lease or contract and flags every clause that costs you money later, in plain language, with the page and paragraph it came from.',
    tags:['Legal','Finance'], up:864, adds:390, ageH:19, age:'19h', maker:'Ana Reyes', makerHandle:'@anareyes', makerInitial:'A' },
  { id:'posting-patterns', name:'Posting Patterns', handle:'@postpatterns', hue:'#2f9e6f', tagline:'Reports what an account actually posts about, and when.',
    desc:'Analyses the last fifty posts on an account and reports what it actually writes about, at what times, and which topics draw real engagement.',
    tags:['Monitoring','Data'], up:840, adds:199, ageH:14, age:'14h', maker:'Sam Whitlock', makerHandle:'@samwhit', makerInitial:'S' },
  { id:'resume-review', name:'Résumé Review', handle:'@resumereview', hue:'#ff4d14', tagline:'Names the claim a hiring manager will question first.',
    desc:'Reads a résumé and names the single claim a hiring manager will question first, then tells you what evidence to have ready for it.',
    tags:['Recruiting','Writing'], up:812, adds:301, ageH:12, age:'12h', maker:'Jules Park', makerHandle:'@julesbuilds', makerInitial:'J' },
  { id:'patch-tuesday', name:'Patch Tuesday', handle:'@patchtues', hue:'#c0392b', tagline:'Only reports a CVE if you actually run the affected thing.',
    desc:'Watches vulnerability feeds against the stack you list and only speaks up when something you actually run is affected. Silence is the feature.',
    tags:['Security','DevOps'], up:797, adds:288, ageH:8, age:'8h', maker:'Jules Park', makerHandle:'@julesbuilds', makerInitial:'J' },
  { id:'orbital-fact-check', name:'Orbital Fact Check', handle:'@orbitalfacts', hue:'#1f8a8a', tagline:'Answers space news with the actual orbital numbers.',
    desc:'Watches space news as it breaks, pulls the delta-v, launch window and payload margin that matter, and replies with the numbers shown.',
    tags:['Fact Checking','Space'], up:731, adds:260, ageH:6, age:'6h', maker:'Kate Ostrom', makerHandle:'@orbital_kate', makerInitial:'K' },
  { id:'account-summary', name:'Account Summary', handle:'@acctsummary', hue:'#c0392b', tagline:'Profiles a public account in four lines before you engage.',
    desc:'Profiles any public account in four lines: what they post about, how often, who they engage with, and how their reach has moved this month.',
    tags:['Monitoring','Research'], up:684, adds:241, ageH:22, age:'22h', maker:'Jules Park', makerHandle:'@julesbuilds', makerInitial:'J' },
  { id:'rules-lawyer', name:'Rules Lawyer', handle:'@ruleslawyer', hue:'#2f9e6f', tagline:'Settles tabletop rules questions with the page number.',
    desc:'Settles a rules question with the exact page, edition and printing, then states plainly which reading is correct. Accepts photographs of the book.',
    tags:['Gaming','Research'], up:623, adds:214, ageH:13, age:'13h', maker:'Mo Adeyemi', makerHandle:'@moadeyemi', makerInitial:'M' },
  { id:'layover', name:'Layover', handle:'@layoverbot', hue:'#1f8a8a', tagline:'Works out whether you can leave the airport, and what you can reach.',
    desc:'Given a connection time and an airport, works out whether you can clear immigration, leave the terminal and be back. Names what is actually reachable.',
    tags:['Travel','Personal Assistant'], up:588, adds:243, ageH:16, age:'16h', maker:'Kate Ostrom', makerHandle:'@orbital_kate', makerInitial:'K' },
  { id:'sentiment-read', name:'Sentiment Read', handle:'@sentimentread', hue:'#d6486f', tagline:'Scores a thread and cites the posts driving the number.',
    desc:'Scores the sentiment of a thread from zero to a hundred and cites the specific posts driving the number, so you can check its reasoning.',
    tags:['Monitoring','Fact Checking'], up:547, adds:176, ageH:4, age:'4h', maker:'Mo Adeyemi', makerHandle:'@moadeyemi', makerInitial:'M' },
  { id:'release-notes', name:'Release Notes', handle:'@releasenotes', hue:'#c8871a', tagline:'Rewrites a changelog as something users will read.',
    desc:'Takes any changelog and rewrites it as a short thread that leads with the change users will actually notice. Keeps the version numbers intact.',
    tags:['Dev','Thread Writing'], up:512, adds:305, ageH:0.5, age:'30m', maker:'Dev Mirza', makerHandle:'@nullpointer', makerInitial:'D' },
  { id:'training-log', name:'Training Log', handle:'@traininglog', hue:'#2f9e6f', tagline:'Logs a session from one sentence, reports weekly volume.',
    desc:'Logs a training session from a single sentence and reports your weekly volume against the target you set, with the sessions you missed.',
    tags:['Fitness','Health'], up:474, adds:198, ageH:7, age:'7h', maker:'Sam Whitlock', makerHandle:'@samwhit', makerInitial:'S' },
  { id:'set-list', name:'Set List', handle:'@setlistbot', hue:'#7b5bd6', tagline:'Builds a set from room size, genre and closing time.',
    desc:'Builds a set list from a room size, a genre and a closing time, then explains the running order so you can argue with its reasoning.',
    tags:['Music','Operations'], up:466, adds:157, ageH:18, age:'18h', maker:'Mo Adeyemi', makerHandle:'@moadeyemi', makerInitial:'M' }
];

const MAKERS = [
  { rank:1, name:'Kate Ostrom', handle:'@orbital_kate', initial:'K', hue:'#ff4d14', bots:12, karma:'18.4k', badge:'Day One', followers:'4,120', following:'318', bio:'Propulsion engineer. I build bots that check the numbers before anyone draws a conclusion.' },
  { rank:2, name:'Dev Mirza', handle:'@nullpointer', initial:'D', hue:'#3a7bd5', bots:9, karma:'15.1k', badge:'10k Adds', followers:'3,504', following:'201', bio:'Small, single-purpose tools. If it takes more than a sentence to explain, it is not finished.' },
  { rank:3, name:'Ana Reyes', handle:'@anareyes', initial:'A', hue:'#7b5bd6', bots:7, karma:'11.9k', badge:'Streak 90', followers:'2,890', following:'450', bio:'Research and summarising bots. Attribution over interpretation.' },
  { rank:4, name:'Sam Whitlock', handle:'@samwhit', initial:'S', hue:'#2f9e6f', bots:6, karma:'9.7k', badge:'Category Lead', followers:'2,140', following:'612', bio:'Writing and analysis tools. Mostly interested in what the data says before anyone reads it.' },
  { rank:5, name:'Jules Park', handle:'@julesbuilds', initial:'J', hue:'#c8871a', bots:5, karma:'8.2k', badge:'Rising', followers:'1,776', following:'389', bio:'Monitoring and security bots. I care about the alert you actually need to act on.' }
];

const BADGES = [
  { name:'Day One', desc:'Posted a bot in the first week grokbotit existed. Never awarded again.', hue:'#ff4d14', light:'#ff9166', holders:214 },
  { name:'10k Adds', desc:'A single bot of yours crossed ten thousand adds. Upvotes do not count toward this one.', hue:'#3a7bd5', light:'#84b4f2', holders:38 },
  { name:'Streak 90', desc:'Ninety consecutive days of upvoting or replying. Miss one day and it starts over.', hue:'#2f9e6f', light:'#6fd7a8', holders:96 },
  { name:'Category Lead', desc:'Held number one in a category for seven straight days.', hue:'#d6486f', light:'#f28fa9', holders:12 },
  { name:'First Blood', desc:'Left the first reply on a bot that later reached the top ten.', hue:'#7b5bd6', light:'#af99f2', holders:503 },
  { name:'Hunter', desc:'Posted ten bots that each cleared a hundred upvotes.', hue:'#c8871a', light:'#e6b45c', holders:61 }
];

const COMMENTS = {
  'draft-check': [
    { id:'c1', name:'Jules Park', handle:'@julesbuilds', initial:'J', hue:'#c8871a', age:'1h', up:34, body:'Ran it on a draft about a pricing change and it flagged one word as the thing people would quote back at me. It was right.', replies:[
      { name:'Kate Ostrom', handle:'@orbital_kate', initial:'K', hue:'#ff4d14', age:'52m', body:'The single-word output is deliberate. Anything longer and people argue with the tool instead of reading the note.' }] },
    { id:'c2', name:'Mo Adeyemi', handle:'@moadeyemi', initial:'M', hue:'#d6486f', age:'2h', up:19, body:'Useful, but I want it to run on scheduled posts too. Right now I have to remember to paste the draft in first.', replies:[] },
    { id:'c3', name:'Kate Ostrom', handle:'@orbital_kate', initial:'K', hue:'#ff4d14', age:'3h', up:57, body:'Built this after a post of mine got quoted badly out of context. It is calibrated on about nine thousand replies, and it will tell you when it is not confident.', replies:[] }
  ],
  'launch-review': [
    { id:'c1', name:'Mo Adeyemi', handle:'@moadeyemi', initial:'M', hue:'#d6486f', age:'4h', up:88, body:'It told me my landing page buried the actual product below three paragraphs of positioning. Fixed that and conversion moved.', replies:[
      { name:'Dev Mirza', handle:'@nullpointer', initial:'D', hue:'#3a7bd5', age:'3h', body:'That is the most common finding by a wide margin. Almost every page I feed it has the same problem.' }] },
    { id:'c2', name:'Ana Reyes', handle:'@anareyes', initial:'A', hue:'#7b5bd6', age:'6h', up:22, body:'The structure is what makes it usable — positioning, clarity, weakest claim, one fix. Freeform critique is much harder to act on.', replies:[] }
  ],
  'context-collapse': [
    { id:'c1', name:'Kate Ostrom', handle:'@orbital_kate', initial:'K', hue:'#ff4d14', age:'30m', up:41, body:'The no-adjectives rule is doing most of the work here. I have borrowed it for an internal summarising tool.', replies:[] },
    { id:'c2', name:'Sam Whitlock', handle:'@samwhit', initial:'S', hue:'#2f9e6f', age:'45m', up:16, body:'Tried it on a chain with roughly four hundred quote tweets and it held up. Named three accounts, attributed each claim, no editorialising.', replies:[] }
  ],
  'posting-patterns': [
    { id:'c1', name:'Dev Mirza', handle:'@nullpointer', initial:'D', hue:'#3a7bd5', age:'6h', up:64, body:'The time-of-day breakdown was the useful part. Turns out everything I write after midnight underperforms by a wide margin.', replies:[
      { name:'Sam Whitlock', handle:'@samwhit', initial:'S', hue:'#2f9e6f', age:'5h', body:'That pattern shows up for almost everyone who runs it. It is the main reason I built the report the way I did.' }] },
    { id:'c2', name:'Mo Adeyemi', handle:'@moadeyemi', initial:'M', hue:'#d6486f', age:'9h', up:27, body:'Ran it on an account I have not touched since 2019 and the topic clustering was still accurate.', replies:[] }
  ],
  'orbital-fact-check': [
    { id:'c1', name:'Ana Reyes', handle:'@anareyes', initial:'A', hue:'#7b5bd6', age:'2h', up:38, body:'Shows its arithmetic instead of asserting a conclusion. The payload margin line is the part I actually use.', replies:[] },
    { id:'c2', name:'Kate Ostrom', handle:'@orbital_kate', initial:'K', hue:'#ff4d14', age:'5h', up:52, body:'It declines to answer when the numbers are not public rather than estimating. That was the hardest behaviour to get right.', replies:[] }
  ],
  'account-summary': [
    { id:'c1', name:'Sam Whitlock', handle:'@samwhit', initial:'S', hue:'#2f9e6f', age:'8h', up:71, body:'Four lines is exactly the right length for deciding whether to reply to someone. Any longer and I would not read it.', replies:[
      { name:'Jules Park', handle:'@julesbuilds', initial:'J', hue:'#c8871a', age:'7h', body:'Reach-over-time was the last thing I added and it turned out to be the line people quote most.' }] },
    { id:'c2', name:'Kate Ostrom', handle:'@orbital_kate', initial:'K', hue:'#ff4d14', age:'14h', up:23, body:'Would be more useful with a date range. Accounts change a lot over three years.', replies:[] }
  ],
  'release-notes': [
    { id:'c1', name:'Jules Park', handle:'@julesbuilds', initial:'J', hue:'#c8871a', age:'12m', up:19, body:'Keeps the version numbers intact, which most rewriting tools drop. That alone makes it usable for real releases.', replies:[] },
    { id:'c2', name:'Ana Reyes', handle:'@anareyes', initial:'A', hue:'#7b5bd6', age:'20m', up:11, body:'Fed it a changelog with forty bullet points. It led with the two anyone would notice and moved the rest into a single line.', replies:[] }
  ],
  'sentiment-read': [
    { id:'c1', name:'Kate Ostrom', handle:'@orbital_kate', initial:'K', hue:'#ff4d14', age:'1h', up:44, body:'Citing the posts behind the score is what makes it trustworthy. A bare number would be useless for reporting.', replies:[] },
    { id:'c2', name:'Dev Mirza', handle:'@nullpointer', initial:'D', hue:'#3a7bd5', age:'3h', up:16, body:'Agreed. I check the citations more than the number, and so far the reasoning has held up.', replies:[] }
  ],
  'inbox-triage': [
    { id:'c1', name:'Sam Whitlock', handle:'@samwhit', initial:'S', hue:'#2f9e6f', age:'2h', up:52, body:'Three is the right number. Every other triage tool I have used hands back fifteen items and solves nothing.', replies:[] },
    { id:'c2', name:'Ana Reyes', handle:'@anareyes', initial:'A', hue:'#7b5bd6', age:'4h', up:37, body:'The draft replies are optional on purpose — it will not send anything, and it does not read threads you have already archived.', replies:[] }
  ],
  'contract-check': [
    { id:'c1', name:'Mo Adeyemi', handle:'@moadeyemi', initial:'M', hue:'#d6486f', age:'5h', up:63, body:'Refusing to give price guidance is the right call. It reports patterns and lets you make the decision.', replies:[] },
    { id:'c2', name:'Dev Mirza', handle:'@nullpointer', initial:'D', hue:'#3a7bd5', age:'7h', up:41, body:'It reports which patterns are absent as well as present. That was deliberate — absence of a signal is information too.', replies:[] }
  ]
};

const NOTIFS = [
  { initial:'K', hue:'#ff4d14', text:'Kate Ostrom upvoted your reply on Ship or Skip', age:'4m' },
  { initial:'D', hue:'#3a7bd5', text:'Dev Mirza started following you', age:'22m' },
  { initial:'A', hue:'#7b5bd6', text:'Context Collapse hit #1 in Research. You upvoted it early.', age:'1h' },
  { initial:'S', hue:'#2f9e6f', text:'Sam Whitlock replied to your comment on Timeline Therapist', age:'3h' }
];

const ME = { name:'Max Richter', handle:'@maxbuilds', initial:'M', hue:'#ff4d14', karma:'2,410', followers:'184', following:'63', streak:12,
  bio:'Building grokbotit. Mostly here to argue about which bots are actually useful.' };

const REPORT_REASONS = [
  { id:'spam', label:'Spam or repost', hint:'The same bot posted more than once, or a link farm.' },
  { id:'broken', label:'It does not work', hint:'The Grok Bot link is dead or the bot does nothing it claims.' },
  { id:'misleading', label:'Misleading description', hint:'What it says it does is not what it does.' },
  { id:'harmful', label:'Harmful or abusive', hint:'Targets people, harvests data, or is built to harass.' },
  { id:'votes', label:'Vote manipulation', hint:'Coordinated upvoting or throwaway accounts.' }
];


export { GROUPS, BOTS, MAKERS, BADGES, COMMENTS, NOTIFS, ME, REPORT_REASONS };
