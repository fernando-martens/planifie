import type { Block, DocContent } from "../../types";
import { Icons } from "../ui/Icons";
import { docPreview } from "../../lib/markdown";

interface Props {
  block: Block;
  onOpen: () => void;
}

export function DocBlock({ block, onOpen }: Props) {
  const c = block.content as DocContent;
  return (
    <div className="doc-collapsed" data-testid="doc-collapsed" onClick={onOpen}>
      <div className="doc-title">
        {c.title || "Untitled document"}
        <span className="doc-open-hint">
          <Icons.expand size={13} /> Open
        </span>
      </div>
      <div className="doc-preview">{docPreview(c.markdown) || "Empty document — click to write"}</div>
    </div>
  );
}
