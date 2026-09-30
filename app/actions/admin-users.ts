'use server'

import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { branches, user } from '@/lib/db/schema'
import { ROLES, normalizeRole, requireRole, type Role } from '@/lib/roles'

/** super_admin يغيّر دور مستخدم */
export async function setUserRole(userId: string, role: Role) {
  const admin = await requireRole('super_admin')
  if (!ROLES.includes(role)) return { ok: false as const, error: 'دور غير معروف' }
  // لا يُنزّل المدير العام نفسه لتفادي فقد الوصول
  if (userId === admin.id && role !== 'super_admin') {
    return { ok: false as const, error: 'لا يمكنك تغيير دورك أنت' }
  }

  await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, userId))
  revalidatePath('/admin/users')
  return { ok: true as const }
}

/** super_admin يربط مستخدماً بفرع */
export async function setUserBranch(userId: string, branchId: string | null) {
  await requireRole('super_admin')
  if (branchId) {
    const [branch] = await db.select().from(branches).where(eq(branches.id, branchId)).limit(1)
    if (!branch) return { ok: false as const, error: 'الفرع غير موجود' }
  }

  await db.update(user).set({ branchId, updatedAt: new Date() }).where(eq(user.id, userId))
  revalidatePath('/admin/users')
  return { ok: true as const }
}

/** super_admin ينشئ فرعاً جديداً */
export async function createBranch(input: { name: string; city?: string; phone?: string }) {
  await requireRole('super_admin')
  const name = input.name?.trim()
  if (!name) return { ok: false as const, error: 'اسم الفرع مطلوب' }

  const id = `branch_${randomUUID().slice(0, 8)}`
  await db.insert(branches).values({
    id,
    name,
    city: input.city?.trim() || null,
    phone: input.phone?.trim() || null,
    active: true,
  })
  revalidatePath('/admin/branches')
  return { ok: true as const, id }
}

/** super_admin يفعّل/يعطّل فرعاً */
export async function toggleBranch(branchId: string, active: boolean) {
  await requireRole('super_admin')
  await db.update(branches).set({ active }).where(eq(branches.id, branchId))
  revalidatePath('/admin/branches')
  return { ok: true as const }
}

export { normalizeRole }
