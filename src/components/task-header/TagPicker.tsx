import { useEffect, useRef, useState } from "react";
import type { Tag } from "../../types";
import { Icons } from "../ui/Icons";
import { colorHex } from "../../lib/colors";

export function TagChip({ tag, onRemove }: { tag: Tag; onRemove?: () => void }) {
  return (
    <span className="tag-chip" data-testid="tag-chip" data-tag-name={tag.name} style={{ "--tg": colorHex(tag.color) } as React.CSSProperties}>
      <span className="tag-chip-dot" />
      {tag.name}
      {onRemove && (
        <button className="tag-chip-x" data-testid="tag-chip-remove" onClick={onRemove} title="Remove tag">
          <Icons.x size={11} />
        </button>
      )}
    </span>
  );
}

interface PickerProps {
  allTags: Tag[];
  taskTagIds: string[];
  onToggle: (id: string) => void;
  onCreate: (name: string) => void;
  onClose: () => void;
}

export function TagPicker({ allTags, taskTagIds, onToggle, onCreate, onClose }: PickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  const query = q.trim();
  const matches = allTags.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));
  const exact = allTags.some((t) => t.name.toLowerCase() === query.toLowerCase());

  return (
    <div className="tag-pop" data-testid="tag-pop" ref={ref}>
      <input
        className="tag-pop-search"
        data-testid="tag-pop-search"
        autoFocus
        value={q}
        placeholder="Find or create a tag…"
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query && !exact) {
            onCreate(query);
            setQ("");
          }
          if (e.key === "Escape") onClose();
        }}
      />
      <div className="tag-pop-list scroll">
        {matches.map((t) => {
          const on = taskTagIds.includes(t.id);
          return (
            <button key={t.id} className="tag-pop-item" data-testid="tag-pop-item" data-tag-name={t.name} data-on={on ? "1" : undefined} onClick={() => onToggle(t.id)}>
              <span className="tag-chip-dot" style={{ background: colorHex(t.color) }} />
              <span className="tag-pop-name">{t.name}</span>
              {on && <Icons.check size={14} />}
            </button>
          );
        })}
        {query && !exact && (
          <button
            className="tag-pop-item create"
            data-testid="tag-pop-create"
            onClick={() => {
              onCreate(query);
              setQ("");
            }}
          >
            <Icons.plus size={13} /> Create “{query}”
          </button>
        )}
        {!matches.length && !query && (
          <div className="tag-pop-empty" data-testid="tag-pop-empty">No tags yet — type to create one</div>
        )}
      </div>
    </div>
  );
}
