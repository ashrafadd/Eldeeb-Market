'use client'

import { useState, useTransition } from 'react'
import {
  Banknote,
  Calculator,
  HandCoins,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { addExpense, settleCustody } from '@/app/actions/accounting'
import { BranchSwitcher } from '@/components/dashboard/branch-switcher'
import { formatEGP } from '@/lib/data'
import { cn } from '@/lib/utils'

type Accounting = {
  deliveredRevenue: number
  deliveredCount: number
  openOrdersValue: number
  openOrdersCount: number
  expensesTotal: number
  netProfit: number
}

type RepCustody = {
  repId: string
  repName: string
  collected: number
  settled: number
  outstanding: number
  ordersCount: number
}

type ExpenseRow = {
  id: string
  category: string
  amount: number
  note: string
  createdAt: string
}

type SettlementRow = {
  id: string
  repId: string
  repName: string
  amount: number
  note: string
  createdAt: string
}

export function AccountingDashboard({
  branchId,
  branchName,
  branches,
  staffName,
  accounting,
  custody,
  expenses,
  settlements,
}: {
  branchId: string
  branchName: string
  branches: { id: string; name: string }[]
  staffName: string
  accounting: Accounting
  custody: RepCustody[]
  expenses: ExpenseRow[]
  settlements: SettlementRow[]
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // نموذج المصروف
  const [category, setCategory] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [note, setNote] = useState('')

  // تسوية العهدة النشطة
  const [activeRep, setActiveRep] = useState<string | null>(null)
  const [settleAmount, setSettleAmount] = useState('')

  function submitExpense() {
    setError(null)
    const value = Number(expenseAmount)
    if (!category.trim()) return setError('أدخل بند المصروف')
    if (!Number.isFinite(value) || value <= 0) return setError('أدخل مبلغاً صحيحاً')
    startTransition(async () => {
      const result = await addExpense(branchId, category, value, note)
      if (!result.ok) return setError(result.error ?? 'تعذر حفظ المصروف')
      setCategory('')
      setExpenseAmount('')
      setNote('')
    })
  }

  function submitSettlement(rep: RepCustody) {
    setError(null)
    const value = Number(settleAmount)
    if (!Number.isFinite(value) || value <= 0) return setError('أدخل مبلغاً صحيحاً')
    startTransition(async () => {
      const result = await settleCustody(rep.repId, branchId, value, '')
      if (!result.ok) return setError(result.error ?? 'تعذر تسوية العهدة')
      setActiveRep(null)
      setSettleAmount('')
    })
  }

  const totalOutstanding = custody.reduce((sum, rep) => sum + rep.outstanding, 0)

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-background pb-16">
      <header className="bg-primary px-5 pb-6 pt-8 text-primary-foreground">
        <div className="flex items-center gap-2">
          <Calculator className="size-5" aria-hidden="true" />
          <h1 className="text-lg font-extrabold">المحاسبة</h1>
        </div>
        <p className="mt-1 text-[13px] text-primary-foreground/80">
          {staffName} — {branchName}
        </p>
        <BranchSwitcher branches={branches} current={branchId} />
      </header>

      {error ? (
        <p className="mx-5 mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-[13px] font-bold text-destructive">
          {error}
        </p>
      ) : null}

      {/* صافي الربح */}
      <section className="px-5 pt-5">
        <div className="rounded-2xl bg-foreground p-4 text-background">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4" aria-hidden="true" />
            <span className="text-[12px] font-bold opacity-80">صافي الربح (مبيعات مسلَّمة − مصروفات)</span>
          </div>
          <p className="mt-2 text-2xl font-extrabold" dir="ltr">
            {formatEGP(accounting.netProfit)}
          </p>
        </div>
      </section>

      {/* مبيعات ومصروفات */}
      <section className="grid grid-cols-2 gap-2 px-5 pt-3" aria-label="ملخّص مالي">
        <SummaryCard
          icon={Banknote}
          label="مبيعات مسلَّمة"
          value={formatEGP(accounting.deliveredRevenue)}
          hint={`${accounting.deliveredCount.toLocaleString('ar-EG')} طلب`}
          tone="good"
        />
        <SummaryCard
          icon={TrendingDown}
          label="مصروفات"
          value={formatEGP(accounting.expensesTotal)}
          hint={`${expenses.length.toLocaleString('ar-EG')} بند`}
          tone="bad"
        />
        <SummaryCard
          icon={Wallet}
          label="طلبات قيد التنفيذ"
          value={formatEGP(accounting.openOrdersValue)}
          hint={`${accounting.openOrdersCount.toLocaleString('ar-EG')} طلب`}
          tone="neutral"
        />
        <SummaryCard
          icon={HandCoins}
          label="عهد لدى المناديب"
          value={formatEGP(totalOutstanding)}
          hint={`${custody.length.toLocaleString('ar-EG')} مندوب`}
          tone="neutral"
        />
      </section>

      {/* عهد المناديب */}
      <section className="px-5 pt-7">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-foreground">
          <HandCoins className="size-4 text-primary" aria-hidden="true" />
          عهد المناديب (تحصيل الدفع عند الاستلام)
        </h2>
        {custody.length === 0 ? (
          <p className="rounded-xl bg-card px-4 py-6 text-center text-[13px] text-muted-foreground">
            لا يوجد مناديب في هذا الفرع
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {custody.map((rep) => {
              const open = activeRep === rep.repId
              return (
                <li key={rep.repId} className="rounded-2xl border border-border bg-card p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold text-foreground">{rep.repName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        حصّل {formatEGP(rep.collected)} · سلّم {formatEGP(rep.settled)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-[12px] font-extrabold',
                        rep.outstanding > 0
                          ? 'bg-primary/12 text-primary'
                          : 'bg-secondary text-secondary-foreground',
                      )}
                      dir="ltr"
                    >
                      {formatEGP(rep.outstanding)}
                    </span>
                  </div>

                  {rep.outstanding > 0 ? (
                    open ? (
                      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                        <input
                          autoFocus
                          value={settleAmount}
                          onChange={(event) => setSettleAmount(event.target.value)}
                          inputMode="decimal"
                          placeholder={`حتى ${rep.outstanding.toFixed(2)}`}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => submitSettlement(rep)}
                          className="shrink-0 rounded-xl bg-primary px-4 py-2 text-[12px] font-bold text-primary-foreground disabled:opacity-60"
                        >
                          تسوية
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => setActiveRep(null)}
                          className="shrink-0 rounded-xl bg-secondary px-3 py-2 text-[12px] font-bold text-secondary-foreground disabled:opacity-60"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setError(null)
                          setActiveRep(rep.repId)
                          setSettleAmount(String(rep.outstanding.toFixed(2)))
                        }}
                        className="mt-3 w-full rounded-xl bg-primary/10 py-2 text-[12px] font-bold text-primary"
                      >
                        تسوية العهدة
                      </button>
                    )
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* المصروفات */}
      <section className="px-5 pt-7">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-foreground">
          <Receipt className="size-4 text-primary" aria-hidden="true" />
          المصروفات
        </h2>

        <div className="rounded-2xl border border-border bg-card p-3.5">
          <div className="flex flex-col gap-2">
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="البند (إيجار، كهرباء، بضاعة…)"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <input
                value={expenseAmount}
                onChange={(event) => setExpenseAmount(event.target.value)}
                inputMode="decimal"
                placeholder="المبلغ"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
              />
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="ملاحظة (اختياري)"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
              />
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={submitExpense}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[13px] font-bold text-primary-foreground disabled:opacity-60"
            >
              <Plus className="size-4" aria-hidden="true" />
              إضافة مصروف
            </button>
          </div>
        </div>

        {expenses.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-1.5">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between rounded-xl bg-card px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-foreground">
                    {expense.category}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {expense.note ? `${expense.note} · ` : ''}
                    {new Date(expense.createdAt).toLocaleDateString('ar-EG', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full bg-destructive/10 px-2.5 py-1 text-[12px] font-extrabold text-destructive"
                  dir="ltr"
                >
                  {formatEGP(expense.amount)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* آخر التسويات */}
      {settlements.length > 0 ? (
        <section className="px-5 pt-7">
          <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-foreground">
            <Banknote className="size-4 text-primary" aria-hidden="true" />
            آخر تسويات العهد
          </h2>
          <ul className="flex flex-col gap-1.5">
            {settlements.map((settlement) => (
              <li
                key={settlement.id}
                className="flex items-center justify-between rounded-xl bg-card px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-foreground">
                    {settlement.repName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(settlement.createdAt).toLocaleDateString('ar-EG', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full bg-primary/12 px-2.5 py-1 text-[12px] font-extrabold text-primary"
                  dir="ltr"
                >
                  {formatEGP(settlement.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Banknote
  label: string
  value: string
  hint: string
  tone: 'good' | 'bad' | 'neutral'
}) {
  const valueClass =
    tone === 'good' ? 'text-primary' : tone === 'bad' ? 'text-destructive' : 'text-foreground'
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        <span className="text-[11px] font-bold">{label}</span>
      </div>
      <p className={cn('mt-1.5 text-[15px] font-extrabold', valueClass)} dir="ltr">
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  )
}
