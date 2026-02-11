import React, { useEffect, useRef } from 'react';

function parseHex(s: string): [number, number, number] {
  const m = s.replace(/^#/, '').match(/.{2}/g);
  if (m && m.length >= 3) return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)];
  return [0, 0, 0];
}
function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
}
function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = a.startsWith('#') ? parseHex(a) : [0, 0, 0];
  const [r2, g2, b2] = b.startsWith('#') ? parseHex(b) : [0, 0, 0];
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

interface FuzzyTextProps {
  children: React.ReactNode;
  fontSize?: number | string;
  fontWeight?: string | number;
  fontFamily?: string;
  color?: string;
  enableHover?: boolean;
  baseIntensity?: number;
  hoverIntensity?: number;
  fuzzRange?: number;
  fps?: number;
  direction?: 'horizontal' | 'vertical' | 'both';
  transitionDuration?: number;
  clickEffect?: boolean;
  glitchMode?: boolean;
  glitchInterval?: number;
  glitchDuration?: number;
  gradient?: string[] | null;
  /** グラデーションを流す速度。0 で静止、0.5 で約2秒で1周など */
  gradientSpeed?: number;
  letterSpacing?: number;
  /** 文字の境界線（ストローク）色。指定時は strokeWidth も必要 */
  strokeColor?: string | null;
  /** 境界線の太さ（px）。0 または未指定でストロークなし */
  strokeWidth?: number;
  className?: string;
}

