import { asc, eq } from 'drizzle-orm'
import { cache } from 'react'
import { db } from '@/lib/db'
import { branches } from '@/lib/db/schema'

export const MAIN_BRANCH_ID = 'branch_main'

export type Branch = typeof branches.$inferSelect

/** كل الفروع مرتبة بالاسم */
export const getBranches = cache(async (): Promise<Branch[]> => {
  return db.select().from(branches).orderBy(asc(branches.name))
})

/** الفروع المفعّلة فقط — لعرضها للعميل */
export const getActiveBranches = cache(async (): Promise<Branch[]> => {
  const all = await getBranches()
  return all.filter((branch) => branch.active)
})

export async function getBranch(id: string): Promise<Branch | undefined> {
  const [row] = await db.select().from(branches).where(eq(branches.id, id)).limit(1)
  return row
}
