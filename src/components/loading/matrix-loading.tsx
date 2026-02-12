"use client";

import { useRef, useEffect } from "react";

/**
 * ローディング用マトリックス雨エフェクト（ManzDev/twitch-matrix-canvas を参考に実装）
 * https://github.com/ManzDev/twitch-matrix-canvas/
 */
export function MatrixLoading({ isDark = true }: { isDark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const TEXT_HEIGHT = 20;
    const LAYERS = 2;
    let width = canvas.width;
    let height = canvas.height;
    const columns: { y: number; letters: string[]; speed: number }[] = [];

    const greenBright = isDark ? "#00ff41" : "#008c2a";
    const greenDim = isDark ? "rgba(0, 255, 65, 0.15)" : "rgba(0, 140, 42, 0.2)";
    const greenMid = isDark ? "rgba(0, 255, 65, 0.5)" : "rgba(0, 140, 42, 0.5)";

    const generateCharacter = () => {
      const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト";
      return chars[Math.floor(Math.random() * chars.length)];
    };

    const getColor = (index: number, size: number, _x: number) => {
      const last = index === size - 1;
      const first = index === 0;
      const second = index === 1;
      const third = index === 2;
      if (last) return greenBright;
      if (first) return greenDim;
      if (second) return isDark ? "rgba(0, 255, 65, 0.25)" : "rgba(0, 140, 42, 0.3)";
      if (third) return isDark ? "rgba(0, 255, 65, 0.4)" : "rgba(0, 140, 42, 0.45)";
      return greenMid;
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
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
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
          ctx.shadowColor = isDark ? "#00ff41" : "#008c2a";
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
    window.addEventListener("resize", resize);
    rafId = requestAnimationFrame((t) => matrixIteration(t));

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block h-full w-full"
      style={{ background: "transparent" }}
      aria-hidden
    />
  );
}
