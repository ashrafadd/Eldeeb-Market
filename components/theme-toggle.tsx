'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-pressed={isDark}
      className="flex size-10 items-center justify-center rounded-2xl bg-primary-foreground/15 ring-1 ring-primary-foreground/25 transition-colors hover:bg-primary-foreground/25"
    >
      {isDark ? (
        <Sun className="size-5" aria-hidden="true" />
      ) : (
        <Moon className="size-5" aria-hidden="true" />
      )}
      <span className="sr-only">
        {isDark ? 'تشغيل الوضع النهاري' : 'تشغيل الوضع الليلي'}
      </span>
    </button>
  )
}
