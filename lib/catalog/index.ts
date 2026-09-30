import { freshProducts } from './products-fresh'
import { groceryProducts } from './products-grocery'
import { homeProducts } from './products-home'
import {
  catalogGroups,
  departments,
  departmentsOf,
  getDepartment,
  getSubCategory,
  subCategories,
  subCategoriesOf,
} from './taxonomy'
import type { ProductRow, SubCategoryProducts } from './types'

export * from './taxonomy'
export type { ProductRow } from './types'

export type CatalogProduct = {
  id: string
  title: string
  unit: string
  image: string
  price: number
  oldPrice?: number
  rating: number
  reviews: number
  brand: string
  category: string
  stock: number
  description: string
  badge?: string
  groupId: string
  departmentId: string
  subCategoryId: string
}

const allRows: SubCategoryProducts = {
  ...groceryProducts,
  ...homeProducts,
  ...freshProducts,
}

/** قيم شبه عشوائية ثابتة (بدون Math.random) لتفادي اختلاف الخادم والعميل */
function seeded(seed: string, min: number, max: number) {
  let hash = 7
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100000
  }
  return min + (hash % (max - min + 1))
}

function buildProduct(row: ProductRow, subCategoryId: string, index: number): CatalogProduct {
  const [title, unit, price, oldPrice, brand, description, image] = row
  const subCategory = getSubCategory(subCategoryId)
  const department = subCategory ? getDepartment(subCategory.departmentId) : undefined
  const id = `${subCategoryId}-${index + 1}`
  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0

  return {
    id,
    title,
    unit,
    image: image ?? `/catalog/${subCategoryId}.png`,
    price,
    oldPrice: oldPrice || undefined,
    rating: seeded(`r${id}`, 40, 50) / 10,
    reviews: seeded(`v${id}`, 18, 640),
    brand,
    category: subCategory?.name ?? '',
    stock: seeded(`s${id}`, 6, 90),
    description,
    badge: discount >= 12 ? `خصم ${discount}%` : undefined,
    groupId: department?.groupId ?? 'grocery',
    departmentId: subCategory?.departmentId ?? '',
    subCategoryId,
  }
}

export const catalogProducts: CatalogProduct[] = subCategories.flatMap((subCategory) =>
  (allRows[subCategory.id] ?? []).map((row, index) => buildProduct(row, subCategory.id, index)),
)

const bySubCategory = new Map<string, CatalogProduct[]>()
for (const product of catalogProducts) {
  const list = bySubCategory.get(product.subCategoryId) ?? []
  list.push(product)
  bySubCategory.set(product.subCategoryId, list)
}

export function productsOfSubCategory(subCategoryId: string) {
  return bySubCategory.get(subCategoryId) ?? []
}

export function productsOfDepartment(departmentId: string) {
  return subCategoriesOf(departmentId).flatMap((item) => productsOfSubCategory(item.id))
}

export function productsOfGroup(groupId: string) {
  return departmentsOf(groupId).flatMap((item) => productsOfDepartment(item.id))
}

export function subCategoryCount(subCategoryId: string) {
  return productsOfSubCategory(subCategoryId).length
}

export function departmentCount(departmentId: string) {
  return productsOfDepartment(departmentId).length
}

/** صورة تمثيلية لقسم فرعي (أول منتج فيه) */
export function subCategoryImage(subCategoryId: string) {
  return productsOfSubCategory(subCategoryId)[0]?.image ?? '/placeholder.svg'
}

/** أربع صور للقسم الرئيسي لعرض شبكة مصغرة */
export function departmentThumbs(departmentId: string) {
  return subCategoriesOf(departmentId).slice(0, 4).map((item) => subCategoryImage(item.id))
}

export const catalogGroupList = catalogGroups
export const departmentList = departments
