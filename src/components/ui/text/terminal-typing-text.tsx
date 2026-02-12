"use client";

import { useEffect, useState } from "react";

export type TerminalTypingTextProps = {
  /** 表示するテキスト */
  text: string;
  /** 1文字あたりの表示間隔（ms） */
  charDelay?: number;
  /** タイピング開始までの遅延（ms） */
  startDelay?: number;
  /** タイピング完了後にカーソルを表示し続けるか */
  cursorAfterComplete?: boolean;
  /** カーソル点滅の間隔（ms） */
  cursorBlinkInterval?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * ターミナルでタイピングしているような1文字ずつ表示するエフェクト。
 */
export function TerminalTypingText({
  text,
  charDelay = 50,
  startDelay = 0,
  cursorAfterComplete = true,
  cursorBlinkInterval = 530,
  className = "",
  style = {},
}: TerminalTypingTextProps) {
  const [visibleLength, setVisibleLength] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  // テキストが変わったらリセットしてタイピング開始
  useEffect(() => {
    setVisibleLength(0);
    if (text.length === 0) return;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const startTimer = setTimeout(() => {
      let index = 0;
      intervalId = setInterval(() => {
        index += 1;
        setVisibleLength(index);
        if (index >= text.length && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, charDelay);
    }, startDelay);
    return () => {
      clearTimeout(startTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, charDelay, startDelay]);

  // カーソル点滅
  useEffect(() => {
    const id = setInterval(() => {
      setCursorVisible((v) => !v);
    }, cursorBlinkInterval);
    return () => clearInterval(id);
  }, [cursorBlinkInterval]);

  const visibleText = text.slice(0, visibleLength);
  const isTyping = visibleLength < text.length;
  const showCursor = isTyping || cursorAfterComplete;

  return (
    <span className={className} style={style}>
      {visibleText}
      {showCursor && (
        <span
          className="inline-block w-[0.5em] align-baseline"
          style={{ opacity: cursorVisible ? 1 : 0, transition: "opacity 0.05s" }}
          aria-hidden
        >
          |
        </span>
      )}
    </span>
  );
}
