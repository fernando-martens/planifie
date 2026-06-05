import { create } from "zustand";
import type { Block, BlockContent, BlockType, Task } from "../types";
import { getAdapter } from "../db";
import { useWorkspaceStore } from "./workspaceStore";
import { useTagStore } from "./tagStore";

interface TaskState {
  tasks: Task[];
  activeTaskId: string | null;
  openDocId: string | null;
  query: string;

  loadAll: () => Promise<void>;
  setQuery: (q: string) => void;
  setOpenDoc: (id: string | null) => void;
  selectTask: (id: string | null) => void;

  newTask: () => Promise<string>;
  renameTask: (id: string, title: string) => Promise<void>;
  setTaskDate: (id: string, ts: number) => Promise<void>;
  reorderTask: (dragId: string, targetId: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  toggleTag: (taskId: string, tagId: string) => Promise<void>;
  createTagAndAttach: (name: string) => Promise<void>;

  addBlock: (type: BlockType, presetLabel?: string) => Promise<string>;
  patchBlock: (taskId: string, blockId: string, content: Partial<BlockContent> & { __ts?: number }) => Promise<void>;
  changeActiveBlock: (blockId: string, content: Partial<BlockContent> & { __ts?: number }) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;

  activeTask: () => Task | null;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  activeTaskId: null,
  openDocId: null,
  query: "",

  loadAll: async () => {
    const adapter = await getAdapter();
    const workspaces = useWorkspaceStore.getState().workspaces;
    const all: Task[] = [];
    for (const ws of workspaces) {
      all.push(...(await adapter.listTasks(ws.id)));
    }
    all.sort((a, b) => b.created_at - a.created_at);
    set({ tasks: all });
    // pick an active task within the active workspace if none selected
    const activeWs = useWorkspaceStore.getState().activeWorkspaceId;
    if (!get().activeTaskId) {
      const first = all.find((t) => t.workspace_id === activeWs);
      set({ activeTaskId: first ? first.id : null });
    }
  },

  setQuery: (query) => set({ query }),
  setOpenDoc: (openDocId) => set({ openDocId }),
  selectTask: (id) => set({ activeTaskId: id, openDocId: null }),

  newTask: async () => {
    const adapter = await getAdapter();
    const workspaceId = useWorkspaceStore.getState().activeWorkspaceId;
    if (!workspaceId) throw new Error("no active workspace");
    const task = await adapter.createTask({ workspace_id: workspaceId, title: "", created_at: Date.now() });
    set((s) => ({ tasks: [task, ...s.tasks], activeTaskId: task.id, openDocId: null, query: "" }));
    return task.id;
  },

  renameTask: async (id, title) => {
    const adapter = await getAdapter();
    await adapter.updateTask(id, { title });
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, title } : t)) }));
  },

  setTaskDate: async (id, ts) => {
    const adapter = await getAdapter();
    await adapter.updateTask(id, { created_at: ts });
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, created_at: ts } : t)) }));
  },

  reorderTask: async (dragId, targetId) => {
    const list = [...get().tasks];
    const fromIdx = list.findIndex((t) => t.id === dragId);
    const toIdx = list.findIndex((t) => t.id === targetId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    const [moved] = list.splice(fromIdx, 1);
    const anchor = list[Math.min(toIdx, list.length - 1)];
    moved.created_at = anchor.created_at;
    list.splice(toIdx, 0, moved);
    set({ tasks: list });
    const adapter = await getAdapter();
    await adapter.updateTask(moved.id, { created_at: moved.created_at });
  },

  deleteTask: async (id) => {
    const adapter = await getAdapter();
    await adapter.deleteTask(id);
    set((s) => {
      const next = s.tasks.filter((t) => t.id !== id);
      let activeTaskId = s.activeTaskId;
      if (activeTaskId === id) {
        const activeWs = useWorkspaceStore.getState().activeWorkspaceId;
        const inWs = next
          .filter((t) => t.workspace_id === activeWs)
          .sort((a, b) => b.created_at - a.created_at);
        activeTaskId = inWs.length ? inWs[0].id : null;
      }
      return { tasks: next, activeTaskId, openDocId: s.openDocId === id ? null : s.openDocId };
    });
  },

  toggleTag: async (taskId, tagId) => {
    const adapter = await getAdapter();
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const has = task.tags.includes(tagId);
    if (has) await adapter.removeTagFromTask(taskId, tagId);
    else await adapter.addTagToTask(taskId, tagId);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, tags: has ? t.tags.filter((x) => x !== tagId) : [...t.tags, tagId] }
          : t,
      ),
    }));
  },

  createTagAndAttach: async (name) => {
    const taskId = get().activeTaskId;
    if (!taskId) return;
    const tag = await useTagStore.getState().createTag(name);
    const adapter = await getAdapter();
    await adapter.addTagToTask(taskId, tag.id);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, tags: [...t.tags, tag.id] } : t,
      ),
    }));
  },

  addBlock: async (type, presetLabel) => {
    const adapter = await getAdapter();
    const taskId = get().activeTaskId;
    if (!taskId) throw new Error("no active task");
    let content: BlockContent;
    if (type === "note") content = { text: "" };
    else if (type === "timer") content = { label: presetLabel || "", status: "idle" };
    else content = { title: "", markdown: "" };
    const block = await adapter.createBlock({ task_id: taskId, type, ts: Date.now(), content });
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, blocks: [...t.blocks, block] } : t)),
      openDocId: type === "doc" ? block.id : s.openDocId,
    }));
    return block.id;
  },

  patchBlock: async (taskId, blockId, patch) => {
    const { __ts, ...rest } = patch;
    const task = get().tasks.find((t) => t.id === taskId);
    const block = task?.blocks.find((b) => b.id === blockId);
    if (!block) return;
    const nextContent = { ...block.content, ...rest } as BlockContent;
    const nextTs = __ts !== undefined ? __ts : block.ts;
    const adapter = await getAdapter();
    await adapter.updateBlock(blockId, { content: nextContent, ts: nextTs });
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              blocks: t.blocks.map((b) =>
                b.id === blockId ? { ...b, content: nextContent, ts: nextTs } : b,
              ),
            }
          : t,
      ),
    }));
  },

  changeActiveBlock: async (blockId, content) => {
    const taskId = get().activeTaskId;
    if (taskId) await get().patchBlock(taskId, blockId, content);
  },

  deleteBlock: async (id) => {
    const adapter = await getAdapter();
    const { useTimerStore } = await import("./timerStore");
    useTimerStore.getState().clearIfBlock(id);
    await adapter.deleteBlock(id);
    set((s) => ({
      tasks: s.tasks.map((t) => ({ ...t, blocks: t.blocks.filter((b) => b.id !== id) })),
      openDocId: s.openDocId === id ? null : s.openDocId,
    }));
  },

  activeTask: () => {
    const { tasks, activeTaskId } = get();
    return tasks.find((t) => t.id === activeTaskId) || null;
  },
}));

export type { Block };
