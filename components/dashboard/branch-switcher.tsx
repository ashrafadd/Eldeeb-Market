'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

/** يظهر للمدير العام فقط: يبدّل الفرع عبر تحديث ?branch= */
export function BranchSwitcher({
  branches,
  current,
}: {
  branches: { id: string; name: string }[]
  current: string | null
}) {
  const router = useRouter()
  const params = useSearchParams()

  if (branches.length <= 1) return null

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString())
    next.set('branch', event.target.value)
    router.push(`?${next.toString()}`)
  }

  return (
    <div className="relative mt-3">
      <select
        value={current ?? ''}
        onChange={onChange}
        aria-label="اختيار الفرع"
        className="w-full appearance-none rounded-xl bg-primary-foreground/15 px-3 py-2 pe-9 text-[13px] font-bold text-primary-foreground outline-none"
      >
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id} className="text-foreground">
            {branch.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-primary-foreground/80"
        aria-hidden="true"
      />
    </div>
  )
}
