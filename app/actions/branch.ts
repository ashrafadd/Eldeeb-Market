'use server'

import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { branches, user } from '@/lib/db/schema'
import { getActiveBranches } from '@/lib/branches'
import { getCities, getVillages } from '@/lib/geo'

/** الفروع المفعّلة — للقوائم المرتبطة عند العميل */
export async function fetchBranches() {
  const rows = await getActiveBranches()
  return rows.map((branch) => ({ id: branch.id, name: branch.name }))
}

/** مدن فرع مفعّلة — للقوائم المرتبطة عند العميل */
export async function fetchCities(branchId: string) {
  if (!branchId) return []
  return getCities(branchId, true)
}

/** مناطق/قرى مدينة مفعّلة — للقوائم المرتبطة عند العميل */
export async function fetchVillages(cityId: string) {
  if (!cityId) return []
  return getVillages(cityId, true)
}

/** العميل يختار فرعه (الأقرب إليه) — يجب أن يكون فرعاً مفعّلاً */
export async function chooseBranch(branchId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return { ok: false as const, error: 'يجب تسجيل الدخول' }

  const [branch] = await db.select().from(branches).where(eq(branches.id, branchId)).limit(1)
  if (!branch || !branch.active) return { ok: false as const, error: 'الفرع غير متاح' }

  await db
    .update(user)
    .set({ branchId, updatedAt: new Date() })
    .where(eq(user.id, session.user.id))

  revalidatePath('/account')
  revalidatePath('/')
  return { ok: true as const }
}
