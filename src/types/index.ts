export type ColorToken =
  | "clay"
  | "slate"
  | "sage"
  | "mauve"
  | "gold"
  | "rose"
  | "ocean";

export type Theme = "light" | "dark";

export interface Workspace {
  id: string;
  name: string;
  color: ColorToken;
  created_at: number;
  updated_at: number;
}

export interface Tag {
  id: string;
  name: string;
  color: ColorToken;
  created_at: number;
}

export interface TimerPreset {
  id: string;
  label: string;
  position: number;
  created_at: number;
}

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  created_at: number;
  updated_at: number;
  tags: string[];
  blocks: Block[];
}

export type BlockType = "note" | "timer" | "doc";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

export interface NoteContent {
  text: string;
}

export interface TimerContent {
  label?: string;
  started_at?: string;
  finished_at?: string;
  duration_ms?: number;
  status: TimerStatus;
}

export interface DocContent {
  title: string;
  markdown: string;
}

export type BlockContent = NoteContent | TimerContent | DocContent;

export interface Block {
  id: string;
  task_id: string;
  type: BlockType;
  ts: number;
  content: BlockContent;
  created_at: number;
  updated_at: number;
}

/** Singleton in-memory timer state — never persisted. */
export interface ActiveTimer {
  blockId: string;
  taskId: string;
  label: string;
  status: "running" | "paused";
  startedAt: number;
  accumulatedMs: number;
}

// ---- DTOs ----
export interface CreateWorkspaceDTO {
  name: string;
  color: ColorToken;
}

export interface CreateTagDTO {
  name: string;
  color: ColorToken;
}

export interface CreateTimerPresetDTO {
  label: string;
  position: number;
}

export interface CreateTaskDTO {
  workspace_id: string;
  title: string;
  created_at?: number;
}

export interface CreateBlockDTO {
  task_id: string;
  type: BlockType;
  ts: number;
  content: BlockContent;
}
