import { useState } from "react";
import type { Tag, Task } from "../../types";
import { Icons } from "../ui/Icons";
import { colorHex } from "../../lib/colors";

interface Props {
  task: Task;
  tags: Tag[];
  active: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: (id: string | null) => void;
  isDragOver: boolean;
}

export function TaskItem({
  task, tags, active, onSelect, onRename, onDelete, onDragStart, onDragOver, onDrop, isDragOver,
}: Props) {
  const [renaming, setRenaming] = useState(false);
  const [val, setVal] = useState(task.title);
  const taskTags = task.tags.map((id) => tags.find((t) => t.id === id)).filter(Boolean) as Tag[];

  const commit = () => {
    const v = val.trim();
    if (v) onRename(task.id, v);
    else setVal(task.title);
    setRenaming(false);
  };

  if (renaming) {
    return (
      <div className="task-item renaming">
        <input
          className="task-rename"
          data-testid="task-rename-input"
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setVal(task.title);
              setRenaming(false);
            }
          }}
        />
      </div>
    );
  }

  return (
    <button
      className={"task-item" + (active ? " active" : "") + (isDragOver ? " drag-over" : "")}
      data-testid="task-item"
      data-task-title={task.title || "Untitled task"}
      data-active={active ? "1" : undefined}
      onClick={() => onSelect(task.id)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart(task.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver(task.id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(task.id);
      }}
      onDragEnd={() => onDrop(null)}
    >
      <span className="task-drag-handle"><Icons.more size={11} /></span>
      <span className="task-dots">
        {taskTags.slice(0, 3).map((t) => (
          <span key={t.id} className="task-dot" style={{ background: colorHex(t.color) }} />
        ))}
      </span>
      <span className="task-title">{task.title || "Untitled task"}</span>
      <span className="task-actions">
        <span
          className="task-mini"
          data-testid="task-rename"
          title="Rename"
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            setVal(task.title);
            setRenaming(true);
          }}
        >
          <Icons.edit size={13} />
        </span>
        <span
          className="task-mini"
          data-testid="task-delete"
          title="Delete"
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
        >
          <Icons.trash size={13} />
        </span>
      </span>
    </button>
  );
}
