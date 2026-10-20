import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";
const themeKey = "climate-twin-theme";
const themeChanged = "climate-twin-theme-changed";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem(themeKey);
    // No automatic theme: without a saved explicit choice the app is light.
    const initial: Theme = saved === "dark" ? "dark" : "light";
    setTheme(initial);
    applyTheme(initial);

    const syncTheme = () => setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    window.addEventListener(themeChanged, syncTheme);
    return () => window.removeEventListener(themeChanged, syncTheme);
  }, []);

  const toggleTheme = () => {
    const next: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem(themeKey, next);
    window.dispatchEvent(new Event(themeChanged));
  };

  const dark = theme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="size-8 shrink-0 rounded-full sm:size-9"
      aria-label={dark ? "Attiva tema chiaro" : "Attiva tema nero"}
      title={dark ? "Tema chiaro" : "Tema nero"}
    >
      {dark ? <Sun aria-hidden="true" className="size-4 sm:size-[1.15rem]" /> : <Moon aria-hidden="true" className="size-4 sm:size-[1.15rem]" />}
    </Button>
  );
}