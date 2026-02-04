import { useEffect, useState } from "react";

/**
 * html.dark の有無を購読し、現在がダークモードかどうかを返す。
 * AnimatedThemeToggler で class が切り替わると自動で更新される。
 */
export function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const update = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
