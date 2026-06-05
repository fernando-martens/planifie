import { useEffect, useRef } from "react";
import type { Block, NoteContent } from "../../types";

interface Props {
  block: Block;
  onChange: (content: Partial<NoteContent>) => void;
}

export function NoteBlock({ block, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const text = (block.content as NoteContent).text || "";

  useEffect(() => {
    if (ref.current && ref.current.textContent !== text) {
      ref.current.textContent = text;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  return (
    <div
      className="note-body"
      data-testid="note-body"
      contentEditable
      suppressContentEditableWarning
      ref={ref}
      data-placeholder="Write a note…"
      onBlur={(e) => onChange({ text: e.currentTarget.textContent || "" })}
    />
  );
}
