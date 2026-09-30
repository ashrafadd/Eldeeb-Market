'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { ArrowRight, ChevronDown, MapPin, Plus } from 'lucide-react'
import {
  createCity,
  createVillage,
  toggleCity,
  toggleVillage,
} from '@/app/actions/admin-geo'
import { cn } from '@/lib/utils'

type Village = { id: string; cityId: string; name: string; active: boolean }
type City = { id: string; branchId: string; name: string; active: boolean; villages: Village[] }
type BranchOption = { id: string; name: string; active: boolean }

export function GeoManager({
  branches,
  trees,
}: {
  branches: BranchOption[]
  trees: Record<string, City[]>
}) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id ?? '')
  const cities = useMemo(() => trees[activeBranch] ?? [], [trees, activeBranch])

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-background pb-16">
      <header className="bg-primary px-5 pb-6 pt-8 text-primary-foreground">
        <Link
          href="/admin"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary-foreground/80"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
          لوحة التحكم
        </Link>
        <div className="flex items-center gap-2">
          <MapPin className="size-5" aria-hidden="true" />
          <h1 className="text-lg font-extrabold">المدن والمناطق</h1>
        </div>
        <p className="mt-1 text-[13px] text-primary-foreground/80">
          أضف المدن تحت كل فرع، والمناطق / القرى تحت كل مدينة
        </p>
      </header>

      {/* تبويبات الفروع */}
      {branches.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto px-5 pt-4">
          {branches.map((branch) => (
            <button
              key={branch.id}
              type="button"
              onClick={() => setActiveBranch(branch.id)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-bold',
                activeBranch === branch.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground',
              )}
            >
              {branch.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="px-5 pt-5">
        <AddCityForm branchId={activeBranch} />
      </div>

      <ul className="flex flex-col gap-3 px-5 pt-5">
        {cities.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-border p-6 text-center text-[13px] text-muted-foreground">
            لا توجد مدن لهذا الفرع بعد. أضف أول مدينة من الأعلى.
          </li>
        ) : (
          cities.map((city) => <CityRow key={city.id} city={city} />)
        )}
      </ul>
    </main>
  )
}

function AddCityForm({ branchId }: { branchId: string }) {
  const [, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function add() {
    if (!name.trim()) {
      setError('اسم المدينة مطلوب')
      return
    }
    setError(null)
    setBusy(true)
    startTransition(async () => {
      const result = await createCity({ branchId, name })
      if (!result.ok) setError(result.error ?? 'تعذر إضافة المدينة')
      else setName('')
      setBusy(false)
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 text-[14px] font-extrabold text-foreground">إضافة مدينة</h2>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="اسم المدينة"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground"
        />
        <button
          type="button"
          onClick={add}
          disabled={busy || !branchId}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-[13px] font-bold text-primary-foreground disabled:opacity-60"
        >
          <Plus className="size-4" aria-hidden="true" />
          إضافة
        </button>
      </div>
      {error ? <p className="mt-2 text-[12px] font-bold text-destructive">{error}</p> : null}
    </div>
  )
}

function CityRow({ city }: { city: City }) {
  const [, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  function toggle() {
    setBusy(true)
    startTransition(async () => {
      await toggleCity(city.id, !city.active)
      setBusy(false)
    })
  }

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between p-4">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-2 text-right"
        >
          <ChevronDown
            className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
            aria-hidden="true"
          />
          <span className="truncate text-[14px] font-extrabold text-foreground">{city.name}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {city.villages.length} منطقة
          </span>
        </button>
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={cn(
            'mr-2 shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold disabled:opacity-60',
            city.active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          {city.active ? 'مفعّلة' : 'معطّلة'}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          <AddVillageForm cityId={city.id} />
          <ul className="mt-3 flex flex-col gap-2">
            {city.villages.length === 0 ? (
              <li className="text-[12px] text-muted-foreground">لا توجد مناطق / قرى بعد.</li>
            ) : (
              city.villages.map((village) => (
                <VillageRow key={village.id} village={village} />
              ))
            )}
          </ul>
        </div>
      ) : null}
    </li>
  )
}

function AddVillageForm({ cityId }: { cityId: string }) {
  const [, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function add() {
    if (!name.trim()) {
      setError('الاسم مطلوب')
      return
    }
    setError(null)
    setBusy(true)
    startTransition(async () => {
      const result = await createVillage({ cityId, name })
      if (!result.ok) setError(result.error ?? 'تعذر الإضافة')
      else setName('')
      setBusy(false)
    })
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="اسم المنطقة / القرية"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-[12px] text-foreground"
        />
        <button
          type="button"
          onClick={add}
          disabled={busy}
          className="flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[12px] font-bold text-primary-foreground disabled:opacity-60"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          إضافة
        </button>
      </div>
      {error ? <p className="mt-1.5 text-[11px] font-bold text-destructive">{error}</p> : null}
    </div>
  )
}

function VillageRow({ village }: { village: Village }) {
  const [, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)

  function toggle() {
    setBusy(true)
    startTransition(async () => {
      await toggleVillage(village.id, !village.active)
      setBusy(false)
    })
  }

  return (
    <li className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
      <span className="truncate text-[12px] font-bold text-foreground">{village.name}</span>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={cn(
          'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold disabled:opacity-60',
          village.active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        {village.active ? 'مفعّلة' : 'معطّلة'}
      </button>
    </li>
  )
}
