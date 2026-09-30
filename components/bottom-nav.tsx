'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Crown, Home, LayoutGrid, ShoppingCart, UserRound } from 'lucide-react'
import { useStore } from '@/components/store-provider'
import { cn } from '@/lib/utils'

const items = [
  { id: 'home', label: 'الرئيسية', icon: Home, href: '/' },
  { id: 'categories', label: 'الأقسام', icon: LayoutGrid, href: '/categories' },
  { id: 'cart', label: 'السلة', icon: ShoppingCart, href: '/cart' },
  { id: 'packages', label: 'الباقات', icon: Crown, href: '/packages' },
  { id: 'account', label: 'حسابي', icon: UserRound, href: '/account' },
]

export function BottomNav() {
  const pathname = usePathname()
  const { cartCount } = useStore()

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="sticky bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur"
    >
      <ul className="flex items-stretch justify-between px-2 py-2">
        {items.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const badge = item.id === 'cart' ? cartCount : 0
          return (
            <li key={item.id} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className="flex w-full flex-col items-center gap-1 rounded-xl py-1.5"
              >
                <span className="relative">
                  <item.icon
                    className={cn(
                      'size-[22px] transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground',
                    )}
                    aria-hidden="true"
                  />
                  {badge ? (
                    <span className="absolute -top-1.5 -end-2 flex min-w-[17px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-[17px] text-destructive-foreground">
                      {badge}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    'text-[11px] transition-colors',
                    isActive
                      ? 'font-extrabold text-primary'
                      : 'font-medium text-muted-foreground',
                  )}
                >
                  {item.label}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-0.5 w-6 rounded-full transition-colors',
                    isActive ? 'bg-primary' : 'bg-transparent',
                  )}
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
