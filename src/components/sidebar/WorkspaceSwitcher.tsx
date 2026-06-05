import type { Workspace } from "../../types";
import { Icons } from "../ui/Icons";
import { colorHex } from "../../lib/colors";

interface Props {
  workspaces: Workspace[];
  activeWorkspace: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onEdit: (w: Workspace) => void;
}

export function WorkspaceSwitcher({ workspaces, activeWorkspace, onSelect, onNew, onEdit }: Props) {
  return (
    <div className="ws-switch">
      <div className="ws-switch-head">
        <span className="ws-switch-label">Workspaces</span>
        <button className="ws-new-btn" data-testid="workspace-add" title="New workspace" onClick={onNew}>
          <Icons.plus size={14} />
        </button>
      </div>
      <div className="ws-list">
        {workspaces.map((w) => (
          <button
            key={w.id}
            className={"ws-item" + (w.id === activeWorkspace ? " active" : "")}
            data-testid="workspace-item"
            data-ws-name={w.name}
            data-active={w.id === activeWorkspace ? "1" : undefined}
            onClick={() => onSelect(w.id)}
          >
            <span className="ws-dot" style={{ background: colorHex(w.color) }} />
            <span className="ws-name">{w.name}</span>
            <span
              className="ws-edit"
              data-testid="workspace-edit"
              role="button"
              title="Edit workspace"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(w);
              }}
            >
              <Icons.edit size={13} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
