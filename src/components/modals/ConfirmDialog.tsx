import { useEffect } from "react";

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

interface Props extends ConfirmConfig {
  onClose: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = "Delete", danger = true, onConfirm, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onConfirm, onClose]);

  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" data-testid="confirm-dialog" style={{ width: 380 }}>
        <div className="modal-head">
          <h2>{title}</h2>
          <p>{message}</p>
        </div>
        <div className="modal-foot" style={{ borderTop: 0, paddingTop: 4 }}>
          <div className="right">
            <button className="btn ghost" data-testid="confirm-cancel" onClick={onClose}>Cancel</button>
            <button className={danger ? "btn primary danger-solid" : "btn primary"} data-testid="confirm-ok" autoFocus onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
