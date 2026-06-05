import { useEffect, useRef, useState } from "react";
import type { Block, DocContent, NoteContent, TimerContent, Workspace } from "./types";
import { Sidebar } from "./components/sidebar/Sidebar";
import { TaskHeader } from "./components/task-header/TaskHeader";
import { Timeline } from "./components/timeline/Timeline";
import { DocFullscreen } from "./components/timeline/DocFullscreen";
import { ActionBar } from "./components/action-bar/ActionBar";
import { ExportDialog } from "./components/modals/ExportDialog";
import { ConfirmDialog, type ConfirmConfig } from "./components/modals/ConfirmDialog";
import { WorkspaceDialog } from "./components/modals/WorkspaceDialog";
import { Icons } from "./components/ui/Icons";
import { useThemeStore } from "./stores/themeStore";
import { useUIStore } from "./stores/uiStore";
import { useWorkspaceStore } from "./stores/workspaceStore";
import { useTagStore } from "./stores/tagStore";
import { usePresetStore } from "./stores/presetStore";
import { useTaskStore } from "./stores/taskStore";
import { useTimerStore } from "./stores/timerStore";

type WsDialogState = { workspace?: Workspace | null } | null;
type ExportState = { presetBlock?: Block | null } | null;

export default function App() {
  const theme = useThemeStore((s) => s.theme);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const resizing = useUIStore((s) => s.resizing);

  const tasks = useTaskStore((s) => s.tasks);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const openDocId = useTaskStore((s) => s.openDocId);
  const setOpenDoc = useTaskStore((s) => s.setOpenDoc);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const deleteBlock = useTaskStore((s) => s.deleteBlock);
  const changeActiveBlock = useTaskStore((s) => s.changeActiveBlock);
  const newTask = useTaskStore((s) => s.newTask);

  const activeTimer = useTimerStore((s) => s.activeTimer);
  const elapsedMs = useTimerStore((s) => s.elapsedMs());
  const pauseTimer = useTimerStore((s) => s.pauseTimer);
  const resumeTimer = useTimerStore((s) => s.resumeTimer);
  const finishTimer = useTimerStore((s) => s.finishTimer);

  const saveWorkspace = useWorkspaceStore((s) => s.saveWorkspace);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);

  const [ready, setReady] = useState(false);
  const [exportState, setExportState] = useState<ExportState>(null);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [wsDialog, setWsDialog] = useState<WsDialogState>(null);

  const blockRefs = useRef<Record<string, HTMLElement | null>>({});
  const registerRef = (id: string, el: HTMLElement | null) => {
    if (el) blockRefs.current[id] = el;
  };

  // ---- init ----
  useEffect(() => {
    (async () => {
      await useWorkspaceStore.getState().load();
      await useTagStore.getState().load();
      await usePresetStore.getState().load();
      await useTaskStore.getState().loadAll();
      setReady(true);
    })();
  }, []);

  // ---- theme attribute ----
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;
  const blocks = activeTask ? activeTask.blocks : [];
  const openDocBlock = openDocId && activeTask ? activeTask.blocks.find((b) => b.id === openDocId) || null : null;
  const titleTrunc = activeTask
    ? activeTask.title
      ? activeTask.title.length > 28
        ? activeTask.title.slice(0, 28) + "…"
        : activeTask.title
      : "task"
    : "task";

  // ---- delete confirmations ----
  const requestDeleteTask = (id: string) => {
    const tk = tasks.find((t) => t.id === id);
    setConfirm({
      title: "Delete task?",
      message: `“${tk ? tk.title || "Untitled task" : ""}” and its entire timeline will be removed. This can't be undone.`,
      confirmLabel: "Delete task",
      onConfirm: () => {
        void deleteTask(id);
        setConfirm(null);
      },
    });
  };

  const requestDeleteBlock = (id: string) => {
    const b = blocks.find((x) => x.id === id);
    const name = !b
      ? "this block"
      : b.type === "note"
        ? "this note"
        : b.type === "timer"
          ? `the timer “${(b.content as TimerContent).label || "Untitled"}”`
          : `the document “${(b.content as DocContent).title || "Untitled"}”`;
    setConfirm({
      title: "Delete block?",
      message: `This permanently removes ${name} from this task. This can't be undone.`,
      confirmLabel: "Delete",
      onConfirm: () => {
        void deleteBlock(id);
        setConfirm(null);
      },
    });
  };

  const requestDeleteWorkspace = (id: string) => {
    const w = useWorkspaceStore.getState().workspaces.find((x) => x.id === id);
    setWsDialog(null);
    if (useWorkspaceStore.getState().workspaces.length <= 1) return;
    setConfirm({
      title: "Delete workspace?",
      message: `“${w ? w.name : ""}” and all of its tasks will be removed. This can't be undone.`,
      confirmLabel: "Delete workspace",
      onConfirm: () => {
        void deleteWorkspace(id);
        setConfirm(null);
      },
    });
  };

  const navigateToTimer = () => {
    if (!activeTimer) return;
    const tk = useTaskStore.getState().tasks.find((x) => x.id === activeTimer.taskId);
    if (tk) useWorkspaceStore.setState({ activeWorkspaceId: tk.workspace_id });
    useTaskStore.setState({ activeTaskId: activeTimer.taskId, openDocId: null, query: "" });
    setTimeout(() => {
      const el = blockRefs.current[activeTimer.blockId];
      if (el) {
        el.classList.add("flash");
        setTimeout(() => el.classList.remove("flash"), 1100);
      }
    }, 60);
  };

  if (!ready) {
    return (
      <div className="app-loading" data-testid="app-loading">
        <span className="em-ic"><Icons.layers size={40} /></span>
      </div>
    );
  }

  return (
    <div
      className="app"
      data-testid="app"
      data-density="comfortable"
      data-blockstyle="tinted"
      data-resizing={resizing ? "1" : undefined}
      style={{ "--sidebar-w": sidebarWidth + "px" } as React.CSSProperties}
    >
      <Sidebar
        onDeleteTask={requestDeleteTask}
        onNewWorkspace={() => setWsDialog({})}
        onEditWorkspace={(w) => setWsDialog({ workspace: w })}
      />

      <main className="main">
        {activeTask ? (
          <>
            <TaskHeader task={activeTask} onExport={() => setExportState({})} />
            <Timeline
              blocks={blocks}
              onRequestDeleteBlock={requestDeleteBlock}
              registerRef={registerRef}
            />
          </>
        ) : (
          <div className="no-task" data-testid="no-task">
            <span className="em-ic"><Icons.layers size={40} /></span>
            <h3>No task selected</h3>
            <p>Create a task to start a timeline.</p>
            <button className="btn primary" data-testid="no-task-new" onClick={() => void newTask()}>
              <Icons.compose size={15} /> New task
            </button>
          </div>
        )}
      </main>

      {openDocBlock && (
        <DocFullscreen
          block={openDocBlock}
          backLabel={titleTrunc}
          onClose={() => setOpenDoc(null)}
          onChange={(content) => void changeActiveBlock(openDocBlock.id, content as Partial<NoteContent & TimerContent & DocContent>)}
          onExport={(b) => setExportState({ presetBlock: b })}
        />
      )}

      {activeTimer && (
        <ActionBar
          timer={activeTimer}
          elapsedMs={elapsedMs}
          onPause={pauseTimer}
          onResume={resumeTimer}
          onFinish={finishTimer}
          onNavigate={navigateToTimer}
        />
      )}

      {exportState && activeTask && (
        <ExportDialog task={activeTask} presetBlock={exportState.presetBlock} onClose={() => setExportState(null)} />
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.onConfirm}
          onClose={() => setConfirm(null)}
        />
      )}
      {wsDialog && (
        <WorkspaceDialog
          workspace={wsDialog.workspace}
          onSave={(data) => {
            void saveWorkspace(data);
            setWsDialog(null);
          }}
          onDelete={requestDeleteWorkspace}
          onClose={() => setWsDialog(null)}
        />
      )}
    </div>
  );
}
