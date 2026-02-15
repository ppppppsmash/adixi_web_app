"use client";

import { useState, useEffect, useMemo } from "react";
import type { ThemeId } from "../../../lib/useDarkMode";

/** サンプル風：ASCIIアート用の記号・文字（グリッチ時に切り替わる） */
const ASCII_GLITCH_CHARS = "@#$%&*!.:-=+0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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

/** ADiXi SURVEY ASCIIアート（バッククォートはエスケープ必須） */
const TITLE_ASCII_ART = [
  "=========================================================================================================",
  "",
  " .d888888  888888ba  oo dP    dP oo       .d88888b  dP     dP  888888ba  dP     dP  88888888b dP    dP ",
  "d8'    88  88    `8b    Y8.  .8P          88.    \"' 88     88 88    `8b 88     88  88        Y8.  .8P ",
  "88aaaaa88a 88     88 dP  Y8aa8P  dP       `Y88888b. 88     88  88aaaa8P' 88    .8P  a88aaaa     Y8aa8P  ",
  "88     88  88     88 88 d8'  `8b 88             `8b 88     88  88   `8b. 88    d8'  88           88    ",
  "88     88  88    .8P 88 88    88 88       d8'   .8P Y8.   .8P  88     88 88  .d8P   88           88    ",
  "88     88  8888888P  dP dP    dP dP        Y88888P  `Y88888P'  dP     dP 888888'    88888888P    dP    ",
  "",
  "=========================================================================================================",
].join("\n");

/**
 * サンプル風：記号・文字で構成されたASCIIアートタイトル。
 * 各文字がランダムにグリッチして別の記号に変わる。
 */
export function TitleAsciiGlitch({
  theme,
  fontFamily: _fontFamily,
  fontSize,
  className = "",
}: {
  theme: ThemeId;
  fontFamily: string;
  fontSize: string;
  className?: string;
}) {
  const lines = useMemo(() => TITLE_ASCII_ART.split("\n"), []);
  const charsPerLine = useMemo(
    () => lines.map((line) => Array.from(line)),
    [lines]
  );
  const [displayed, setDisplayed] = useState<string[][]>(() =>
    charsPerLine.map((row) => [...row])
  );
  const { color, textShadow } = THEME_COLORS[theme];

  useEffect(() => {
    setDisplayed(charsPerLine.map((row) => [...row]));
  }, [charsPerLine]);

  useEffect(() => {
    const GLITCH_PROB = 0.04;
    const interval = setInterval(() => {
      setDisplayed(
        charsPerLine.map((row) =>
          row.map((c) =>
            c === " " || c === "\n"
              ? c
              : Math.random() < GLITCH_PROB
                ? ASCII_GLITCH_CHARS[Math.floor(Math.random() * ASCII_GLITCH_CHARS.length)]
                : c
          )
        )
      );
    }, 180);
    return () => clearInterval(interval);
  }, [charsPerLine]);

  return (
    <pre
      className={`title-ascii-glitch ${className}`.trim()}
      style={{
        fontFamily: "'JetBrains Mono', 'Consolas', 'Monaco', monospace",
        fontSize,
        fontWeight: 400,
        color,
        textShadow,
        display: "block",
        textAlign: "center",
        letterSpacing: 0,
        lineHeight: 1.25,
        margin: 0,
        whiteSpace: "pre",
        overflow: "visible",
      }}
    >
      {displayed.map((row, rowIdx) => (
        <span key={rowIdx} style={{ display: "block" }}>
          {row.map((c) => (c === " " ? "\u00A0" : c)).join("")}
        </span>
      ))}
    </pre>
  );
}
