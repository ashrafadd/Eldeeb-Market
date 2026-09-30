import { asc, eq } from 'drizzle-orm'
import { cache } from 'react'
import {
  getDepartment,
  getSubCategory,
  subCategoriesOf,
  type CatalogProduct,
} from '@/lib/catalog'
import { db } from '@/lib/db'
import { branchStock, products as productsTable } from '@/lib/db/schema'

export type Product = CatalogProduct

type Row = typeof productsTable.$inferSelect

/** يحوّل صف قاعدة البيانات إلى شكل المنتج المستخدم في الواجهة */
function toProduct(row: Row): Product {
  const subCategory = getSubCategory(row.subCategoryId)
  const department = subCategory ? getDepartment(subCategory.departmentId) : undefined

  const price = Number(row.price)
  const oldPrice = row.oldPrice ? Number(row.oldPrice) : undefined
  const discount = oldPrice && oldPrice > price
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0

  return {
    id: row.id,
    title: row.title,
    unit: row.unit,
    image: row.image || `/catalog/${row.subCategoryId}.png`,
    price,
    oldPrice,
    rating: Number(row.rating),
    reviews: row.reviews,
    brand: row.brand,
    category: subCategory?.name ?? '',
    stock: row.stock,
    description: row.description,
    badge: discount >= 12 ? `خصم ${discount}%` : undefined,
    groupId: department?.groupId ?? 'grocery',
    departmentId: subCategory?.departmentId ?? '',
    subCategoryId: row.subCategoryId,
  }
}

/** كل المنتجات المعروضة في المتجر — مُجمَّعة لكل طلب */
export const getProducts = cache(async (): Promise<Product[]> => {
  const rows = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.isActive, true))
    .orderBy(asc(productsTable.subCategoryId), asc(productsTable.sortOrder))

  return rows.map(toProduct)
})

/** مخزون فرع معيّن: خريطة productId → الكمية */
export async function getBranchStockMap(branchId: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ productId: branchStock.productId, stock: branchStock.stock })
    .from(branchStock)
    .where(eq(branchStock.branchId, branchId))

  const map: Record<string, number> = {}
  for (const row of rows) map[row.productId] = row.stock
  return map
}

/**
 * منتجات المتجر لفرع محدّد — نفس الكتالوج لكن المخزون من مخزون الفرع.
 * المنتج غير الموجود في مخزون الفرع يظهر بمخزون صفر (نافد).
 */
export async function getProductsForBranch(branchId: string): Promise<Product[]> {
  const [all, stockMap] = await Promise.all([getProducts(), getBranchStockMap(branchId)])
  return all.map((product) => ({ ...product, stock: stockMap[product.id] ?? 0 }))
}

/** المنتج كما تعرضه لوحة التحكم — يضم حالة الإظهار */
export type AdminProduct = Product & { isActive: boolean }

/** كل المنتجات بما فيها المخفية — للوحة التحكم */
export const getAllProductsForAdmin = cache(async (): Promise<AdminProduct[]> => {
  const rows = await db
    .select()
    .from(productsTable)
    .orderBy(asc(productsTable.subCategoryId), asc(productsTable.sortOrder))

  return rows.map((row) => ({ ...toProduct(row), isActive: row.isActive }))
})

export async function getProduct(id: string): Promise<Product | undefined> {
  const [row] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id))
    .limit(1)

  return row ? toProduct(row) : undefined
}

export async function productsOfSubCategory(subCategoryId: string): Promise<Product[]> {
  const all = await getProducts()
  return all.filter((product) => product.subCategoryId === subCategoryId)
}

export async function productsOfDepartment(departmentId: string): Promise<Product[]> {
  const ids = new Set(subCategoriesOf(departmentId).map((item) => item.id))
  const all = await getProducts()
  return all.filter((product) => ids.has(product.subCategoryId))
}

/** فهرس الأسعار الذي تحتاجه السلة في الواجهة */
export async function getPriceIndex(): Promise<Record<string, { price: number; oldPrice?: number }>> {
  const all = await getProducts()
  const index: Record<string, { price: number; oldPrice?: number }> = {}
  for (const product of all) {
    index[product.id] = { price: product.price, oldPrice: product.oldPrice }
  }
  return index
}

/** عدد منتجات قسم فرعي */
export async function subCategoryCounts(): Promise<Record<string, number>> {
  const all = await getProducts()
  const counts: Record<string, number> = {}
  for (const product of all) {
    counts[product.subCategoryId] = (counts[product.subCategoryId] ?? 0) + 1
  }
  return counts
}

/** صورة تمثيلية لكل قسم فرعي (أول منتج فيه) */
export async function subCategoryImages(): Promise<Record<string, string>> {
  const all = await getProducts()
  const images: Record<string, string> = {}
  for (const product of all) {
    if (!images[product.subCategoryId]) images[product.subCategoryId] = product.image
  }
  return images
}

function pick(all: Product[], ids: string[]) {
  return ids
    .map((id) => all.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product))
}

/** المنتجات المعروضة في الصفحة الرئيسية */
export async function getHomeSections() {
  const all = await getProducts()

  const mostViewedIds = [
    'fruits-1',
    'fresh-milk-1',
    'rice-pasta-1',
    'poultry-1',
    'chocolate-1',
    'laundry-1',
  ]
  const newArrivalIds = [
    'cakes-1',
    'ice-cream-1',
    'juices-1',
    'cheese-1',
    'diapers-1',
    'coffee-1',
  ]

  const mostViewed = pick(all, mostViewedIds)
  const newArrivals = pick(all, newArrivalIds)

  return {
    // تُستخدم بدائل عند حذف المنتجات الأصلية من اللوحة
    mostViewed: mostViewed.length ? mostViewed : all.slice(0, 6),
    newArrivals: newArrivals.length ? newArrivals : all.slice(6, 12),
    offers: all.filter((product) => product.badge).slice(0, 12),
  }
}
