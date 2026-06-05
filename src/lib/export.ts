import type { Block, Task, Tag, TimerContent, NoteContent, DocContent } from "../types";
import { clockOf, formatDuration } from "./time";
import { isTauri } from "../db";

function blockToMd(b: Block): string {
  const t = clockOf(b.ts);
  if (b.type === "note") {
    return `### ${t} · Note\n${(b.content as NoteContent).text || ""}\n`;
  }
  if (b.type === "timer") {
    const c = b.content as TimerContent;
    const dur = c.status === "finished" ? formatDuration(c.duration_ms || 0) : "(running)";
    return `### ${t} · Timer — ${c.label || "Untitled"}\nDuration: ${dur}\n`;
  }
  if (b.type === "doc") {
    const c = b.content as DocContent;
    return `### ${t} · Document — ${c.title || "Untitled"}\n${c.markdown || ""}\n`;
  }
  return "";
}

export type ExportScope = "task" | "block";

export function buildMarkdown(opts: {
  scope: ExportScope;
  task: Task;
  tags: Tag[];
  block?: Block | null;
}): string {
  const { scope, task, tags, block } = opts;
  if (scope === "block" && block) return (block.content as DocContent).markdown || "";
  const taskTags = (task.tags || [])
    .map((id) => tags.find((t) => t.id === id)?.name)
    .filter(Boolean);
  let out = `# ${task.title || "Untitled task"}\n`;
  if (taskTags.length) out += `Tags: ${taskTags.join(", ")}\n`;
  const list = [...task.blocks].sort((a, b) => a.ts - b.ts);
  out += "\n" + list.map(blockToMd).join("\n");
  return out.trim();
}

/** Save markdown to a file (native dialog in Tauri, download in the browser). */
export async function exportMarkdown(filename: string, content: string): Promise<void> {
  if (isTauri()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    const path = await save({
      defaultPath: filename,
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });
    if (path) await writeTextFile(path, content);
    return;
  }
  // browser fallback
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** PDF export mirrors the timeline visual via the system print dialog. */
export function exportToPdf(): void {
  window.print();
}
