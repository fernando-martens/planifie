import { useEffect, useRef } from "react";
import type { ActiveTimer, Block, NoteContent, TimerContent, DocContent } from "../../types";
import { Icons } from "../ui/Icons";
import { blockTime } from "../../lib/time";
import { NoteBlock } from "./NoteBlock";
import { TimerBlock } from "./TimerBlock";
import { DocBlock } from "./DocBlock";

const KIND_META = {
  note: { label: "Note", icon: Icons.note },
  timer: { label: "Timer", icon: Icons.timer },
  doc: { label: "Doc", icon: Icons.doc },
};

interface Props {
  block: Block;
  active: ActiveTimer | null;
  elapsedMs: number;
  locked: boolean;
  onChange: (content: Partial<NoteContent & TimerContent & DocContent> & { __ts?: number }) => void;
  onDelete: (id: string) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onOpen: () => void;
  registerRef: (id: string, el: HTMLElement | null) => void;
}

export function TimelineBlock(props: Props) {
  const { block, onDelete, registerRef } = props;
  const meta = KIND_META[block.type];
  const IconC = meta.icon;
  const blockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerRef(block.id, blockRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  return (
    <div className="tl-row">
      <div className="tl-gutter">
        <span className="tl-time">{blockTime(block.ts)}</span>
        <span className="tl-node" />
      </div>
      <div className={"block block-" + block.type} data-testid="block" data-block-kind={block.type} ref={blockRef}>
        <div className="block-kind">
          <IconC className="kind-icon" size={13} />
          <span className="kind-label">{meta.label}</span>
          <div className="block-actions">
            <button className="mini-btn" data-testid="block-delete" title="Delete block" onClick={() => onDelete(block.id)}>
              <Icons.trash size={14} />
            </button>
          </div>
        </div>
        {block.type === "note" && <NoteBlock block={block} onChange={props.onChange} />}
        {block.type === "timer" && (
          <TimerBlock
            block={block}
            active={props.active}
            elapsedMs={props.elapsedMs}
            onStart={props.onStart}
            onPause={props.onPause}
            onResume={props.onResume}
            onFinish={props.onFinish}
            locked={props.locked}
            onChange={props.onChange}
          />
        )}
        {block.type === "doc" && <DocBlock block={block} onOpen={props.onOpen} />}
      </div>
    </div>
  );
}
