/* ============================================================
   planifie — data model, helpers, seed content
   Task-based model: tasks → blocks (timeline). Tags on tasks.
   ============================================================ */

// ---------- date / time helpers ----------
const pad2 = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const NOW = Date.now();

// build an epoch timestamp: days-ago offset + hour:minute
function at(dayOffset, h, m) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

// timestamp shown on a timeline block
function blockTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const hhmm = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  if (isoDate(d) === isoDate(now)) return hhmm;
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()} · ${hhmm}`;
}
function clockOf(ts) {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

// ---------- duration helpers ----------
function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${pad2(m)}m ${pad2(s)}s`;
  if (m > 0) return `${m}m ${pad2(s)}s`;
  return `${s}s`;
}
function formatClock(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
}

// ---------- task sidebar grouping (Claude-style) ----------
function startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
function relativeGroup(ts) {
  const dayMs = 86400000;
  const diff = Math.floor((startOfDay(NOW) - startOfDay(ts)) / dayMs);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff <= 7) return "Previous 7 days";
  if (diff <= 30) return "Previous 30 days";
  const d = new Date(ts);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
// returns [{label, tasks[]}] ordered most-recent first
function groupTasks(tasks) {
  const sorted = [...tasks].sort((a, b) => b.created_at - a.created_at);
  const groups = [];
  let cur = null;
  for (const t of sorted) {
    const label = relativeGroup(t.created_at);
    if (!cur || cur.label !== label) { cur = { label, tasks: [] }; groups.push(cur); }
    cur.tasks.push(t);
  }
  return groups;
}

// ---------- markdown -> html (subset) ----------
function escapeHtml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function inlineMd(s) {
  let t = escapeHtml(s);
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return t;
}
function mdToHtml(md) {
  const lines = (md || "").split("\n");
  let html = "", i = 0, listOpen = null;
  const closeList = () => { if (listOpen) { html += `</${listOpen}>`; listOpen = null; } };
  while (i < lines.length) {
    let line = lines[i];
    if (/^```/.test(line)) {
      closeList(); const buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(escapeHtml(lines[i])); i++; }
      i++; html += `<pre><code>${buf.join("\n")}</code></pre>`; continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) { closeList(); const lvl = h[1].length; html += `<h${lvl}>${inlineMd(h[2])}</h${lvl}>`; i++; continue; }
    if (/^\s*>\s?/.test(line)) { closeList(); html += `<blockquote>${inlineMd(line.replace(/^\s*>\s?/, ""))}</blockquote>`; i++; continue; }
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) { if (listOpen !== "ul") { closeList(); html += "<ul>"; listOpen = "ul"; } html += `<li>${inlineMd(ul[1])}</li>`; i++; continue; }
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ol) { if (listOpen !== "ol") { closeList(); html += "<ol>"; listOpen = "ol"; } html += `<li>${inlineMd(ol[1])}</li>`; i++; continue; }
    if (line.trim() === "") { closeList(); i++; continue; }
    closeList(); html += `<p>${inlineMd(line)}</p>`; i++;
  }
  closeList();
  return html;
}
function docPreview(md) {
  const lines = (md || "").split("\n");
  const out = [];
  for (const ln of lines) {
    const t = ln.replace(/^#{1,3}\s+/, "").replace(/[*`>]/g, "").trim();
    if (t) out.push(t);
    if (out.length >= 2) break;
  }
  return out.join(" · ");
}

// ---------- tag palette (desaturated) ----------
const TAG_COLORS = {
  clay:  "#C28E6E",
  slate: "#7E96B4",
  sage:  "#8AA888",
  mauve: "#A98BA0",
  gold:  "#C2A95F",
  rose:  "#C58E92",
  ocean: "#6FA1A6",
};
const TAG_COLOR_LIST = Object.entries(TAG_COLORS).map(([k, v]) => ({ key: k, hex: v }));

const uid = (() => { let n = 0; return (p) => `${p}-${Date.now().toString(36)}-${++n}`; })();

