import type { CSSProperties, ReactNode } from "react";

interface IcProps {
  d?: string;
  fill?: boolean;
  size?: number;
  sw?: number;
  children?: ReactNode;
  vb?: string;
  style?: CSSProperties;
  className?: string;
}

export function Ic({ d, fill, size = 16, sw = 1.6, children, vb = "0 0 24 24", style, className }: IcProps) {
  return (
    <svg
      viewBox={vb}
      width={size}
      height={size}
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      {children || <path d={d} />}
    </svg>
  );
}

type P = Omit<IcProps, "children" | "d">;

export const Icons = {
  sun: (p: P) => <Ic {...p}><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" /></Ic>,
  moon: (p: P) => <Ic {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></Ic>,
  chevL: (p: P) => <Ic {...p} sw={1.8}><path d="M14.5 5.5 8 12l6.5 6.5" /></Ic>,
  chevR: (p: P) => <Ic {...p} sw={1.8}><path d="M9.5 5.5 16 12l-6.5 6.5" /></Ic>,
  plus: (p: P) => <Ic {...p} sw={1.8}><path d="M12 5.5v13M5.5 12h13" /></Ic>,
  note: (p: P) => <Ic {...p}><path d="M5.5 4.5h13v15h-13z" /><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" /></Ic>,
  timer: (p: P) => <Ic {...p}><circle cx="12" cy="13" r="7.5" /><path d="M12 13V9M9.5 2.5h5" /></Ic>,
  doc: (p: P) => <Ic {...p}><path d="M7 3.5h7l4 4v13H7z" /><path d="M13.5 3.5V8H18" /></Ic>,
  play: (p: P) => <Ic {...p} fill><path d="M7 4.5v15l13-7.5z" /></Ic>,
  pause: (p: P) => <Ic {...p} fill><path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z" /></Ic>,
  stop: (p: P) => <Ic {...p} fill><rect x="5.5" y="5.5" width="13" height="13" rx="2.5" /></Ic>,
  share: (p: P) => <Ic {...p}><path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" /><path d="M5.5 12.5v6a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-6" /></Ic>,
  trash: (p: P) => <Ic {...p}><path d="M5 6.5h14M9 6.5V4.5h6v2M7 6.5l.8 13a1 1 0 0 0 1 .9h6.4a1 1 0 0 0 1-.9l.8-13" /></Ic>,
  edit: (p: P) => <Ic {...p}><path d="M14.5 5.5l4 4M4.5 19.5l1-4 9.5-9.5 3 3-9.5 9.5z" /></Ic>,
  collapse: (p: P) => <Ic {...p}><path d="M8 14.5 12 18.5 16 14.5M8 9.5 12 5.5 16 9.5" /></Ic>,
  expand: (p: P) => <Ic {...p}><path d="M14 4.5h5.5V10M10 19.5H4.5V14M19.5 4.5 13.5 10.5M4.5 19.5 10.5 13.5" /></Ic>,
  x: (p: P) => <Ic {...p} sw={1.8}><path d="M6 6l12 12M18 6 6 18" /></Ic>,
  check: (p: P) => <Ic {...p} sw={2}><path d="M5 12.5 10 17.5 19 7" /></Ic>,
  layers: (p: P) => <Ic {...p}><path d="M12 3.5 21 8l-9 4.5L3 8z" /><path d="M3 12.5l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5" /></Ic>,
  search: (p: P) => <Ic {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></Ic>,
  tag: (p: P) => <Ic {...p}><path d="M4.5 4.5h7l8 8-7 7-8-8z" /><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" /></Ic>,
  more: (p: P) => <Ic {...p} fill><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></Ic>,
  compose: (p: P) => <Ic {...p}><path d="M4.5 19.5h15M14 5l4 4M5 16.5l1-4 9-9 3 3-9 9z" /></Ic>,
  clock: (p: P) => <Ic {...p}><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></Ic>,
};
