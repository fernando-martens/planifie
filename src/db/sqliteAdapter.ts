import Database from "@tauri-apps/plugin-sql";
import type { StorageAdapter } from "./adapter";
import type {
  Block,
  BlockContent,
  BlockType,
  CreateBlockDTO,
  CreateTagDTO,
  CreateTaskDTO,
  CreateTimerPresetDTO,
  CreateWorkspaceDTO,
  ColorToken,
  Tag,
  Task,
  TimerPreset,
  Workspace,
} from "../types";
import { uid } from "../lib/id";
import { defaultPresets } from "./seed";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS timer_presets (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS task_tags (
  task_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (task_id, tag_id)
);
CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  type TEXT NOT NULL,
  ts INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_ws ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_blocks_task ON blocks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_task ON task_tags(task_id);
`;

interface WorkspaceRow { id: string; name: string; color: string; created_at: number; updated_at: number }
interface TagRow { id: string; name: string; color: string; created_at: number }
interface PresetRow { id: string; label: string; position: number; created_at: number }
interface TaskRow { id: string; workspace_id: string; title: string; created_at: number; updated_at: number }
interface BlockRow { id: string; task_id: string; type: string; ts: number; content: string; created_at: number; updated_at: number }

export class SQLiteAdapter implements StorageAdapter {
  private db!: Database;

  async init(): Promise<void> {
    this.db = await Database.load("sqlite:planifie.db");
    for (const stmt of SCHEMA.split(";")) {
      const s = stmt.trim();
      if (s) await this.db.execute(s);
    }
    // first-run seed: default presets + a starter workspace
    const presets = await this.db.select<PresetRow[]>("SELECT id FROM timer_presets LIMIT 1");
    if (presets.length === 0) {
      for (const p of defaultPresets()) {
        await this.db.execute(
          "INSERT INTO timer_presets (id, label, position, created_at) VALUES ($1, $2, $3, $4)",
          [p.id, p.label, p.position, p.created_at],
        );
      }
    }
    const ws = await this.db.select<WorkspaceRow[]>("SELECT id FROM workspaces LIMIT 1");
    if (ws.length === 0) {
      const now = Date.now();
      await this.db.execute(
        "INSERT INTO workspaces (id, name, color, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
        [uid("ws"), "Personal", "clay", now, now],
      );
    }
  }

  // ---- Workspaces ----
  async listWorkspaces(): Promise<Workspace[]> {
    const rows = await this.db.select<WorkspaceRow[]>("SELECT * FROM workspaces ORDER BY created_at ASC");
    return rows.map((r) => ({ ...r, color: r.color as ColorToken }));
  }
  async createWorkspace(data: CreateWorkspaceDTO): Promise<Workspace> {
    const now = Date.now();
    const ws: Workspace = { id: uid("ws"), ...data, created_at: now, updated_at: now };
    await this.db.execute(
      "INSERT INTO workspaces (id, name, color, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
      [ws.id, ws.name, ws.color, ws.created_at, ws.updated_at],
    );
    return ws;
  }
  async updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace> {
    const now = Date.now();
    const cur = (await this.db.select<WorkspaceRow[]>("SELECT * FROM workspaces WHERE id = $1", [id]))[0];
    if (!cur) throw new Error(`workspace ${id} not found`);
    const next = { ...cur, ...data, updated_at: now };
    await this.db.execute(
      "UPDATE workspaces SET name = $1, color = $2, updated_at = $3 WHERE id = $4",
      [next.name, next.color, next.updated_at, id],
    );
    return { ...next, color: next.color as ColorToken };
  }
  async deleteWorkspace(id: string): Promise<void> {
    const tasks = await this.db.select<TaskRow[]>("SELECT id FROM tasks WHERE workspace_id = $1", [id]);
    for (const t of tasks) await this.deleteTask(t.id);
    await this.db.execute("DELETE FROM workspaces WHERE id = $1", [id]);
  }

  // ---- Timer presets ----
  async listTimerPresets(): Promise<TimerPreset[]> {
    return this.db.select<PresetRow[]>("SELECT * FROM timer_presets ORDER BY position ASC");
  }
  async createTimerPreset(data: CreateTimerPresetDTO): Promise<TimerPreset> {
    const preset: TimerPreset = { id: uid("preset"), ...data, created_at: Date.now() };
    await this.db.execute(
      "INSERT INTO timer_presets (id, label, position, created_at) VALUES ($1, $2, $3, $4)",
      [preset.id, preset.label, preset.position, preset.created_at],
    );
    return preset;
  }
  async deleteTimerPreset(id: string): Promise<void> {
    await this.db.execute("DELETE FROM timer_presets WHERE id = $1", [id]);
  }
  async reorderTimerPresets(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.db.execute("UPDATE timer_presets SET position = $1 WHERE id = $2", [i, orderedIds[i]]);
    }
  }

  // ---- Tags ----
  async listTags(): Promise<Tag[]> {
    const rows = await this.db.select<TagRow[]>("SELECT * FROM tags ORDER BY created_at ASC");
    return rows.map((r) => ({ ...r, color: r.color as ColorToken }));
  }
  async createTag(data: CreateTagDTO): Promise<Tag> {
    const tag: Tag = { id: uid("tag"), ...data, created_at: Date.now() };
    await this.db.execute(
      "INSERT INTO tags (id, name, color, created_at) VALUES ($1, $2, $3, $4)",
      [tag.id, tag.name, tag.color, tag.created_at],
    );
    return tag;
  }
  async deleteTag(id: string): Promise<void> {
    await this.db.execute("DELETE FROM tags WHERE id = $1", [id]);
    await this.db.execute("DELETE FROM task_tags WHERE tag_id = $1", [id]);
  }

  // ---- Tasks ----
  async listTasks(workspaceId: string): Promise<Task[]> {
    const rows = await this.db.select<TaskRow[]>(
      "SELECT * FROM tasks WHERE workspace_id = $1 ORDER BY created_at DESC",
      [workspaceId],
    );
    const tasks: Task[] = [];
    for (const r of rows) {
      const tagRows = await this.db.select<{ tag_id: string }[]>(
        "SELECT tag_id FROM task_tags WHERE task_id = $1", [r.id],
      );
      const blocks = await this.listBlocks(r.id);
      tasks.push({ ...r, tags: tagRows.map((x) => x.tag_id), blocks });
    }
    return tasks;
  }
  async createTask(data: CreateTaskDTO): Promise<Task> {
    const now = Date.now();
    const task: Task = {
      id: uid("task"),
      workspace_id: data.workspace_id,
      title: data.title,
      created_at: data.created_at ?? now,
      updated_at: now,
      tags: [],
      blocks: [],
    };
    await this.db.execute(
      "INSERT INTO tasks (id, workspace_id, title, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
      [task.id, task.workspace_id, task.title, task.created_at, task.updated_at],
    );
    return task;
  }
  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const now = Date.now();
    const cur = (await this.db.select<TaskRow[]>("SELECT * FROM tasks WHERE id = $1", [id]))[0];
    if (!cur) throw new Error(`task ${id} not found`);
    const next = { ...cur, ...data, updated_at: now };
    await this.db.execute(
      "UPDATE tasks SET workspace_id = $1, title = $2, created_at = $3, updated_at = $4 WHERE id = $5",
      [next.workspace_id, next.title, next.created_at, next.updated_at, id],
    );
    const tagRows = await this.db.select<{ tag_id: string }[]>(
      "SELECT tag_id FROM task_tags WHERE task_id = $1", [id],
    );
    const blocks = await this.listBlocks(id);
    return {
      id: next.id, workspace_id: next.workspace_id, title: next.title,
      created_at: next.created_at, updated_at: next.updated_at,
      tags: tagRows.map((x) => x.tag_id), blocks,
    };
  }
  async deleteTask(id: string): Promise<void> {
    await this.db.execute("DELETE FROM blocks WHERE task_id = $1", [id]);
    await this.db.execute("DELETE FROM task_tags WHERE task_id = $1", [id]);
    await this.db.execute("DELETE FROM tasks WHERE id = $1", [id]);
  }

  // ---- Task-Tag ----
  async addTagToTask(taskId: string, tagId: string): Promise<void> {
    await this.db.execute(
      "INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES ($1, $2)",
      [taskId, tagId],
    );
  }
  async removeTagFromTask(taskId: string, tagId: string): Promise<void> {
    await this.db.execute(
      "DELETE FROM task_tags WHERE task_id = $1 AND tag_id = $2",
      [taskId, tagId],
    );
  }

  // ---- Blocks ----
  async listBlocks(taskId: string): Promise<Block[]> {
    const rows = await this.db.select<BlockRow[]>(
      "SELECT * FROM blocks WHERE task_id = $1 ORDER BY ts ASC", [taskId],
    );
    return rows.map((r) => ({
      id: r.id,
      task_id: r.task_id,
      type: r.type as BlockType,
      ts: r.ts,
      content: JSON.parse(r.content) as BlockContent,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }
  async createBlock(data: CreateBlockDTO): Promise<Block> {
    const now = Date.now();
    const block: Block = { id: uid("b"), ...data, created_at: now, updated_at: now };
    await this.db.execute(
      "INSERT INTO blocks (id, task_id, type, ts, content, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [block.id, block.task_id, block.type, block.ts, JSON.stringify(block.content), block.created_at, block.updated_at],
    );
    return block;
  }
  async updateBlock(id: string, data: Partial<Block>): Promise<Block> {
    const now = Date.now();
    const cur = (await this.db.select<BlockRow[]>("SELECT * FROM blocks WHERE id = $1", [id]))[0];
    if (!cur) throw new Error(`block ${id} not found`);
    const merged: Block = {
      id: cur.id,
      task_id: cur.task_id,
      type: (data.type ?? cur.type) as BlockType,
      ts: data.ts ?? cur.ts,
      content: data.content ?? (JSON.parse(cur.content) as BlockContent),
      created_at: cur.created_at,
      updated_at: now,
    };
    await this.db.execute(
      "UPDATE blocks SET type = $1, ts = $2, content = $3, updated_at = $4 WHERE id = $5",
      [merged.type, merged.ts, JSON.stringify(merged.content), merged.updated_at, id],
    );
    return merged;
  }
  async deleteBlock(id: string): Promise<void> {
    await this.db.execute("DELETE FROM blocks WHERE id = $1", [id]);
  }
}
