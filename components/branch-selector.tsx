'use client'

import { useState, useTransition } from 'react'
import { Check, MapPin } from 'lucide-react'
import { chooseBranch } from '@/app/actions/branch'
import { cn } from '@/lib/utils'

type BranchOption = { id: string; name: string; city: string | null }

export function BranchSelector({
  branches,
  currentBranchId,
}: {
  branches: BranchOption[]
  currentBranchId: string | null
}) {
  const [selected, setSelected] = useState(currentBranchId)
  const [, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function pick(branchId: string) {
    if (branchId === selected) return
    const previous = selected
    setSelected(branchId)
    setError(null)
    setSaving(true)
    startTransition(async () => {
      const result = await chooseBranch(branchId)
      if (!result.ok) {
        setSelected(previous)
        setError(result.error ?? 'تعذر حفظ الفرع')
      }
      setSaving(false)
    })
  }

  return (
    <section className="px-4 pt-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-[14px] font-extrabold text-foreground">فرع التسوّق</h2>
        </div>
        <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
          اختر الفرع الأقرب إليك — تظهر لك منتجاته المتوفرة ويصلك منه طلبك.
        </p>

        {error ? (
          <p className="mt-2 text-[12px] font-bold text-destructive">{error}</p>
        ) : null}

        <ul className="mt-3 flex flex-col gap-2">
          {branches.map((branch) => {
            const active = branch.id === selected
            return (
              <li key={branch.id}>
                <button
                  type="button"
                  onClick={() => pick(branch.id)}
                  disabled={saving}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-start transition-colors disabled:opacity-60',
                    active
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background',
                  )}
                >
                  <span className="flex flex-col">
                    <span className="text-[13px] font-bold text-foreground">{branch.name}</span>
                    {branch.city ? (
                      <span className="text-[11px] text-muted-foreground">{branch.city}</span>
                    ) : null}
                  </span>
                  {active ? (
                    <Check className="size-4 text-primary" aria-hidden="true" />
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
