'use server'

import { desc, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import {
  payoutSettings,
  prepaidCards,
  topupRequests,
  user as userTable,
} from '@/lib/db/schema'
import {
  approveTopup,
  generateCardCode,
  rejectTopup,
  TOPUP_METHODS,
  type TopupMethod,
} from '@/lib/wallet'

/* ── طلبات التعبئة ── */

export type AdminTopup = {
  id: string
  amount: number
  method: TopupMethod
  methodLabel: string
  reference: string
  receipt: string
  status: 'pending' | 'approved' | 'rejected'
  adminNote: string
  customerName: string
  customerEmail: string
  createdAt: string
}

export async function listTopups(): Promise<AdminTopup[]> {
  await requireAdmin()

  const rows = await db
    .select({
      id: topupRequests.id,
      amount: topupRequests.amount,
      method: topupRequests.method,
      reference: topupRequests.reference,
      receipt: topupRequests.receipt,
      status: topupRequests.status,
      adminNote: topupRequests.adminNote,
      createdAt: topupRequests.createdAt,
      customerName: userTable.name,
      customerEmail: userTable.email,
    })
    .from(topupRequests)
    .innerJoin(userTable, eq(topupRequests.userId, userTable.id))
    .orderBy(desc(topupRequests.createdAt))
    .limit(100)

  return rows.map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    method: row.method as TopupMethod,
    methodLabel: TOPUP_METHODS[row.method as TopupMethod] ?? row.method,
    reference: row.reference,
    receipt: row.receipt,
    status: row.status as AdminTopup['status'],
    adminNote: row.adminNote,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function approveTopupRequest(id: string) {
  await requireAdmin()

  const result = await approveTopup(id)

  if (result.ok) {
    revalidatePath('/admin')
    revalidatePath('/wallet')
  }

  return result
}

export async function rejectTopupRequest(id: string, note: string) {
  await requireAdmin()

  const clean = String(note ?? '').trim().slice(0, 200)

  if (clean.length < 3) {
    return { ok: false as const, error: 'اكتب سبب الرفض للعميل' }
  }

  const result = await rejectTopup(id, clean)

  if (result.ok) {
    revalidatePath('/admin')
    revalidatePath('/wallet')
  }

  return result
}

/* ── بطاقات الشحن ── */

export type AdminCard = {
  id: string
  code: string
  amount: number
  batch: string
  status: 'active' | 'redeemed' | 'disabled'
  redeemedByName: string | null
  createdAt: string
}

export type CardBatchSummary = {
  batch: string
  amount: number
  total: number
  active: number
  redeemed: number
  createdAt: string
}

export async function listCardBatches(): Promise<CardBatchSummary[]> {
  await requireAdmin()

  const rows = await db
    .select({
      batch: prepaidCards.batch,
      amount: prepaidCards.amount,
      total: sql<string>`count(*)`,
      active: sql<string>`count(*) filter (where ${prepaidCards.status} = 'active')`,
      redeemed: sql<string>`count(*) filter (where ${prepaidCards.status} = 'redeemed')`,
      createdAt: sql<string>`max(${prepaidCards.createdAt})`,
    })
    .from(prepaidCards)
    .groupBy(prepaidCards.batch, prepaidCards.amount)
    .orderBy(sql`max(${prepaidCards.createdAt}) desc`)
    .limit(50)

  return rows.map((row) => ({
    batch: row.batch,
    amount: Number(row.amount),
    total: Number(row.total),
    active: Number(row.active),
    redeemed: Number(row.redeemed),
    createdAt: new Date(row.createdAt).toISOString(),
  }))
}

export async function listCardsOfBatch(batch: string): Promise<AdminCard[]> {
  await requireAdmin()

  const rows = await db
    .select({
      id: prepaidCards.id,
      code: prepaidCards.code,
      amount: prepaidCards.amount,
      batch: prepaidCards.batch,
      status: prepaidCards.status,
      createdAt: prepaidCards.createdAt,
      redeemedByName: userTable.name,
    })
    .from(prepaidCards)
    .leftJoin(userTable, eq(prepaidCards.redeemedBy, userTable.id))
    .where(eq(prepaidCards.batch, batch))
    .orderBy(prepaidCards.code)
    .limit(500)

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    amount: Number(row.amount),
    batch: row.batch,
    status: row.status as AdminCard['status'],
    redeemedByName: row.redeemedByName,
    createdAt: row.createdAt.toISOString(),
  }))
}

