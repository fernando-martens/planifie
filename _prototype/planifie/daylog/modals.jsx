/* ============================================================
   planifie — modals: export dialog + confirm dialog
   ============================================================ */

function blockToMd(b) {
  const t = clockOf(b.ts);
  if (b.type === "note") return `### ${t} · Note\n${b.content.text || ""}\n`;
  if (b.type === "timer") {
    const dur = b.content.status === "finished" ? formatDuration(b.content.duration_ms || 0) : "(running)";
    return `### ${t} · Timer — ${b.content.label || "Untitled"}\nDuration: ${dur}\n`;
  }
  if (b.type === "doc") return `### ${t} · Document — ${b.content.title || "Untitled"}\n${b.content.markdown || ""}\n`;
  return "";
}

function buildMarkdown({ scope, task, tags, block }) {
  if (scope === "block" && block) return block.content.markdown || "";
  const taskTags = (task.tags || []).map((id) => (tags.find((t) => t.id === id) || {}).name).filter(Boolean);
  let out = `# ${task.title || "Untitled task"}\n`;
  if (taskTags.length) out += `Tags: ${taskTags.join(", ")}\n`;
  const list = [...task.blocks].sort((a, b) => a.ts - b.ts);
  out += "\n" + list.map(blockToMd).join("\n");
  return out.trim();
}

function ExportDialog({ task, tags, presetBlock, onClose }) {
  const [scope, setScope] = useState(presetBlock ? "block" : "task");
  const [format, setFormat] = useState("markdown");

  const md = buildMarkdown({ scope, task, tags, block: presetBlock });
  const scopeLabel = scope === "task"
    ? `the whole task “${task.title || "Untitled"}”`
    : `the document “${presetBlock ? presetBlock.content.title : ""}”`;

  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 480 }}>
        <div className="modal-head">
          <h2>Export</h2>
          <p>Exporting {scopeLabel} as {format === "markdown" ? "Markdown" : "PDF"}.</p>
        </div>
        <div className="modal-body">
          {!presetBlock && (
            <div>
              <div className="field-label">Scope</div>
              <div className="seg">
                <button className={scope === "task" ? "on" : ""} onClick={() => setScope("task")}>Whole task</button>
              </div>
            </div>
          )}
          <div>
            <div className="field-label">Format</div>
            <div className="seg">
              <button className={format === "markdown" ? "on" : ""} onClick={() => setFormat("markdown")}>Markdown</button>
              <button className={format === "pdf" ? "on" : ""} onClick={() => setFormat("pdf")}>PDF</button>
            </div>
          </div>
          <div>
            <div className="field-label">Preview</div>
            <div className="export-preview scroll">{md || "Nothing to export."}</div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <div className="right">
            <button className="btn primary" onClick={onClose}>
              <Icons.share size={14} /> Export {format === "markdown" ? ".md" : ".pdf"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel = "Delete", danger = true, onConfirm, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); if (e.key === "Enter") onConfirm(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onConfirm, onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 380 }}>
        <div className="modal-head">
          <h2>{title}</h2>
          <p>{message}</p>
        </div>
        <div className="modal-foot" style={{ borderTop: 0, paddingTop: 4 }}>
          <div className="right">
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <button className={danger ? "btn primary danger-solid" : "btn primary"} autoFocus onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspaceDialog({ workspace, onSave, onDelete, onClose }) {
  const editing = !!workspace;
  const [name, setName] = useState(workspace ? workspace.name : "");
  const [color, setColor] = useState(workspace ? workspace.color : "mauve");
  const save = () => { if (!name.trim()) return; onSave({ id: workspace ? workspace.id : null, name: name.trim(), color }); };
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head"><h2>{editing ? "Edit workspace" : "New workspace"}</h2></div>
        <div className="modal-body">
          <div>
            <div className="field-label">Name</div>
            <input className="modal-input" autoFocus value={name} placeholder="e.g. Side projects"
                   onChange={(e) => setName(e.target.value)}
                   onKeyDown={(e) => e.key === "Enter" && save()} />
          </div>
          <div>
            <div className="field-label">Color</div>
            <div className="color-row">
              {TAG_COLOR_LIST.map((c) => (
                <button key={c.key} className={"color-pick" + (c.key === color ? " on" : "")}
                        style={{ background: c.hex }} onClick={() => setColor(c.key)} aria-label={c.key} />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          {editing
            ? <button className="btn danger-btn" onClick={() => onDelete(workspace.id)}><Icons.trash size={14} /> Delete</button>
            : <span />}
          <div className="right">
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn primary" onClick={save}>{editing ? "Save" : "Create"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ExportDialog, ConfirmDialog, WorkspaceDialog, buildMarkdown });
