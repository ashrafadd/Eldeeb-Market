'use server'

import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { branchStock, products, stockMovements } from '@/lib/db/schema'
import { requireRole, type SessionUser } from '@/lib/roles'

/** يتأكد أن الموظف غير المدير العام يعمل على فرعه فقط */
function assertBranch(current: SessionUser, branchId: string) {
  if (current.role === 'super_admin') return
  if (!current.branchId || current.branchId !== branchId) {
    throw new Error('غير مصرح بالوصول لهذا الفرع')
  }
}

async function ensureProduct(productId: string) {
  const [row] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)
  return Boolean(row)
}

/** يطبّق تغيّراً على مخزون منتج في فرع ويسجّل الحركة (داخل معاملة) */
async function applyDelta(
  branchId: string,
  productId: string,
  delta: number,
  reason: 'purchase' | 'adjustment',
  note: string,
  userId: string,
) {
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(branchStock)
      .set({ stock: sqlAdd(delta), updatedAt: new Date() })
      .where(and(eq(branchStock.branchId, branchId), eq(branchStock.productId, productId)))
      .returning({ id: branchStock.id })

    if (updated.length === 0) {
      await tx.insert(branchStock).values({
        id: `bstk_${crypto.randomUUID()}`,
        branchId,
        productId,
        stock: Math.max(delta, 0),
      })
    }

    await tx.insert(stockMovements).values({
      id: `smv_${crypto.randomUUID()}`,
      branchId,
      productId,
      delta,
      reason,
      note: note.trim(),
      userId,
    })
  })
}

// GREATEST يمنع النزول تحت الصفر
function sqlAdd(delta: number) {
  return sql`GREATEST(${branchStock.stock} + ${delta}, 0)`
}

/** تسجيل مشتريات: إضافة كمية لمخزون الفرع */
export async function recordPurchase(
  branchId: string,
  productId: string,
  qty: number,
  note = '',
) {
  const current = await requireRole('purchasing', 'inventory', 'branch_manager')
  try {
    assertBranch(current, branchId)
  } catch (error) {
    return { ok: false as const, error: (error as Error).message }
  }

  const amount = Math.floor(Number(qty))
  if (!Number.isFinite(amount) || amount < 1) {
    return { ok: false as const, error: 'أدخل كمية صحيحة أكبر من صفر' }
  }
  if (amount > 100000) {
    return { ok: false as const, error: 'الكمية كبيرة جداً' }
  }
  if (!(await ensureProduct(productId))) {
    return { ok: false as const, error: 'المنتج غير موجود' }
  }

  await applyDelta(branchId, productId, amount, 'purchase', note, current.id)
  revalidatePath('/dashboard/purchasing')
  revalidatePath('/dashboard/inventory')
  return { ok: true as const }
}

/** تعديل كمية المخزون إلى قيمة محددة (جرد/تصحيح) */
export async function setStockLevel(
  branchId: string,
  productId: string,
  newQty: number,
  note = '',
) {
  const current = await requireRole('purchasing', 'inventory', 'branch_manager')
  try {
    assertBranch(current, branchId)
  } catch (error) {
    return { ok: false as const, error: (error as Error).message }
  }

  const target = Math.floor(Number(newQty))
  if (!Number.isFinite(target) || target < 0) {
    return { ok: false as const, error: 'أدخل كمية صحيحة (صفر أو أكثر)' }
  }
  if (target > 100000) {
    return { ok: false as const, error: 'الكمية كبيرة جداً' }
  }
  if (!(await ensureProduct(productId))) {
    return { ok: false as const, error: 'المنتج غير موجود' }
  }

  const [row] = await db
    .select({ stock: branchStock.stock })
    .from(branchStock)
    .where(and(eq(branchStock.branchId, branchId), eq(branchStock.productId, productId)))
    .limit(1)
  const currentStock = row?.stock ?? 0
  const delta = target - currentStock
  if (delta === 0) return { ok: true as const }

  await applyDelta(branchId, productId, delta, 'adjustment', note, current.id)
  revalidatePath('/dashboard/purchasing')
  revalidatePath('/dashboard/inventory')
  return { ok: true as const }
}
