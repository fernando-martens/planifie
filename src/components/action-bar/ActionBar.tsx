import type { ActiveTimer } from "../../types";
import { Icons } from "../ui/Icons";
import { formatClock } from "../../lib/time";

interface Props {
  timer: ActiveTimer;
  elapsedMs: number;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onNavigate: () => void;
}

export function ActionBar({ timer, elapsedMs, onPause, onResume, onFinish, onNavigate }: Props) {
  const paused = timer.status === "paused";
  return (
    <div className="action-bar" data-testid="action-bar" data-status={paused ? "paused" : "running"}>
      <span
        className="ab-pulse"
        style={{ animationPlayState: paused ? "paused" : "running", opacity: paused ? 0.4 : 1 }}
      />
      <div className="ab-label" data-testid="action-bar-label" onClick={onNavigate} title="Jump to timer">
        <span className="l1">{timer.label || "Timer running"}</span>
        <span className="l2">{paused ? "Paused" : "In progress"}</span>
      </div>
      <span className={"ab-time" + (paused ? " paused" : "")} data-testid="action-bar-time">{formatClock(elapsedMs)}</span>
      <div className="ab-ctrls">
        {paused ? (
          <button className="ab-btn" data-testid="action-bar-resume" onClick={onResume} title="Resume">
            <Icons.play size={15} />
          </button>
        ) : (
          <button className="ab-btn" data-testid="action-bar-pause" onClick={onPause} title="Pause">
            <Icons.pause size={15} />
          </button>
        )}
        <button className="ab-btn stop" data-testid="action-bar-finish" onClick={onFinish} title="Finish">
          <Icons.stop size={14} />
        </button>
      </div>
    </div>
  );
}
