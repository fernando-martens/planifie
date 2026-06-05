import { useState } from "react";
import type { Tag, Task, NoteContent, TimerContent, DocContent } from "../../types";
import { groupTasks } from "../../lib/time";
import { TaskItem } from "./TaskItem";

interface Props {
  tasks: Task[];
  tags: Tag[];
  activeTask: string | null;
  query: string;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onReorder: (dragId: string, targetId: string) => void;
}

function matchesQuery(t: Task, tags: Tag[], q: string): boolean {
  if (t.title.toLowerCase().includes(q)) return true;
  const tagNames = t.tags
    .map((id) => tags.find((x) => x.id === id)?.name || "")
    .join(" ")
    .toLowerCase();
  if (tagNames.includes(q)) return true;
  return t.blocks.some((b) => {
    const c = b.content as Partial<NoteContent & TimerContent & DocContent>;
    return (
      (c.text || "").toLowerCase().includes(q) ||
      (c.title || "").toLowerCase().includes(q) ||
      (c.label || "").toLowerCase().includes(q)
    );
  });
}

export function TaskList({ tasks, tags, activeTask, query, onSelect, onRename, onDelete, onReorder }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleDrop = (targetId: string | null) => {
    if (dragId && targetId && dragId !== targetId) onReorder(dragId, targetId);
    setDragId(null);
    setOverId(null);
  };

  const q = query.trim().toLowerCase();
  const filtered = !q ? tasks : tasks.filter((t) => matchesQuery(t, tags, q));

  if (filtered.length === 0) {
    return <div className="task-empty" data-testid="task-empty">{q ? `No tasks match “${query}”` : "No tasks yet"}</div>;
  }

  const groups = groupTasks(filtered);
  return (
    <div className="task-list scroll">
      {groups.map((g) => (
        <div key={g.label} className="task-group" data-testid="task-group" data-group-label={g.label}>
          <div className="task-group-label">{g.label}</div>
          {g.tasks.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              tags={tags}
              active={t.id === activeTask}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onDragStart={setDragId}
              onDragOver={setOverId}
              onDrop={handleDrop}
              isDragOver={!!dragId && overId === t.id && dragId !== t.id}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
