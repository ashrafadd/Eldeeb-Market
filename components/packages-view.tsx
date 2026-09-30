'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BadgeCheck,
  Check,
  Crown,
  Leaf,
  Medal,
  Minus,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react'
import {
  cancelSubscription,
  subscribeToPlan,
  type ActiveSubscription,
} from '@/app/actions/subscriptions'
import { formatEGP } from '@/lib/data'
import { deliveryLabel, formatCycle, getPlan, plans, type Plan } from '@/lib/packages'
import { cn } from '@/lib/utils'

const planIcons = { Leaf, Medal, Crown } as const

const accents: Record<
  Plan['id'],
  { chip: string; ring: string; iconBg: string; iconText: string; cta: string }
> = {
  basic: {
    chip: 'bg-primary/10 text-primary',
    ring: 'ring-border',
    iconBg: 'bg-primary/10',
    iconText: 'text-primary',
    cta: 'bg-secondary text-secondary-foreground',
  },
  silver: {
    chip: 'bg-secondary text-secondary-foreground',
    ring: 'ring-primary/40',
    iconBg: 'bg-muted',
    iconText: 'text-muted-foreground',
    cta: 'bg-primary text-primary-foreground',
  },
  gold: {
    chip: 'bg-accent/20 text-[oklch(0.45_0.13_66)]',
    ring: 'ring-accent/45',
    iconBg: 'bg-accent/15',
    iconText: 'text-[oklch(0.5_0.14_68)]',
    cta: 'bg-accent text-accent-foreground',
  },
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function PackagesView({
  isSignedIn,
  subscription,
}: {
  isSignedIn: boolean
  subscription: ActiveSubscription | null
}) {
  const router = useRouter()
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const current = subscription ? getPlan(subscription.planId) : null

  function handleSubscribe(plan: Plan) {
    setMessage(null)
    setPendingId(plan.id)
    startTransition(async () => {
      const result = await subscribeToPlan(plan.id, cycle)
      setPendingId(null)
      if (!result.ok) {
        setMessage(result.error)
        return
      }
      setMessage(`تم تفعيل ${plan.name} بنجاح`)
      router.refresh()
    })
  }

  function handleCancel() {
    setMessage(null)
    startTransition(async () => {
      const result = await cancelSubscription()
      if (!result.ok) {
        setMessage(result.error)
        return
      }
      setMessage('تم إلغاء الاشتراك، يمكنك الاشتراك مرة أخرى في أي وقت')
      router.refresh()
    })
  }

  return (
    <>
      <header className="bg-primary px-4 pb-6 pt-6 text-primary-foreground">
        <p className="text-[11px] font-bold text-primary-foreground/75">تسويقة الديب</p>
        <h1 className="pt-1 text-xl font-extrabold text-balance">باقات الاشتراك</h1>
        <p className="pt-1.5 text-[12px] leading-5 text-primary-foreground/85 text-pretty">
          اختر الباقة المناسبة لك ووفّر في التوصيل والأسعار على كل طلب.
        </p>

        <div className="mt-4 flex rounded-2xl bg-primary-foreground/12 p-1 ring-1 ring-primary-foreground/20">
          {(['monthly', 'yearly'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCycle(item)}
              aria-pressed={cycle === item}
              className={cn(
                'flex-1 rounded-xl py-2 text-[12px] font-extrabold transition-colors',
                cycle === item
                  ? 'bg-primary-foreground text-primary'
                  : 'text-primary-foreground/80',
              )}
            >
              {item === 'monthly' ? 'شهري' : 'سنوي · وفر شهرين'}
            </button>
          ))}
        </div>
      </header>

      {subscription && current ? (
        <section
          aria-label="اشتراكي الحالي"
          className="mx-4 -mt-3 rounded-3xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <BadgeCheck className="size-5 text-primary" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-extrabold text-foreground">{current.name}</p>
              <p className="pt-0.5 text-[11px] text-muted-foreground">
                {`اشتراك ${formatCycle(subscription.cycle)} · يتجدد ${formatDate(subscription.renewsAt)}`}
              </p>
            </div>
            <span className="shrink-0 text-[13px] font-extrabold text-primary">
              {subscription.price > 0 ? formatEGP(subscription.price) : 'مجانية'}
            </span>
          </div>
          {subscription.price > 0 ? (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="mt-3 w-full rounded-2xl bg-secondary py-2.5 text-[12px] font-extrabold text-secondary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              إلغاء الاشتراك
            </button>
          ) : null}
        </section>
      ) : null}

      {message ? (
        <p
          role="status"
          className="mx-4 mt-3 rounded-2xl bg-secondary px-3.5 py-2.5 text-[12px] font-bold text-secondary-foreground"
        >
          {message}
        </p>
      ) : null}

      {!isSignedIn ? (
        <p className="mx-4 mt-3 rounded-2xl border border-dashed border-border px-3.5 py-3 text-[11px] leading-5 text-muted-foreground text-pretty">
          {'للاشتراك في أي باقة يجب '}
          <Link href="/account" className="font-extrabold text-primary underline">
            تسجيل الدخول
          </Link>
          {' أولاً.'}
        </p>
      ) : null}

      <section aria-label="الباقات المتاحة" className="flex flex-col gap-3 px-4 py-4">
        {plans.map((plan) => {
          const Icon = planIcons[plan.icon]
          const accent = accents[plan.id]
          const isCurrent = subscription?.planId === plan.id
          const shownPrice =
            cycle === 'yearly' ? (plan.yearlyPrice ?? plan.price * 12) : plan.price

          return (
            <article
              key={plan.id}
              className={cn(
                'rounded-3xl border border-border bg-card p-4 ring-1',
                accent.ring,
                plan.recommended && !isCurrent ? 'shadow-md' : '',
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-2xl',
                    accent.iconBg,
                  )}
                >
                  <Icon className={cn('size-5', accent.iconText)} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="text-[14px] font-extrabold text-foreground">{plan.name}</h2>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[9px] font-extrabold',
                        accent.chip,
                      )}
                    >
                      {plan.highlight}
                    </span>
                  </div>
                  <p className="pt-0.5 text-[11px] text-muted-foreground text-pretty">
                    {plan.tagline}
                  </p>
                </div>
              </div>

              <p className="flex items-baseline gap-1.5 pt-3">
                <span className="text-2xl font-extrabold leading-none text-foreground">
                  {shownPrice > 0 ? formatEGP(shownPrice) : 'مجاناً'}
                </span>
                {shownPrice > 0 ? (
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {cycle === 'yearly' ? '/ سنوياً' : '/ شهرياً'}
                  </span>
                ) : null}
              </p>

              <ul className="flex flex-col gap-1 pt-3">
                <li className="flex items-center gap-2 rounded-xl bg-secondary/40 px-2.5 py-2 text-[11px] font-bold text-foreground">
                  <Truck className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  {deliveryLabel(plan)}
                </li>
                <li className="flex items-center gap-2 rounded-xl bg-secondary/40 px-2.5 py-2 text-[11px] font-bold text-foreground">
                  <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  {plan.discountPercent > 0
                    ? `خصم ${plan.discountPercent.toLocaleString('ar-EG')}% + نقاط ×${plan.pointsMultiplier.toLocaleString('ar-EG')}`
                    : `نقاط عادية ×${plan.pointsMultiplier.toLocaleString('ar-EG')}`}
                </li>
              </ul>

              <ul className="flex flex-col gap-1.5 pt-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[11.5px] leading-5">
                    <Check
                      className="mt-0.5 size-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="text-foreground text-pretty">{feature}</span>
                  </li>
                ))}
                {plan.missing?.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-[11.5px] leading-5 text-muted-foreground"
                  >
                    <Minus className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <span className="text-pretty line-through">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrent || isPending || !isSignedIn}
                className={cn(
                  'mt-4 w-full rounded-2xl py-3 text-[13px] font-extrabold transition-transform active:scale-[0.98]',
                  isCurrent
                    ? 'bg-secondary text-muted-foreground'
                    : accent.cta,
                  'disabled:active:scale-100',
                )}
              >
                {isCurrent
                  ? 'باقتك الحالية'
                  : pendingId === plan.id
                    ? 'جاري التفعيل...'
                    : shownPrice > 0
                      ? `اشترك بـ ${formatEGP(shownPrice)}`
                      : 'ابدأ مجاناً'}
              </button>
            </article>
          )
        })}
      </section>

      <section aria-label="مقارنة الباقات" className="px-4 pb-6">
        <h2 className="pb-2 text-[13px] font-extrabold text-foreground">مقارنة سريعة</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-secondary/50 text-secondary-foreground">
                <th scope="col" className="px-2.5 py-2 text-start font-extrabold">
                  الميزة
                </th>
                {plans.map((plan) => (
                  <th key={plan.id} scope="col" className="px-1 py-2 text-center font-extrabold">
                    {plan.name.replace('الباقة ', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  label: 'السعر الشهري',
                  value: (plan: Plan) => (plan.price > 0 ? formatEGP(plan.price) : 'مجاناً'),
                },
                {
                  label: 'خصم المنتجات',
                  value: (plan: Plan) =>
                    plan.discountPercent > 0
                      ? `${plan.discountPercent.toLocaleString('ar-EG')}%`
                      : null,
                },
                {
                  label: 'مضاعف النقاط',
                  value: (plan: Plan) => `×${plan.pointsMultiplier.toLocaleString('ar-EG')}`,
                },
                {
                  label: 'توصيل مجاني',
                  value: (plan: Plan) =>
                    plan.freeDeliveryOver === 0
                      ? 'دائماً'
                      : plan.freeDeliveryOver === null
                        ? null
                        : `فوق ${plan.freeDeliveryOver.toLocaleString('ar-EG')}`,
                },
                {
                  label: 'توصيل نفس اليوم',
                  value: (plan: Plan) => (plan.id === 'gold' ? 'متاح' : null),
                },
              ].map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <th scope="row" className="px-2.5 py-2 text-start font-bold text-foreground">
                    {row.label}
                  </th>
                  {plans.map((plan) => {
                    const value = row.value(plan)
                    return (
                      <td
                        key={plan.id}
                        className="px-1 py-2 text-center font-bold text-foreground"
                      >
                        {value ?? (
                          <>
                            <X
                              className="mx-auto size-3.5 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <span className="sr-only">غير متاح</span>
                          </>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="pt-3 text-[10.5px] leading-5 text-muted-foreground text-pretty">
          الاشتراك يتجدد تلقائياً ويمكن إلغاؤه في أي وقت من صفحة حسابي. الأسعار تشمل كل الضرائب،
          والخصومات تُطبّق على أسعار المنتجات مباشرة عند إتمام الطلب.
        </p>
      </section>
    </>
  )
}
