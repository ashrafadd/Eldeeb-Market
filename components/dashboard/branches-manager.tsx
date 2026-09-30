'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ArrowRight, Plus, Store } from 'lucide-react'
import { createBranch, toggleBranch } from '@/app/actions/admin-users'
import { cn } from '@/lib/utils'

type Branch = {
  id: string
  name: string
  city: string | null
  phone: string | null
  address: string | null
  active: boolean
}

export function BranchesManager({ branches }: { branches: Branch[] }) {
  const [, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')

  function add() {
    if (!name.trim()) {
      setError('اسم الفرع مطلوب')
      return
    }
    setError(null)
    setBusy(true)
    startTransition(async () => {
      const result = await createBranch({ name, city, phone })
      if (!result.ok) setError(result.error ?? 'تعذر إضافة الفرع')
      else {
        setName('')
        setCity('')
        setPhone('')
      }
      setBusy(false)
    })
  }

  function toggle(branchId: string, active: boolean) {
    setBusy(true)
    startTransition(async () => {
      await toggleBranch(branchId, active)
      setBusy(false)
    })
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-background pb-16">
      <header className="bg-primary px-5 pb-6 pt-8 text-primary-foreground">
        <Link href="/admin" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary-foreground/80">
          <ArrowRight className="size-4" aria-hidden="true" />
          لوحة التحكم
        </Link>
        <div className="flex items-center gap-2">
          <Store className="size-5" aria-hidden="true" />
          <h1 className="text-lg font-extrabold">إدارة الفروع</h1>
        </div>
        <p className="mt-1 text-[13px] text-primary-foreground/80">{branches.length} فرع</p>
      </header>

      <section className="px-5 pt-6">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-[14px] font-extrabold text-foreground">إضافة فرع جديد</h2>
          <div className="flex flex-col gap-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="اسم الفرع"
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground"
            />
            <div className="flex gap-2">
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="المدينة"
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground"
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="الهاتف"
                dir="ltr"
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground"
              />
            </div>
            {error ? <p className="text-[12px] font-bold text-destructive">{error}</p> : null}
            <button
              type="button"
              onClick={add}
              disabled={busy}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[13px] font-bold text-primary-foreground disabled:opacity-60"
            >
              <Plus className="size-4" aria-hidden="true" />
              إضافة الفرع
            </button>
          </div>
        </div>
      </section>

      <ul className="flex flex-col gap-3 px-5 pt-6">
        {branches.map((branch) => (
          <li
            key={branch.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
          >
            <div>
              <p className="text-[14px] font-extrabold text-foreground">{branch.name}</p>
              <p className="text-[12px] text-muted-foreground">
                {branch.city || 'بدون مدينة'}
                {branch.phone ? ` — ${branch.phone}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggle(branch.id, !branch.active)}
              disabled={busy}
              className={cn(
                'rounded-full px-3 py-1.5 text-[12px] font-bold disabled:opacity-60',
                branch.active
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {branch.active ? 'مفعّل' : 'معطّل'}
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
