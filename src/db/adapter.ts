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

/**
 * The single boundary between the app and persistence.
 * The rest of the app never talks to SQLite directly — always through this.
 * A future SyncAdapter implements the same interface against the cloud.
 */
export interface StorageAdapter {
  // Workspaces
  listWorkspaces(): Promise<Workspace[]>;
  createWorkspace(data: CreateWorkspaceDTO): Promise<Workspace>;
  updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace>;
  deleteWorkspace(id: string): Promise<void>;

  // Timer presets
  listTimerPresets(): Promise<TimerPreset[]>;
  createTimerPreset(data: CreateTimerPresetDTO): Promise<TimerPreset>;
  deleteTimerPreset(id: string): Promise<void>;
  reorderTimerPresets(orderedIds: string[]): Promise<void>;

  // Tags
  listTags(): Promise<Tag[]>;
  createTag(data: CreateTagDTO): Promise<Tag>;
  deleteTag(id: string): Promise<void>;

  // Tasks (returned fully hydrated with `tags` ids and `blocks`)
  listTasks(workspaceId: string): Promise<Task[]>;
  createTask(data: CreateTaskDTO): Promise<Task>;
  updateTask(id: string, data: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Task-Tag relationships
  addTagToTask(taskId: string, tagId: string): Promise<void>;
  removeTagFromTask(taskId: string, tagId: string): Promise<void>;

  // Blocks
  listBlocks(taskId: string): Promise<Block[]>;
  createBlock(data: CreateBlockDTO): Promise<Block>;
  updateBlock(id: string, data: Partial<Block>): Promise<Block>;
  deleteBlock(id: string): Promise<void>;
}
