import type { Block } from "../../types";
import { Icons } from "../ui/Icons";
import { Composer } from "./Composer";
import { TimelineBlock } from "./TimelineBlock";
import { useTaskStore } from "../../stores/taskStore";
import { useTimerStore } from "../../stores/timerStore";

interface Props {
  blocks: Block[];
  onRequestDeleteBlock: (id: string) => void;
  registerRef: (id: string, el: HTMLElement | null) => void;
}

export function Timeline({ blocks, onRequestDeleteBlock, registerRef }: Props) {
  const addBlock = useTaskStore((s) => s.addBlock);
  const changeActiveBlock = useTaskStore((s) => s.changeActiveBlock);
  const setOpenDoc = useTaskStore((s) => s.setOpenDoc);

  const activeTimer = useTimerStore((s) => s.activeTimer);
  const elapsedMs = useTimerStore((s) => s.elapsedMs());
  const startTimer = useTimerStore((s) => s.startTimer);
  const pauseTimer = useTimerStore((s) => s.pauseTimer);
  const resumeTimer = useTimerStore((s) => s.resumeTimer);
  const finishTimer = useTimerStore((s) => s.finishTimer);

  const addAndScroll = async (type: Parameters<typeof addBlock>[0], presetLabel?: string) => {
    await addBlock(type, presetLabel);
    setTimeout(() => {
      const el = document.getElementById("tl-scroll");
      if (el) el.scrollTop = 0;
    }, 50);
  };

  const sorted = [...blocks].sort((a, b) => b.ts - a.ts);

  return (
    <div className="timeline-wrap scroll" id="tl-scroll" data-testid="timeline">
      <div className="timeline">
        {sorted.length === 0 ? (
          <div className="empty" data-testid="empty-timeline">
            <span className="em-ic"><Icons.layers size={38} /></span>
            <h3>Nothing logged yet</h3>
            <p>Add a note, start a timer, or write a document to build this task's timeline.</p>
            <div style={{ marginTop: 8 }}>
              <Composer onAdd={(t) => void addAndScroll(t)} onAddTimer={(l) => void addAndScroll("timer", l)} />
            </div>
          </div>
        ) : (
          <>
            <Composer onAdd={(t) => void addAndScroll(t)} onAddTimer={(l) => void addAndScroll("timer", l)} />
            {sorted.map((b) => (
              <TimelineBlock
                key={b.id}
                block={b}
                registerRef={registerRef}
                active={activeTimer && activeTimer.blockId === b.id ? activeTimer : null}
                elapsedMs={elapsedMs}
                locked={!!activeTimer && activeTimer.blockId !== b.id}
                onChange={(content) => void changeActiveBlock(b.id, content)}
                onDelete={onRequestDeleteBlock}
                onStart={() => startTimer(b.id)}
                onPause={pauseTimer}
                onResume={resumeTimer}
                onFinish={finishTimer}
                onOpen={() => setOpenDoc(b.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
