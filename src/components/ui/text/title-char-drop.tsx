"use client";

import { useMemo, useState, useEffect } from "react";

/** マトリックス矩阵エフェクト用の文字（数字・カタカナ等） */
const MATRIX_CHARS =
  "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * 最初はマトリックス風の文字が落ちてきて、あるタイミングでタイトルの文字に変わる。
 */
export function TitleCharDrop({
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
  const chars = title.split("");

  const matrixChars = useMemo(
    () =>
      chars.map(
        () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
      ),
    [title]
  );

  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowTitle(true), 1400);
    return () => clearTimeout(t);
  }, []);

  const green = isDark ? "#00ff41" : "#008c2a";

  return (
    <span
      className={`title-char-drop-wrap ${className}`}
      style={{
        fontFamily,
        fontSize,
        fontWeight: 700,
        color: green,
        display: "inline-block",
        textAlign: "center",
        filter: isDark
          ? "drop-shadow(0 0 6px rgba(0, 255, 65, 0.5))"
          : "drop-shadow(0 0 6px rgba(0, 140, 42, 0.4))",
      }}
    >
      {chars.map((char, i) => (
        <span
          key={i}
          className="title-char-drop-char"
          style={{
            display: "inline-block",
            animation: "title-char-drop 0.5s ease-out forwards",
            animationDelay: `${i * 70}ms`,
            opacity: 0,
          }}
        >
          {showTitle ? (char === " " ? "\u00A0" : char) : matrixChars[i]}
        </span>
      ))}
    </span>
  );
}
