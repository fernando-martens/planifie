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
  if (scope === "block" && block) {
    const c = block.content as DocContent;
    const title = (c.title || "").trim();
    const body = c.markdown || "";
    // The doc title is stored separately from its body — prepend it so the
    // exported file (markdown/PDF) actually shows the document's title.
    return title ? `# ${title}\n\n${body}`.trim() : body;
  }
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

/** Save a binary blob to a file (native dialog in Tauri, download in the browser). */
async function savePdf(filename: string, blob: Blob): Promise<void> {
  if (isTauri()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");
    const path = await save({
      defaultPath: filename,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (path) await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
    return;
  }
  // browser fallback
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Markdown → PDF (selectable text) ----

/* eslint-disable @typescript-eslint/no-explicit-any */
type InlineRun = { text: string; bold?: boolean; italic?: boolean; code?: boolean; br?: boolean };

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#3?9;|&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/** Flatten marked inline tokens into styled text runs. */
function flattenInline(tokens: any[], sty: Omit<InlineRun, "text"> = {}): InlineRun[] {
  const runs: InlineRun[] = [];
  for (const t of tokens || []) {
    switch (t.type) {
      case "strong":
        runs.push(...flattenInline(t.tokens, { ...sty, bold: true }));
        break;
      case "em":
        runs.push(...flattenInline(t.tokens, { ...sty, italic: true }));
        break;
      case "codespan":
        runs.push({ text: decodeEntities(t.text), ...sty, code: true });
        break;
      case "link":
      case "del":
        runs.push(...flattenInline(t.tokens, sty));
        break;
      case "br":
        runs.push({ text: "", ...sty, br: true });
        break;
      case "text":
        if (t.tokens) runs.push(...flattenInline(t.tokens, sty));
        else runs.push({ text: decodeEntities(t.text), ...sty });
        break;
      default:
        if (t.tokens) runs.push(...flattenInline(t.tokens, sty));
        else if (t.text) runs.push({ text: decodeEntities(t.text), ...sty });
    }
  }
  return runs;
}

/**
 * Render markdown to a real PDF with **selectable text**: markdown is parsed and
 * each block is written with jsPDF's text API (no rasterization). Works in both
 * the Tauri webview and a plain browser — no print dialog.
 */
export async function exportToPdf(filename: string, markdown: string): Promise<void> {
  const [{ marked }, { jsPDF }] = await Promise.all([import("marked"), import("jspdf")]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxX = pageW - margin;
  const contentW = pageW - margin * 2;
  const SERIF = "times";
  const INK: [number, number, number] = [27, 27, 27];
  let y = margin;

  const pageBreakIfNeeded = (lineH: number) => {
    if (y + lineH > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const styleOf = (r: InlineRun): string =>
    r.bold && r.italic ? "bolditalic" : r.bold ? "bold" : r.italic ? "italic" : "normal";

  /** Lay out styled runs with word wrapping; advances `y` past the last line. */
  const drawRuns = (
    runs: InlineRun[],
    opts: { size: number; startX?: number; color?: [number, number, number]; gap?: number; forceBold?: boolean },
  ) => {
    const { size, startX = margin, color = INK, gap = 1.4, forceBold = false } = opts;
    const lineH = size * gap;
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    let x = startX;
    let lineHasContent = false;
    pageBreakIfNeeded(lineH);

    const newline = () => {
      y += lineH;
      x = startX;
      lineHasContent = false;
      pageBreakIfNeeded(lineH);
    };

    for (const run of runs) {
      if (run.br) {
        newline();
        continue;
      }
      const family = run.code ? "courier" : SERIF;
      const style = run.code ? (run.bold || forceBold ? "bold" : "normal") : styleOf({ ...run, bold: run.bold || forceBold });
      doc.setFont(family, style);

      for (const part of run.text.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          if (lineHasContent) x += doc.getTextWidth(" ");
          continue;
        }
        let w = doc.getTextWidth(part);
        if (w > contentW) {
          // A single token longer than the line: hard-wrap it.
          for (const piece of doc.splitTextToSize(part, maxX - startX) as string[]) {
            const pw = doc.getTextWidth(piece);
            if (lineHasContent && x + pw > maxX) newline();
            doc.text(piece, x, y + size);
            x += pw;
            lineHasContent = true;
          }
          continue;
        }
        if (lineHasContent && x + w > maxX) newline();
        doc.text(part, x, y + size);
        x += w;
        lineHasContent = true;
      }
    }
    y += lineH;
  };

  const blocks = marked.lexer(markdown || "") as any[];

  const drawList = (list: any, depth: number) => {
    let idx = typeof list.start === "number" ? list.start : 1;
    const indent = 16 + depth * 16;
    for (const item of list.items) {
      const marker = list.ordered ? `${idx}.` : "•";
      idx++;
      const runs: InlineRun[] = [];
      const nested: any[] = [];
      for (const tok of item.tokens || []) {
        if (tok.type === "list") nested.push(tok);
        else if (tok.tokens) runs.push(...flattenInline(tok.tokens));
        else if (tok.text) runs.push({ text: decodeEntities(tok.text) });
      }
      const lineH = 11 * 1.4;
      pageBreakIfNeeded(lineH);
      doc.setFont(SERIF, "normal");
      doc.setFontSize(11);
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text(marker, margin + (depth * 16), y + 11);
      drawRuns(runs, { size: 11, startX: margin + indent });
      for (const n of nested) drawList(n, depth + 1);
    }
    y += 4;
  };

  for (const b of blocks) {
    switch (b.type) {
      case "heading": {
        const size = { 1: 22, 2: 17, 3: 14, 4: 12, 5: 11, 6: 11 }[b.depth as 1] ?? 12;
        y += size * 0.35;
        drawRuns(flattenInline(b.tokens), { size, forceBold: true, gap: 1.25 });
        y += 3;
        break;
      }
      case "paragraph":
        drawRuns(flattenInline(b.tokens), { size: 11 });
        y += 5;
        break;
      case "list":
        drawList(b, 0);
        y += 4;
        break;
      case "blockquote": {
        const runs: InlineRun[] = [];
        for (const inner of b.tokens || []) {
          if (inner.tokens) runs.push(...flattenInline(inner.tokens, { italic: true }));
          else if (inner.text) runs.push({ text: decodeEntities(inner.text), italic: true });
        }
        const startY = y;
        const startPage = doc.getNumberOfPages();
        drawRuns(runs, { size: 11, startX: margin + 14, color: [90, 90, 90] });
        if (doc.getNumberOfPages() === startPage) {
          doc.setDrawColor(200);
          doc.setLineWidth(2);
          doc.line(margin + 4, startY + 2, margin + 4, y - 6);
        }
        y += 5;
        break;
      }
      case "code": {
        const size = 9.5;
        const lineH = size * 1.45;
        doc.setFont("courier", "normal");
        doc.setFontSize(size);
        for (const raw of String(b.text || "").split("\n")) {
          for (const ln of doc.splitTextToSize(raw || " ", contentW - 16) as string[]) {
            pageBreakIfNeeded(lineH);
            doc.setFillColor(244, 244, 244);
            doc.rect(margin, y, contentW, lineH, "F");
            doc.setTextColor(40, 40, 40);
            doc.text(ln, margin + 8, y + size);
            y += lineH;
          }
        }
        y += 6;
        break;
      }
      case "hr":
        pageBreakIfNeeded(14);
        doc.setDrawColor(220);
        doc.setLineWidth(1);
        doc.line(margin, y + 6, maxX, y + 6);
        y += 16;
        break;
      case "space":
        break;
      default:
        if (b.tokens) {
          drawRuns(flattenInline(b.tokens), { size: 11 });
          y += 5;
        } else if (b.text) {
          drawRuns([{ text: decodeEntities(String(b.text)) }], { size: 11 });
          y += 5;
        }
    }
  }

  await savePdf(filename, doc.output("blob"));
}
/* eslint-enable @typescript-eslint/no-explicit-any */
