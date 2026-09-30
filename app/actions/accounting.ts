'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { custodySettlements, expenses } from '@/lib/db/schema'
import { getRepCustody } from '@/lib/accounting'
import { requireRole, type SessionUser } from '@/lib/roles'

function assertBranch(current: SessionUser, branchId: string) {
  if (current.role === 'super_admin') return
  if (!current.branchId || current.branchId !== branchId) {
    throw new Error('غير مصرح بالوصول لهذا الفرع')
  }
}

/** تسجيل مصروف على الفرع */
export async function addExpense(
  branchId: string,
  category: string,
  amount: number,
  note = '',
) {
  const current = await requireRole('accountant', 'branch_manager')
  try {
    assertBranch(current, branchId)
  } catch (error) {
    return { ok: false as const, error: (error as Error).message }
  }

  const cleanCategory = category.trim()
  const value = Number(amount)
  if (!cleanCategory) return { ok: false as const, error: 'أدخل بند المصروف' }
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false as const, error: 'أدخل مبلغاً صحيحاً أكبر من صفر' }
  }
  if (value > 10000000) return { ok: false as const, error: 'المبلغ كبير جداً' }

  await db.insert(expenses).values({
    id: `exp_${crypto.randomUUID()}`,
    branchId,
    category: cleanCategory,
    amount: value.toFixed(2),
    note: note.trim(),
    userId: current.id,
  })

  revalidatePath('/dashboard/accounting')
  return { ok: true as const }
}

/** تسوية عهدة مندوب: تسجيل نقد سلّمه للمحاسبة */
export async function settleCustody(
  repId: string,
  branchId: string,
  amount: number,
  note = '',
) {
  const current = await requireRole('accountant', 'branch_manager')
  try {
    assertBranch(current, branchId)
  } catch (error) {
    return { ok: false as const, error: (error as Error).message }
  }

  const value = Number(amount)
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false as const, error: 'أدخل مبلغاً صحيحاً أكبر من صفر' }
  }

  // لا نسمح بتسوية أكثر من العهدة المستحقة للمندوب
  const custody = await getRepCustody(branchId)
  const rep = custody.find((item) => item.repId === repId)
  if (!rep) return { ok: false as const, error: 'المندوب غير موجود في هذا الفرع' }
  if (value > rep.outstanding + 1e-9) {
    return {
      ok: false as const,
      error: `العهدة المستحقة ${rep.outstanding.toFixed(2)} جنيه فقط`,
    }
  }

  await db.insert(custodySettlements).values({
    id: `cst_${crypto.randomUUID()}`,
    repId,
    branchId,
    amount: value.toFixed(2),
    note: note.trim(),
    settledBy: current.id,
  })

  revalidatePath('/dashboard/accounting')
  return { ok: true as const }
}
