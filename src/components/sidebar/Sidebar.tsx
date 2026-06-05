import { useRef, useState } from "react";
import type { Workspace } from "../../types";
import { Icons } from "../ui/Icons";
import { ThemeToggle } from "../ui/ThemeToggle";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { TaskList } from "./TaskList";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { useTaskStore } from "../../stores/taskStore";
import { useTagStore } from "../../stores/tagStore";
import { useUIStore } from "../../stores/uiStore";

interface Props {
  onDeleteTask: (id: string) => void;
  onNewWorkspace: () => void;
  onEditWorkspace: (w: Workspace) => void;
}

export function Sidebar({ onDeleteTask, onNewWorkspace, onEditWorkspace }: Props) {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);

  const tasks = useTaskStore((s) => s.tasks);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const query = useTaskStore((s) => s.query);
  const setQuery = useTaskStore((s) => s.setQuery);
  const selectTask = useTaskStore((s) => s.selectTask);
  const renameTask = useTaskStore((s) => s.renameTask);
  const reorderTask = useTaskStore((s) => s.reorderTask);
  const newTask = useTaskStore((s) => s.newTask);

  const tags = useTagStore((s) => s.tags);

  const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);
  const resetSidebarWidth = useUIStore((s) => s.resetSidebarWidth);
  const setResizing = useUIStore((s) => s.setResizing);

  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const workspaceTasks = tasks.filter((t) => t.workspace_id === activeWorkspaceId);

  const toggleSearch = () => {
    if (searchOpen) {
      setQuery("");
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);
    const move = (ev: MouseEvent) => setSidebarWidth(ev.clientX);
    const up = () => {
      setResizing(false);
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  return (
    <aside className="sidebar">
      <div className="sb-head">
        <div className="wordmark">
          <span className="mark"><Icons.layers size={13} /></span>
          planifie
        </div>
        <ThemeToggle />
      </div>

      <WorkspaceSwitcher
        workspaces={workspaces}
        activeWorkspace={activeWorkspaceId}
        onSelect={selectWorkspace}
        onNew={onNewWorkspace}
        onEdit={onEditWorkspace}
      />

      <div className="task-section-head">
        <span className="ws-switch-label">Tasks</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button className="ws-new-btn" data-testid="task-search-toggle" title="Search tasks" onClick={toggleSearch}>
            <Icons.search size={14} />
          </button>
          <button className="nt-pill" data-testid="new-task" title="New task" onClick={() => void newTask()}>
            <Icons.plus size={14} /> New task
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="sb-search">
          <Icons.search size={15} />
          <input
            ref={searchRef}
            data-testid="task-search-input"
            value={query}
            placeholder="Search tasks"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setQuery("");
                setSearchOpen(false);
              }
            }}
          />
          {query && (
            <button
              className="sb-search-x"
              data-testid="task-search-clear"
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery("");
              }}
            >
              <Icons.x size={13} />
            </button>
          )}
        </div>
      )}

      <TaskList
        tasks={workspaceTasks}
        tags={tags}
        activeTask={activeTaskId}
        query={query}
        onSelect={selectTask}
        onRename={renameTask}
        onDelete={onDeleteTask}
        onReorder={reorderTask}
      />

      <div
        className="sidebar-resizer"
        data-testid="sidebar-resizer"
        onMouseDown={startResize}
        title="Drag to resize · double-click to reset"
        onDoubleClick={() => resetSidebarWidth()}
      >
        <span className="sidebar-resizer-grip" />
      </div>
    </aside>
  );
}
