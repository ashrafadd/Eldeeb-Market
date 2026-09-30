'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  ChevronLeft,
  Crown,
  Heart,
  Home,
  LayoutGrid,
  LifeBuoy,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Package,
  Gift,
  ShieldCheck,
  ShoppingCart,
  Tags,
  UserRound,
  X,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { InstallAppButton } from '@/components/install-app-button'
import { useStore } from '@/components/store-provider'
import { authClient } from '@/lib/auth-client'
import { categories } from '@/lib/data'
import { cn } from '@/lib/utils'

type Item = {
  label: string
  href: string
  icon: typeof Home
  hint?: string
}

const mainItems: Item[] = [
  { label: 'الرئيسية', href: '/', icon: Home },
  { label: 'الأقسام', href: '/categories', icon: LayoutGrid },
  { label: 'الباقات والاشتراكات', href: '/packages', icon: Crown, hint: 'جديد' },
  { label: 'العروض والتخفيضات', href: '/categories?c=offers', icon: Tags },
  { label: 'سلة المشتريات', href: '/cart', icon: ShoppingCart },
]

const accountItems: Item[] = [
  { label: 'حسابي', href: '/account', icon: UserRound },
  { label: 'طلباتي', href: '/account?tab=orders', icon: Package },
  { label: 'نقاطي ومكافآتي', href: '/account?tab=points', icon: Gift },
  { label: 'المفضلة', href: '/account?tab=wishlist', icon: Heart },
  { label: 'عناويني', href: '/account?tab=contact', icon: MapPin },
  { label: 'الإشعارات', href: '/notifications', icon: Bell },
]

const supportItems: Item[] = [
  { label: 'تواصل معنا', href: '/account?tab=contact', icon: LifeBuoy },
  { label: 'سياسة الخصوصية والاستبدال', href: '/account?tab=policy', icon: ShieldCheck },
]

export function AppMenu() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { cartCount, isSignedIn } = useStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // تُغلق القائمة تلقائياً عند تغيير الصفحة
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open])

  async function handleSignOut() {
    setOpen(false)
    await authClient.signOut()
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="فتح القائمة"
        className="flex size-10 items-center justify-center rounded-2xl bg-primary-foreground/15 ring-1 ring-primary-foreground/25 transition-colors hover:bg-primary-foreground/25"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {open && mounted
        ? createPortal(
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="قائمة تسويقة الديب"
            className="absolute inset-y-0 right-0 flex w-[290px] max-w-[85vw] flex-col bg-card shadow-2xl animate-in slide-in-from-right duration-200"
          >
            <div className="flex items-center justify-between gap-2 bg-primary px-4 py-4 text-primary-foreground">
              <Logo size={40} tone="light" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/25"
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">إغلاق</span>
              </button>
            </div>

            <nav aria-label="قائمة التنقل" className="flex-1 overflow-y-auto px-3 py-3">
              <MenuGroup title="التسوق">
                <ul className="flex flex-col gap-0.5">
                  {mainItems.map((item) => (
                    <MenuLink
                      key={item.label}
                      item={item}
                      pathname={pathname}
                      badge={item.href === '/cart' ? cartCount : undefined}
                    />
                  ))}
                </ul>
              </MenuGroup>

              <MenuGroup title="أقسام سريعة">
                <ul className="flex flex-wrap gap-1.5 px-1 pb-1">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/department/${category.id}`}
                        className="block rounded-xl bg-secondary/60 px-2.5 py-1.5 text-[11px] font-bold text-secondary-foreground transition-colors active:bg-secondary"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </MenuGroup>

              <MenuGroup title="حسابي">
                <ul className="flex flex-col gap-0.5">
                  {accountItems.map((item) => (
                    <MenuLink key={item.label} item={item} pathname={pathname} />
                  ))}
                </ul>
              </MenuGroup>

              <MenuGroup title="المساعدة">
                <ul className="flex flex-col gap-0.5">
                  {supportItems.map((item) => (
                    <MenuLink key={item.label} item={item} pathname={pathname} />
                  ))}
                </ul>
              </MenuGroup>
            </nav>

            <div className="border-t border-border p-3">
              <InstallAppButton variant="menu" onDone={() => setOpen(false)} />
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary py-2.5 text-[12px] font-extrabold text-secondary-foreground"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  تسجيل الخروج
                </button>
              ) : (
                <Link
                  href="/account"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-[12px] font-extrabold text-primary-foreground"
                >
                  <LogIn className="size-4" aria-hidden="true" />
                  تسجيل الدخول
                </Link>
              )}
              <p className="pt-2 text-center text-[10px] text-muted-foreground">
                تسويقة الديب · السوق في بيتك بضغطة زر
              </p>
            </div>
          </div>
        </div>,
            document.body,
          )
        : null}
    </>
  )
}

function MenuGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pb-3">
      <h2 className="px-2 pb-1.5 text-[10px] font-extrabold tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}

function MenuLink({
  item,
  pathname,
  badge,
}: {
  item: Item
  pathname: string
  badge?: number
}) {
  const base = item.href.split('?')[0]
  const isActive = base === '/' ? pathname === '/' : pathname.startsWith(base)

  return (
    <li>
      <Link
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex items-center gap-2.5 rounded-2xl px-2.5 py-2.5 transition-colors',
          isActive ? 'bg-primary/10' : 'active:bg-secondary/60',
        )}
      >
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-xl',
            isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary/70 text-primary',
          )}
        >
          <item.icon className="size-4" aria-hidden="true" />
        </span>
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-[12.5px]',
            isActive ? 'font-extrabold text-primary' : 'font-bold text-foreground',
          )}
        >
          {item.label}
        </span>
        {badge ? (
          <span className="shrink-0 rounded-full bg-destructive px-1.5 text-[10px] font-extrabold leading-[17px] text-destructive-foreground">
            {badge.toLocaleString('ar-EG')}
          </span>
        ) : item.hint ? (
          <span className="shrink-0 rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] font-extrabold text-[oklch(0.45_0.13_66)]">
            {item.hint}
          </span>
        ) : (
          <ChevronLeft className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
      </Link>
    </li>
  )
}
