import { create } from "zustand";
import type { ColorToken, Tag } from "../types";
import { getAdapter } from "../db";
import { TAG_COLOR_LIST } from "../lib/colors";

interface TagState {
  tags: Tag[];
  load: () => Promise<void>;
  createTag: (name: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
}

/** Pick the first unused color, falling back to round-robin. */
function pickColor(tags: Tag[]): ColorToken {
  const used = new Set(tags.map((t) => t.color));
  const free = TAG_COLOR_LIST.find((c) => !used.has(c.key));
  return free ? free.key : TAG_COLOR_LIST[tags.length % TAG_COLOR_LIST.length].key;
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  load: async () => {
    const adapter = await getAdapter();
    set({ tags: await adapter.listTags() });
  },
  createTag: async (name) => {
    const adapter = await getAdapter();
    const color = pickColor(get().tags);
    const tag = await adapter.createTag({ name, color });
    set((s) => ({ tags: [...s.tags, tag] }));
    return tag;
  },
  deleteTag: async (id) => {
    const adapter = await getAdapter();
    await adapter.deleteTag(id);
    set((s) => ({ tags: s.tags.filter((t) => t.id !== id) }));
  },
}));
