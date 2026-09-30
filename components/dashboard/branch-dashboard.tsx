'use client'

import Link from 'next/link'
import {
  Boxes,
  Calculator,
  ClipboardList,
  LayoutDashboard,
  ShoppingCart,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { BranchSwitcher } from '@/components/dashboard/branch-switcher'
import { formatEGP } from '@/lib/data'
import { cn } from '@/lib/utils'

type Summary = {
  stockTotal: number
  lowCount: number
  outCount: number
  netProfit: number
  outstandingCustody: number
  openOrders: number
}

const SECTIONS = [
  {
    href: '/dashboard/purchasing',
    label: 'المشتريات والمخزون',
    desc: 'توريد الأصناف وضبط الكميات',
    icon: ShoppingCart,
  },
  {
    href: '/dashboard/inventory',
    label: 'الجرد والمخزون',
    desc: 'متابعة الكميات وتنبيهات النفاد',
    icon: Boxes,
  },
  {
    href: '/dashboard/accounting',
    label: 'المحاسبة والعهد',
    desc: 'المبيعات والمصروفات وتسويات المناديب',
    icon: Calculator,
  },
] as const

export function BranchDashboard({
  branchId,
  branchName,
  branches,
  managerName,
  summary,
}: {
  branchId: string
  branchName: string
  branches: { id: string; name: string }[]
  managerName: string
  summary: Summary
}) {
  const hasAlerts = summary.lowCount > 0 || summary.outCount > 0

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-background pb-16">
      <header className="bg-primary px-5 pb-6 pt-8 text-primary-foreground">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="size-5" aria-hidden="true" />
          <h1 className="text-lg font-extrabold">لوحة مدير الفرع</h1>
        </div>
        <p className="mt-1 text-[13px] text-primary-foreground/80">
          {managerName} — {branchName}
        </p>
      </header>

      <div className="px-4 py-4">
        <BranchSwitcher branches={branches} current={branchId} />
      </div>

      {/* بطاقات الملخّص */}
      <section aria-label="ملخّص الفرع" className="grid grid-cols-2 gap-3 px-4">
        <div className="rounded-2xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Wallet className="size-3.5" aria-hidden="true" />
            <span className="text-[11px] font-bold">صافي الربح</span>
          </div>
          <p
            className={cn(
              'mt-1.5 text-[15px] font-extrabold',
              summary.netProfit >= 0 ? 'text-foreground' : 'text-destructive',
            )}
          >
            {formatEGP(summary.netProfit)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ClipboardList className="size-3.5" aria-hidden="true" />
            <span className="text-[11px] font-bold">طلبات مفتوحة</span>
          </div>
          <p className="mt-1.5 text-[15px] font-extrabold text-foreground">{summary.openOrders}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Boxes className="size-3.5" aria-hidden="true" />
            <span className="text-[11px] font-bold">إجمالي الأصناف</span>
          </div>
          <p className="mt-1.5 text-[15px] font-extrabold text-foreground">{summary.stockTotal}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Wallet className="size-3.5" aria-hidden="true" />
            <span className="text-[11px] font-bold">عهدة غير مسوّاة</span>
          </div>
          <p className="mt-1.5 text-[15px] font-extrabold text-foreground">
            {formatEGP(summary.outstandingCustody)}
          </p>
        </div>
      </section>

      {/* تنبيه النفاد */}
      {hasAlerts ? (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-2xl bg-destructive/10 px-3.5 py-3 text-destructive">
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          <p className="text-[12px] font-bold">
            {summary.outCount > 0 ? `${summary.outCount} صنف نافد` : null}
            {summary.outCount > 0 && summary.lowCount > 0 ? ' · ' : null}
            {summary.lowCount > 0 ? `${summary.lowCount} صنف قارب على النفاد` : null}
          </p>
        </div>
      ) : null}

      {/* روابط الأقسام */}
      <section aria-label="أقسام الفرع" className="mt-4 flex flex-col gap-2.5 px-4">
        {SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-extrabold text-foreground">
                  {section.label}
                </span>
                <span className="block text-[11px] text-muted-foreground">{section.desc}</span>
              </span>
            </Link>
          )
        })}
      </section>
    </main>
  )
}
