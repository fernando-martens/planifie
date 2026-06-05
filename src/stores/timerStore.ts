import { create } from "zustand";
import type { ActiveTimer, TimerContent } from "../types";
import { useTaskStore } from "./taskStore";

let ticker: ReturnType<typeof setInterval> | null = null;

interface TimerState {
  activeTimer: ActiveTimer | null;
  now: number;
  elapsedMs: () => number;
  startTimer: (blockId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  finishTimer: () => void;
  clearIfBlock: (blockId: string) => void;
  clearIfTasks: (taskIds: string[]) => void;
}

function startTicking(set: (p: Partial<TimerState>) => void) {
  if (ticker) return;
  ticker = setInterval(() => set({ now: Date.now() }), 1000);
}
function stopTicking() {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

export const useTimerStore = create<TimerState>((set, get) => ({
  activeTimer: null,
  now: Date.now(),

  elapsedMs: () => {
    const at = get().activeTimer;
    if (!at) return 0;
    return at.accumulatedMs + (at.status === "running" ? get().now - at.startedAt : 0);
  },

  startTimer: (blockId) => {
    if (get().activeTimer) return;
    const tasks = useTaskStore.getState();
    const taskId = tasks.activeTaskId;
    if (!taskId) return;
    const block = tasks.tasks.find((t) => t.id === taskId)?.blocks.find((b) => b.id === blockId);
    const label = block ? (block.content as TimerContent).label || "" : "";
    set({
      activeTimer: { blockId, taskId, label, status: "running", startedAt: Date.now(), accumulatedMs: 0 },
      now: Date.now(),
    });
    void tasks.patchBlock(taskId, blockId, { status: "running", started_at: new Date().toISOString() } as Partial<TimerContent>);
    startTicking(set);
  },

  pauseTimer: () => {
    const at = get().activeTimer;
    if (!at) return;
    stopTicking();
    set({ activeTimer: { ...at, status: "paused", accumulatedMs: at.accumulatedMs + (Date.now() - at.startedAt) } });
    void useTaskStore.getState().patchBlock(at.taskId, at.blockId, { status: "paused" } as Partial<TimerContent>);
  },

  resumeTimer: () => {
    const at = get().activeTimer;
    if (!at) return;
    set({ activeTimer: { ...at, status: "running", startedAt: Date.now() }, now: Date.now() });
    void useTaskStore.getState().patchBlock(at.taskId, at.blockId, { status: "running" } as Partial<TimerContent>);
    startTicking(set);
  },

  finishTimer: () => {
    const at = get().activeTimer;
    if (!at) return;
    stopTicking();
    const final = at.accumulatedMs + (at.status === "running" ? Date.now() - at.startedAt : 0);
    void useTaskStore.getState().patchBlock(at.taskId, at.blockId, {
      status: "finished",
      duration_ms: final,
      finished_at: new Date().toISOString(),
    } as Partial<TimerContent>);
    set({ activeTimer: null });
  },

  clearIfBlock: (blockId) => {
    if (get().activeTimer?.blockId === blockId) {
      stopTicking();
      set({ activeTimer: null });
    }
  },

  clearIfTasks: (taskIds) => {
    const at = get().activeTimer;
    if (at && taskIds.includes(at.taskId)) {
      stopTicking();
      set({ activeTimer: null });
    }
  },
}));
