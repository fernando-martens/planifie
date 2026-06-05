export const pad2 = (n: number): string => String(n).padStart(2, "0");

export const isoDate = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** timestamp shown on a timeline block */
export function blockTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const hhmm = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  if (isoDate(d) === isoDate(now)) return hhmm;
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()} · ${hhmm}`;
}

export function clockOf(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${pad2(m)}m ${pad2(s)}s`;
  if (m > 0) return `${m}m ${pad2(s)}s`;
  return `${s}s`;
}

export function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
}

export function fmtCreated(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const yr = d.getFullYear() === now.getFullYear() ? "" : `, ${d.getFullYear()}`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}${yr}`;
}

export function tsToLocal(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export const localToTs = (str: string): number => new Date(str).getTime();

export const toInputDate = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

// ---- Claude-style relative grouping for the sidebar ----
function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function relativeGroup(ts: number, now = Date.now()): string {
  const dayMs = 86400000;
  const diff = Math.floor((startOfDay(now) - startOfDay(ts)) / dayMs);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff <= 7) return "Previous 7 days";
  if (diff <= 30) return "Previous 30 days";
  const d = new Date(ts);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export interface TaskGroup<T> {
  label: string;
  tasks: T[];
}

/** returns [{label, tasks[]}] ordered most-recent first */
export function groupTasks<T extends { created_at: number }>(tasks: T[]): TaskGroup<T>[] {
  const now = Date.now();
  const sorted = [...tasks].sort((a, b) => b.created_at - a.created_at);
  const groups: TaskGroup<T>[] = [];
  let cur: TaskGroup<T> | null = null;
  for (const t of sorted) {
    const label = relativeGroup(t.created_at, now);
    if (!cur || cur.label !== label) {
      cur = { label, tasks: [] };
      groups.push(cur);
    }
    cur.tasks.push(t);
  }
  return groups;
}
