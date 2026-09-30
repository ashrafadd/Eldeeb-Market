'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { requireRole } from '@/lib/roles'

const REP_STATUSES = ['processing', 'onway', 'delivered', 'cancelled'] as const
type RepStatus = (typeof REP_STATUSES)[number]

/** المندوب يقبل طلباً غير مُسنَد في فرعه فيصبح مسؤولاً عنه */
export async function acceptOrder(orderId: number) {
  const rep = await requireRole('rep')
  if (!rep.branchId) return { ok: false as const, error: 'لا يوجد فرع مرتبط بحسابك' }

  // يُسنَد فقط إن كان في نفس الفرع وغير مُسنَد لغيره
  const result = await db
    .update(orders)
    .set({ assignedRepId: rep.id })
    .where(and(eq(orders.id, orderId), eq(orders.branchId, rep.branchId)))
    .returning({ id: orders.id })

  if (result.length === 0) return { ok: false as const, error: 'الطلب غير متاح' }
  revalidatePath('/dashboard/rep')
  return { ok: true as const }
}

/** المندوب يحدّث حالة طلب مُسنَد إليه فقط */
export async function updateOrderStatus(orderId: number, status: RepStatus) {
  const rep = await requireRole('rep')
  if (!REP_STATUSES.includes(status)) {
    return { ok: false as const, error: 'حالة غير معروفة' }
  }
  if (!rep.branchId) return { ok: false as const, error: 'لا يوجد فرع مرتبط بحسابك' }

  const result = await db
    .update(orders)
    .set({ status })
    .where(
      and(
        eq(orders.id, orderId),
        eq(orders.branchId, rep.branchId),
        eq(orders.assignedRepId, rep.id),
      ),
    )
    .returning({ id: orders.id })

  if (result.length === 0) return { ok: false as const, error: 'الطلب غير مُسنَد إليك' }
  revalidatePath('/dashboard/rep')
  return { ok: true as const }
}
