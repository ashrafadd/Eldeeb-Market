'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  AlertTriangle,
  Boxes,
  History,
  PackagePlus,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  Warehouse,
} from 'lucide-react'
import { recordPurchase, setStockLevel } from '@/app/actions/inventory'
import { BranchSwitcher } from '@/components/dashboard/branch-switcher'
import { cn } from '@/lib/utils'

type StockRow = {
  productId: string
  title: string
  image: string
  unit: string
  stock: number
}

type Movement = {
  id: string
  productId: string
  delta: number
  reason: string
  note: string
  createdAt: string
}

type Summary = { total: number; lowCount: number; outCount: number }

const reasonLabel: Record<string, string> = {
  purchase: 'شراء',
  adjustment: 'تعديل',
}

export function StockManager({
  mode,
  branchId,
  branchName,
  branches,
  rows,
  movements,
  summary,
  threshold,
  staffName,
}: {
  mode: 'purchasing' | 'inventory'
  branchId: string
  branchName: string
  branches: { id: string; name: string }[]
  rows: StockRow[]
  movements: Movement[]
  summary: Summary
  threshold: number
  staffName: string
}) {
  const [query, setQuery] = useState('')
  const [showLog, setShowLog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  // المحرّر النشط: "productId:action"
  const [active, setActive] = useState<string | null>(null)
  const [amount, setAmount] = useState('')

  const titleOf = useMemo(() => {
    const map = new Map(rows.map((row) => [row.productId, row.title]))
    return (id: string) => map.get(id) ?? id
  }, [rows])

  const alerts = useMemo(
    () =>
      rows
        .filter((row) => row.stock <= threshold)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 40),
    [rows, threshold],
  )

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    return rows.filter((row) => row.title.includes(q)).slice(0, 40)
  }, [rows, query])

  function submit(row: StockRow, action: 'purchase' | 'adjust') {
    setError(null)
    const value = Math.floor(Number(amount))
    if (!Number.isFinite(value) || (action === 'purchase' ? value < 1 : value < 0)) {
      setError(action === 'purchase' ? 'أدخل كمية أكبر من صفر' : 'أدخل كمية صحيحة')
      return
    }
    startTransition(async () => {
      const result =
        action === 'purchase'
          ? await recordPurchase(branchId, row.productId, value)
          : await setStockLevel(branchId, row.productId, value)
      if (!result.ok) {
        setError(result.error ?? 'تعذر تنفيذ العملية')
        return
      }
      setActive(null)
      setAmount('')
    })
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-background pb-16">
      <header className="bg-primary px-5 pb-6 pt-8 text-primary-foreground">
        <div className="flex items-center gap-2">
          {mode === 'purchasing' ? (
            <Warehouse className="size-5" aria-hidden="true" />
          ) : (
            <Boxes className="size-5" aria-hidden="true" />
          )}
          <h1 className="text-lg font-extrabold">
            {mode === 'purchasing' ? 'المشتريات والمخزون' : 'إدارة المخزون'}
          </h1>
        </div>
        <p className="mt-1 text-[13px] text-primary-foreground/80">
          {staffName} — {branchName}
        </p>
        <BranchSwitcher branches={branches} current={branchId} />
      </header>

      {/* ملخّص الحالة */}
      <section className="grid grid-cols-3 gap-2 px-5 pt-5" aria-label="ملخّص المخزون">
        <StatCard label="أصناف" value={summary.total} tone="neutral" icon={Boxes} />
        <StatCard label="قربت تنفد" value={summary.lowCount} tone="warn" icon={AlertTriangle} />
        <StatCard label="نافدة" value={summary.outCount} tone="danger" icon={TriangleAlert} />
      </section>

      {error ? (
        <p className="mx-5 mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-[13px] font-bold text-destructive">
          {error}
        </p>
      ) : null}

      {/* البحث لضبط/شراء أي صنف */}
      <section className="px-5 pt-6">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            inputMode="search"
            placeholder="ابحث عن صنف لضبط كميته…"
            className="w-full rounded-xl border border-border bg-card py-2.5 ps-9 pe-3 text-[13px] outline-none focus:border-primary"
          />
        </label>

        {query.trim() ? (
          <ul className="mt-3 flex flex-col gap-2">
            {results.length === 0 ? (
              <li className="rounded-xl bg-card px-4 py-5 text-center text-[13px] text-muted-foreground">
                لا نتائج مطابقة
              </li>
            ) : (
              results.map((row) => (
                <ProductRow
                  key={row.productId}
                  row={row}
                  threshold={threshold}
                  active={active}
                  amount={amount}
                  pending={pending}
                  onOpen={(action) => {
                    setError(null)
                    setActive(`${row.productId}:${action}`)
                    setAmount(action === 'adjust' ? String(row.stock) : '')
                  }}
                  onCancel={() => setActive(null)}
                  onAmount={setAmount}
                  onSubmit={submit}
                />
              ))
            )}
          </ul>
        ) : null}
      </section>

      {/* تنبيهات النفاد */}
      <section className="px-5 pt-7">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-foreground">
          <AlertTriangle className="size-4 text-primary" aria-hidden="true" />
          أصناف تحتاج توريد
          <span className="text-[12px] font-bold text-muted-foreground">({alerts.length})</span>
        </h2>
        {alerts.length === 0 ? (
          <p className="rounded-xl bg-card px-4 py-6 text-center text-[13px] text-muted-foreground">
            كل الأصناف ضمن الحد الآمن
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {alerts.map((row) => (
              <ProductRow
                key={row.productId}
                row={row}
                threshold={threshold}
                active={active}
                amount={amount}
                pending={pending}
                onOpen={(action) => {
                  setError(null)
                  setActive(`${row.productId}:${action}`)
                  setAmount(action === 'adjust' ? String(row.stock) : '')
                }}
                onCancel={() => setActive(null)}
                onAmount={setAmount}
                onSubmit={submit}
              />
            ))}
          </ul>
        )}
      </section>

      {/* سجل الحركات */}
      <section className="px-5 pt-7">
        <button
          type="button"
          onClick={() => setShowLog((value) => !value)}
          className="flex w-full items-center justify-between rounded-xl bg-card px-4 py-3 text-[14px] font-extrabold text-foreground"
        >
          <span className="flex items-center gap-2">
            <History className="size-4 text-primary" aria-hidden="true" />
            آخر الحركات
          </span>
          <span className="text-[12px] font-bold text-muted-foreground">
            {showLog ? 'إخفاء' : `عرض (${movements.length})`}
          </span>
        </button>
        {showLog ? (
          movements.length === 0 ? (
            <p className="mt-2 rounded-xl bg-card px-4 py-5 text-center text-[13px] text-muted-foreground">
              لا حركات مسجّلة بعد
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {movements.map((movement) => (
                <li
                  key={movement.id}
                  className="flex items-center justify-between rounded-xl bg-card px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-foreground">
                      {titleOf(movement.productId)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {reasonLabel[movement.reason] ?? movement.reason} ·{' '}
                      {new Date(movement.createdAt).toLocaleDateString('ar-EG', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-[12px] font-extrabold',
                      movement.delta >= 0
                        ? 'bg-primary/12 text-primary'
                        : 'bg-destructive/10 text-destructive',
                    )}
                    dir="ltr"
                  >
                    {movement.delta >= 0 ? '+' : ''}
                    {movement.delta.toLocaleString('ar-EG')}
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>
    </main>
  )
}

function StatCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string
  value: number
  tone: 'neutral' | 'warn' | 'danger'
  icon: typeof Boxes
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-destructive'
      : tone === 'warn'
        ? 'text-primary'
        : 'text-foreground'
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <Icon className={cn('mx-auto size-4', toneClass)} aria-hidden="true" />
      <p className={cn('mt-1 text-lg font-extrabold', toneClass)}>
        {value.toLocaleString('ar-EG')}
      </p>
      <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
    </div>
  )
}

function ProductRow({
  row,
  threshold,
  active,
  amount,
  pending,
  onOpen,
  onCancel,
  onAmount,
  onSubmit,
}: {
  row: StockRow
  threshold: number
  active: string | null
  amount: string
  pending: boolean
  onOpen: (action: 'purchase' | 'adjust') => void
  onCancel: () => void
  onAmount: (value: string) => void
  onSubmit: (row: StockRow, action: 'purchase' | 'adjust') => void
}) {
  const out = row.stock <= 0
  const low = !out && row.stock <= threshold
  const purchaseOpen = active === `${row.productId}:purchase`
  const adjustOpen = active === `${row.productId}:adjust`
  const openAction = purchaseOpen ? 'purchase' : adjustOpen ? 'adjust' : null

  return (
    <li className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={row.image || '/placeholder.svg'}
          alt=""
          className="size-11 shrink-0 rounded-xl object-cover"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-foreground">{row.title}</p>
          <p className="text-[11px] text-muted-foreground">{row.unit}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-[12px] font-extrabold',
            out
              ? 'bg-destructive/10 text-destructive'
              : low
                ? 'bg-primary/12 text-primary'
                : 'bg-secondary text-secondary-foreground',
          )}
        >
          {out ? 'نافد' : row.stock.toLocaleString('ar-EG')}
        </span>
      </div>

      {openAction ? (
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <input
            autoFocus
            value={amount}
            onChange={(event) => onAmount(event.target.value)}
            inputMode="numeric"
            placeholder={openAction === 'purchase' ? 'الكمية المضافة' : 'الكمية الصحيحة'}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => onSubmit(row, openAction)}
            className="shrink-0 rounded-xl bg-primary px-4 py-2 text-[12px] font-bold text-primary-foreground disabled:opacity-60"
          >
            حفظ
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="shrink-0 rounded-xl bg-secondary px-3 py-2 text-[12px] font-bold text-secondary-foreground disabled:opacity-60"
          >
            إلغاء
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => onOpen('purchase')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2 text-[12px] font-bold text-primary"
          >
            <PackagePlus className="size-3.5" aria-hidden="true" />
            توريد
          </button>
          <button
            type="button"
            onClick={() => onOpen('adjust')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary py-2 text-[12px] font-bold text-secondary-foreground"
          >
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            ضبط
          </button>
        </div>
      )}
    </li>
  )
}
