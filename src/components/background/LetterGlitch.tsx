import { useRef, useEffect } from 'react';

const ADIXI_CHARS = ['A', 'D', 'i', 'X', 'i'];
const ADIXI_DISPLAY_DURATION_MS = 2000;   // 全ADiXi表示している時間
const ADIXI_TRANSITION_IN_MS = 4500;     // だんだんADiXiに並べる時間（グリッチは止めない）
const ADIXI_TRANSITION_OUT_MS = 4500;    // だんだん元に戻す時間（グリッチは止めない）
const ADIXI_LOOP_INTERVAL_MS = 10000;    // この間隔で「ADiXiへ」を開始

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const LetterGlitch = ({
  glitchColors = ['#2b4539', '#61dca3', '#61b3dc'],
  glitchSpeed = 50,
  centerVignette = false,
  outerVignette = true,
  smooth = true,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789',
  adixiLoopIntervalMs = ADIXI_LOOP_INTERVAL_MS
}: {
  glitchColors: string[];
  glitchSpeed: number;
  centerVignette: boolean;
  outerVignette: boolean;
  smooth: boolean;
  characters: string;
  adixiLoopIntervalMs?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const glitchColorsRef = useRef(glitchColors);
  glitchColorsRef.current = glitchColors;
  const letters = useRef<
    {
      char: string;
      color: string;
      targetColor: string;
      colorProgress: number;
    }[]
  >([]);
  const grid = useRef({ columns: 0, rows: 0 });
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const lastGlitchTime = useRef(Date.now());
  const lastAdixiLoopTime = useRef(Date.now());
  const adixiShowStartTime = useRef(0);
  const adixiTransitionInStart = useRef(0);   // 0 = 未使用
  const adixiTransitionOutStart = useRef(0);
  const adixiShuffledIndices = useRef<number[]>([]);
  const lastAdixiColorNudge = useRef(0);

  const lettersAndSymbols = Array.from(characters);

  const fontSize = 16;
  const charWidth = 10;
  const charHeight = 20;

  const getRandomChar = () => {
    return lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];
  };

  const getRandomColor = () => {
    const colors = glitchColorsRef.current;
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_m, r, g, b) => {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  };

  const interpolateColor = (
    start: { r: number; g: number; b: number },
    end: { r: number; g: number; b: number },
    factor: number
  ) => {
    const result = {
      r: Math.round(start.r + (end.r - start.r) * factor),
      g: Math.round(start.g + (end.g - start.g) * factor),
      b: Math.round(start.b + (end.b - start.b) * factor)
    };
    return `rgb(${result.r}, ${result.g}, ${result.b})`;
  };

  const calculateGrid = (width: number, height: number) => {
    const columns = Math.ceil(width / charWidth);
    const rows = Math.ceil(height / charHeight);
    return { columns, rows };
  };

  const initializeLetters = (columns: number, rows: number) => {
    grid.current = { columns, rows };
    const totalLetters = columns * rows;
    letters.current = Array.from({ length: totalLetters }, () => ({
      char: getRandomChar(),
      color: getRandomColor(),
      targetColor: getRandomColor(),
      colorProgress: 1
    }));
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    if (context.current) {
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const { columns, rows } = calculateGrid(rect.width, rect.height);
    initializeLetters(columns, rows);
    drawLetters();
  };

  const drawLetters = () => {
    if (!context.current || letters.current.length === 0) return;
    const ctx = context.current;
    const { width, height } = canvasRef.current!.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';

    letters.current.forEach((letter, index) => {
      const x = (index % grid.current.columns) * charWidth;
      const y = Math.floor(index / grid.current.columns) * charHeight;
      ctx.fillStyle = letter.color;
      ctx.fillText(letter.char, x, y);
    });
  };

  /** skipIndices に含まれるセルは更新しない（ADiXi固定用） */
  const updateLetters = (skipIndices?: Set<number>) => {
    if (!letters.current || letters.current.length === 0) return;

    const total = letters.current.length;
    const updateCount = Math.max(1, Math.floor(total * 0.05));
    let updated = 0;
    let attempts = 0;
    const maxAttempts = updateCount * 20;

    while (updated < updateCount && attempts < maxAttempts) {
      attempts++;
      const index = Math.floor(Math.random() * total);
      if (skipIndices?.has(index)) continue;
      if (!letters.current[index]) continue;

      letters.current[index].char = getRandomChar();
      letters.current[index].targetColor = getRandomColor();
      if (!smooth) {
        letters.current[index].color = letters.current[index].targetColor;
        letters.current[index].colorProgress = 1;
      } else {
        letters.current[index].colorProgress = 0;
      }
      updated++;
    }
  };

  const handleSmoothTransitions = () => {
    let needsRedraw = false;
    letters.current.forEach(letter => {
      if (letter.colorProgress < 1) {
        letter.colorProgress += 0.05;
        if (letter.colorProgress > 1) letter.colorProgress = 1;

        const startRgb = hexToRgb(letter.color);
        const endRgb = hexToRgb(letter.targetColor);
        if (startRgb && endRgb) {
          letter.color = interpolateColor(startRgb, endRgb, letter.colorProgress);
          needsRedraw = true;
        }
      }
    });

    if (needsRedraw) {
      drawLetters();
    }
  };

  const animate = () => {
    const now = Date.now();
    const useAdixiLoop = adixiLoopIntervalMs > 0;
    const total = letters.current.length;
    const shuffled = adixiShuffledIndices.current;

    let skipIndices: Set<number> | undefined;

    // 1) トランジションイン: だんだんADiXiに（グリッチは止めない・固定以外は更新し続ける）
    if (useAdixiLoop && adixiTransitionInStart.current > 0) {
      const elapsed = now - adixiTransitionInStart.current;
      const progress = Math.min(1, elapsed / ADIXI_TRANSITION_IN_MS);
      const fixedCount = Math.floor(progress * total);
      skipIndices = new Set(shuffled.slice(0, fixedCount));
      for (let i = 0; i < fixedCount && i < shuffled.length; i++) {
        const idx = shuffled[i];
        const l = letters.current[idx];
        if (l) {
          l.char = ADIXI_CHARS[idx % ADIXI_CHARS.length];
          l.targetColor = getRandomColor();
          if (!smooth) l.color = l.targetColor;
          else l.colorProgress = 0;
        }
      }
      if (progress >= 1) {
        adixiTransitionInStart.current = 0;
        adixiShowStartTime.current = now;
      }
    }
    // 2) 全ADiXi表示中（文字は固定・色だけだんだん変えて止まらないように）
    else if (useAdixiLoop && adixiShowStartTime.current > 0) {
      if (now - adixiShowStartTime.current >= ADIXI_DISPLAY_DURATION_MS) {
        adixiShowStartTime.current = 0;
        adixiTransitionOutStart.current = now;
        adixiShuffledIndices.current = shuffleArray(letters.current.map((_, i) => i));
      } else {
        skipIndices = new Set(letters.current.map((_, i) => i));
        letters.current.forEach((l, idx) => {
          l.char = ADIXI_CHARS[idx % ADIXI_CHARS.length];
        });
        if (now - lastAdixiColorNudge.current >= 400) {
          lastAdixiColorNudge.current = now;
          letters.current.forEach(l => {
            l.targetColor = getRandomColor();
            l.colorProgress = 0;
          });
        }
      }
    }
    // 3) トランジションアウト: だんだん元に戻す（グリッチは止めない）
    else if (useAdixiLoop && adixiTransitionOutStart.current > 0) {
      const elapsed = now - adixiTransitionOutStart.current;
      const progress = Math.min(1, elapsed / ADIXI_TRANSITION_OUT_MS);
      const stillFixedCount = Math.floor((1 - progress) * total);
      skipIndices = new Set(shuffled.slice(0, stillFixedCount));
      for (let i = 0; i < stillFixedCount && i < shuffled.length; i++) {
        const idx = shuffled[i];
        const l = letters.current[idx];
        if (l) {
          l.char = ADIXI_CHARS[idx % ADIXI_CHARS.length];
          l.targetColor = getRandomColor();
          if (!smooth) l.color = l.targetColor;
          else l.colorProgress = 0;
        }
      }
      if (progress >= 1) {
        adixiTransitionOutStart.current = 0;
        lastAdixiLoopTime.current = now;
      }
    }

    // 4) 10秒経過でトランジションイン開始
    if (useAdixiLoop && adixiTransitionInStart.current === 0 && adixiShowStartTime.current === 0 && adixiTransitionOutStart.current === 0) {
      if (now - lastAdixiLoopTime.current >= adixiLoopIntervalMs) {
        lastAdixiLoopTime.current = now;
        adixiTransitionInStart.current = now;
        adixiShuffledIndices.current = shuffleArray(letters.current.map((_, i) => i));
      }
    }

    // 5) 常にグリッチ更新（固定セル以外）＋色のスムーズ変化
    if (now - lastGlitchTime.current >= glitchSpeed) {
      updateLetters(skipIndices);
      lastGlitchTime.current = now;
    }
    if (smooth) {
      handleSmoothTransitions();
    }
    drawLetters();

    animationRef.current = requestAnimationFrame(animate);
  };

  /** テーマ変更時：全文字の色を即座に新しいパレットで塗り直す */
  useEffect(() => {
    glitchColorsRef.current = glitchColors;
    if (letters.current.length === 0) return;
    letters.current.forEach((l) => {
      l.color = getRandomColor();
      l.targetColor = getRandomColor();
      l.colorProgress = 1;
    });
  }, [glitchColors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    context.current = canvas.getContext('2d');
    resizeCanvas();
    animate();

    let resizeTimeout: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        cancelAnimationFrame(animationRef.current as number);
        resizeCanvas();
        animate();
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current!);
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glitchSpeed, smooth, adixiLoopIntervalMs]);

  return (
    <div
      className="fixed inset-0 w-full h-full overflow-hidden -z-10 bg-[var(--glitch-bg)]"
      aria-hidden
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      {outerVignette && (
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, transparent 60%, var(--glitch-outer-vignette) 100%)`,
          }}
        />
      )}
      {centerVignette && (
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, var(--glitch-center-vignette) 0%, transparent 60%)`,
          }}
        />
      )}
    </div>
  );
};

export default LetterGlitch;
