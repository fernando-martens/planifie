import type { ColorToken } from "../types";

export const TAG_COLORS: Record<ColorToken, string> = {
  clay: "#C28E6E",
  slate: "#7E96B4",
  sage: "#8AA888",
  mauve: "#A98BA0",
  gold: "#C2A95F",
  rose: "#C58E92",
  ocean: "#6FA1A6",
};

export const TAG_COLOR_LIST: { key: ColorToken; hex: string }[] = (
  Object.entries(TAG_COLORS) as [ColorToken, string][]
).map(([key, hex]) => ({ key, hex }));

export const colorHex = (token: string): string =>
  (TAG_COLORS as Record<string, string>)[token] || token;