// ---------- seed workspaces ----------
const WORKSPACES_SEED = [
  { id: "ws-personal", name: "Personal", color: "clay" },
  { id: "ws-work",     name: "Work",     color: "slate" },
  { id: "ws-side",     name: "Side projects", color: "sage" },
];

// ---------- seed tags ----------
const TAGS_SEED = [
  { id: "tag-work",     name: "Work",      color: "slate" },
  { id: "tag-personal", name: "Personal",  color: "clay" },
  { id: "tag-reading",  name: "Reading",   color: "sage" },
  { id: "tag-deep",     name: "Deep work", color: "mauve" },
  { id: "tag-learning", name: "Learning",  color: "gold" },
];

// ---------- markdown bodies ----------
const SPEC_MD = `# Export module — scope & format

The export dialog lets the user pick **what** to export and **how**.

## Scope
- **Whole task** — every block in this task's timeline
- **One document** — a single \`doc\` block, raw markdown

## Format
Markdown is produced by direct serialization. PDF mirrors the timeline visual: timestamps, type labels, rendered content.

> Decision: ship Markdown first, PDF behind it.

\`\`\`ts
interface ExportOptions {
  scope: 'task' | 'block'
  format: 'markdown' | 'pdf'
}
\`\`\``;

const ROADMAP_MD = `# Q3 roadmap — working notes

Three bets for the quarter, in priority order.

1. **Sync foundation** — land the StorageAdapter boundary
2. **Export** — Markdown + PDF, ship behind a flag
3. **Search** — full-text over history (stretch)

## Open questions
- Do we version blocks for conflict resolution?
- How aggressive is the local cache?`;

const HIGHLIGHTS_MD = `# Highlights — Thinking in Systems

> A system is an interconnected set of elements coherently organized to achieve something.

Key idea from ch.3: **stocks** are the memory of a system, **flows** change them over time. Most leverage hides in the *delays* between them.

- Stocks buffer flows and create stability
- Delays make systems oscillate`;

const REVIEW_MD = `# Weekly review

- Shipped the timeline rail
- Behind on export — pull forward

> Energy was uneven. Protect mornings.`;

const TRIP_MD = `# Lisbon — 4 days

## Must do
- Time-out Market
- Belém (pastéis!)
- Tram 28 early, before crowds

## Stay
Alfama or Príncipe Real. Walkable, hilly.`;

const KICKOFF_MD = `# Project kickoff

Scope, milestones, owners. Keep the MVP honest.

## Milestones
1. Data model + adapter
2. Timeline UI
3. Export`;

// ---------- seed tasks ----------
const blk = (type, ts, content, extra = {}) => ({ id: uid("b"), type, ts, content, ...extra });

