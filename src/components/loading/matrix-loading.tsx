"use client";

import { useRef, useEffect } from "react";
import type { ThemeId } from "../../lib/useDarkMode";

const THEME_MATRIX = {
  dark: { bright: "#00ff41", dim: "rgba(0, 255, 65, 0.15)", mid: "rgba(0, 255, 65, 0.5)", r2: "rgba(0, 255, 65, 0.25)", r3: "rgba(0, 255, 65, 0.4)" },
  virtualboy: { bright: "#ff0040", dim: "rgba(255, 0, 64, 0.2)", mid: "rgba(255, 0, 64, 0.5)", r2: "rgba(255, 0, 64, 0.3)", r3: "rgba(255, 0, 64, 0.45)" },
  lcdgreen: { bright: "#9bbc0f", dim: "rgba(155, 188, 15, 0.15)", mid: "rgba(155, 188, 15, 0.5)", r2: "rgba(155, 188, 15, 0.25)", r3: "rgba(155, 188, 15, 0.4)" },
  gameboypocket: { bright: "#ada59a", dim: "rgba(173, 165, 154, 0.15)", mid: "rgba(173, 165, 154, 0.5)", r2: "rgba(173, 165, 154, 0.25)", r3: "rgba(173, 165, 154, 0.4)" },
} as const;

/**
 * ローディング用マトリックス雨エフェクト（ManzDev/twitch-matrix-canvas を参考に実装）
 * https://github.com/ManzDev/twitch-matrix-canvas/
 * @param contained true のとき親要素のサイズを使用（枠内表示用）
 */
export function MatrixLoading({ theme = "dark", contained = false }: { theme?: ThemeId; contained?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = contained ? canvas.parentElement : null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const TEXT_HEIGHT = 20;
    const LAYERS = 2;
    let width = canvas.width;
    let height = canvas.height;
    const columns: { y: number; letters: string[]; speed: number }[] = [];

    const { bright, dim, mid, r2, r3 } = THEME_MATRIX[theme];

    const generateCharacter = () => {
      const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト";
      return chars[Math.floor(Math.random() * chars.length)];
    };

    const getColor = (index: number, size: number, _x: number) => {
      const last = index === size - 1;
      const first = index === 0;
      const second = index === 1;
      const third = index === 2;
      if (last) return bright;
      if (first) return dim;
      if (second) return r2;
      if (third) return r3;
      return mid;
    };

    const init = () => {
      columns.length = 0;
      const totalColumns = Math.floor(width / TEXT_HEIGHT) + 1;
      for (let i = 0; i < totalColumns * LAYERS; i++) {
        const size = Math.floor(Math.random() * 12) + 15;
        const letters = Array.from({ length: size }, () => generateCharacter());
        const initialY = -1000 + -1 * Math.floor(Math.random() * 500);
        const fastRandomSpeed = ~~(Math.random() * 20);
        const speed = fastRandomSpeed === 0 ? 40 : 10 + Math.random() * 20;
        columns.push({ y: initialY, letters, speed });
      }
    };

    const resize = () => {
      if (contained && container) {
        const rect = container.getBoundingClientRect();
        width = canvas.width = rect.width;
        height = canvas.height = rect.height;
      } else {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      init();
    };

    let rafId: number;
    let lastTime = 0;
    const intervalMs = 50;

    const matrixIteration = (time: number) => {
      const delta = lastTime ? time - lastTime : intervalMs;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);
      ctx.font = `18pt "JetBrains Mono", "M PLUS 1 Code", Consolas, Monaco, monospace`;

      const step = Math.min(delta / intervalMs, 3);

      columns.forEach((data, x) => {
        data.letters.forEach((letter, index, array) => {
          const isHead = index === array.length - 1;
          ctx.fillStyle = getColor(index, array.length, x);
          ctx.shadowColor = bright;
          ctx.shadowBlur = isHead ? 12 : 6;
          const char = isHead ? generateCharacter() : Math.random() < 0.04 ? generateCharacter() : letter;
          ctx.fillText(char, x * (TEXT_HEIGHT / LAYERS), 50 + data.y + index * TEXT_HEIGHT);
        });
        ctx.shadowBlur = 0;

        data.y += data.speed * step;
        if (data.y > height) {
          data.y = -500;
          data.letters = Array.from({ length: data.letters.length }, () => generateCharacter());
        }
      });

      rafId = requestAnimationFrame(matrixIteration);
    };

    resize();
    const ro = contained && container ? new ResizeObserver(resize) : null;
    if (ro && container) ro.observe(container);
    window.addEventListener("resize", resize);
    rafId = requestAnimationFrame((t) => matrixIteration(t));

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, [theme, contained]);

  const canvas = (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block h-full w-full"
      style={{ background: "transparent" }}
      aria-hidden
    />
  );

  if (contained) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        {canvas}
      </div>
    );
  }
  return canvas;
}
