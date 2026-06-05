import { useState } from "react";
import type { ColorToken, Workspace } from "../../types";
import { Icons } from "../ui/Icons";
import { TAG_COLOR_LIST } from "../../lib/colors";

interface Props {
  workspace?: Workspace | null;
  onSave: (data: { id: string | null; name: string; color: ColorToken }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function WorkspaceDialog({ workspace, onSave, onDelete, onClose }: Props) {
  const editing = !!workspace;
  const [name, setName] = useState(workspace ? workspace.name : "");
  const [color, setColor] = useState<ColorToken>(workspace ? workspace.color : "mauve");

  const save = () => {
    if (!name.trim()) return;
    onSave({ id: workspace ? workspace.id : null, name: name.trim(), color });
  };

  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" data-testid="ws-dialog">
        <div className="modal-head">
          <h2>{editing ? "Edit workspace" : "New workspace"}</h2>
        </div>
        <div className="modal-body">
          <div>
            <div className="field-label">Name</div>
            <input
              className="modal-input"
              data-testid="ws-name-input"
              autoFocus
              value={name}
              placeholder="e.g. Side projects"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
          </div>
          <div>
            <div className="field-label">Color</div>
            <div className="color-row">
              {TAG_COLOR_LIST.map((c) => (
                <button
                  key={c.key}
                  className={"color-pick" + (c.key === color ? " on" : "")}
                  data-testid={"ws-color-" + c.key}
                  style={{ background: c.hex }}
                  onClick={() => setColor(c.key)}
                  aria-label={c.key}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          {editing ? (
            <button className="btn danger-btn" data-testid="ws-delete" onClick={() => onDelete(workspace!.id)}>
              <Icons.trash size={14} /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="right">
            <button className="btn ghost" data-testid="ws-cancel" onClick={onClose}>Cancel</button>
            <button className="btn primary" data-testid="ws-save" onClick={save}>{editing ? "Save" : "Create"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
