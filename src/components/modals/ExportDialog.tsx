import { useState } from "react";
import type { Block, DocContent, Task } from "../../types";
import { Icons } from "../ui/Icons";
import { useTagStore } from "../../stores/tagStore";
import { buildMarkdown, exportMarkdown, exportToPdf, type ExportScope } from "../../lib/export";

interface Props {
  task: Task;
  presetBlock?: Block | null;
  onClose: () => void;
}

export function ExportDialog({ task, presetBlock, onClose }: Props) {
  const tags = useTagStore((s) => s.tags);
  const [scope] = useState<ExportScope>(presetBlock ? "block" : "task");
  const [format, setFormat] = useState<"markdown" | "pdf">("markdown");

  const md = buildMarkdown({ scope, task, tags, block: presetBlock });
  const scopeLabel =
    scope === "task"
      ? `the whole task “${task.title || "Untitled"}”`
      : `the document “${presetBlock ? (presetBlock.content as DocContent).title : ""}”`;

  const doExport = async () => {
    if (format === "markdown") {
      const base =
        scope === "block" && presetBlock
          ? (presetBlock.content as DocContent).title || "document"
          : task.title || "task";
      const filename = `${base.replace(/[^\w.-]+/g, "-")}.md`;
      await exportMarkdown(filename, md);
    } else {
      exportToPdf();
    }
    onClose();
  };

  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" data-testid="export-dialog" style={{ width: 480 }}>
        <div className="modal-head">
          <h2>Export</h2>
          <p>Exporting {scopeLabel} as {format === "markdown" ? "Markdown" : "PDF"}.</p>
        </div>
        <div className="modal-body">
          {!presetBlock && (
            <div>
              <div className="field-label">Scope</div>
              <div className="seg">
                <button className="on">Whole task</button>
              </div>
            </div>
          )}
          <div>
            <div className="field-label">Format</div>
            <div className="seg">
              <button className={format === "markdown" ? "on" : ""} data-testid="export-format-md" onClick={() => setFormat("markdown")}>Markdown</button>
              <button className={format === "pdf" ? "on" : ""} data-testid="export-format-pdf" onClick={() => setFormat("pdf")}>PDF</button>
            </div>
          </div>
          <div>
            <div className="field-label">Preview</div>
            <div className="export-preview scroll" data-testid="export-preview">{md || "Nothing to export."}</div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" data-testid="export-cancel" onClick={onClose}>Cancel</button>
          <div className="right">
            <button className="btn primary" data-testid="export-confirm" onClick={() => void doExport()}>
              <Icons.share size={14} /> Export {format === "markdown" ? ".md" : ".pdf"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
