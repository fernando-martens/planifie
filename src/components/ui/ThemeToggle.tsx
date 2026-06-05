import { Icons } from "./Icons";
import { useThemeStore } from "../../stores/themeStore";

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const dark = theme === "dark";
  return (
    <button
      className="icon-btn"
      data-testid="theme-toggle"
      data-theme-state={dark ? "dark" : "light"}
      title={dark ? "Switch to light" : "Switch to dark"}
      onClick={toggle}
      aria-label="Toggle theme"
    >
      {dark ? <Icons.sun /> : <Icons.moon />}
    </button>
  );
}
