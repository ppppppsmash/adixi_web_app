"use client";

import { useRef, useEffect, useCallback, useState } from "react";

/** マトリックス「コードの雨」用の文字 */
const MATRIX_CHARS =
  "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const FILL_DURATION_MS = 3200;

/**
 * タイトル: 輪郭 → 雨が落ちる → タイトルが徐々に浮かび上がる。
 * サイズは非表示の計測用ノードで取得し、表示はキャンバスのみにする。
 */
export function TitleCodeRain({
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const [size, setSize] = useState({ width: 400, height: 80 });

  // 計測用ノードでタイトルサイズを取得（画面外で計測）。フォント読み込み後も再計測
  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const updateSize = () => {
      const r = el.getBoundingClientRect();
      if (r.width >= 20 && r.height >= 8) {
        setSize({ width: r.width, height: r.height });
      }
    };

    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    updateSize();

    document.fonts?.ready?.then(updateSize);

    return () => ro.disconnect();
  }, [title, fontFamily, fontSize]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width: rectWidth, height: rectHeight } = size;
    const dpr = window.devicePixelRatio ?? 1;
    const w = Math.round(rectWidth * dpr);
    const h = Math.round(rectHeight * dpr);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${rectWidth}px`;
      canvas.style.height = `${rectHeight}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (startTimeRef.current == null) startTimeRef.current = Date.now();
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const fillAlpha = Math.min(0.52, (elapsed / (FILL_DURATION_MS / 1000)) * 0.52);

    const titleSizePx = Math.max(20, Math.min(64, rectHeight * 0.8));
    const rainFontSizePx = Math.max(6, Math.min(10, titleSizePx * 0.2));
    const rainFont = `${rainFontSizePx}px ${fontFamily}`;
    const titleFont = `700 ${titleSizePx}px ${fontFamily}`;

    const cols = Math.max(12, Math.floor(rectWidth / 6));
    const charHeight = Math.max(6, Math.floor(rainFontSizePx * 1.1));

    const canvasState = canvas as unknown as { _matrixOffsets?: number[] };
    if (!canvasState._matrixOffsets || canvasState._matrixOffsets.length !== cols) {
      canvasState._matrixOffsets = Array.from({ length: cols }, () => Math.random() * h);
    }
    const offsets = canvasState._matrixOffsets;

    const green = isDark ? "#00ff41" : "#008c2a";
    const dim = isDark ? "rgba(0, 255, 65, 0.35)" : "rgba(0, 140, 42, 0.4)";

    ctx.clearRect(0, 0, w, h);
    ctx.font = rainFont;
    ctx.textBaseline = "top";

    for (let c = 0; c < cols; c++) {
      const x = (c / cols) * rectWidth * dpr;
      offsets[c] = (offsets[c] + 0.18 * charHeight) % (h + charHeight * 2);
      const baseY = offsets[c] - charHeight * 2;
      for (let i = 0; i < 45; i++) {
        const y = baseY + i * charHeight;
        if (y < -charHeight || y > h + charHeight) continue;
        const ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        const isHead = i === 0;
        ctx.fillStyle = isHead ? green : dim;
        ctx.globalAlpha = isHead ? 1 : 0.65 - (i / 45) * 0.5;
        ctx.fillText(ch, x, y);
      }
    }
    ctx.globalAlpha = 1;

    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = "black";
    ctx.font = titleFont;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";
    const centerX = (rectWidth * dpr) / 2;
    const centerY = (rectHeight * dpr) / 2;
    ctx.fillText(title, centerX, centerY);
    ctx.globalCompositeOperation = "source-over";
    ctx.textAlign = "start";

    ctx.strokeStyle = green;
    ctx.lineWidth = Math.max(2, 2.5 * dpr);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeText(title, centerX, centerY);

    if (fillAlpha > 0.01) {
      ctx.fillStyle = green;
      ctx.globalAlpha = fillAlpha;
      ctx.fillText(title, centerX, centerY);
      ctx.globalAlpha = 1;
    }
  }, [title, isDark, fontFamily, size]);

  useEffect(() => {
    let rafId: number;
    const loop = () => {
      animate();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [animate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) (canvas as unknown as { _matrixOffsets?: number[] })._matrixOffsets = undefined;
  }, [fontSize, fontFamily]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        width: size.width,
        height: size.height,
        minWidth: size.width,
        minHeight: size.height,
      }}
    >
      {/* 計測用：画面外に配置してサイズだけ取得。表示されない */}
      <div
        ref={measureRef}
        style={{
          position: "fixed",
          left: -9999,
          top: 0,
          fontFamily,
          fontSize,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
        aria-hidden
      >
        {title}
      </div>
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: size.width,
          height: size.height,
        }}
        aria-hidden
      />
      <span className="sr-only">{title}</span>
    </div>
  );
}