const FuzzyText: React.FC<FuzzyTextProps> = ({
  children,
  fontSize = 'clamp(2rem, 8vw, 8rem)',
  fontWeight = 900,
  fontFamily = 'inherit',
  color = '#fff',
  enableHover = true,
  baseIntensity = 0.18,
  hoverIntensity = 0.5,
  fuzzRange = 30,
  fps = 60,
  direction = 'horizontal',
  transitionDuration = 0,
  clickEffect = false,
  glitchMode = false,
  glitchInterval = 2000,
  glitchDuration = 200,
  gradient = null,
  gradientSpeed = 0,
  letterSpacing = 0,
  strokeColor = null,
  strokeWidth = 0,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement & { cleanupFuzzyText?: () => void }>(null);

  useEffect(() => {
    let animationFrameId: number;
    let isCancelled = false;
    let glitchTimeoutId: ReturnType<typeof setTimeout>;
    let glitchEndTimeoutId: ReturnType<typeof setTimeout>;
    let clickTimeoutId: ReturnType<typeof setTimeout>;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const init = async () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const computedFontFamily =
        fontFamily === 'inherit' ? window.getComputedStyle(canvas).fontFamily || 'sans-serif' : fontFamily;

      const fontSizeStr = typeof fontSize === 'number' ? `${fontSize}px` : fontSize;
      const fontString = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;

      try {
        await document.fonts.load(fontString);
      } catch {
        await document.fonts.ready;
      }
      if (isCancelled) return;

      let numericFontSize: number;
      if (typeof fontSize === 'number') {
        numericFontSize = fontSize;
      } else {
        const temp = document.createElement('span');
        temp.style.fontSize = fontSize;
        document.body.appendChild(temp);
        const computedSize = window.getComputedStyle(temp).fontSize;
        numericFontSize = parseFloat(computedSize);
        document.body.removeChild(temp);
      }

      const text = React.Children.toArray(children).join('');

      const offscreen = document.createElement('canvas');
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = 'alphabetic';

      let totalWidth = 0;
      if (letterSpacing !== 0) {
        for (const char of text) {
          totalWidth += offCtx.measureText(char).width + letterSpacing;
        }
        totalWidth -= letterSpacing;
      } else {
        totalWidth = offCtx.measureText(text).width;
      }

      const metrics = offCtx.measureText(text);
      const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
      const actualRight = letterSpacing !== 0 ? totalWidth : (metrics.actualBoundingBoxRight ?? metrics.width);
      const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize;
      const actualDescent = metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2;

      const textBoundingWidth = Math.ceil(letterSpacing !== 0 ? totalWidth : actualLeft + actualRight);
      const tightHeight = Math.ceil(actualAscent + actualDescent);

      const hasStroke = strokeWidth > 0 && strokeColor;
      const extraWidthBuffer = 4;
      const effectiveStrokeWidth = hasStroke
        ? Math.max(1, strokeWidth * (numericFontSize / 32))
        : 0;
      const strokePadding = hasStroke ? Math.ceil(effectiveStrokeWidth * 3) : 0;
      const offscreenWidth = textBoundingWidth + extraWidthBuffer + strokePadding;
      const offscreenHeight = tightHeight + strokePadding;

      offscreen.width = offscreenWidth;
      offscreen.height = offscreenHeight;

      const xOffset = extraWidthBuffer / 2 + (hasStroke ? effectiveStrokeWidth : 0);
      const yOffset = actualAscent + (hasStroke ? effectiveStrokeWidth : 0);
      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = 'alphabetic';

      const drawText = (fillOrStroke: 'fill' | 'stroke') => {
        if (letterSpacing !== 0) {
          let xPos = xOffset - actualLeft;
          for (const char of text) {
            if (fillOrStroke === 'stroke') offCtx.strokeText(char, xPos, yOffset);
            else offCtx.fillText(char, xPos, yOffset);
            xPos += offCtx.measureText(char).width + letterSpacing;
          }
        } else {
          if (fillOrStroke === 'stroke') offCtx.strokeText(text, xOffset - actualLeft, yOffset);
          else offCtx.fillText(text, xOffset - actualLeft, yOffset);
        }
      };

      const drawOffscreen = (phase: number) => {
        offCtx.clearRect(0, 0, offscreenWidth, offscreenHeight);
        if (hasStroke) {
          offCtx.strokeStyle = strokeColor;
          offCtx.lineWidth = effectiveStrokeWidth;
          offCtx.lineJoin = 'round';
          offCtx.lineCap = 'round';
          drawText('stroke');
        }
        if (gradient && Array.isArray(gradient) && gradient.length >= 2) {
          const n = gradient.length;
          const grad = offCtx.createLinearGradient(0, 0, offscreenWidth, 0);
          const shift = phase * n;
          const base = Math.floor(shift) % n;
          const t = shift % 1;
          for (let i = 0; i < n; i++) {
            const c0 = gradient[(i + base) % n];
            const c1 = gradient[(i + base + 1) % n];
            const color = t < 1e-6 ? c0 : lerpColor(c0, c1, t);
            grad.addColorStop(i / (n - 1), color);
          }
          offCtx.fillStyle = grad;
          drawText('fill');
        } else {
          offCtx.fillStyle = color;
          drawText('fill');
        }
      };

      drawOffscreen(0);

      const horizontalMargin = Math.ceil(fuzzRange * 0.6);
      const verticalMargin = direction === 'vertical' || direction === 'both' ? Math.ceil(fuzzRange * 0.3) : 0;
      canvas.width = offscreenWidth + horizontalMargin * 2;
      canvas.height = offscreenHeight + verticalMargin * 2;
      ctx.translate(horizontalMargin, verticalMargin);

      const interactiveLeft = horizontalMargin + xOffset - actualLeft;
      const interactiveTop = verticalMargin;
      const interactiveRight = interactiveLeft + textBoundingWidth;
      const interactiveBottom = interactiveTop + tightHeight;

      let isHovering = false;
      let isClicking = false;
      let isGlitching = false;
      let currentIntensity = baseIntensity;
      let targetIntensity = baseIntensity;
      let lastFrameTime = 0;
      const frameDuration = 1000 / fps;

      const startGlitchLoop = () => {
        if (!glitchMode || isCancelled) return;
        glitchTimeoutId = setTimeout(() => {
          if (isCancelled) return;
          isGlitching = true;
          glitchEndTimeoutId = setTimeout(() => {
            isGlitching = false;
            startGlitchLoop();
          }, glitchDuration);
        }, glitchInterval);
      };

      if (glitchMode) startGlitchLoop();

      const run = (timestamp: number) => {
        if (isCancelled) return;

        if (timestamp - lastFrameTime < frameDuration) {
          animationFrameId = window.requestAnimationFrame(run);
          return;
        }
        lastFrameTime = timestamp;

        if (gradientSpeed > 0 && gradient && gradient.length >= 2) {
          const phase = ((timestamp / 1000) * gradientSpeed) % 1;
          drawOffscreen(phase);
        }

        ctx.clearRect(
          -horizontalMargin,
          -verticalMargin,
          offscreenWidth + horizontalMargin * 2,
          offscreenHeight + verticalMargin * 2
        );

        if (isClicking) {
          targetIntensity = 1;
        } else if (isGlitching) {
          targetIntensity = 1;
        } else if (isHovering) {
          targetIntensity = hoverIntensity;
        } else {
          targetIntensity = baseIntensity;
        }

        if (transitionDuration > 0) {
          const step = 1 / (transitionDuration / frameDuration);
          if (currentIntensity < targetIntensity) {
            currentIntensity = Math.min(currentIntensity + step, targetIntensity);
          } else if (currentIntensity > targetIntensity) {
            currentIntensity = Math.max(currentIntensity - step, targetIntensity);
          }
        } else {
          currentIntensity = targetIntensity;
        }

        for (let j = 0; j < offscreenHeight; j++) {
          let dx = 0,
            dy = 0;
          if (direction === 'horizontal' || direction === 'both') {
            dx = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange);
          }
          if (direction === 'vertical' || direction === 'both') {
            dy = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange * 0.5);
          }
          ctx.drawImage(offscreen, 0, j, offscreenWidth, 1, dx, j + dy, offscreenWidth, 1);
        }
        animationFrameId = window.requestAnimationFrame(run);
      };

      animationFrameId = window.requestAnimationFrame(run);

      const isInsideTextArea = (x: number, y: number) =>
        x >= interactiveLeft && x <= interactiveRight && y >= interactiveTop && y <= interactiveBottom;

      const handleMouseMove = (e: MouseEvent) => {
        if (!enableHover) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      const handleMouseLeave = () => {
        isHovering = false;
      };

      const handleClick = () => {
        if (!clickEffect) return;
        isClicking = true;
        clearTimeout(clickTimeoutId);
        clickTimeoutId = setTimeout(() => {
          isClicking = false;
        }, 150);
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!enableHover) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      const handleTouchEnd = () => {
        isHovering = false;
      };

      if (enableHover) {
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);
      }

      if (clickEffect) {
        canvas.addEventListener('click', handleClick);
      }

      const cleanup = () => {
        window.cancelAnimationFrame(animationFrameId);
        clearTimeout(glitchTimeoutId);
        clearTimeout(glitchEndTimeoutId);
        clearTimeout(clickTimeoutId);
        if (enableHover) {
          canvas.removeEventListener('mousemove', handleMouseMove);
          canvas.removeEventListener('mouseleave', handleMouseLeave);
          canvas.removeEventListener('touchmove', handleTouchMove);
          canvas.removeEventListener('touchend', handleTouchEnd);
        }
        if (clickEffect) {
          canvas.removeEventListener('click', handleClick);
        }
      };

      canvas.cleanupFuzzyText = cleanup;
    };

    init();

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(animationFrameId);
      clearTimeout(glitchTimeoutId);
      clearTimeout(glitchEndTimeoutId);
      clearTimeout(clickTimeoutId);
      if (canvas && canvas.cleanupFuzzyText) {
        canvas.cleanupFuzzyText();
      }
    };
  }, [
    children,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    enableHover,
    baseIntensity,
    hoverIntensity,
    fuzzRange,
    fps,
    direction,
    transitionDuration,
    clickEffect,
    glitchMode,
    glitchInterval,
    glitchDuration,
    gradient,
    gradientSpeed,
    letterSpacing,
    strokeColor,
    strokeWidth
  ]);

  return <canvas ref={canvasRef} className={className} />;
};

export default FuzzyText;
