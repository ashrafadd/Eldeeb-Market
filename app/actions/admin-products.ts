'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin'
import { getSubCategory } from '@/lib/catalog'
import { db } from '@/lib/db'
import { products as productsTable } from '@/lib/db/schema'

/** أقصى حجم مسموح لصورة مخزَّنة كـ Base64 داخل قاعدة البيانات */
const MAX_IMAGE_CHARS = 900_000

export type ProductInput = {
  id?: string
  title: string
  subCategoryId: string
  price: number
  oldPrice?: number | null
  unit: string
  brand: string
  stock: number
  description: string
  image: string
  isActive: boolean
}

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

/** يتحقق من صحة الصورة: مسار داخلي، رابط https، أو Base64 مضمَّن */
function validateImage(image: string): string | null {
  const value = image.trim()
  if (!value) return ''

  if (value.startsWith('data:image/')) {
    if (value.length > MAX_IMAGE_CHARS) {
      return null
    }
    return value
  }

  if (value.startsWith('/')) return value

  if (value.startsWith('https://')) return value

  return null
}

function validate(input: ProductInput): { error: string } | { data: Omit<ProductInput, 'oldPrice'> & { oldPrice: number | null } } {
  const title = input.title?.trim()
  if (!title) return { error: 'اسم المنتج مطلوب' }
  if (title.length > 160) return { error: 'اسم المنتج طويل جداً' }

  if (!getSubCategory(input.subCategoryId)) {
    return { error: 'القسم المختار غير موجود' }
  }

  const price = Number(input.price)
  if (!Number.isFinite(price) || price <= 0) {
    return { error: 'السعر يجب أن يكون رقماً أكبر من صفر' }
  }
  if (price > 1_000_000) return { error: 'السعر أكبر من الحد المسموح' }

  let oldPrice: number | null = null
  if (input.oldPrice !== null && input.oldPrice !== undefined && `${input.oldPrice}` !== '') {
    const parsed = Number(input.oldPrice)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return { error: 'السعر قبل الخصم غير صالح' }
    }
    if (parsed <= price) {
      return { error: 'السعر قبل الخصم يجب أن يكون أكبر من السعر الحالي' }
    }
    oldPrice = parsed
  }

  const stock = Number(input.stock)
  if (!Number.isInteger(stock) || stock < 0 || stock > 100_000) {
    return { error: 'الكمية غير صالحة' }
  }

  const image = validateImage(input.image ?? '')
  if (image === null) {
    return { error: 'الصورة غير صالحة أو حجمها كبير — اختر صورة أصغر' }
  }

  return {
    data: {
      id: input.id,
      title,
      subCategoryId: input.subCategoryId,
      price,
      oldPrice,
      unit: (input.unit ?? '').trim().slice(0, 60),
      brand: (input.brand ?? '').trim().slice(0, 80),
      stock,
      description: (input.description ?? '').trim().slice(0, 1000),
      image,
      isActive: Boolean(input.isActive),
    },
  }
}

/** يبني معرِّفاً فريداً للمنتج داخل قسمه */
async function buildId(subCategoryId: string) {
  const rows = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.subCategoryId, subCategoryId))

  const taken = new Set(rows.map((row) => row.id))
  let index = rows.length + 1
  let candidate = `${subCategoryId}-${index}`
  while (taken.has(candidate)) {
    index += 1
    candidate = `${subCategoryId}-${index}`
  }
  return candidate
}

/** يُحدِّث كل الصفحات التي تعرض المنتجات */
function revalidateStore() {
  revalidatePath('/', 'layout')
}

export async function createProduct(input: ProductInput): Promise<ActionResult> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: 'غير مصرح بالوصول' }
  }

  const checked = validate(input)
  if ('error' in checked) return { ok: false, error: checked.error }
  const data = checked.data

  const id = await buildId(data.subCategoryId)

  await db.insert(productsTable).values({
    id,
    title: data.title,
    unit: data.unit,
    image: data.image,
    price: data.price.toFixed(2),
    oldPrice: data.oldPrice === null ? null : data.oldPrice.toFixed(2),
    brand: data.brand,
    stock: data.stock,
    description: data.description,
    subCategoryId: data.subCategoryId,
    isActive: data.isActive,
    sortOrder: 999,
  })

  revalidateStore()
  return { ok: true, id }
}

export async function updateProduct(input: ProductInput): Promise<ActionResult> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: 'غير مصرح بالوصول' }
  }

  if (!input.id) return { ok: false, error: 'معرّف المنتج مفقود' }

  const checked = validate(input)
  if ('error' in checked) return { ok: false, error: checked.error }
  const data = checked.data

  const [existing] = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.id, input.id))
    .limit(1)

  if (!existing) return { ok: false, error: 'المنتج غير موجود' }

  await db
    .update(productsTable)
    .set({
      title: data.title,
      unit: data.unit,
      image: data.image,
      price: data.price.toFixed(2),
      oldPrice: data.oldPrice === null ? null : data.oldPrice.toFixed(2),
      brand: data.brand,
      stock: data.stock,
      description: data.description,
      subCategoryId: data.subCategoryId,
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(productsTable.id, input.id))

  revalidateStore()
  return { ok: true, id: input.id }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: 'غير مصرح بالوصول' }
  }

  if (!id) return { ok: false, error: 'معرّف المنتج مفقود' }

  const [existing] = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.id, id))
    .limit(1)

  if (!existing) return { ok: false, error: 'المنتج غير موجود' }

  await db.delete(productsTable).where(eq(productsTable.id, id))

  revalidateStore()
  return { ok: true, id }
}

/** إظهار أو إخفاء منتج من المتجر دون حذفه */
export async function toggleProduct(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: 'غير مصرح بالوصول' }
  }

  const [existing] = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.id, id))
    .limit(1)

  if (!existing) return { ok: false, error: 'المنتج غير موجود' }

  await db
    .update(productsTable)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(productsTable.id, id))

  revalidateStore()
  return { ok: true, id }
}
