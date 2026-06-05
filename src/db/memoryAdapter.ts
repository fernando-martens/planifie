import type { StorageAdapter } from "./adapter";
import type {
  Block,
  CreateBlockDTO,
  CreateTagDTO,
  CreateTaskDTO,
  CreateTimerPresetDTO,
  CreateWorkspaceDTO,
  Tag,
  Task,
  TimerPreset,
  Workspace,
} from "../types";
import { uid } from "../lib/id";
import { buildSeed } from "./seed";

/**
 * In-memory adapter for browser development (outside the Tauri shell).
 * Seeded with demo content so the UI is populated. Not persisted.
 */
export class MemoryAdapter implements StorageAdapter {
  private workspaces: Workspace[];
  private tags: Tag[];
  private presets: TimerPreset[];
  private tasks: Task[];

  constructor() {
    const seed = buildSeed();
    this.workspaces = seed.workspaces;
    this.tags = seed.tags;
    this.presets = seed.presets;
    this.tasks = seed.tasks;
  }

  private clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v));
  }

  // ---- Workspaces ----
  async listWorkspaces(): Promise<Workspace[]> {
    return this.clone(this.workspaces);
  }
  async createWorkspace(data: CreateWorkspaceDTO): Promise<Workspace> {
    const now = Date.now();
    const ws: Workspace = { id: uid("ws"), ...data, created_at: now, updated_at: now };
    this.workspaces.push(ws);
    return this.clone(ws);
  }
  async updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace> {
    const ws = this.workspaces.find((w) => w.id === id);
    if (!ws) throw new Error(`workspace ${id} not found`);
    Object.assign(ws, data, { updated_at: Date.now() });
    return this.clone(ws);
  }
  async deleteWorkspace(id: string): Promise<void> {
    this.workspaces = this.workspaces.filter((w) => w.id !== id);
    this.tasks = this.tasks.filter((t) => t.workspace_id !== id);
  }

  // ---- Timer presets ----
  async listTimerPresets(): Promise<TimerPreset[]> {
    return this.clone([...this.presets].sort((a, b) => a.position - b.position));
  }
  async createTimerPreset(data: CreateTimerPresetDTO): Promise<TimerPreset> {
    const preset: TimerPreset = { id: uid("preset"), ...data, created_at: Date.now() };
    this.presets.push(preset);
    return this.clone(preset);
  }
  async deleteTimerPreset(id: string): Promise<void> {
    this.presets = this.presets.filter((p) => p.id !== id);
  }
  async reorderTimerPresets(orderedIds: string[]): Promise<void> {
    orderedIds.forEach((id, i) => {
      const p = this.presets.find((x) => x.id === id);
      if (p) p.position = i;
    });
  }

  // ---- Tags ----
  async listTags(): Promise<Tag[]> {
    return this.clone(this.tags);
  }
  async createTag(data: CreateTagDTO): Promise<Tag> {
    const tag: Tag = { id: uid("tag"), ...data, created_at: Date.now() };
    this.tags.push(tag);
    return this.clone(tag);
  }
  async deleteTag(id: string): Promise<void> {
    this.tags = this.tags.filter((t) => t.id !== id);
    this.tasks.forEach((t) => (t.tags = t.tags.filter((x) => x !== id)));
  }

  // ---- Tasks ----
  async listTasks(workspaceId: string): Promise<Task[]> {
    return this.clone(this.tasks.filter((t) => t.workspace_id === workspaceId));
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
    this.tasks.unshift(task);
    return this.clone(task);
  }
  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) throw new Error(`task ${id} not found`);
    const { tags, blocks, ...rest } = data;
    Object.assign(task, rest, { updated_at: Date.now() });
    if (tags) task.tags = tags;
    if (blocks) task.blocks = blocks;
    return this.clone(task);
  }
  async deleteTask(id: string): Promise<void> {
    this.tasks = this.tasks.filter((t) => t.id !== id);
  }

  // ---- Task-Tag ----
  async addTagToTask(taskId: string, tagId: string): Promise<void> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task && !task.tags.includes(tagId)) task.tags.push(tagId);
  }
  async removeTagFromTask(taskId: string, tagId: string): Promise<void> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) task.tags = task.tags.filter((x) => x !== tagId);
  }

  // ---- Blocks ----
  async listBlocks(taskId: string): Promise<Block[]> {
    const task = this.tasks.find((t) => t.id === taskId);
    return this.clone(task ? task.blocks : []);
  }
  async createBlock(data: CreateBlockDTO): Promise<Block> {
    const task = this.tasks.find((t) => t.id === data.task_id);
    if (!task) throw new Error(`task ${data.task_id} not found`);
    const now = Date.now();
    const block: Block = { id: uid("b"), ...data, created_at: now, updated_at: now };
    task.blocks.push(block);
    return this.clone(block);
  }
  async updateBlock(id: string, data: Partial<Block>): Promise<Block> {
    for (const task of this.tasks) {
      const block = task.blocks.find((b) => b.id === id);
      if (block) {
        Object.assign(block, data, { updated_at: Date.now() });
        return this.clone(block);
      }
    }
    throw new Error(`block ${id} not found`);
  }
  async deleteBlock(id: string): Promise<void> {
    for (const task of this.tasks) {
      task.blocks = task.blocks.filter((b) => b.id !== id);
    }
  }
}
