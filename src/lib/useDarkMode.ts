import { useEffect, useState } from "react";

export type ThemeId = "dark" | "virtualboy" | "lcdgreen" | "gameboypocket";

const THEME_ORDER: ThemeId[] = ["dark", "virtualboy", "lcdgreen", "gameboypocket"];

function getThemeFromDom(): ThemeId {
  const el = document.documentElement;
  if (el.classList.contains("virtual-boy")) return "virtualboy";
  if (el.classList.contains("lcd-green")) return "lcdgreen";
  if (el.classList.contains("game-boy-pocket")) return "gameboypocket";
  return "dark";
}

/**
 * 現在のテーマを返す。クリックで dark → virtualboy → lcdgreen → gameboypocket → dark の順で切り替わる。
 */
export function useTheme(): ThemeId {
  const [theme, setTheme] = useState<ThemeId>(getThemeFromDom);

  useEffect(() => {
    const update = () => setTheme(getThemeFromDom());
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}

export function getNextTheme(current: ThemeId): ThemeId {
  const i = THEME_ORDER.indexOf(current);
  return THEME_ORDER[(i + 1) % THEME_ORDER.length];
}

/**
 * html.dark の有無を購読し、現在がダーク（緑）モードかどうかを返す。
 */
export function useDarkMode(): boolean {
  const theme = useTheme();
  return theme === "dark";
}

export { THEME_ORDER };
