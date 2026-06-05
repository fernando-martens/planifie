/* ============================================================
   DayLog — Timeline, blocks, action bar, modals
   ============================================================ */
const { useEffect, useRef } = React;

/* ---------- NOTE ---------- */
function NoteBlock({ block, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.textContent !== (block.content.text || "")) {
      ref.current.textContent = block.content.text || "";
    }
  }, [block.id]);
  return (
    <div className="note-body" contentEditable suppressContentEditableWarning
         ref={ref} data-placeholder="Write a note…"
         onBlur={(e) => onChange({ text: e.currentTarget.textContent })} />
  );
}

/* ---------- helpers for datetime-local inputs ---------- */
function tsToLocal(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function localToTs(str) { return new Date(str).getTime(); }

/* ---------- TIMER ---------- */
function TimerBlock({ block, active, elapsedMs, onStart, onPause, onResume, onFinish, locked, onChange, planning }) {
  const c = block.content;
  const isActive = !planning && !!active;
  const isFinished = c.status === "finished";

  const [editing, setEditing] = useState(false);
  const editRef = useRef(null);
  const baseMs = c.duration_ms || 0;
  const [label, setLabel] = useState(c.label || "");
  const [startStr, setStartStr] = useState("");
  const [endStr, setEndStr] = useState("");

  const openEdit = () => {
    setLabel(c.label || "");
    const st = block.ts;
    const en = isFinished ? st + (c.duration_ms || 0) : st;
    setStartStr(tsToLocal(st));
    setEndStr(tsToLocal(en));
    setEditing(true);
  };
  const save = () => {
    const startTs = localToTs(startStr);
    const endTs = localToTs(endStr);
    if (!startTs || !endTs) { setEditing(false); return; }
    const dur = Math.max(0, endTs - startTs);
    const patch = { label: label.trim(), __ts: startTs };
    if (planning) { patch.status = "planned"; patch.duration_ms = dur; }
    else { patch.duration_ms = dur; patch.status = dur > 0 ? "finished" : c.status; }
    onChange(patch);
    setEditing(false);
  };
  const saveRef = useRef(save);
  saveRef.current = save;

  let displayMs = 0;
  if (isActive) displayMs = elapsedMs;
  else if (isFinished) displayMs = baseMs;

  // clicking outside the edit form saves and exits
  useEffect(() => {
    if (!editing) return;
    const onDown = (e) => {
      if (editRef.current && !editRef.current.contains(e.target) &&
          !e.target.closest(".modal") && !e.target.closest(".twk-panel")) {
        saveRef.current();
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [editing]);

  // computed duration preview from start/end inputs
  const previewDur = (() => {
    const a = localToTs(startStr), b = localToTs(endStr);
    if (!a || !b || b <= a) return null;
    return formatDuration(b - a);
  })();

  if (editing) {
    return (
      <div className="timer-edit" ref={editRef}>
        <input className="timer-edit-label" value={label} placeholder="Timer label (optional)"
               autoFocus onChange={(e) => setLabel(e.target.value)}
               onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} />
        <div className="timer-edit-row">
          <div className="timer-edit-dates">
            <div className="date-field">
              <label>Start</label>
              <input type="datetime-local" value={startStr} onChange={(e) => setStartStr(e.target.value)} />
            </div>
            <span className="date-arrow">→</span>
            <div className="date-field">
              <label>End</label>
              <input type="datetime-local" value={endStr} min={startStr} onChange={(e) => setEndStr(e.target.value)} />
            </div>
          </div>
        </div>
        {previewDur && <div className="timer-edit-preview">Duration: {previewDur}</div>}
        <div className="timer-edit-actions">
          <button className="t-ctrl" onClick={() => setEditing(false)}>Cancel</button>
          <button className="t-ctrl solid" onClick={save}><Icons.check size={13} /> Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className={"timer-main" + (isActive ? "" : " timer-clickable")}
         onClick={isActive ? undefined : openEdit}
         title={isActive ? undefined : (planning ? "Click to plan time" : "Click to edit time")}>
      <div className="timer-info">
        <span className={"timer-name" + (c.label ? "" : " muted")}>
          {c.label || (planning ? "Untitled plan" : "Untitled timer")}
          {planning && <span className="timer-plan-tag">Planned</span>}
        </span>
        {planning ? (
          <span className="timer-meta">{baseMs > 0 ? `Target · ${formatDuration(baseMs)}` : "Planning · set a target time"}</span>
        ) : isFinished ? (
          <span className="timer-meta">{clockOf(block.ts)} → {clockOf(block.ts + baseMs)}</span>
        ) : isActive ? (
          <span className="timer-meta">{active.status === "paused" ? "Paused" : "Running now"}</span>
        ) : (
          <span className="timer-meta">Not started · click to log time</span>
        )}
      </div>

      {planning ? (
        baseMs > 0 ? (
          <span className="timer-duration planned">
            {formatDuration(baseMs)}
            <span className="timer-edit-hint" style={{ marginLeft: 8 }}><Icons.edit size={13} /></span>
          </span>
        ) : (
          <div className="timer-controls" onClick={(e) => e.stopPropagation()}>
            <button className="t-ctrl" onClick={openEdit}><Icons.edit size={12} /> Set target</button>
          </div>
        )
      ) : isFinished ? (
        <span className="timer-duration">
          {formatDuration(displayMs)}
          <span className="timer-edit-hint" style={{ marginLeft: 8 }}><Icons.edit size={13} /></span>
        </span>
      ) : isActive ? (
        <>
          <span className={"timer-duration live" + (active.status === "paused" ? " paused" : "")}>
            {formatClock(displayMs)}
          </span>
          <div className="timer-controls">
            {active.status === "paused"
              ? <button className="t-ctrl" onClick={onResume}><Icons.play size={12} /> Resume</button>
              : <button className="t-ctrl" onClick={onPause}><Icons.pause size={12} /> Pause</button>}
            <button className="t-ctrl solid" onClick={onFinish}><Icons.stop size={11} /> Finish</button>
          </div>
        </>
      ) : (
        <div className="timer-controls" onClick={(e) => e.stopPropagation()}>
          <button className="t-ctrl" onClick={openEdit} title="Edit time"><Icons.edit size={12} /> Edit</button>
          <button className="t-ctrl solid" onClick={onStart} disabled={locked}
                  title={locked ? "Finish the running timer first" : "Start timer"}>
            <Icons.play size={12} /> Start
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- DOC ---------- */
function DocToolbar({ editorRef }) {
  const cmd = (command, value) => {
    editorRef.current && editorRef.current.focus();
    document.execCommand(command, false, value);
  };
  const wrapCode = () => {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;
    const text = sel.toString();
    const code = document.createElement("code");
    code.textContent = text;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(code);
    sel.removeAllRanges();
  };
  return (
    <div className="doc-toolbar" onMouseDown={(e) => e.preventDefault()}>
      <button className="tb" title="Heading 1" onClick={() => cmd("formatBlock", "h1")}>H1</button>
      <button className="tb" title="Heading 2" onClick={() => cmd("formatBlock", "h2")}>H2</button>
      <button className="tb" title="Body" onClick={() => cmd("formatBlock", "p")}>¶</button>
      <span className="sep" />
      <button className="tb" title="Bold" onClick={() => cmd("bold")} style={{ fontWeight: 800 }}>B</button>
      <button className="tb" title="Italic" onClick={() => cmd("italic")} style={{ fontStyle: "italic", fontFamily: "var(--font-serif)" }}>i</button>
      <button className="tb mono" title="Inline code" onClick={wrapCode}>{"</>"}</button>
      <span className="sep" />
      <button className="tb" title="Bulleted list" onClick={() => cmd("insertUnorderedList")}>•—</button>
      <button className="tb" title="Quote" onClick={() => cmd("formatBlock", "blockquote")}>"</button>
    </div>
  );
}

/* doc card in the timeline — click to open the full-screen editor */
function DocBlock({ block, onOpen }) {
  const c = block.content;
  return (
    <div className="doc-collapsed" onClick={onOpen}>
      <div className="doc-title">{c.title || "Untitled document"}<span className="doc-open-hint"><Icons.expand size={13} /> Open</span></div>
      <div className="doc-preview">{docPreview(c.markdown) || "Empty document — click to write"}</div>
    </div>
  );
}

/* full-screen markdown editor — covers the main area (sidebar stays usable) */
function DocFullscreen({ block, backLabel, onClose, onChange, onExport }) {
  const c = block.content;
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = mdToHtml(c.markdown);
  }, [block.id]);

  // Esc closes
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="doc-fs">
      <div className="doc-fs-bar">
        <button className="btn ghost doc-back" onClick={onClose}>
          <Icons.chevL size={15} /> Back to {backLabel || "timeline"}
        </button>
        <div className="doc-fs-kind"><Icons.doc size={13} /> Document</div>
        <div className="doc-fs-actions">
          <button className="btn ghost" onClick={() => onExport(block)}>
            <Icons.share size={14} /> Export
          </button>
          <button className="btn" onClick={onClose}>Done</button>
        </div>
      </div>
      <div className="doc-fs-scroll scroll">
        <div className="doc-fs-page">
          <input className="doc-fs-title" value={c.title} placeholder="Untitled document"
                 onChange={(e) => onChange({ title: e.target.value })} />
          <div className="doc-fs-toolbar"><DocToolbar editorRef={editorRef} /></div>
          <div className="doc-editor doc-fs-editor" contentEditable suppressContentEditableWarning ref={editorRef} />
        </div>
      </div>
    </div>
  );
}

/* ---------- BLOCK WRAPPER ---------- */
const KIND_META = {
  note: { label: "Note", icon: Icons.note },
  timer: { label: "Timer", icon: Icons.timer },
  doc: { label: "Doc", icon: Icons.doc },
};

function TimelineBlock(props) {
  const { block, onDelete, registerRef } = props;
  const meta = KIND_META[block.type];
  const IconC = meta.icon;
  const blockRef = useRef(null);
  useEffect(() => { if (registerRef) registerRef(block.id, blockRef.current); }, [block.id]);

  return (
    <div className="tl-row">
      <div className="tl-gutter">
        <span className="tl-time">{blockTime(block.ts)}</span>
        <span className="tl-node" />
      </div>
      <div className={"block block-" + block.type} ref={blockRef}>
        <div className="block-kind">
          <IconC className="kind-icon" size={13} />
          <span className="kind-label">{meta.label}</span>
          <div className="block-actions">
            <button className="mini-btn" title="Delete block" onClick={() => onDelete(block.id)}>
              <Icons.trash size={14} />
            </button>
          </div>
        </div>
        {block.type === "note" && <NoteBlock block={block} onChange={props.onChange} />}
        {block.type === "timer" && (
          <TimerBlock block={block} active={props.active} elapsedMs={props.elapsedMs}
                      onStart={props.onStart} onPause={props.onPause}
                      onResume={props.onResume} onFinish={props.onFinish} locked={props.locked}
                      onChange={props.onChange} planning={props.planning} />
        )}
        {block.type === "doc" && (
          <DocBlock block={block} onOpen={props.onOpen} />
        )}
      </div>
    </div>
  );
}

/* ---------- COMPOSER ---------- */
const DEFAULT_PRESETS = ["Writing", "Reviewing", "Studying", "Deep work", "Meeting"];
const LS_PRESETS = "planifie-timer-presets";
function loadPresets() { try { const v = JSON.parse(localStorage.getItem(LS_PRESETS)); if (Array.isArray(v)) return v; } catch (e) {} return DEFAULT_PRESETS; }
function savePresets(list) { try { localStorage.setItem(LS_PRESETS, JSON.stringify(list)); } catch (e) {} }

function Composer({ onAdd, onAddTimer }) {
  const [timerOpen, setTimerOpen] = React.useState(false);
  const [presets, setPresetsState] = React.useState(loadPresets);
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const popRef = useRef(null);
  const inputRef = useRef(null);

  const setPresets = (list) => { setPresetsState(list); savePresets(list); };

  useEffect(() => {
    if (!timerOpen) return;
    const onDown = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setTimerOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [timerOpen]);

  useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus();
  }, [creating]);

  const commitCustom = () => {
    const name = newName.trim();
    if (name && !presets.includes(name)) {
      setPresets([...presets, name]);
    }
    setNewName("");
    setCreating(false);
  };

  const removePreset = (p) => {
    setPresets(presets.filter((x) => x !== p));
  };

  return (
    <div className="composer">
      <button className="add-btn" onClick={() => onAdd("note")}><Icons.note size={14} /> Note</button>
      <div className="pop-anchor" ref={popRef}>
        <button className={"add-btn" + (timerOpen ? " active" : "")}
                onClick={() => { setTimerOpen((o) => !o); setCreating(false); setNewName(""); }}>
          <Icons.timer size={14} /> Timer
        </button>
        {timerOpen && (
          <div className="preset-pop">
            <div className="preset-pop-head">Quick start</div>
            {presets.map((p) => (
              <div key={p} className="preset-row">
                <button className="preset-item"
                        onClick={() => { onAddTimer(p); setTimerOpen(false); }}>
                  <span className="pi-dot" />{p}
                </button>
                <button className="preset-del" title="Remove preset"
                        onClick={(e) => { e.stopPropagation(); removePreset(p); }}>
                  <Icons.trash size={12} />
                </button>
              </div>
            ))}
            <div className="preset-sep" />
            {creating ? (
              <div className="preset-input-row">
                <input ref={inputRef} className="preset-input" value={newName} placeholder="Timer name…"
                       onChange={(e) => setNewName(e.target.value)}
                       onKeyDown={(e) => { if (e.key === "Enter") commitCustom(); if (e.key === "Escape") { setCreating(false); setNewName(""); } }} />
                <button className="preset-commit" onClick={commitCustom} title="Save preset" disabled={!newName.trim()}>
                  <Icons.check size={14} />
                </button>
              </div>
            ) : (
              <button className="preset-item custom"
                      onClick={() => setCreating(true)}>
                <Icons.plus size={14} /> Custom timer
              </button>
            )}
          </div>
        )}
      </div>
      <button className="add-btn" onClick={() => onAdd("doc")}><Icons.doc size={14} /> Document</button>
    </div>
  );
}

/* ---------- TIMELINE ---------- */
function Timeline(props) {
  const { blocks } = props;
  // most-recent first
  const sorted = [...blocks].sort((a, b) => b.ts - a.ts || 0);

  return (
    <div className="timeline-wrap scroll" id="tl-scroll">
      <div className="timeline">
        {sorted.length === 0 ? (
          <div className="empty">
            <span className="em-ic"><Icons.layers size={38} /></span>
            <h3>Nothing logged yet</h3>
            <p>Add a note, start a timer, or write a document to build this task's timeline.</p>
            <div style={{ marginTop: 8 }}>
              <Composer onAdd={props.onAdd} onAddTimer={props.onAddTimer} />
            </div>
          </div>
        ) : (
          <>
            <Composer onAdd={props.onAdd} onAddTimer={props.onAddTimer} />
            {sorted.map((b) => (
              <TimelineBlock key={b.id} block={b}
                onChange={(content) => props.onChangeBlock(b.id, content)}
                onDelete={props.onDeleteBlock}
                registerRef={props.registerRef}
                active={props.activeTimer && props.activeTimer.blockId === b.id ? props.activeTimer : null}
                elapsedMs={props.elapsedMs}
                locked={!!props.activeTimer && (!props.activeTimer || props.activeTimer.blockId !== b.id)}
                onStart={() => props.onStartTimer(b.id)}
                onPause={props.onPauseTimer}
                onResume={props.onResumeTimer}
                onFinish={props.onFinishTimer}
                onOpen={() => props.onOpenDoc(b.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- ACTION BAR ---------- */
function ActionBar({ timer, elapsedMs, onPause, onResume, onFinish, onNavigate }) {
  const paused = timer.status === "paused";
  return (
    <div className="action-bar">
      <span className="ab-pulse" style={{ animationPlayState: paused ? "paused" : "running", opacity: paused ? .4 : 1 }} />
      <div className="ab-label" onClick={onNavigate} title="Jump to timer">
        <span className="l1">{timer.label || "Timer running"}</span>
        <span className="l2">{paused ? "Paused" : "In progress"}</span>
      </div>
      <span className={"ab-time" + (paused ? " paused" : "")}>{formatClock(elapsedMs)}</span>
      <div className="ab-ctrls">
        {paused
          ? <button className="ab-btn" onClick={onResume} title="Resume"><Icons.play size={15} /></button>
          : <button className="ab-btn" onClick={onPause} title="Pause"><Icons.pause size={15} /></button>}
        <button className="ab-btn stop" onClick={onFinish} title="Finish"><Icons.stop size={14} /></button>
      </div>
    </div>
  );
}

Object.assign(window, {
  NoteBlock, TimerBlock, DocBlock, DocFullscreen, DocToolbar, TimelineBlock, Composer, Timeline, ActionBar, KIND_META,
});
