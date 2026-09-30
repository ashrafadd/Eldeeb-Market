'use server'

import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pointEvents, subscriptions } from '@/lib/db/schema'
import { getPlan, isPlanId } from '@/lib/packages'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  return session.user.id
}

export type ActiveSubscription = {
  id: number
  planId: string
  status: string
  price: number
  cycle: string
  startedAt: string
  renewsAt: string
}

/** الاشتراك النشط للمستخدم الحالي، أو null للزائر / غير المشترك */
export async function getActiveSubscription(): Promise<ActiveSubscription | null> {
  const userId = await getUserId()
  if (!userId) return null

  const [row] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1)

  if (!row) return null

  return {
    id: row.id,
    planId: row.planId,
    status: row.status,
    price: Number(row.price),
    cycle: row.cycle,
    startedAt: row.startedAt.toISOString(),
    renewsAt: row.renewsAt.toISOString(),
  }
}

export async function subscribeToPlan(planId: string, cycle: 'monthly' | 'yearly' = 'monthly') {
  const userId = await getUserId()
  if (!userId) {
    return { ok: false as const, error: 'سجّل الدخول أولاً للاشتراك في الباقة' }
  }

  if (!isPlanId(planId)) {
    return { ok: false as const, error: 'باقة غير معروفة' }
  }

  // السعر يُحسب على السيرفر فقط من ملف الباقات
  const plan = getPlan(planId)
  const price =
    cycle === 'yearly' ? (plan.yearlyPrice ?? plan.price * 12) : plan.price

  const now = new Date()
  const renewsAt = new Date(now)
  if (cycle === 'yearly') {
    renewsAt.setFullYear(renewsAt.getFullYear() + 1)
  } else {
    renewsAt.setDate(renewsAt.getDate() + 30)
  }

  // تُغلق الاشتراكات السابقة قبل تسجيل الاشتراك الجديد
  await db
    .update(subscriptions)
    .set({ status: 'replaced', cancelledAt: now })
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))

  const [row] = await db
    .insert(subscriptions)
    .values({
      userId,
      planId: plan.id,
      status: 'active',
      price: price.toFixed(2),
      cycle,
      startedAt: now,
      renewsAt,
    })
    .returning()

  // مكافأة ترحيبية للباقات المدفوعة
  if (price > 0) {
    await db.insert(pointEvents).values({
      userId,
      label: `الاشتراك في ${plan.name}`,
      points: Math.floor(price / 5),
    })
  }

  revalidatePath('/packages')
  revalidatePath('/account')

  return {
    ok: true as const,
    subscription: {
      id: row.id,
      planId: row.planId,
      status: row.status,
      price: Number(row.price),
      cycle: row.cycle,
      startedAt: row.startedAt.toISOString(),
      renewsAt: row.renewsAt.toISOString(),
    },
  }
}

export async function cancelSubscription() {
  const userId = await getUserId()
  if (!userId) {
    return { ok: false as const, error: 'سجّل الدخول أولاً' }
  }

  await db
    .update(subscriptions)
    .set({ status: 'cancelled', cancelledAt: new Date() })
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))

  revalidatePath('/packages')
  revalidatePath('/account')
  return { ok: true as const }
}
