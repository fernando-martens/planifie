import { useEffect, useRef, useState } from "react";
import type { Task } from "../../types";
import { Icons } from "../ui/Icons";
import { TagChip, TagPicker } from "./TagPicker";
import { fmtCreated, toInputDate } from "../../lib/time";
import { useTagStore } from "../../stores/tagStore";
import { useTaskStore } from "../../stores/taskStore";

interface Props {
  task: Task;
  onExport: () => void;
}

export function TaskHeader({ task, onExport }: Props) {
  const tags = useTagStore((s) => s.tags);
  const renameTask = useTaskStore((s) => s.renameTask);
  const toggleTag = useTaskStore((s) => s.toggleTag);
  const createTagAndAttach = useTaskStore((s) => s.createTagAndAttach);
  const setTaskDate = useTaskStore((s) => s.setTaskDate);

  const [picking, setPicking] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const taskTags = task.tags.map((id) => tags.find((t) => t.id === id)).filter(Boolean) as typeof tags;

  const handleDateClick = (e: React.MouseEvent) => {
    if (e.target === dateRef.current) return;
    if (dateRef.current) {
      dateRef.current.style.pointerEvents = "auto";
      try {
        dateRef.current.showPicker();
      } catch {
        dateRef.current.click();
      }
      setTimeout(() => {
        if (dateRef.current) dateRef.current.style.pointerEvents = "none";
      }, 100);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const [y, m, d] = val.split("-").map(Number);
      const old = new Date(task.created_at);
      const updated = new Date(y, m - 1, d, old.getHours(), old.getMinutes(), old.getSeconds());
      void setTaskDate(task.id, updated.getTime());
    }
  };

  useEffect(() => {
    if (titleRef.current && titleRef.current.textContent !== task.title) {
      titleRef.current.textContent = task.title;
    }
    if (titleRef.current && !task.title) titleRef.current.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  return (
    <div className="task-header" data-testid="task-header">
      <div className="task-header-top">
        <h1
          className="task-h1"
          data-testid="task-title"
          contentEditable
          suppressContentEditableWarning
          ref={titleRef}
          data-placeholder="Untitled task"
          onBlur={(e) => void renameTask(task.id, e.currentTarget.textContent?.trim() || "")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        />
        <button className="btn" data-testid="export-button" onClick={onExport}>
          <Icons.share size={15} /> Export
        </button>
      </div>
      <div className="task-meta-row">
        <span className="task-created task-created-btn" data-testid="task-date" onClick={handleDateClick} title="Change date">
          <Icons.clock size={13} /> {fmtCreated(task.created_at)}
          <input
            ref={dateRef}
            type="date"
            className="date-pick-input"
            data-testid="task-date-input"
            value={toInputDate(task.created_at)}
            onChange={handleDateChange}
          />
        </span>
        <span className="task-meta-sep" />
        <div className="task-tags">
          {taskTags.map((t) => (
            <TagChip key={t.id} tag={t} onRemove={() => void toggleTag(task.id, t.id)} />
          ))}
          <div className="tag-add-wrap">
            <button className="tag-add" data-testid="tag-add" onClick={() => setPicking((p) => !p)}>
              <Icons.tag size={12} /> {taskTags.length ? "Tag" : "Add tag"}
            </button>
            {picking && (
              <TagPicker
                allTags={tags}
                taskTagIds={task.tags}
                onToggle={(id) => void toggleTag(task.id, id)}
                onCreate={(name) => void createTagAndAttach(name)}
                onClose={() => setPicking(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
