'use client'

import Link from 'next/link'
import { Search, UserRound } from 'lucide-react'
import { AddressPicker } from '@/components/address-picker'
import { AppMenu } from '@/components/app-menu'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 bg-primary text-primary-foreground">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <Link href="/" aria-label="تسويقة الديب - الصفحة الرئيسية">
          <Logo size={40} tone="light" />
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/account"
            className="flex size-10 items-center justify-center rounded-2xl bg-primary-foreground/15 ring-1 ring-primary-foreground/25 transition-colors hover:bg-primary-foreground/25"
          >
            <UserRound className="size-5" aria-hidden="true" />
            <span className="sr-only">حسابي</span>
          </Link>
          <AppMenu />
        </div>
      </div>

      <AddressPicker />

      <div className="px-4 pt-3 pb-5">
        <form
          action="/search"
          className="flex items-center gap-2 rounded-2xl bg-card px-3.5 py-2.5 shadow-sm"
        >
          <Search className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="site-search" className="sr-only">
            ابحث عن منتجك
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder="ابحث في كل الأقسام والمنتجات..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </form>
      </div>
    </header>
  )
}
