import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { stockMovements } from '@/lib/db/schema'
import { getProductsForBranch } from '@/lib/products'

/** حدّ التنبيه: منتج كميته <= هذا الرقم يُعدّ منخفضاً (والصفر نافد) */
export const LOW_STOCK_THRESHOLD = 10

export type StockRow = {
  productId: string
  title: string
  image: string
  unit: string
  stock: number
}

/** كل منتجات الفرع مع كمياتها (المنتج غير الموجود في المخزون = صفر) */
export async function getBranchStockRows(branchId: string): Promise<StockRow[]> {
  const products = await getProductsForBranch(branchId)
  return products.map((product) => ({
    productId: product.id,
    title: product.title,
    image: product.image,
    unit: product.unit,
    stock: product.stock,
  }))
}

export type StockSummary = {
  total: number
  lowCount: number
  outCount: number
}

/** ملخّص حالة مخزون الفرع للتنبيهات */
export function summarizeStock(rows: StockRow[]): StockSummary {
  let lowCount = 0
  let outCount = 0
  for (const row of rows) {
    if (row.stock <= 0) outCount += 1
    else if (row.stock <= LOW_STOCK_THRESHOLD) lowCount += 1
  }
  return { total: rows.length, lowCount, outCount }
}

export type StockMovement = {
  id: string
  productId: string
  delta: number
  reason: string
  note: string
  createdAt: string
}

/** آخر حركات المخزون في الفرع */
export async function getStockMovements(
  branchId: string,
  limit = 30,
): Promise<StockMovement[]> {
  const rows = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.branchId, branchId))
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    delta: row.delta,
    reason: row.reason,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  }))
}
