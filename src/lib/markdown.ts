/** A short, plain-text preview of a markdown document (first ~2 lines). */
export function docPreview(md: string): string {
  const lines = (md || "").split("\n");
  const out: string[] = [];
  for (const ln of lines) {
    const t = ln.replace(/^#{1,3}\s+/, "").replace(/[*`>]/g, "").trim();
    if (t) out.push(t);
    if (out.length >= 2) break;
  }
  return out.join(" · ");
}
