"use client"

import { useCallback, useRef } from "react"
import { flushSync } from "react-dom"

import { cn } from "../../../lib/utils"
import { useTheme, getNextTheme, THEME_ORDER, type ThemeId } from "../../../lib/useDarkMode"

const THEME_CLASS: Record<ThemeId, string> = {
  dark: "dark",
  virtualboy: "virtual-boy",
  lcdgreen: "lcd-green",
  gameboypocket: "game-boy-pocket",
}

const THEME_LABEL: Record<ThemeId, string> = {
  dark: "ダーク（緑）",
  virtualboy: "Virtual Boy",
  lcdgreen: "液晶緑",
  gameboypocket: "Game Boy Pocket",
}

interface AnimatedThemeTogglerProps {
  className?: string
  duration?: number
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
}: AnimatedThemeTogglerProps) => {
  const theme = useTheme()
  const nextTheme = getNextTheme(theme)
  const containerRef = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback(async () => {
    if (!containerRef.current) return
    const next = nextTheme
    const root = document.documentElement

    await document.startViewTransition(() => {
      flushSync(() => {
        root.classList.remove("dark", "virtual-boy", "lcd-green", "game-boy-pocket")
        root.classList.add(THEME_CLASS[next])
        localStorage.setItem("theme", next)
      })
    }).ready

    const { top, left } = containerRef.current.getBoundingClientRect()
    const x = left + containerRef.current.offsetWidth / 2
    const y = top + containerRef.current.offsetHeight / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }, [nextTheme, duration])

  const nextLabel = THEME_LABEL[nextTheme]
  const themeIndex = THEME_ORDER.indexOf(theme)
  const themeNumber = themeIndex >= 0 ? themeIndex + 1 : 1

  return (
    <button
      ref={containerRef}
      type="button"
      onClick={handleClick}
      className={cn("hacker-toolbar-btn font-mono tabular-nums min-w-[2rem]", className)}
      title={`現在: ${THEME_LABEL[theme]}（次: ${nextLabel}）`}
      aria-label={`テーマを ${nextLabel} に切り替え（現在 ${themeNumber} / ${THEME_ORDER.length}）`}
    >
      <span aria-hidden>{themeNumber}</span>
    </button>
  )
}
