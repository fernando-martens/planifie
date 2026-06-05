/* ============================================================
   planifie — App store, timer engine, tweaks, render
   ============================================================ */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "sidebarWidth": 268,
  "density": "comfortable",
  "blockStyle": "tinted"
}/*EDITMODE-END*/;

const LS_THEME = "planifie-theme";
function initialTheme() {
  try {
    const saved = localStorage.getItem(LS_THEME);
    if (saved === "light" || saved === "dark") return saved;
  } catch (e) {}
  return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // ---- theme ----
  const [theme, setThemeState] = React.useState(initialTheme);
  const setTheme = (v) => { setThemeState(v); try { localStorage.setItem(LS_THEME, v); } catch (e) {} };
  React.useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  // ---- resizable sidebar ----
  const LS_SBW = "planifie-sidebar-w";
  const [sidebarW, setSidebarWState] = React.useState(() => {
    try { const v = parseInt(localStorage.getItem(LS_SBW), 10); if (v >= 220 && v <= 460) return v; } catch (e) {}
    return TWEAK_DEFAULTS.sidebarWidth;
  });
  const setSidebarW = (w) => {
    const clamped = Math.max(220, Math.min(460, Math.round(w)));
    setSidebarWState(clamped);
    try { localStorage.setItem(LS_SBW, String(clamped)); } catch (e) {}
  };
  const [resizing, setResizing] = React.useState(false);
  const startResize = (e) => {
    e.preventDefault(); setResizing(true);
    const move = (ev) => setSidebarW(ev.clientX);
    const up = () => { setResizing(false); document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  // ---- core data ----
  const [workspaces, setWorkspaces] = React.useState(WORKSPACES_SEED);
  const [tasks, setTasks] = React.useState(() => TASKS_SEED.map((t) => ({ ...t, blocks: t.blocks.map((b) => ({ ...b })) })));
  const [tags, setTags] = React.useState(TAGS_SEED);
  const [activeWorkspaceId, setActiveWorkspaceId] = React.useState(TASKS_SEED[0].workspace_id);
  const [activeTaskId, setActiveTaskId] = React.useState(TASKS_SEED[0].id);
  const [query, setQuery] = React.useState("");
  const [openDocId, setOpenDocId] = React.useState(null);

  // ---- overlays ----
  const [exportState, setExportState] = React.useState(null);
  const [confirm, setConfirm] = React.useState(null);
  const [wsDialog, setWsDialog] = React.useState(null);  // {workspace} | {create:true}

  // ---- active timer (singleton) ----
  const seedActive = React.useMemo(() => {
    for (const tk of TASKS_SEED) {
      const b = tk.blocks.find((x) => x.__activeSeed);
      if (b) return { blockId: b.id, taskId: tk.id, label: b.content.label, status: "running", startedAt: Date.now() - 6 * 60 * 1000, accumulatedMs: 0 };
    }
    return null;
  }, []);
  const [activeTimer, setActiveTimer] = React.useState(seedActive);
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    if (!activeTimer || activeTimer.status !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeTimer]);
  const elapsedMs = activeTimer
    ? activeTimer.accumulatedMs + (activeTimer.status === "running" ? now - activeTimer.startedAt : 0)
    : 0;

  // ---- refs for flash ----
  const blockRefs = React.useRef({});
  const registerRef = (id, el) => { if (el) blockRefs.current[id] = el; };

  // ---- derived ----
  const workspaceTasks = tasks.filter((tk) => tk.workspace_id === activeWorkspaceId);
  const activeTask = tasks.find((tk) => tk.id === activeTaskId) || null;
  const blocks = activeTask ? activeTask.blocks : [];
  const openDocBlock = (openDocId && activeTask) ? activeTask.blocks.find((b) => b.id === openDocId) : null;

  // ---- task mutations ----
  const mutateTask = (taskId, fn) => setTasks((prev) => prev.map((tk) => tk.id === taskId ? fn(tk) : tk));
  const mutateBlocks = (taskId, fn) => mutateTask(taskId, (tk) => ({ ...tk, blocks: fn(tk.blocks) }));

  const newTask = () => {
    const id = uid("task");
    const task = { id, title: "", created_at: Date.now(), workspace_id: activeWorkspaceId, tags: [], blocks: [] };
    setTasks((prev) => [task, ...prev]);
    setActiveTaskId(id);
    setQuery("");
    setOpenDocId(null);
  };
  const renameTask = (id, title) => mutateTask(id, (tk) => ({ ...tk, title }));
  const selectTask = (id) => { setActiveTaskId(id); setOpenDocId(null); };
  const reorderTask = (dragId, targetId) => {
    setTasks((prev) => {
      const list = [...prev];
      const fromIdx = list.findIndex((t) => t.id === dragId);
      const toIdx = list.findIndex((t) => t.id === targetId);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return prev;
      const [moved] = list.splice(fromIdx, 1);
      // place dragged task at the target's position (adopting its created_at to keep grouping)
      moved.created_at = list[Math.min(toIdx, list.length - 1)].created_at;
      list.splice(toIdx, 0, moved);
      return list;
    });
  };

  // ---- workspace ops ----
  const selectWorkspace = (id) => {
    setActiveWorkspaceId(id);
    setOpenDocId(null);
    setQuery("");
    const first = tasks.filter((tk) => tk.workspace_id === id).sort((a, b) => b.created_at - a.created_at)[0];
    setActiveTaskId(first ? first.id : null);
  };
  const saveWorkspace = (data) => {
    if (data.id) {
      setWorkspaces((ws) => ws.map((w) => w.id === data.id ? { ...w, name: data.name, color: data.color } : w));
    } else {
      const id = uid("ws");
      setWorkspaces((ws) => [...ws, { id, name: data.name, color: data.color }]);
      setActiveWorkspaceId(id);
      setActiveTaskId(null);
    }
    setWsDialog(null);
  };
  const deleteWorkspace = (id) => {
    if (workspaces.length <= 1) { setWsDialog(null); return; }
    const w = workspaces.find((x) => x.id === id);
    setWsDialog(null);
    setConfirm({
      title: "Delete workspace?",
      message: `“${w ? w.name : ""}” and all of its tasks will be removed. This can't be undone.`,
      confirmLabel: "Delete workspace",
      onConfirm: () => {
        const remainingWs = workspaces.filter((x) => x.id !== id);
        const keptTasks = tasks.filter((tk) => tk.workspace_id !== id);
        setWorkspaces(remainingWs);
        setTasks(keptTasks);
        if (activeTimer && tasks.find((tk) => tk.id === activeTimer.taskId && tk.workspace_id === id)) setActiveTimer(null);
        if (activeWorkspaceId === id) {
          const nextWs = remainingWs[0];
          setActiveWorkspaceId(nextWs ? nextWs.id : null);
          const first = keptTasks.filter((tk) => nextWs && tk.workspace_id === nextWs.id).sort((a, b) => b.created_at - a.created_at)[0];
          setActiveTaskId(first ? first.id : null);
        }
        setConfirm(null);
      },
    });
  };
  const deleteTask = (id) => {
    const tk = tasks.find((x) => x.id === id);
    setConfirm({
      title: "Delete task?",
      message: `“${tk ? (tk.title || "Untitled task") : ""}” and its entire timeline will be removed. This can't be undone.`,
      confirmLabel: "Delete task",
      onConfirm: () => {
        setTasks((prev) => {
          const next = prev.filter((x) => x.id !== id);
          if (activeTaskId === id) {
            const inWs = next.filter((x) => x.workspace_id === activeWorkspaceId).sort((a, b) => b.created_at - a.created_at);
            setActiveTaskId(inWs.length ? inWs[0].id : null);
          }
          return next;
        });
        if (activeTimer && activeTimer.taskId === id) setActiveTimer(null);
        setConfirm(null);
      },
    });
  };

  // ---- tag ops ----
  const toggleTag = (tagId) => mutateTask(activeTaskId, (tk) => ({
    ...tk, tags: tk.tags.includes(tagId) ? tk.tags.filter((x) => x !== tagId) : [...tk.tags, tagId],
  }));
  const createTag = (name) => {
    const used = new Set(tags.map((t) => t.color));
    const pick = (TAG_COLOR_LIST.find((c) => !used.has(c.key)) || TAG_COLOR_LIST[tags.length % TAG_COLOR_LIST.length]);
    const id = uid("tag");
    setTags((prev) => [...prev, { id, name, color: pick.key }]);
    mutateTask(activeTaskId, (tk) => ({ ...tk, tags: [...tk.tags, id] }));
  };

  // ---- block ops ----
  const changeBlock = (id, content) => {
    const { __ts, ...rest } = content;
    mutateBlocks(activeTaskId, (list) => list.map((b) => {
      if (b.id !== id) return b;
      const updated = { ...b, content: { ...b.content, ...rest } };
      if (__ts !== undefined) updated.ts = __ts;
      return updated;
    }));
  };
  const changeBlockIn = (taskId, id, content) => {
    const { __ts, ...rest } = content;
    mutateBlocks(taskId, (list) => list.map((b) => {
      if (b.id !== id) return b;
      const updated = { ...b, content: { ...b.content, ...rest } };
      if (__ts !== undefined) updated.ts = __ts;
      return updated;
    }));
  };

  const deleteBlockNow = (id) => {
    if (activeTimer && activeTimer.blockId === id) setActiveTimer(null);
    if (openDocId === id) setOpenDocId(null);
    mutateBlocks(activeTaskId, (list) => list.filter((b) => b.id !== id));
  };
  const requestDeleteBlock = (id) => {
    const b = blocks.find((x) => x.id === id);
    const name = !b ? "this block"
      : b.type === "note" ? "this note"
      : b.type === "timer" ? `the timer “${b.content.label || "Untitled"}”`
      : `the document “${b.content.title || "Untitled"}”`;
    setConfirm({
      title: "Delete block?",
      message: `This permanently removes ${name} from this task. This can't be undone.`,
      confirmLabel: "Delete",
      onConfirm: () => { deleteBlockNow(id); setConfirm(null); },
    });
  };

  const addBlock = (type, presetLabel) => {
    const id = uid("b");
    let content;
    if (type === "note") content = { text: "" };
    else if (type === "timer") content = { label: presetLabel || "", status: "idle" };
    else content = { title: "", markdown: "" };
    const block = { id, type, ts: Date.now(), content };
    mutateBlocks(activeTaskId, (list) => [...list, block]);
    if (type === "doc") setTimeout(() => setOpenDocId(id), 0);
    // scroll timeline to top so the new block is visible
    setTimeout(() => {
      const el = document.getElementById("tl-scroll");
      if (el) el.scrollTop = 0;
    }, 50);
  };

  const addTimerPreset = (label) => addBlock("timer", label);

  // ---- timer engine ----
  const startTimer = (blockId) => {
    if (activeTimer) return;
    const block = blocks.find((b) => b.id === blockId);
    setActiveTimer({ blockId, taskId: activeTaskId, label: block ? block.content.label : "", status: "running", startedAt: Date.now(), accumulatedMs: 0 });
    setNow(Date.now());
    changeBlock(blockId, { status: "running" });
  };
  const pauseTimer = () => {
    if (!activeTimer) return;
    setActiveTimer((at) => at ? { ...at, status: "paused", accumulatedMs: at.accumulatedMs + (Date.now() - at.startedAt) } : at);
    changeBlockIn(activeTimer.taskId, activeTimer.blockId, { status: "paused" });
  };
  const resumeTimer = () => {
    if (!activeTimer) return;
    setActiveTimer((at) => at ? { ...at, status: "running", startedAt: Date.now() } : at);
    setNow(Date.now());
    changeBlockIn(activeTimer.taskId, activeTimer.blockId, { status: "running" });
  };
  const finishTimer = () => {
    if (!activeTimer) return;
    const final = activeTimer.accumulatedMs + (activeTimer.status === "running" ? Date.now() - activeTimer.startedAt : 0);
    changeBlockIn(activeTimer.taskId, activeTimer.blockId, { status: "finished", duration_ms: final, finished_at: new Date().toISOString() });
    setActiveTimer(null);
  };
  const navigateToTimer = () => {
    if (!activeTimer) return;
    const tk = tasks.find((x) => x.id === activeTimer.taskId);
    if (tk) setActiveWorkspaceId(tk.workspace_id);
    setActiveTaskId(activeTimer.taskId);
    setOpenDocId(null);
    setQuery("");
    setTimeout(() => {
      const el = blockRefs.current[activeTimer.blockId];
      if (el) { el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1100); }
    }, 60);
  };

  const titleTrunc = activeTask ? (activeTask.title ? (activeTask.title.length > 28 ? activeTask.title.slice(0, 28) + "…" : activeTask.title) : "task") : "task";

  return (
    <div className="app" data-density={t.density} data-blockstyle={t.blockStyle}
         data-resizing={resizing ? "1" : undefined}
         style={{ "--sidebar-w": sidebarW + "px" }}>

      <Sidebar
        tasks={workspaceTasks} tags={tags} activeTask={activeTaskId}
        onSelect={selectTask} onRename={renameTask} onDelete={deleteTask} onNewTask={newTask} onReorder={reorderTask}
        theme={theme} setTheme={setTheme} query={query} setQuery={setQuery}
        onResizeStart={startResize} onResetWidth={() => setSidebarW(TWEAK_DEFAULTS.sidebarWidth)}
        workspaces={workspaces} activeWorkspace={activeWorkspaceId}
        onSelectWorkspace={selectWorkspace}
        onNewWorkspace={() => setWsDialog({ create: true })}
        onEditWorkspace={(w) => setWsDialog({ workspace: w })} />

      <main className="main">
        {activeTask ? (
          <>
            <TaskHeader task={activeTask} tags={tags}
                        onTitleChange={(v) => renameTask(activeTask.id, v)}
                        onToggleTag={toggleTag} onCreateTag={createTag}
                        onExport={() => setExportState({})}
                        onDateChange={(ts) => mutateTask(activeTaskId, (tk) => ({ ...tk, created_at: ts }))} />
            <Timeline
              blocks={blocks}
              onChangeBlock={changeBlock} onDeleteBlock={requestDeleteBlock} onAdd={addBlock} onAddTimer={addTimerPreset}
              registerRef={registerRef}
              activeTimer={activeTimer} elapsedMs={elapsedMs}
              onStartTimer={startTimer} onPauseTimer={pauseTimer}
              onResumeTimer={resumeTimer} onFinishTimer={finishTimer}
              onOpenDoc={(id) => setOpenDocId(id)} />
          </>
        ) : (
          <div className="no-task">
            <span className="em-ic"><Icons.layers size={40} /></span>
            <h3>No task selected</h3>
            <p>Create a task to start a timeline.</p>
            <button className="btn primary" onClick={newTask}><Icons.compose size={15} /> New task</button>
          </div>
        )}
      </main>

      {openDocBlock && (
        <DocFullscreen block={openDocBlock} backLabel={titleTrunc}
                       onClose={() => setOpenDocId(null)}
                       onChange={(content) => changeBlock(openDocBlock.id, content)}
                       onExport={(b) => setExportState({ presetBlock: b })} />
      )}

      {activeTimer && (
        <ActionBar timer={activeTimer} elapsedMs={elapsedMs}
                   onPause={pauseTimer} onResume={resumeTimer} onFinish={finishTimer}
                   onNavigate={navigateToTimer} />
      )}

      {exportState && activeTask && (
        <ExportDialog task={activeTask} tags={tags} presetBlock={exportState.presetBlock}
                      onClose={() => setExportState(null)} />
      )}
      {confirm && (
        <ConfirmDialog title={confirm.title} message={confirm.message}
                       confirmLabel={confirm.confirmLabel}
                       onConfirm={confirm.onConfirm} onClose={() => setConfirm(null)} />
      )}
      {wsDialog && (
        <WorkspaceDialog workspace={wsDialog.workspace}
                         onSave={saveWorkspace} onDelete={deleteWorkspace}
                         onClose={() => setWsDialog(null)} />
      )}

      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakRadio label="Theme" value={theme} options={["light", "dark"]} onChange={setTheme} />
        <TweakSlider label="Sidebar width" value={sidebarW} min={220} max={460} step={4} unit="px" onChange={setSidebarW} />
        <TweakSection label="Timeline" />
        <TweakRadio label="Density" value={t.density} options={["compact", "comfortable"]} onChange={(v) => setTweak("density", v)} />
        <TweakRadio label="Block style" value={t.blockStyle} options={["tinted", "card", "minimal"]} onChange={(v) => setTweak("blockStyle", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
