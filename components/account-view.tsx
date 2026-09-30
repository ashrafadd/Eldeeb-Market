'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Banknote,
  Bell,
  ChevronLeft,
  Crown,
  FileText,
  Gift,
  Info,
  Landmark,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import type { ActiveSubscription } from '@/app/actions/subscriptions'
import { formatCycle, getPlan } from '@/lib/packages'
import {
  contactChannels,
  formatOrderDate,
  getPaymentMethod,
  nextTierFor,
  orderStatusLabel,
  pointsTiers,
  pointsValue,
  tierFor,
  type Order,
  type PaymentMethodId,
} from '@/lib/account'
import { formatEGP } from '@/lib/data'
import { authClient } from '@/lib/auth-client'
import { InstallAppButton } from '@/components/install-app-button'
import { cn } from '@/lib/utils'

type Tab = 'orders' | 'points' | 'contact' | 'more'

type PointEvent = { id: number; label: string; points: number; createdAt: string }
type Address = { id: number; city: string; village: string; details: string }

const tabs: { id: Tab; label: string }[] = [
  { id: 'orders', label: 'مشترياتي' },
  { id: 'points', label: 'نقاطي' },
  { id: 'contact', label: 'تواصل معنا' },
  { id: 'more', label: 'المزيد' },
]

const moreLinks = [
  { label: 'الباقات والاشتراكات', hint: 'قارن الباقات وفعّل اشتراكك', href: '/packages', icon: Crown },
  { label: 'الأقسام والمنتجات', hint: 'تصفح كل أقسام المتجر', href: '/categories', icon: Package },
  { label: 'الإشعارات', hint: 'عروض وتحديثات الطلبات', href: '/notifications', icon: Bell },
  { label: 'العناوين المحفوظة', hint: 'أضف أو عدّل عنوان التوصيل', href: '/', icon: MapPin },
  { label: 'شروط الاستخدام', hint: 'سياسة الطلب والتوصيل', href: '/account', icon: FileText },
  { label: 'سياسة الخصوصية', hint: 'كيف نحمي بياناتك', href: '/account', icon: ShieldCheck },
]

const paymentIcons = { Wallet, Landmark, Banknote } as const
const contactIcons = { Phone, MessageCircle, Mail, MapPin } as const

const statusStyles: Record<string, string> = {
  processing: 'bg-secondary text-secondary-foreground',
  onway: 'bg-accent/15 text-[oklch(0.5_0.14_68)]',
  delivered: 'bg-primary/10 text-primary',
  cancelled: 'bg-destructive/10 text-destructive',
}

