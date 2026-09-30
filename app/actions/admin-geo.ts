'use server'

import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { branches, cities, villages } from '@/lib/db/schema'
import { requireRole } from '@/lib/roles'

/** super_admin يضيف مدينة تحت فرع */
export async function createCity(input: { branchId: string; name: string }) {
  await requireRole('super_admin')
  const name = input.name?.trim()
  if (!name) return { ok: false as const, error: 'اسم المدينة مطلوب' }

  const [branch] = await db
    .select()
    .from(branches)
    .where(eq(branches.id, input.branchId))
    .limit(1)
  if (!branch) return { ok: false as const, error: 'الفرع غير موجود' }

  const id = `city_${randomUUID().slice(0, 8)}`
  await db.insert(cities).values({ id, branchId: input.branchId, name, active: true })
  revalidatePath('/admin/geo')
  return { ok: true as const, id }
}

/** super_admin يعدّل اسم مدينة */
export async function renameCity(cityId: string, name: string) {
  await requireRole('super_admin')
  const trimmed = name?.trim()
  if (!trimmed) return { ok: false as const, error: 'اسم المدينة مطلوب' }
  await db.update(cities).set({ name: trimmed }).where(eq(cities.id, cityId))
  revalidatePath('/admin/geo')
  return { ok: true as const }
}

/** super_admin يفعّل/يعطّل مدينة */
export async function toggleCity(cityId: string, active: boolean) {
  await requireRole('super_admin')
  await db.update(cities).set({ active }).where(eq(cities.id, cityId))
  revalidatePath('/admin/geo')
  return { ok: true as const }
}

/** super_admin يضيف منطقة/قرية تحت مدينة */
export async function createVillage(input: { cityId: string; name: string }) {
  await requireRole('super_admin')
  const name = input.name?.trim()
  if (!name) return { ok: false as const, error: 'اسم المنطقة / القرية مطلوب' }

  const [city] = await db.select().from(cities).where(eq(cities.id, input.cityId)).limit(1)
  if (!city) return { ok: false as const, error: 'المدينة غير موجودة' }

  const id = `village_${randomUUID().slice(0, 8)}`
  await db.insert(villages).values({ id, cityId: input.cityId, name, active: true })
  revalidatePath('/admin/geo')
  return { ok: true as const, id }
}

/** super_admin يعدّل اسم منطقة/قرية */
export async function renameVillage(villageId: string, name: string) {
  await requireRole('super_admin')
  const trimmed = name?.trim()
  if (!trimmed) return { ok: false as const, error: 'اسم المنطقة / القرية مطلوب' }
  await db.update(villages).set({ name: trimmed }).where(eq(villages.id, villageId))
  revalidatePath('/admin/geo')
  return { ok: true as const }
}

/** super_admin يفعّل/يعطّل منطقة/قرية */
export async function toggleVillage(villageId: string, active: boolean) {
  await requireRole('super_admin')
  await db.update(villages).set({ active }).where(eq(villages.id, villageId))
  revalidatePath('/admin/geo')
  return { ok: true as const }
}
