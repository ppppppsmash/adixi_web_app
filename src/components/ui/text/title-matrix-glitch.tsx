"use client";

import { useState, useEffect, useMemo } from "react";
import type { ThemeId } from "../../../lib/useDarkMode";

const MATRIX_CHARS =
  "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const THEME_COLORS: Record<ThemeId, { color: string; stroke: string; filter: string }> = {
  dark: {
    color: "#18ff62",
    stroke: "#18ff62",
    filter: "drop-shadow(0 0 12px rgba(24, 255, 98, 0.8)) drop-shadow(0 0 24px rgba(24, 255, 98, 0.4))",
  },
  virtualboy: {
    color: "#ff0040",
    stroke: "#dd0038",
    filter: "drop-shadow(0 0 12px rgba(255, 0, 64, 0.7)) drop-shadow(0 0 24px rgba(255, 0, 64, 0.35))",
  },
  lcdgreen: {
    color: "#9bbc0f",
    stroke: "#8bac0f",
    filter: "drop-shadow(0 0 12px rgba(155, 188, 15, 0.8)) drop-shadow(0 0 24px rgba(155, 188, 15, 0.4))",
  },
  gameboypocket: {
    color: "#ada59a",
    stroke: "#8b7355",
    filter: "drop-shadow(0 0 12px rgba(173, 165, 154, 0.8)) drop-shadow(0 0 24px rgba(173, 165, 154, 0.4))",
  },
};

/**
 * タイトルを表示しつつ、マトリックス雨のように一部の文字が不安定にランダムで切り替わる。
 * 全体としてはタイトルが読める表示。
 */
export function TitleMatrixGlitch({
  children: title,
  theme,
  fontFamily,
  fontSize,
  className = "",
}: {
  children: string;
  theme: ThemeId;
  fontFamily: string;
  fontSize: string;
  className?: string;
}) {
  const chars = useMemo(() => title.split(""), [title]);
  const [displayed, setDisplayed] = useState<string[]>(() => [...chars]);
  const { color, stroke, filter } = THEME_COLORS[theme];

  useEffect(() => {
    setDisplayed([...chars]);
  }, [chars]);

  useEffect(() => {
    const GLITCH_PROB = 0.04;
    const interval = setInterval(() => {
      setDisplayed(
        chars.map((c) =>
          Math.random() < GLITCH_PROB
            ? MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
            : c
        )
      );
    }, 180);
    return () => clearInterval(interval);
  }, [chars]);

  return (
    <span
      className={className}
      style={{
        fontFamily,
        fontSize,
        fontWeight: 200,
        color,
        display: "inline-block",
        textAlign: "center",
        letterSpacing: "0.04em",
        WebkitTextStroke: `0.5px ${stroke}`,
        paintOrder: "stroke fill",
        filter,
      }}
    >
      {displayed.map((c, i) => (
        <span key={i} style={{ display: "inline-block" }}>
          {c === " " ? "\u00A0" : c}
        </span>
      ))}
    </span>
  );
}
