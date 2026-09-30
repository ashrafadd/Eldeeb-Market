import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { custodySettlements, expenses, orders, user } from '@/lib/db/schema'

export type BranchAccounting = {
  deliveredRevenue: number
  deliveredCount: number
  openOrdersValue: number
  openOrdersCount: number
  expensesTotal: number
  netProfit: number
}

/** ملخّص محاسبي للفرع: الإيراد المُحقّق (طلبات مسلَّمة) والمصروفات وصافي الربح */
export async function getBranchAccounting(branchId: string): Promise<BranchAccounting> {
  const orderRows = await db
    .select({ status: orders.status, total: orders.total })
    .from(orders)
    .where(eq(orders.branchId, branchId))

  let deliveredRevenue = 0
  let deliveredCount = 0
  let openOrdersValue = 0
  let openOrdersCount = 0
  for (const row of orderRows) {
    const total = Number(row.total)
    if (row.status === 'delivered') {
      deliveredRevenue += total
      deliveredCount += 1
    } else if (row.status !== 'cancelled') {
      openOrdersValue += total
      openOrdersCount += 1
    }
  }

  const expenseRows = await db
    .select({ amount: expenses.amount })
    .from(expenses)
    .where(eq(expenses.branchId, branchId))
  const expensesTotal = expenseRows.reduce((sum, row) => sum + Number(row.amount), 0)

  return {
    deliveredRevenue,
    deliveredCount,
    openOrdersValue,
    openOrdersCount,
    expensesTotal,
    netProfit: deliveredRevenue - expensesTotal,
  }
}

export type ExpenseRow = {
  id: string
  category: string
  amount: number
  note: string
  createdAt: string
}

/** مصروفات الفرع الأحدث أولاً */
export async function getExpenses(branchId: string, limit = 50): Promise<ExpenseRow[]> {
  const rows = await db
    .select()
    .from(expenses)
    .where(eq(expenses.branchId, branchId))
    .orderBy(desc(expenses.createdAt))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  }))
}

export type RepCustody = {
  repId: string
  repName: string
  collected: number
  settled: number
  outstanding: number
  ordersCount: number
}

/**
 * عهدة كل مندوب في الفرع: نقد الدفع عند الاستلام للطلبات المسلَّمة
 * ناقص ما سبق تسويته. تشمل كل مندوب في الفرع وكل من له تحصيل.
 */
export async function getRepCustody(branchId: string): Promise<RepCustody[]> {
  const reps = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(and(eq(user.branchId, branchId), eq(user.role, 'rep')))

  const codRows = await db
    .select({ repId: orders.assignedRepId, total: orders.total })
    .from(orders)
    .where(
      and(
        eq(orders.branchId, branchId),
        eq(orders.status, 'delivered'),
        eq(orders.paymentMethod, 'cod'),
      ),
    )

  const settledRows = await db
    .select({ repId: custodySettlements.repId, amount: custodySettlements.amount })
    .from(custodySettlements)
    .where(eq(custodySettlements.branchId, branchId))

  const collectedMap = new Map<string, { sum: number; count: number }>()
  for (const row of codRows) {
    if (!row.repId) continue
    const entry = collectedMap.get(row.repId) ?? { sum: 0, count: 0 }
    entry.sum += Number(row.total)
    entry.count += 1
    collectedMap.set(row.repId, entry)
  }

  const settledMap = new Map<string, number>()
  for (const row of settledRows) {
    settledMap.set(row.repId, (settledMap.get(row.repId) ?? 0) + Number(row.amount))
  }

  // نضم المناديب المعروفين + أي مندوب له تحصيل ولم يعد ضمن الفرع
  const names = new Map(reps.map((rep) => [rep.id, rep.name]))
  const ids = new Set<string>([...names.keys(), ...collectedMap.keys(), ...settledMap.keys()])

  const result: RepCustody[] = []
  for (const id of ids) {
    const collectedEntry = collectedMap.get(id) ?? { sum: 0, count: 0 }
    const settled = settledMap.get(id) ?? 0
    result.push({
      repId: id,
      repName: names.get(id) ?? 'مندوب سابق',
      collected: collectedEntry.sum,
      settled,
      outstanding: collectedEntry.sum - settled,
      ordersCount: collectedEntry.count,
    })
  }

  return result.sort((a, b) => b.outstanding - a.outstanding)
}

export type SettlementRow = {
  id: string
  repId: string
  repName: string
  amount: number
  note: string
  createdAt: string
}

/** آخر تسويات العهد في الفرع */
export async function getSettlements(branchId: string, limit = 30): Promise<SettlementRow[]> {
  const rows = await db
    .select({
      id: custodySettlements.id,
      repId: custodySettlements.repId,
      amount: custodySettlements.amount,
      note: custodySettlements.note,
      createdAt: custodySettlements.createdAt,
      repName: user.name,
    })
    .from(custodySettlements)
    .leftJoin(user, eq(user.id, custodySettlements.repId))
    .where(eq(custodySettlements.branchId, branchId))
    .orderBy(desc(custodySettlements.createdAt))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    repId: row.repId,
    repName: row.repName ?? 'مندوب سابق',
    amount: Number(row.amount),
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  }))
}
