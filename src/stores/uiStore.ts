import { create } from "zustand";

const LS_SBW = "planifie-sidebar-w";
export const DEFAULT_SIDEBAR_W = 268;
const MIN_W = 220;
const MAX_W = 460;

function initialWidth(): number {
  try {
    const v = parseInt(localStorage.getItem(LS_SBW) || "", 10);
    if (v >= MIN_W && v <= MAX_W) return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_SIDEBAR_W;
}

interface UIState {
  sidebarWidth: number;
  resizing: boolean;
  setSidebarWidth: (w: number) => void;
  resetSidebarWidth: () => void;
  setResizing: (r: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarWidth: initialWidth(),
  resizing: false,
  setSidebarWidth: (w) => {
    const clamped = Math.max(MIN_W, Math.min(MAX_W, Math.round(w)));
    set({ sidebarWidth: clamped });
    try {
      localStorage.setItem(LS_SBW, String(clamped));
    } catch {
      /* ignore */
    }
  },
  resetSidebarWidth: () => set(() => {
    try {
      localStorage.setItem(LS_SBW, String(DEFAULT_SIDEBAR_W));
    } catch {
      /* ignore */
    }
    return { sidebarWidth: DEFAULT_SIDEBAR_W };
  }),
  setResizing: (resizing) => set({ resizing }),
}));
