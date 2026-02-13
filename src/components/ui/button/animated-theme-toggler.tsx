"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"

import { cn } from "../../../lib/utils"

interface AnimatedThemeTogglerProps {
  className?: string
  duration?: number
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
}: AnimatedThemeTogglerProps) => {
  const [isDark, setIsDark] = useState(false)
  const containerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"))
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const handleClick = useCallback(async () => {
    const nextDark = !isDark
    if (!containerRef.current) return

    await document.startViewTransition(() => {
      flushSync(() => {
        setIsDark(nextDark)
        document.documentElement.classList.toggle("dark", nextDark)
        localStorage.setItem("theme", nextDark ? "dark" : "light")
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
  }, [isDark, duration])

  return (
    <button
      ref={containerRef}
      type="button"
      onClick={handleClick}
      className={cn("hacker-toolbar-btn", className)}
      title={isDark ? "ライトモードへ" : "ダークモードへ"}
      aria-label={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
    </button>
  )
}
