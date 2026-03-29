"use client";

import { useMemo } from "react";
import type { ThemeId } from "../../../lib/useDarkMode";

/** サンプル準拠：控えめな明るさ（#12db50 = やや暗めの緑 + 弱いシャドウ） */
const THEME_COLORS: Record<ThemeId, { color: string; textShadow: string }> = {
  dark: {
    color: "#12db50",
    textShadow: "0 0 2px rgba(10, 255, 10, 0.6)",
  },
  virtualboy: {
    color: "#dd0038",
    textShadow: "0 0 2px rgba(255, 10, 10, 0.6)",
  },
  lcdgreen: {
    color: "#8bac0f",
    textShadow: "0 0 2px rgba(139, 255, 10, 0.6)",
  },
  gameboypocket: {
    color: "#8b7355",
    textShadow: "0 0 2px rgba(173, 165, 154, 0.6)",
  },
};

/** ADiXi SURVEY ASCIIアート（ブロック+ボックスドローイング） */
const TITLE_ASCII_ART = [
  " █████╗ ██████╗ ██╗██╗  ██╗██╗    ███████╗██╗   ██╗██████╗ ██╗   ██╗███████╗██╗   ██╗",
  "██╔══██╗██╔══██╗██║╚██╗██╔╝██║    ██╔════╝██║   ██║██╔══██╗██║   ██║██╔════╝╚██╗ ██╔╝",
  "███████║██║  ██║██║ ╚███╔╝ ██║    ███████╗██║   ██║██████╔╝██║   ██║█████╗   ╚████╔╝ ",
  "██╔══██║██║  ██║██║ ██╔██╗ ██║    ╚════██║██║   ██║██╔══██╗╚██╗ ██╔╝██╔══╝    ╚██╔╝  ",
  "██║  ██║██████╔╝██║██╔╝ ██╗██║    ███████║╚██████╔╝██║  ██║ ╚████╔╝ ███████╗   ██║   ",
  "╚═╝  ╚═╝╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝    ╚══════╝ ╚═════╝ ╚═╝  ╚═╝  ╚═══╝ ╚══════╝   ╚═╝   ",
].join("\n");

/**
 * 静的ASCIIアートタイトル（グリッチなし）
 */
export function TitleAsciiGlitch({
  theme,
  fontFamily,
  fontSize,
  className = "",
}: {
  theme: ThemeId;
  fontFamily: string;
  fontSize: string;
  className?: string;
}) {
  const lines = useMemo(() => TITLE_ASCII_ART.split("\n"), []);
  const { color, textShadow } = THEME_COLORS[theme];

  return (
    <pre
      className={`title-ascii-glitch ${className}`.trim()}
      style={{
        fontFamily: fontFamily,
        fontSize,
        fontWeight: 400,
        color,
        textShadow,
        display: "block",
        textAlign: "center",
        letterSpacing: 0,
        lineHeight: 1.15,
        margin: 0,
        whiteSpace: "pre",
        overflow: "visible",
      }}
    >
      {lines.map((line, rowIdx) => (
        <span key={rowIdx} style={{ display: "block" }}>
          {line.split("").map((c) => (c === " " ? "\u00A0" : c)).join("")}
        </span>
      ))}
    </pre>
  );
}
