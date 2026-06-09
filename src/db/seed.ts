import type { Block, BlockContent, BlockType, Tag, Task, TimerPreset, Workspace } from "../types";
import { uid } from "../lib/id";

export const DEFAULT_PRESET_LABELS = ["Writing", "Reviewing", "Studying", "Deep work", "Meeting"];

export function defaultPresets(): TimerPreset[] {
  return DEFAULT_PRESET_LABELS.map((label, i) => ({
    id: uid("preset"),
    label,
    position: i,
    created_at: Date.now(),
  }));
}

// build an epoch timestamp: days-ago offset + hour:minute
function at(dayOffset: number, h: number, m: number): number {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

const NOW = Date.now();

/** A doc seed starts empty — BlockNote is the source of truth, filled in-app. */
function emptyDoc(title: string): BlockContent {
  return { title, blocks: [], markdown: "" };
}

interface SeedSpec {
  id: string;
  workspace_id: string;
  title: string;
  created_at: number;
  tags: string[];
  blocks: { type: BlockType; ts: number; content: BlockContent }[];
}

export interface SeedData {
  workspaces: Workspace[];
  tags: Tag[];
  presets: TimerPreset[];
  tasks: Task[];
}

export function buildSeed(): SeedData {
  const workspaces: Workspace[] = [
    { id: "ws-personal", name: "Personal", color: "clay", created_at: NOW, updated_at: NOW },
    { id: "ws-work", name: "Work", color: "slate", created_at: NOW, updated_at: NOW },
    { id: "ws-side", name: "Side projects", color: "sage", created_at: NOW, updated_at: NOW },
  ];

  const tags: Tag[] = [
    { id: "tag-work", name: "Work", color: "slate", created_at: NOW },
    { id: "tag-personal", name: "Personal", color: "clay", created_at: NOW },
    { id: "tag-reading", name: "Reading", color: "sage", created_at: NOW },
    { id: "tag-deep", name: "Deep work", color: "mauve", created_at: NOW },
    { id: "tag-learning", name: "Learning", color: "gold", created_at: NOW },
  ];

  const specs: SeedSpec[] = [
    {
      id: "task-export", workspace_id: "ws-work", title: "Ship export module", created_at: at(0, 8, 50),
      tags: ["tag-work", "tag-deep"],
      blocks: [
        { type: "note", ts: at(0, 8, 52), content: { text: "Morning intention: ship the export module today. Coffee, standup, then heads-down." } },
        { type: "timer", ts: at(0, 9, 15), content: { label: "Deep work", duration_ms: 4990000, status: "finished" } },
        { type: "note", ts: at(0, 10, 45), content: { text: "Standup: backend sync blocked on auth-token refresh — Maya's on it. I'm unblocked on the timeline UI." } },
        { type: "doc", ts: at(0, 11, 30), content: emptyDoc("Export module — spec v2") },
        { type: "timer", ts: at(0, 14, 10), content: { label: "Pairing w/ Sam", duration_ms: 2820000, status: "finished" } },
        { type: "timer", ts: NOW - 6 * 60 * 1000, content: { label: "Writing changelog", status: "finished", duration_ms: 360000 } },
      ],
    },
    {
      id: "task-roadmap", workspace_id: "ws-work", title: "Q3 roadmap planning", created_at: at(0, 9, 25),
      tags: ["tag-work"],
      blocks: [
        { type: "doc", ts: at(0, 9, 30), content: emptyDoc("Q3 roadmap — working notes") },
        { type: "note", ts: at(0, 13, 5), content: { text: "Reviewed PRs #441, #442 — merged both. Left a note on migration ordering in #443." } },
        { type: "timer", ts: at(0, 15, 20), content: { label: "Design review", duration_ms: 1920000, status: "finished" } },
      ],
    },
    {
      id: "task-reading", workspace_id: "ws-personal", title: "Thinking in Systems — notes", created_at: at(0, 21, 30),
      tags: ["tag-reading", "tag-personal"],
      blocks: [
        { type: "note", ts: at(0, 21, 30), content: { text: "Reading ch.3 — stocks and flows. Slow but worth it." } },
        { type: "doc", ts: at(0, 21, 48), content: emptyDoc("Highlights — Meadows") },
      ],
    },
    {
      id: "task-review", workspace_id: "ws-personal", title: "Weekly review", created_at: at(-1, 16, 20),
      tags: ["tag-personal"],
      blocks: [
        { type: "timer", ts: at(-1, 10, 0), content: { label: "Deep work", duration_ms: 5400000, status: "finished" } },
        { type: "doc", ts: at(-1, 16, 20), content: emptyDoc("Weekly review") },
        { type: "note", ts: at(-1, 16, 40), content: { text: "Agreed with Priya to descope search from Q3." } },
      ],
    },
    {
      id: "task-onboarding", workspace_id: "ws-work", title: "Onboarding doc for new hire", created_at: at(-3, 14, 0),
      tags: ["tag-work"],
      blocks: [
        { type: "note", ts: at(-3, 14, 0), content: { text: "Drafted the architecture overview. Need a diagram." } },
        { type: "doc", ts: at(-3, 15, 10), content: emptyDoc("Architecture overview") },
      ],
    },
    {
      id: "task-trip", workspace_id: "ws-personal", title: "Trip planning — Lisbon", created_at: at(-5, 20, 0),
      tags: ["tag-personal"],
      blocks: [
        { type: "note", ts: at(-5, 20, 0), content: { text: "Booked flights. Need to sort accommodation + a loose itinerary." } },
        { type: "doc", ts: at(-5, 20, 30), content: emptyDoc("Lisbon itinerary") },
      ],
    },
    {
      id: "task-kickoff", workspace_id: "ws-side", title: "Project kickoff", created_at: at(-12, 9, 0),
      tags: ["tag-work"],
      blocks: [
        { type: "timer", ts: at(-12, 9, 0), content: { label: "Kickoff meeting", duration_ms: 3600000, status: "finished" } },
        { type: "doc", ts: at(-12, 10, 30), content: emptyDoc("Kickoff notes") },
      ],
    },
    {
      id: "task-rust", workspace_id: "ws-side", title: "Learn Rust — week 1", created_at: at(-22, 19, 0),
      tags: ["tag-learning"],
      blocks: [
        { type: "note", ts: at(-22, 19, 0), content: { text: "Ownership and borrowing finally clicked. The compiler is a strict but fair teacher." } },
        { type: "timer", ts: at(-22, 19, 15), content: { label: "Rustlings", duration_ms: 2700000, status: "finished" } },
      ],
    },
    {
      id: "task-goals", workspace_id: "ws-personal", title: "Year goals", created_at: at(-46, 11, 0),
      tags: ["tag-personal"],
      blocks: [
        { type: "doc", ts: at(-46, 11, 0), content: emptyDoc("2026 goals") },
      ],
    },
  ];

  const tasks: Task[] = specs.map((s) => {
    const blocks: Block[] = s.blocks.map((b) => ({
      id: uid("b"),
      task_id: s.id,
      type: b.type,
      ts: b.ts,
      content: b.content,
      created_at: b.ts,
      updated_at: b.ts,
    }));
    return {
      id: s.id,
      workspace_id: s.workspace_id,
      title: s.title,
      created_at: s.created_at,
      updated_at: s.created_at,
      tags: s.tags,
      blocks,
    };
  });

  return { workspaces, tags, presets: defaultPresets(), tasks };
}
