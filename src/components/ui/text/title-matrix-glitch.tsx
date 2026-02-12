"use client";

import { useState, useEffect, useMemo } from "react";

const MATRIX_CHARS =
  "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * タイトルを表示しつつ、マトリックス雨のように一部の文字が不安定にランダムで切り替わる。
 * 全体としてはタイトルが読める表示。
 */
export function TitleMatrixGlitch({
  children: title,
  isDark,
  fontFamily,
  fontSize,
  className = "",
}: {
  children: string;
  isDark: boolean;
  fontFamily: string;
  fontSize: string;
  className?: string;
}) {
  const chars = useMemo(() => title.split(""), [title]);
  const [displayed, setDisplayed] = useState<string[]>(() => [...chars]);

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

  const green = isDark ? "#00ff41" : "#008c2a";

  return (
    <span
      className={className}
      style={{
        fontFamily,
        fontSize,
        fontWeight: 800,
        color: green,
        display: "inline-block",
        textAlign: "center",
        letterSpacing: "0.04em",
        WebkitTextStroke: `3px ${green}`,
        paintOrder: "stroke fill",
        filter: isDark
          ? "drop-shadow(0 0 12px rgba(0, 255, 65, 0.8)) drop-shadow(0 0 24px rgba(0, 255, 65, 0.4))"
          : "drop-shadow(0 0 12px rgba(0, 140, 42, 0.7)) drop-shadow(0 0 24px rgba(0, 140, 42, 0.35))",
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
