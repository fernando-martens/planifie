import { create } from "zustand";
import type { ColorToken, Workspace } from "../types";
import { getAdapter } from "../db";

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;

  load: () => Promise<void>;
  selectWorkspace: (id: string) => void;
  saveWorkspace: (data: { id: string | null; name: string; color: ColorToken }) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,

  load: async () => {
    const adapter = await getAdapter();
    const workspaces = await adapter.listWorkspaces();
    set({
      workspaces,
      activeWorkspaceId: get().activeWorkspaceId ?? (workspaces[0]?.id ?? null),
    });
  },

  selectWorkspace: (id) => {
    set({ activeWorkspaceId: id });
    // pick the most recent task in this workspace
    void import("./taskStore").then(({ useTaskStore }) => {
      const tasks = useTaskStore.getState().tasks;
      const first = tasks
        .filter((t) => t.workspace_id === id)
        .sort((a, b) => b.created_at - a.created_at)[0];
      useTaskStore.setState({ activeTaskId: first ? first.id : null, openDocId: null, query: "" });
    });
  },

  saveWorkspace: async (data) => {
    const adapter = await getAdapter();
    if (data.id) {
      const updated = await adapter.updateWorkspace(data.id, { name: data.name, color: data.color });
      set((s) => ({ workspaces: s.workspaces.map((w) => (w.id === data.id ? updated : w)) }));
    } else {
      const created = await adapter.createWorkspace({ name: data.name, color: data.color });
      set((s) => ({ workspaces: [...s.workspaces, created], activeWorkspaceId: created.id }));
      const { useTaskStore } = await import("./taskStore");
      useTaskStore.setState({ activeTaskId: null, openDocId: null, query: "" });
    }
  },

  deleteWorkspace: async (id) => {
    if (get().workspaces.length <= 1) return;
    const adapter = await getAdapter();
    await adapter.deleteWorkspace(id);

    const { useTaskStore } = await import("./taskStore");
    const { useTimerStore } = await import("./timerStore");
    const removedTaskIds = useTaskStore
      .getState()
      .tasks.filter((t) => t.workspace_id === id)
      .map((t) => t.id);
    useTimerStore.getState().clearIfTasks(removedTaskIds);

    const remaining = get().workspaces.filter((w) => w.id !== id);
    const wasActive = get().activeWorkspaceId === id;
    const nextActive = wasActive ? (remaining[0]?.id ?? null) : get().activeWorkspaceId;
    set({ workspaces: remaining, activeWorkspaceId: nextActive });

    useTaskStore.setState((s) => {
      const keptTasks = s.tasks.filter((t) => t.workspace_id !== id);
      let activeTaskId = s.activeTaskId;
      if (removedTaskIds.includes(activeTaskId ?? "")) {
        const inWs = keptTasks
          .filter((t) => t.workspace_id === nextActive)
          .sort((a, b) => b.created_at - a.created_at);
        activeTaskId = inWs.length ? inWs[0].id : null;
      }
      return { tasks: keptTasks, activeTaskId, openDocId: null };
    });
  },
}));
