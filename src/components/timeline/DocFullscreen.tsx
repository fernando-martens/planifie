import { useEffect, useRef } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import type { PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import type { Block, DocContent } from "../../types";
import { useThemeStore } from "../../stores/themeStore";
import { Icons } from "../ui/Icons";

interface Props {
  block: Block;
  backLabel: string;
  onClose: () => void;
  onChange: (content: Partial<DocContent>) => void;
  onExport: (block: Block) => void;
}

/** BlockNote editor for a single doc. Re-mounted per block via `key`. */
function DocEditor({
  block,
  onChange,
}: {
  block: Block;
  onChange: (content: Partial<DocContent>) => void;
}) {
  const theme = useThemeStore((s) => s.theme);
  const initial = (block.content as DocContent).blocks;

  const editor = useCreateBlockNote({
    initialContent: initial && initial.length ? (initial as PartialBlock[]) : undefined,
  });

  // Keep the latest onChange without re-creating the editor on every render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Persist blocks (source of truth) + derived markdown cache, debounced.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let pending = false;
    const persist = () => {
      pending = false;
      const blocks = editor.document;
      const markdown = editor.blocksToMarkdownLossy(blocks);
      onChangeRef.current({ blocks, markdown });
    };
    const unsub = editor.onChange(() => {
      pending = true;
      if (timer) clearTimeout(timer);
      timer = setTimeout(persist, 300);
    });
    return () => {
      if (timer) clearTimeout(timer);
      if (pending) persist(); // flush the final edit when the doc closes
      unsub?.();
    };
  }, [editor]);

  return (
    <BlockNoteView
      editor={editor}
      theme={theme}
      className="doc-editor"
      data-testid="doc-editor"
    />
  );
}

export function DocFullscreen({ block, backLabel, onClose, onChange, onExport }: Props) {
  const c = block.content as DocContent;

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
          <DocEditor key={block.id} block={block} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
