'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, MapPin, Package, Phone, Truck } from 'lucide-react'
import { acceptOrder, updateOrderStatus } from '@/app/actions/rep'
import { orderStatusLabel } from '@/lib/account'
import type { RepOrder } from '@/lib/dashboard'
import { cn } from '@/lib/utils'

const STATUS_FLOW: { value: 'onway' | 'delivered' | 'cancelled'; label: string }[] = [
  { value: 'onway', label: 'في الطريق' },
  { value: 'delivered', label: 'تم التوصيل' },
  { value: 'cancelled', label: 'إلغاء' },
]

const statusTone: Record<string, string> = {
  processing: 'bg-secondary text-secondary-foreground',
  onway: 'bg-primary/15 text-primary',
  delivered: 'bg-primary text-primary-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
}

export function RepDashboard({
  orders,
  repId,
  repName,
  branchName,
}: {
  orders: RepOrder[]
  repId: string
  repName: string
  branchName: string
}) {
  const [pending, setPending] = useState<number | null>(null)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const available = orders.filter((order) => !order.assignedRepId && order.status === 'processing')
  const mine = orders.filter((order) => order.assignedRepId === repId)

  function runAction(orderId: number, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    setPending(orderId)
    startTransition(async () => {
      const result = await fn()
      if (!result.ok) setError(result.error ?? 'تعذر تنفيذ العملية')
      setPending(null)
    })
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-background pb-16">
      <header className="bg-primary px-5 pb-6 pt-8 text-primary-foreground">
        <div className="flex items-center gap-2">
          <Truck className="size-5" aria-hidden="true" />
          <h1 className="text-lg font-extrabold">لوحة المندوب</h1>
        </div>
        <p className="mt-1 text-[13px] text-primary-foreground/80">
          {repName} — فرع {branchName}
        </p>
      </header>

      {error ? (
        <p className="mx-5 mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-[13px] font-bold text-destructive">
          {error}
        </p>
      ) : null}

      <section className="px-5 pt-6">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-foreground">
          <Package className="size-4 text-primary" aria-hidden="true" />
          طلبات متاحة للقبول
          <span className="text-[12px] font-bold text-muted-foreground">({available.length})</span>
        </h2>
        {available.length === 0 ? (
          <p className="rounded-xl bg-card px-4 py-6 text-center text-[13px] text-muted-foreground">
            لا توجد طلبات متاحة الآن
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {available.map((order) => (
              <OrderCard key={order.id} order={order} busy={pending === order.id}>
                <button
                  type="button"
                  disabled={pending === order.id}
                  onClick={() => runAction(order.id, () => acceptOrder(order.id))}
                  className="w-full rounded-xl bg-primary py-2.5 text-[13px] font-bold text-primary-foreground disabled:opacity-60"
                >
                  قبول الطلب
                </button>
              </OrderCard>
            ))}
          </ul>
        )}
      </section>

      <section className="px-5 pt-8">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-foreground">
          <Truck className="size-4 text-primary" aria-hidden="true" />
          طلباتي
          <span className="text-[12px] font-bold text-muted-foreground">({mine.length})</span>
        </h2>
        {mine.length === 0 ? (
          <p className="rounded-xl bg-card px-4 py-6 text-center text-[13px] text-muted-foreground">
            لم تقبل أي طلب بعد
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {mine.map((order) => (
              <OrderCard key={order.id} order={order} busy={pending === order.id}>
                {order.status === 'delivered' || order.status === 'cancelled' ? (
                  <p className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary py-2.5 text-[13px] font-bold text-secondary-foreground">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    {orderStatusLabel[order.status]}
                  </p>
                ) : (
                  <div className="flex gap-2">
                    {STATUS_FLOW.map((step) => (
                      <button
                        key={step.value}
                        type="button"
                        disabled={pending === order.id}
                        onClick={() =>
                          runAction(order.id, () => updateOrderStatus(order.id, step.value))
                        }
                        className={cn(
                          'flex-1 rounded-xl py-2.5 text-[12px] font-bold disabled:opacity-60',
                          step.value === 'cancelled'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-primary/10 text-primary',
                        )}
                      >
                        {step.label}
                      </button>
                    ))}
                  </div>
                )}
              </OrderCard>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function OrderCard({
  order,
  busy,
  children,
}: {
  order: RepOrder
  busy: boolean
  children: React.ReactNode
}) {
  return (
    <li
      className={cn(
        'rounded-2xl border border-border bg-card p-4 transition-opacity',
        busy && 'opacity-60',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[13px] font-bold text-foreground" dir="ltr">
          {order.reference}
        </span>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-bold',
            statusTone[order.status] ?? 'bg-secondary text-secondary-foreground',
          )}
        >
          {orderStatusLabel[order.status] ?? order.status}
        </span>
      </div>

      <div className="mt-3 flex items-start gap-2 text-[13px] text-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="leading-6">{order.addressText}</span>
      </div>

      {order.phone ? (
        <a
          href={`tel:${order.phone}`}
          dir="ltr"
          className="mt-2 flex items-center gap-2 text-[13px] font-bold text-primary"
        >
          <Phone className="size-4" aria-hidden="true" />
          {order.phone}
        </a>
      ) : null}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-[12px] text-muted-foreground">الإجمالي</span>
        <span className="text-[14px] font-extrabold text-foreground">
          {order.total.toLocaleString('ar-EG')} ج.م
        </span>
      </div>

      <div className="mt-3">{children}</div>
    </li>
  )
}
