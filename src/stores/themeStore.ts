import { create } from "zustand";
import type { Theme } from "../types";

const LS_THEME = "planifie-theme";

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(LS_THEME);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme(),
  setTheme: (theme) => {
    set({ theme });
    try {
      localStorage.setItem(LS_THEME, theme);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute("data-theme", theme);
  },
  toggle: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
}));
