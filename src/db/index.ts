import type { StorageAdapter } from "./adapter";
import { MemoryAdapter } from "./memoryAdapter";

export type { StorageAdapter } from "./adapter";

/** True when running inside the Tauri shell (vs. a plain browser). */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let adapterPromise: Promise<StorageAdapter> | null = null;

async function build(): Promise<StorageAdapter> {
  if (isTauri()) {
    const { SQLiteAdapter } = await import("./sqliteAdapter");
    const adapter = new SQLiteAdapter();
    await adapter.init();
    return adapter;
  }
  return new MemoryAdapter();
}

/** Lazily-initialized singleton storage adapter. */
export function getAdapter(): Promise<StorageAdapter> {
  if (!adapterPromise) adapterPromise = build();
  return adapterPromise;
}
