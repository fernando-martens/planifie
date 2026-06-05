/* ============================================================
   planifie — Task header: title, tags, tag picker, export
   ============================================================ */
const { useRef: useRefT, useEffect: useEffectT, useState: useStateT } = React;

function fmtCreated(ts) {
  const d = new Date(ts);
  const now = new Date();
  const yr = d.getFullYear() === now.getFullYear() ? "" : `, ${d.getFullYear()}`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}${yr}`;
}

function TagChip({ tag, onRemove }) {
  return (
    <span className="tag-chip" style={{ "--tg": TAG_COLORS[tag.color] || tag.color }}>
      <span className="tag-chip-dot" />
      {tag.name}
      {onRemove && (
        <button className="tag-chip-x" onClick={onRemove} title="Remove tag"><Icons.x size={11} /></button>
      )}
    </span>
  );
}

function TagPicker({ allTags, taskTagIds, onToggle, onCreate, onClose }) {
  const ref = useRefT(null);
  const [q, setQ] = useStateT("");
  useEffectT(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const query = q.trim();
  const matches = allTags.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));
  const exact = allTags.some((t) => t.name.toLowerCase() === query.toLowerCase());

  return (
    <div className="tag-pop" ref={ref}>
      <input className="tag-pop-search" autoFocus value={q} placeholder="Find or create a tag…"
             onChange={(e) => setQ(e.target.value)}
             onKeyDown={(e) => { if (e.key === "Enter" && query && !exact) { onCreate(query); setQ(""); } if (e.key === "Escape") onClose(); }} />
      <div className="tag-pop-list scroll">
        {matches.map((t) => {
          const on = taskTagIds.includes(t.id);
          return (
            <button key={t.id} className="tag-pop-item" onClick={() => onToggle(t.id)}>
              <span className="tag-chip-dot" style={{ background: TAG_COLORS[t.color] || t.color }} />
              <span className="tag-pop-name">{t.name}</span>
              {on && <Icons.check size={14} />}
            </button>
          );
        })}
        {query && !exact && (
          <button className="tag-pop-item create" onClick={() => { onCreate(query); setQ(""); }}>
            <Icons.plus size={13} /> Create “{query}”
          </button>
        )}
        {!matches.length && !query && <div className="tag-pop-empty">No tags yet — type to create one</div>}
      </div>
    </div>
  );
}

function TaskHeader({ task, tags, onTitleChange, onToggleTag, onCreateTag, onExport, onDateChange }) {
  const [picking, setPicking] = useStateT(false);
  const titleRef = useRefT(null);
  const dateRef = useRefT(null);
  const taskTags = task.tags.map((id) => tags.find((t) => t.id === id)).filter(Boolean);

  const toInputDate = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  };

  const handleDateClick = (e) => {
    // Don't trigger if clicking the input itself
    if (e.target === dateRef.current) return;
    if (dateRef.current) {
      // Remove pointer-events temporarily so showPicker works
      dateRef.current.style.pointerEvents = "auto";
      try { dateRef.current.showPicker(); } catch (err) { dateRef.current.click(); }
      // Restore after picker closes
      setTimeout(() => { if (dateRef.current) dateRef.current.style.pointerEvents = "none"; }, 100);
    }
  };

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (val) {
      const [y, m, d] = val.split("-").map(Number);
      const old = new Date(task.created_at);
      const updated = new Date(y, m - 1, d, old.getHours(), old.getMinutes(), old.getSeconds());
      onDateChange(updated.getTime());
    }
  };

  useEffectT(() => {
    if (titleRef.current && titleRef.current.textContent !== task.title) {
      titleRef.current.textContent = task.title;
    }
    // auto-focus title for new (empty) tasks
    if (titleRef.current && !task.title) {
      titleRef.current.focus();
    }
  }, [task.id]);

  return (
    <div className="task-header">
      <div className="task-header-top">
        <h1 className="task-h1" contentEditable suppressContentEditableWarning ref={titleRef}
            data-placeholder="Untitled task"
            onBlur={(e) => onTitleChange(e.currentTarget.textContent.trim())}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }} />
        <button className="btn" onClick={onExport}><Icons.share size={15} /> Export</button>
      </div>
      <div className="task-meta-row">
        <span className="task-created task-created-btn" onClick={handleDateClick} title="Change date">
          <Icons.clock size={13} /> {fmtCreated(task.created_at)}
          <input ref={dateRef} type="date" className="date-pick-input"
                 value={toInputDate(task.created_at)}
                 onChange={handleDateChange} />
        </span>
        <span className="task-meta-sep" />
        <div className="task-tags">
          {taskTags.map((t) => (
            <TagChip key={t.id} tag={t} onRemove={() => onToggleTag(t.id)} />
          ))}
          <div className="tag-add-wrap">
            <button className="tag-add" onClick={() => setPicking((p) => !p)}>
              <Icons.tag size={12} /> {taskTags.length ? "Tag" : "Add tag"}
            </button>
            {picking && (
              <TagPicker allTags={tags} taskTagIds={task.tags}
                         onToggle={onToggleTag} onCreate={onCreateTag}
                         onClose={() => setPicking(false)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TaskHeader, TagPicker, TagChip, fmtCreated });
