/* ============================================================
   planifie — Sidebar: wordmark, new task, search, task list
   (Claude-style grouped conversation list)
   ============================================================ */
const { useState } = React;

function ThemeToggle({ theme, setTheme }) {
  const dark = theme === "dark";
  return (
    <button className="icon-btn" title={dark ? "Switch to light" : "Switch to dark"}
            onClick={() => setTheme(dark ? "light" : "dark")} aria-label="Toggle theme">
      {dark ? <Icons.sun /> : <Icons.moon />}
    </button>
  );
}

function TaskItem({ task, tags, active, onSelect, onRename, onDelete, onDragStart, onDragOver, onDrop, isDragOver }) {
  const [renaming, setRenaming] = useState(false);
  const [val, setVal] = useState(task.title);
  const taskTags = task.tags.map((id) => tags.find((t) => t.id === id)).filter(Boolean);

  const commit = () => {
    const v = val.trim();
    if (v) onRename(task.id, v); else setVal(task.title);
    setRenaming(false);
  };

  if (renaming) {
    return (
      <div className="task-item renaming">
        <input className="task-rename" autoFocus value={val}
               onChange={(e) => setVal(e.target.value)}
               onBlur={commit}
               onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setVal(task.title); setRenaming(false); } }} />
      </div>
    );
  }

  return (
    <button className={"task-item" + (active ? " active" : "") + (isDragOver ? " drag-over" : "")}
            onClick={() => onSelect(task.id)}
            draggable
            onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(task.id); }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver(task.id); }}
            onDrop={(e) => { e.preventDefault(); onDrop(task.id); }}
            onDragEnd={() => onDrop(null)}>
      <span className="task-drag-handle"><Icons.more size={11} /></span>
      <span className="task-dots">
        {taskTags.slice(0, 3).map((t) => (
          <span key={t.id} className="task-dot" style={{ background: TAG_COLORS[t.color] || t.color }} />
        ))}
      </span>
      <span className="task-title">{task.title || "Untitled task"}</span>
      <span className="task-actions">
        <span className="task-mini" title="Rename" role="button"
              onClick={(e) => { e.stopPropagation(); setVal(task.title); setRenaming(true); }}>
          <Icons.edit size={13} />
        </span>
        <span className="task-mini" title="Delete" role="button"
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>
          <Icons.trash size={13} />
        </span>
      </span>
    </button>
  );
}

function TaskList({ tasks, tags, activeTask, onSelect, onRename, onDelete, query, onReorder }) {
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  const handleDrop = (targetId) => {
    if (dragId && targetId && dragId !== targetId) {
      onReorder(dragId, targetId);
    }
    setDragId(null);
    setOverId(null);
  };

  const q = query.trim().toLowerCase();
  const filtered = !q ? tasks : tasks.filter((t) => {
    if (t.title.toLowerCase().includes(q)) return true;
    const tagNames = t.tags.map((id) => (tags.find((x) => x.id === id) || {}).name || "").join(" ").toLowerCase();
    if (tagNames.includes(q)) return true;
    // also search block text/titles
    return t.blocks.some((b) =>
      (b.content.text || "").toLowerCase().includes(q) ||
      (b.content.title || "").toLowerCase().includes(q) ||
      (b.content.label || "").toLowerCase().includes(q));
  });

  if (filtered.length === 0) {
    return <div className="task-empty">{q ? `No tasks match “${query}”` : "No tasks yet"}</div>;
  }

  const groups = groupTasks(filtered);
  return (
    <div className="task-list scroll">
      {groups.map((g) => (
        <div key={g.label} className="task-group">
          <div className="task-group-label">{g.label}</div>
          {g.tasks.map((t) => (
            <TaskItem key={t.id} task={t} tags={tags} active={t.id === activeTask}
                      onSelect={onSelect} onRename={onRename} onDelete={onDelete}
                      onDragStart={setDragId} onDragOver={setOverId} onDrop={handleDrop}
                      isDragOver={dragId && overId === t.id && dragId !== t.id} />
          ))}
        </div>
      ))}
    </div>
  );
}

function WorkspaceSwitcher({ workspaces, activeWorkspace, onSelect, onNew, onEdit }) {
  return (
    <div className="ws-switch">
      <div className="ws-switch-head">
        <span className="ws-switch-label">Workspaces</span>
        <button className="ws-new-btn" title="New workspace" onClick={onNew}><Icons.plus size={14} /></button>
      </div>
      <div className="ws-list">
        {workspaces.map((w) => (
          <button key={w.id} className={"ws-item" + (w.id === activeWorkspace ? " active" : "")}
                  onClick={() => onSelect(w.id)}>
            <span className="ws-dot" style={{ background: TAG_COLORS[w.color] || w.color }} />
            <span className="ws-name">{w.name}</span>
            <span className="ws-edit" role="button" title="Edit workspace"
                  onClick={(e) => { e.stopPropagation(); onEdit(w); }}><Icons.edit size={13} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Sidebar(props) {
  const { tasks, tags, activeTask, onSelect, onRename, onDelete, onNewTask, onReorder,
          theme, setTheme, query, setQuery, onResizeStart, onResetWidth,
          workspaces, activeWorkspace, onSelectWorkspace, onNewWorkspace, onEditWorkspace } = props;
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = React.useRef(null);

  const toggleSearch = () => {
    if (searchOpen) { setQuery(""); setSearchOpen(false); }
    else { setSearchOpen(true); setTimeout(() => searchRef.current && searchRef.current.focus(), 0); }
  };

  return (
    <aside className="sidebar">
      <div className="sb-head">
        <div className="wordmark">
          <span className="mark"><Icons.layers size={13} /></span>
          planifie
        </div>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      <WorkspaceSwitcher workspaces={workspaces} activeWorkspace={activeWorkspace}
                         onSelect={onSelectWorkspace} onNew={onNewWorkspace} onEdit={onEditWorkspace} />

      <div className="task-section-head">
        <span className="ws-switch-label">Tasks</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button className="ws-new-btn" title="Search tasks" onClick={toggleSearch}><Icons.search size={14} /></button>
          <button className="nt-pill" title="New task" onClick={onNewTask}><Icons.plus size={14} /> New task</button>
        </div>
      </div>

      {searchOpen && (
        <div className="sb-search">
          <Icons.search size={15} />
          <input ref={searchRef} value={query} placeholder="Search tasks"
                 onChange={(e) => setQuery(e.target.value)}
                 onKeyDown={(e) => { if (e.key === "Escape") { setQuery(""); setSearchOpen(false); } }} />
          {query && <button className="sb-search-x" onMouseDown={(e) => { e.preventDefault(); setQuery(""); }}><Icons.x size={13} /></button>}
        </div>
      )}

      <TaskList tasks={tasks} tags={tags} activeTask={activeTask} query={query}
                onSelect={onSelect} onRename={onRename} onDelete={onDelete} onReorder={onReorder} />

      <div className="sidebar-resizer" onMouseDown={onResizeStart}
           title="Drag to resize · double-click to reset"
           onDoubleClick={() => onResetWidth && onResetWidth()}>
        <span className="sidebar-resizer-grip" />
      </div>
    </aside>
  );
}

Object.assign(window, { Sidebar, TaskList, TaskItem, ThemeToggle, WorkspaceSwitcher });
