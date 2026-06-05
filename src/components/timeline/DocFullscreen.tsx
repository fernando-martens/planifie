import { useEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import type { Block, DocContent } from "../../types";
import { Icons } from "../ui/Icons";

interface Props {
  block: Block;
  backLabel: string;
  onClose: () => void;
  onChange: (content: Partial<DocContent>) => void;
  onExport: (block: Block) => void;
}

export function DocFullscreen({ block, backLabel, onClose, onChange, onExport }: Props) {
  const c = block.content as DocContent;
  const rootRef = useRef<HTMLDivElement>(null);

  // Keep the latest onChange without re-creating the editor on every render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Mount Milkdown's Crepe editor (all features enabled) for the active doc.
  // Re-created only when the open block changes, so typing never resets it.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const crepe = new Crepe({
      root,
      defaultValue: (block.content as DocContent).markdown || "",
    });
    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        onChangeRef.current({ markdown });
      });
    });
    const ready = crepe.create();

    return () => {
      // Destroy only after creation settles to avoid tearing down mid-init.
      void ready.then(() => crepe.destroy()).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="doc-fs" data-testid="doc-fullscreen">
      <div className="doc-fs-bar">
        <button className="btn ghost doc-back" data-testid="doc-back" onClick={onClose}>
          <Icons.chevL size={15} /> Back to {backLabel || "timeline"}
        </button>
        <div className="doc-fs-kind">
          <Icons.doc size={13} /> Document
        </div>
        <div className="doc-fs-actions">
          <button className="btn ghost" data-testid="doc-export" onClick={() => onExport(block)}>
            <Icons.share size={14} /> Export
          </button>
          <button className="btn" data-testid="doc-done" onClick={onClose}>Done</button>
        </div>
      </div>
      <div className="doc-fs-scroll scroll">
        <div className="doc-fs-page">
          <input
            className="doc-fs-title"
            data-testid="doc-title-input"
            value={c.title}
            placeholder="Untitled document"
            onChange={(e) => onChange({ title: e.target.value })}
          />
          <div className="doc-crepe" data-testid="doc-editor" ref={rootRef} />
        </div>
      </div>
    </div>
  );
}
