import { useEffect, useRef, useState } from "react";
import type { ActiveTimer, Block, TimerContent } from "../../types";
import { Icons } from "../ui/Icons";
import { clockOf, formatClock, formatDuration, localToTs, tsToLocal } from "../../lib/time";

interface Props {
  block: Block;
  active: ActiveTimer | null;
  elapsedMs: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  locked: boolean;
  onChange: (content: Partial<TimerContent> & { __ts?: number }) => void;
}

export function TimerBlock({ block, active, elapsedMs, onStart, onPause, onResume, onFinish, locked, onChange }: Props) {
  const c = block.content as TimerContent;
  const isActive = !!active;
  const isFinished = c.status === "finished";
  const baseMs = c.duration_ms || 0;

  const [editing, setEditing] = useState(false);
  const editRef = useRef<HTMLDivElement>(null);
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
    if (!startTs || !endTs) {
      setEditing(false);
      return;
    }
    const dur = Math.max(0, endTs - startTs);
    onChange({ label: label.trim(), __ts: startTs, duration_ms: dur, status: dur > 0 ? "finished" : c.status });
    setEditing(false);
  };

  const saveRef = useRef(save);
  saveRef.current = save;

  let displayMs = 0;
  if (isActive) displayMs = elapsedMs;
  else if (isFinished) displayMs = baseMs;

  useEffect(() => {
    if (!editing) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (editRef.current && !editRef.current.contains(target) && !target.closest(".modal")) {
        saveRef.current();
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [editing]);

  const previewDur = (() => {
    const a = localToTs(startStr);
    const b = localToTs(endStr);
    if (!a || !b || b <= a) return null;
    return formatDuration(b - a);
  })();

  if (editing) {
    return (
      <div className="timer-edit" data-testid="timer-edit" ref={editRef}>
        <input
          className="timer-edit-label"
          data-testid="timer-edit-label"
          value={label}
          placeholder="Timer label (optional)"
          autoFocus
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <div className="timer-edit-row">
          <div className="timer-edit-dates">
            <div className="date-field">
              <label>Start</label>
              <input type="datetime-local" data-testid="timer-edit-start" value={startStr} onChange={(e) => setStartStr(e.target.value)} />
            </div>
            <span className="date-arrow">→</span>
            <div className="date-field">
              <label>End</label>
              <input type="datetime-local" data-testid="timer-edit-end" value={endStr} min={startStr} onChange={(e) => setEndStr(e.target.value)} />
            </div>
          </div>
        </div>
        {previewDur && <div className="timer-edit-preview">Duration: {previewDur}</div>}
        <div className="timer-edit-actions">
          <button className="t-ctrl" data-testid="timer-edit-cancel" onClick={() => setEditing(false)}>Cancel</button>
          <button className="t-ctrl solid" data-testid="timer-edit-save" onClick={save}>
            <Icons.check size={13} /> Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={"timer-main" + (isActive ? "" : " timer-clickable")}
      data-testid="timer-main"
      data-timer-status={isActive ? active!.status : isFinished ? "finished" : "idle"}
      onClick={isActive ? undefined : openEdit}
      title={isActive ? undefined : "Click to edit time"}
    >
      <div className="timer-info">
        <span className={"timer-name" + (c.label ? "" : " muted")}>{c.label || "Untitled timer"}</span>
        {isFinished ? (
          <span className="timer-meta">{clockOf(block.ts)} → {clockOf(block.ts + baseMs)}</span>
        ) : isActive ? (
          <span className="timer-meta">{active!.status === "paused" ? "Paused" : "Running now"}</span>
        ) : (
          <span className="timer-meta">Not started · click to log time</span>
        )}
      </div>

      {isFinished ? (
        <span className="timer-duration" data-testid="timer-duration">
          {formatDuration(displayMs)}
          <span className="timer-edit-hint" style={{ marginLeft: 8 }}>
            <Icons.edit size={13} />
          </span>
        </span>
      ) : isActive ? (
        <>
          <span className={"timer-duration live" + (active!.status === "paused" ? " paused" : "")} data-testid="timer-live">
            {formatClock(displayMs)}
          </span>
          <div className="timer-controls">
            {active!.status === "paused" ? (
              <button className="t-ctrl" data-testid="timer-resume" onClick={onResume}><Icons.play size={12} /> Resume</button>
            ) : (
              <button className="t-ctrl" data-testid="timer-pause" onClick={onPause}><Icons.pause size={12} /> Pause</button>
            )}
            <button className="t-ctrl solid" data-testid="timer-finish" onClick={onFinish}><Icons.stop size={11} /> Finish</button>
          </div>
        </>
      ) : (
        <div className="timer-controls" onClick={(e) => e.stopPropagation()}>
          <button className="t-ctrl" data-testid="timer-edit-open" onClick={openEdit} title="Edit time">
            <Icons.edit size={12} /> Edit
          </button>
          <button
            className="t-ctrl solid"
            data-testid="timer-start"
            onClick={onStart}
            disabled={locked}
            title={locked ? "Finish the running timer first" : "Start timer"}
          >
            <Icons.play size={12} /> Start
          </button>
        </div>
      )}
    </div>
  );
}
