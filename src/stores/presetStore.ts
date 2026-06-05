import { create } from "zustand";
import type { TimerPreset } from "../types";
import { getAdapter } from "../db";

interface PresetState {
  presets: TimerPreset[];
  load: () => Promise<void>;
  addPreset: (label: string) => Promise<void>;
  removePreset: (id: string) => Promise<void>;
}

export const usePresetStore = create<PresetState>((set, get) => ({
  presets: [],
  load: async () => {
    const adapter = await getAdapter();
    set({ presets: await adapter.listTimerPresets() });
  },
  addPreset: async (label) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    if (get().presets.some((p) => p.label.toLowerCase() === trimmed.toLowerCase())) return;
    const adapter = await getAdapter();
    const position = get().presets.length;
    const preset = await adapter.createTimerPreset({ label: trimmed, position });
    set((s) => ({ presets: [...s.presets, preset] }));
  },
  removePreset: async (id) => {
    const adapter = await getAdapter();
    await adapter.deleteTimerPreset(id);
    set((s) => ({ presets: s.presets.filter((p) => p.id !== id) }));
  },
}));