const TASKS_SEED = [
  {
    id: "task-export", workspace_id: "ws-work", title: "Ship export module", created_at: at(0, 8, 50),
    tags: ["tag-work", "tag-deep"],
    blocks: [
      blk("note", at(0, 8, 52), { text: "Morning intention: ship the export module today. Coffee, standup, then heads-down." }),
      blk("timer", at(0, 9, 15), { label: "Deep work", duration_ms: 4990000, status: "finished" }),
      blk("note", at(0, 10, 45), { text: "Standup: backend sync blocked on auth-token refresh — Maya's on it. I'm unblocked on the timeline UI." }),
      blk("doc", at(0, 11, 30), { title: "Export module — spec v2", markdown: SPEC_MD }),
      blk("timer", at(0, 14, 10), { label: "Pairing w/ Sam", duration_ms: 2820000, status: "finished" }),
      blk("timer", NOW - 6 * 60 * 1000, { label: "Writing changelog", status: "running" }, { __activeSeed: true }),
    ],
  },
  {
    id: "task-roadmap", workspace_id: "ws-work", title: "Q3 roadmap planning", created_at: at(0, 9, 25),
    tags: ["tag-work"],
    blocks: [
      blk("doc", at(0, 9, 30), { title: "Q3 roadmap — working notes", markdown: ROADMAP_MD }),
      blk("note", at(0, 13, 5), { text: "Reviewed PRs #441, #442 — merged both. Left a note on migration ordering in #443." }),
      blk("timer", at(0, 15, 20), { label: "Design review", duration_ms: 1920000, status: "finished" }),
    ],
  },
  {
    id: "task-reading", workspace_id: "ws-personal", title: "Thinking in Systems — notes", created_at: at(0, 21, 30),
    tags: ["tag-reading", "tag-personal"],
    blocks: [
      blk("note", at(0, 21, 30), { text: "Reading ch.3 — stocks and flows. Slow but worth it." }),
      blk("doc", at(0, 21, 48), { title: "Highlights — Meadows", markdown: HIGHLIGHTS_MD }),
    ],
  },
  {
    id: "task-review", workspace_id: "ws-personal", title: "Weekly review", created_at: at(-1, 16, 20),
    tags: ["tag-personal"],
    blocks: [
      blk("timer", at(-1, 10, 0), { label: "Deep work", duration_ms: 5400000, status: "finished" }),
      blk("doc", at(-1, 16, 20), { title: "Weekly review", markdown: REVIEW_MD }),
      blk("note", at(-1, 16, 40), { text: "Agreed with Priya to descope search from Q3." }),
    ],
  },
  {
    id: "task-onboarding", workspace_id: "ws-work", title: "Onboarding doc for new hire", created_at: at(-3, 14, 0),
    tags: ["tag-work"],
    blocks: [
      blk("note", at(-3, 14, 0), { text: "Drafted the architecture overview. Need a diagram." }),
      blk("doc", at(-3, 15, 10), { title: "Architecture overview", markdown: "# Architecture\n\nClient → adapter → SQLite. Sync is a future adapter.\n\n- Never import SQLite directly\n- Everything flows through StorageAdapter" }),
    ],
  },
  {
    id: "task-trip", workspace_id: "ws-personal", title: "Trip planning — Lisbon", created_at: at(-5, 20, 0),
    tags: ["tag-personal"],
    blocks: [
      blk("note", at(-5, 20, 0), { text: "Booked flights. Need to sort accommodation + a loose itinerary." }),
      blk("doc", at(-5, 20, 30), { title: "Lisbon itinerary", markdown: TRIP_MD }),
    ],
  },
  {
    id: "task-kickoff", workspace_id: "ws-side", title: "Project kickoff", created_at: at(-12, 9, 0),
    tags: ["tag-work"],
    blocks: [
      blk("timer", at(-12, 9, 0), { label: "Kickoff meeting", duration_ms: 3600000, status: "finished" }),
      blk("doc", at(-12, 10, 30), { title: "Kickoff notes", markdown: KICKOFF_MD }),
    ],
  },
  {
    id: "task-rust", workspace_id: "ws-side", title: "Learn Rust — week 1", created_at: at(-22, 19, 0),
    tags: ["tag-learning"],
    blocks: [
      blk("note", at(-22, 19, 0), { text: "Ownership and borrowing finally clicked. The compiler is a strict but fair teacher." }),
      blk("timer", at(-22, 19, 15), { label: "Rustlings", duration_ms: 2700000, status: "finished" }),
    ],
  },
  {
    id: "task-goals", workspace_id: "ws-personal", title: "Year goals", created_at: at(-46, 11, 0),
    tags: ["tag-personal"],
    blocks: [
      blk("doc", at(-46, 11, 0), { title: "2026 goals", markdown: "# 2026\n\n- Ship something I'm proud of\n- Read 20 books\n- Run a half marathon" }),
    ],
  },
];

Object.assign(window, {
  pad2, isoDate, MONTHS, MONTHS_SHORT, NOW, at,
  blockTime, clockOf, formatDuration, formatClock,
  relativeGroup, groupTasks,
  mdToHtml, docPreview,
  TAG_COLORS, TAG_COLOR_LIST,
  WORKSPACES_SEED, TAGS_SEED, TASKS_SEED, uid,
});
