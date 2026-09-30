import { and, desc, eq, isNull, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import type { Role } from '@/lib/roles'

export type RepOrder = {
  id: number
  reference: string
  status: string
  paymentMethod: string
  total: number
  addressText: string
  phone: string | null
  assignedRepId: string | null
  createdAt: string
}

function toRepOrder(row: typeof orders.$inferSelect): RepOrder {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    paymentMethod: row.paymentMethod,
    total: Number(row.total),
    addressText: row.addressText,
    phone: row.phone,
    assignedRepId: row.assignedRepId,
    createdAt: row.createdAt.toISOString(),
  }
}

/**
 * طلبات المندوب: المُسنَدة إليه + الطلبات الجاهزة في فرعه غير المُسنَدة بعد.
 * تُقيَّد دائماً بفرع المندوب.
 */
export async function getRepOrders(repId: string, branchId: string | null): Promise<RepOrder[]> {
  if (!branchId) return []
  const rows = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.branchId, branchId),
        or(eq(orders.assignedRepId, repId), isNull(orders.assignedRepId)),
      ),
    )
    .orderBy(desc(orders.createdAt))

  return rows.map(toRepOrder)
}