export function AccountView({
  user,
  orders,
  points,
  pointHistory,
  addresses,
  subscription,
  balance,
}: {
  user: { name: string; phone: string }
  orders: Order[]
  points: number
  pointHistory: PointEvent[]
  addresses: Address[]
  subscription: ActiveSubscription | null
  balance: number
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('orders')

  const tier = tierFor(points)
  const next = nextTierFor(points)
  const redeemable = pointsValue(points)
  const spent = orders
    .filter((order) => order.status !== 'cancelled')
    .reduce((total, order) => total + order.total, 0)

  async function handleSignOut() {
    await authClient.signOut()
    router.refresh()
  }

  return (
    <>
      <header className="bg-primary px-4 pb-5 pt-6 text-primary-foreground">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/15 text-lg font-extrabold ring-1 ring-primary-foreground/25"
          >
            {user.name.trim().charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-extrabold">{user.name}</p>
            <p dir="ltr" className="truncate text-start text-[11px] text-primary-foreground/75">
              {user.phone}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-bold">
              <Sparkles className="size-3" aria-hidden="true" />
              {tier.name}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/25"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="sr-only">تسجيل الخروج</span>
          </button>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'طلب', value: orders.length.toLocaleString('ar-EG') },
            { label: 'نقطة', value: points.toLocaleString('ar-EG') },
            { label: 'إجمالي الشراء', value: formatEGP(spent) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-primary-foreground/12 px-2 py-2.5 text-center ring-1 ring-primary-foreground/20"
            >
              <dt className="text-[10px] text-primary-foreground/75">{stat.label}</dt>
              <dd className="pt-0.5 text-[13px] font-extrabold">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <Link
          href="/packages"
          className="mt-3 flex items-center gap-2.5 rounded-2xl bg-primary-foreground/12 px-3 py-2.5 ring-1 ring-primary-foreground/20"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Crown className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-extrabold">
              {subscription ? getPlan(subscription.planId).name : 'لا يوجد اشتراك نشط'}
            </span>
            <span className="block truncate text-[10px] text-primary-foreground/75">
              {subscription
                ? `اشتراك ${formatCycle(subscription.cycle)} · يتجدد ${formatOrderDate(subscription.renewsAt)}`
                : 'اشترك في باقة ووفّر في التوصيل والأسعار'}
            </span>
          </span>
          <ChevronLeft className="size-4 shrink-0 text-primary-foreground/70" aria-hidden="true" />
        </Link>

        <Link
          href="/wallet"
          className="mt-2 flex items-center gap-2.5 rounded-2xl bg-primary-foreground/12 px-3 py-2.5 ring-1 ring-primary-foreground/20"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Wallet className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-extrabold">
              {`رصيد المحفظة ${formatEGP(balance)}`}
            </span>
            <span className="block truncate text-[10px] text-primary-foreground/75">
              اشحن رصيدك بالتحويل أو ببطاقة تسويقة
            </span>
          </span>
          <ChevronLeft className="size-4 shrink-0 text-primary-foreground/70" aria-hidden="true" />
        </Link>
      </header>

      <div className="sticky top-0 z-20 flex gap-1 border-b border-border bg-card/95 px-3 py-2 backdrop-blur">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-pressed={tab === item.id}
            className={cn(
              'flex-1 rounded-xl py-2 text-[11px] font-bold transition-colors',
              tab === item.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'orders' ? (
        <section aria-label="مشترياتي السابقة" className="flex flex-col gap-2.5 px-4 py-4">
          {orders.length === 0 ? (
            <EmptyState
              title="لا توجد مشتريات بعد"
              body="ابدأ التسوق وستظهر كل طلباتك هنا مع تفاصيلها."
            />
          ) : (
            orders.map((order) => {
              const method = getPaymentMethod(order.paymentMethod as PaymentMethodId)
              const PaymentIcon =
                paymentIcons[method.icon as keyof typeof paymentIcons] ?? Wallet
              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-border bg-card p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p dir="ltr" className="text-start text-[13px] font-extrabold text-foreground">
                        {order.reference}
                      </p>
                      <p className="pt-0.5 text-[11px] text-muted-foreground">
                        {formatOrderDate(order.createdAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-extrabold',
                        statusStyles[order.status] ?? statusStyles.processing,
                      )}
                    >
                      {orderStatusLabel[order.status] ?? 'قيد التجهيز'}
                    </span>
                  </div>

                  <ul className="mt-2.5 flex flex-col gap-1 border-y border-border py-2.5">
                    {order.items.map((line) => (
                      <li
                        key={`${order.id}-${line.productId}`}
                        className="flex items-center justify-between gap-2 text-[11px]"
                      >
                        <Link
                          href={`/product/${line.productId}`}
                          className="line-clamp-1 font-bold text-foreground"
                        >
                          {line.title}
                        </Link>
                        <span className="shrink-0 text-muted-foreground">
                          {`${line.qty.toLocaleString('ar-EG')} × ${formatEGP(line.price)}`}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between gap-2 pt-2.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <PaymentIcon className="size-3.5" aria-hidden="true" />
                      {method.name}
                    </span>
                    <span className="text-[13px] font-extrabold text-primary">
                      {formatEGP(order.total)}
                    </span>
                  </div>

                  {order.pointsEarned > 0 ? (
                    <p className="mt-2 rounded-xl bg-secondary px-2.5 py-1.5 text-[10px] font-bold text-secondary-foreground">
                      {`ربحت ${order.pointsEarned.toLocaleString('ar-EG')} نقطة من هذا الطلب`}
                    </p>
                  ) : null}
                </article>
              )
            })
          )}
        </section>
      ) : null}

      {tab === 'points' ? (
        <section aria-label="نقاطي" className="flex flex-col gap-3 px-4 py-4">
          <div className="rounded-3xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/15">
                <Gift className="size-5 text-[oklch(0.5_0.14_68)]" aria-hidden="true" />
              </span>
              <div>
                <p className="text-2xl font-extrabold leading-none text-foreground">
                  {points.toLocaleString('ar-EG')}
                </p>
                <p className="pt-1 text-[11px] text-muted-foreground">
                  {`نقطة متاحة · تعادل ${formatEGP(redeemable)} خصم`}
                </p>
              </div>
            </div>

            {next ? (
              <div className="pt-4">
                <div className="flex items-baseline justify-between pb-1.5 text-[11px]">
                  <span className="font-bold text-foreground">{`المستوى القادم: ${next.name}`}</span>
                  <span className="text-muted-foreground">
                    {`${(next.min - points).toLocaleString('ar-EG')} نقطة متبقية`}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={Math.min(100, Math.round((points / next.min) * 100))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2 overflow-hidden rounded-full bg-secondary"
                >
                  <span
                    className="block h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (points / next.min) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="pt-3 text-[11px] font-bold text-primary">
                وصلت لأعلى مستوى في برنامج المكافآت
              </p>
            )}

            <button
              type="button"
              disabled={redeemable === 0}
              className="mt-4 w-full rounded-2xl bg-primary py-3 text-[13px] font-extrabold text-primary-foreground transition-transform active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground"
            >
              {redeemable > 0
                ? `استبدل ${formatEGP(redeemable)} في طلبك القادم`
                : 'اجمع 100 نقطة للاستبدال'}
            </button>
          </div>

          {pointHistory.length > 0 ? (
            <div className="rounded-2xl border border-border bg-card p-3.5">
              <h2 className="pb-2 text-[13px] font-extrabold text-foreground">سجل النقاط</h2>
              <ul className="flex flex-col gap-1.5">
                {pointHistory.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-secondary/40 px-2.5 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-bold text-foreground">
                        {event.label}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        {formatOrderDate(event.createdAt)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] font-extrabold text-primary">
                      {`+${event.points.toLocaleString('ar-EG')}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-card p-3.5">
            <h2 className="pb-2 text-[13px] font-extrabold text-foreground">مستويات العضوية</h2>
            <ul className="flex flex-col gap-2">
              {pointsTiers.map((item) => {
                const reached = points >= item.min
                return (
                  <li
                    key={item.id}
                    className={cn(
                      'flex items-start gap-2.5 rounded-xl px-2.5 py-2',
                      item.id === tier.id ? 'bg-primary/8 ring-1 ring-primary/25' : 'bg-secondary/40',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold',
                        reached
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {reached ? '✓' : item.min.toLocaleString('ar-EG')}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-bold text-foreground">
                        {item.name}
                      </span>
                      <span className="block text-[11px] leading-4 text-muted-foreground text-pretty">
                        {item.perk}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <p className="rounded-2xl bg-secondary/50 px-3.5 py-3 text-[11px] leading-5 text-muted-foreground text-pretty">
            تربح نقطة واحدة على كل 10 جنيهات من قيمة الطلب، وكل 100 نقطة تعادل 10 جنيهات خصم عند
            الاستبدال. النقاط لا تنتهي صلاحيتها.
          </p>
        </section>
      ) : null}

      {tab === 'contact' ? (
        <section aria-label="تواصل معنا" className="flex flex-col gap-2.5 px-4 py-4">
          {contactChannels.map((channel) => {
            const Icon = contactIcons[channel.icon as keyof typeof contactIcons] ?? Phone
            const content = (
              <>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="size-[18px] text-primary" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-extrabold text-foreground">
                    {channel.label}
                  </span>
                  <span className="block truncate text-[11px] font-medium text-foreground/80">
                    {channel.value}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">{channel.hint}</span>
                </span>
                {channel.href ? (
                  <ChevronLeft className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                ) : null}
              </>
            )

            return channel.href ? (
              <a
                key={channel.id}
                href={channel.href}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors active:bg-secondary/50"
              >
                {content}
              </a>
            ) : (
              <div
                key={channel.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                {content}
              </div>
            )
          })}

          <div className="rounded-2xl border border-border bg-card p-3.5">
            <h2 className="flex items-center gap-2 pb-2 text-[13px] font-extrabold text-foreground">
              <MapPin className="size-4 text-primary" aria-hidden="true" />
              عناويني المحفوظة
            </h2>
            {addresses.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">لم تحفظ أي عنوان بعد.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {addresses.map((address) => (
                  <li
                    key={address.id}
                    className="rounded-xl bg-secondary/40 px-2.5 py-2 text-[11px] leading-4"
                  >
                    <span className="block font-bold text-foreground">
                      {`${address.city} - ${address.village}`}
                    </span>
                    <span className="block text-muted-foreground text-pretty">
                      {address.details}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {tab === 'more' ? (
        <section aria-label="قوائم أخرى" className="flex flex-col gap-2.5 px-4 py-4">
          <div className="rounded-2xl border border-border bg-card p-3.5">
            <h2 className="pb-1 text-[13px] font-extrabold text-foreground">بياناتي</h2>
            <dl className="flex flex-col gap-1.5 pt-1.5">
              {[
                { label: 'الاسم', value: user.name },
                { label: 'رقم الموبايل', value: user.phone, ltr: true },
                {
                  label: 'المستوى',
                  value: `${tier.name} · ${points.toLocaleString('ar-EG')} نقطة`,
                },
                {
                  label: 'الاشتراك',
                  value: subscription
                    ? `${getPlan(subscription.planId).name} (${formatCycle(subscription.cycle)})`
                    : 'بدون اشتراك',
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-2 rounded-xl bg-secondary/40 px-2.5 py-2"
                >
                  <dt className="shrink-0 text-[11px] text-muted-foreground">{row.label}</dt>
                  <dd
                    dir={row.ltr ? 'ltr' : undefined}
                    className="min-w-0 truncate text-[11px] font-bold text-foreground"
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <InstallAppButton variant="card" />

          <ul className="flex flex-col gap-1.5">
            {moreLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors active:bg-secondary/50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                    <link.icon className="size-[18px] text-primary" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-extrabold text-foreground">
                      {link.label}
                    </span>
                    <span className="block truncate text-[10.5px] text-muted-foreground">
                      {link.hint}
                    </span>
                  </span>
                  <ChevronLeft
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-3.5">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-[11px] leading-5 text-muted-foreground text-pretty">
              تسويقة الديب — السوق في بيتك بضغطة زر. الإصدار 1.0. لأي استفسار تواصل معنا من تبويب
              «تواصل معنا».
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 rounded-2xl bg-secondary py-3 text-[12px] font-extrabold text-secondary-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
            تسجيل ال��روج
          </button>
        </section>
      ) : null}
    </>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
        <Package className="size-5 text-primary" aria-hidden="true" />
      </span>
      <p className="text-[13px] font-bold text-foreground">{title}</p>
      <p className="text-[11px] leading-4 text-muted-foreground text-pretty">{body}</p>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-primary px-4 py-2 text-[12px] font-extrabold text-primary-foreground"
      >
        ابدأ التسوق
      </Link>
    </div>
  )
}
