'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ArrowRight, Users } from 'lucide-react'
import { setUserBranch, setUserRole } from '@/app/actions/admin-users'
import type { ManagedUser } from '@/lib/roles'
import { ROLE_LABELS, ROLES, type Role } from '@/lib/roles-shared'

type Branch = { id: string; name: string }

export function UsersManager({
  users,
  branches,
  currentUserId,
}: {
  users: ManagedUser[]
  branches: Branch[]
  currentUserId: string
}) {
  const [, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function changeRole(userId: string, role: Role) {
    setError(null)
    setBusyId(userId)
    startTransition(async () => {
      const result = await setUserRole(userId, role)
      if (!result.ok) setError(result.error ?? 'تعذر تغيير الدور')
      setBusyId(null)
    })
  }

  function changeBranch(userId: string, branchId: string) {
    setError(null)
    setBusyId(userId)
    startTransition(async () => {
      const result = await setUserBranch(userId, branchId || null)
      if (!result.ok) setError(result.error ?? 'تعذر تغيير الفرع')
      setBusyId(null)
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
          <Users className="size-5" aria-hidden="true" />
          <h1 className="text-lg font-extrabold">إدارة المستخدمين</h1>
        </div>
        <p className="mt-1 text-[13px] text-primary-foreground/80">
          {users.length} مستخدم — عيّن الأدوار والفروع
        </p>
      </header>

      {error ? (
        <p className="mx-5 mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-[13px] font-bold text-destructive">
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col gap-3 px-5 pt-6">
        {users.map((u) => {
          const isSelf = u.id === currentUserId
          return (
            <li key={u.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-extrabold text-foreground">{u.name}</span>
                {u.phoneNumber ? (
                  <span dir="ltr" className="text-[12px] text-muted-foreground">
                    {u.phoneNumber.startsWith('+20') ? `0${u.phoneNumber.slice(3)}` : u.phoneNumber}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-muted-foreground">الدور</span>
                  <select
                    value={u.role}
                    disabled={busyId === u.id || isSelf}
                    onChange={(event) => changeRole(u.id, event.target.value as Role)}
                    className="rounded-xl border border-border bg-background px-2.5 py-2 text-[12px] font-bold text-foreground disabled:opacity-60"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-muted-foreground">الفرع</span>
                  <select
                    value={u.branchId ?? ''}
                    disabled={busyId === u.id}
                    onChange={(event) => changeBranch(u.id, event.target.value)}
                    className="rounded-xl border border-border bg-background px-2.5 py-2 text-[12px] font-bold text-foreground disabled:opacity-60"
                  >
                    <option value="">بدون فرع</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {isSelf ? (
                <p className="mt-2 text-[11px] text-muted-foreground">حسابك — لا يمكن تغيير دورك</p>
              ) : null}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