const MAX_BATCH_SIZE = 200

/** ينشئ دفعة بطاقات جديدة ويعيد الأكواد لطباعتها */
export async function generateCards(input: { amount: number; count: number }) {
  await requireAdmin()

  const amount = Number(input.amount)
  const count = Math.trunc(Number(input.count))

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false as const, error: 'أدخل قيمة البطاقة' }
  }

  if (amount > 5000) {
    return { ok: false as const, error: 'أقصى قيمة للبطاقة 5000 جنيه' }
  }

  if (!Number.isFinite(count) || count < 1) {
    return { ok: false as const, error: 'أدخل عدد البطاقات' }
  }

  if (count > MAX_BATCH_SIZE) {
    return { ok: false as const, error: `أقصى عدد في الدفعة ${MAX_BATCH_SIZE} بطاقة` }
  }

  const stamp = new Date()
  const batch = `${stamp.toISOString().slice(0, 10)}-${amount}-${stamp
    .getTime()
    .toString(36)
    .slice(-4)
    .toUpperCase()}`

  // أكواد فريدة داخل الدفعة قبل الإدراج، وقيد UNIQUE يحمي من أي تكرار عام
  const codes = new Set<string>()
  while (codes.size < count) {
    codes.add(generateCardCode())
  }

  const values = Array.from(codes, (code) => ({
    id: `card_${crypto.randomUUID()}`,
    code,
    amount: amount.toFixed(2),
    batch,
  }))

  await db.insert(prepaidCards).values(values)

  revalidatePath('/admin')

  return { ok: true as const, batch, codes: Array.from(codes) }
}

/** إيقاف بطاقة لم تُستخدم (بطاقة تالفة أو مفقودة) */
export async function disableCard(id: string) {
  await requireAdmin()

  const [card] = await db.select().from(prepaidCards).where(eq(prepaidCards.id, id))

  if (!card) return { ok: false as const, error: 'البطاقة غير موجودة' }

  if (card.status === 'redeemed') {
    return { ok: false as const, error: 'لا يمكن إيقاف بطاقة مستخدمة' }
  }

  await db
    .update(prepaidCards)
    .set({ status: card.status === 'disabled' ? 'active' : 'disabled' })
    .where(eq(prepaidCards.id, id))

  revalidatePath('/admin')

  return { ok: true as const }
}

/* ── بيانات التحويل ── */

export async function savePayoutMethod(input: {
  id: string
  holder: string
  number: string
  note: string
  enabled: boolean
}) {
  await requireAdmin()

  if (!['bank', 'wallet', 'instapay'].includes(input.id)) {
    return { ok: false as const, error: 'طريقة غير معروفة' }
  }

  const number = String(input.number ?? '').trim().slice(0, 60)
  const holder = String(input.holder ?? '').trim().slice(0, 80)
  const note = String(input.note ?? '').trim().slice(0, 200)

  // لا يصح تفعيل طريقة بلا رقم، وإلا رأى العميل بيانات ناقصة
  if (input.enabled && number.length < 5) {
    return { ok: false as const, error: 'أدخل رقم الحساب أو المحفظة قبل التفعيل' }
  }

  if (input.enabled && holder.length < 3) {
    return { ok: false as const, error: 'أدخل اسم صاحب الحساب قبل التفعيل' }
  }

  await db
    .update(payoutSettings)
    .set({ holder, number, note, enabled: input.enabled, updatedAt: new Date() })
    .where(eq(payoutSettings.id, input.id))

  revalidatePath('/admin')
  revalidatePath('/wallet')

  return { ok: true as const }
}
