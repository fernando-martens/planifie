import { useEffect, useRef, useState } from "react";
import type { BlockType } from "../../types";
import { Icons } from "../ui/Icons";
import { usePresetStore } from "../../stores/presetStore";

interface Props {
  onAdd: (type: BlockType) => void;
  onAddTimer: (label: string) => void;
}

export function Composer({ onAdd, onAddTimer }: Props) {
  const presets = usePresetStore((s) => s.presets);
  const addPreset = usePresetStore((s) => s.addPreset);
  const removePreset = usePresetStore((s) => s.removePreset);

  const [timerOpen, setTimerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const popRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!timerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setTimerOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [timerOpen]);

  useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus();
  }, [creating]);

  const commitCustom = () => {
    void addPreset(newName);
    setNewName("");
    setCreating(false);
  };

  return (
    <div className="composer" data-testid="composer">
      <button className="add-btn" data-testid="composer-note" onClick={() => onAdd("note")}>
        <Icons.note size={14} /> Note
      </button>
      <div className="pop-anchor" ref={popRef}>
        <button
          className={"add-btn" + (timerOpen ? " active" : "")}
          data-testid="composer-timer"
          onClick={() => {
            setTimerOpen((o) => !o);
            setCreating(false);
            setNewName("");
          }}
        >
          <Icons.timer size={14} /> Timer
        </button>
        {timerOpen && (
          <div className="preset-pop" data-testid="preset-pop">
            <div className="preset-pop-head">Quick start</div>
            {presets.map((p) => (
              <div key={p.id} className="preset-row">
                <button
                  className="preset-item"
                  data-testid="preset-item"
                  data-preset-label={p.label}
                  onClick={() => {
                    onAddTimer(p.label);
                    setTimerOpen(false);
                  }}
                >
                  <span className="pi-dot" />
                  {p.label}
                </button>
                <button
                  className="preset-del"
                  data-testid="preset-del"
                  data-preset-label={p.label}
                  title="Remove preset"
                  onClick={(e) => {
                    e.stopPropagation();
                    void removePreset(p.id);
                  }}
                >
                  <Icons.trash size={12} />
                </button>
              </div>
            ))}
            <div className="preset-sep" />
            {creating ? (
              <div className="preset-input-row">
                <input
                  ref={inputRef}
                  className="preset-input"
                  data-testid="preset-input"
                  value={newName}
                  placeholder="Timer name…"
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitCustom();
                    if (e.key === "Escape") {
                      setCreating(false);
                      setNewName("");
                    }
                  }}
                />
                <button
                  className="preset-commit"
                  data-testid="preset-commit"
                  onClick={commitCustom}
                  title="Save preset"
                  disabled={!newName.trim()}
                >
                  <Icons.check size={14} />
                </button>
              </div>
            ) : (
              <button className="preset-item custom" data-testid="preset-custom" onClick={() => setCreating(true)}>
                <Icons.plus size={14} /> Custom timer
              </button>
            )}
          </div>
        )}
      </div>
      <button className="add-btn" data-testid="composer-doc" onClick={() => onAdd("doc")}>
        <Icons.doc size={14} /> Document
      </button>
    </div>
  );
}
