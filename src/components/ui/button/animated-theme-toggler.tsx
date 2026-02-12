"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"
import { Switch } from "@headlessui/react"

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
  const containerRef = useRef<HTMLDivElement>(null)

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

  const handleChange = useCallback(
    async (checked: boolean) => {
      if (!containerRef.current) return

      await document.startViewTransition(() => {
        flushSync(() => {
          setIsDark(checked)
          document.documentElement.classList.toggle("dark", checked)
          localStorage.setItem("theme", checked ? "dark" : "light")
        })
      }).ready

      const { top, left, width, height } =
        containerRef.current.getBoundingClientRect()
      const x = left + width / 2
      const y = top + height / 2
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
    },
    [duration]
  )

  return (
    <div ref={containerRef} className={cn("inline-flex", className)}>
      <Switch
        checked={isDark}
        onChange={handleChange}
        className="group relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-none border border-[var(--color-border)] bg-[var(--color-stepper-inactive-bg)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#61dca3] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-elevated)] data-[checked]:border-[#61dca3] data-[checked]:bg-[#61dca3]/20"
      >
        <span className="sr-only">ダークモードを切り替え</span>
        <span
          className="pointer-events-none flex size-6 translate-x-0.5 items-center justify-center rounded-none bg-[var(--color-bg-elevated)] text-[var(--color-text)] shadow-sm ring-0 transition duration-200 group-data-[checked]:translate-x-[1.25rem]"
          aria-hidden
        >
          {isDark ? (
            <Moon className="size-3.5" />
          ) : (
            <Sun className="size-3.5 text-[#2b4539]" />
          )}
        </span>
      </Switch>
    </div>
  )
}
