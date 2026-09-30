import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  payoutSettings,
  prepaidCards,
  topupRequests,
  walletTransactions,
} from '@/lib/db/schema'

/* ── الحدود ── */

export const MIN_TOPUP = 50
export const MAX_TOPUP = 20000

export const TOPUP_METHODS = {
  bank: 'حساب بنكي',
  wallet: 'محفظة إلكترونية',
  instapay: 'انستاباي',
} as const

export type TopupMethod = keyof typeof TOPUP_METHODS

export const TX_LABELS = {
  topup: 'تعبئة بتحويل',
  card: 'بطاقة شحن',
  order: 'دفع طلب',
  refund: 'استرداد',
  adjustment: 'تسوية إدارية',
} as const

/* ── الأنواع ── */

export type WalletTx = {
  id: string
  kind: keyof typeof TX_LABELS
  amount: number
  description: string
  createdAt: Date
}

export type TopupRequest = {
  id: string
  amount: number
  method: TopupMethod
  reference: string
  status: 'pending' | 'approved' | 'rejected'
  adminNote: string
  createdAt: Date
}

export type PayoutMethod = {
  id: string
  label: string
  holder: string
  number: string
  note: string
  enabled: boolean
}

/* ── القراءة ── */

/**
 * الرصيد الحالي = مجموع حركات السجل.
 * حسابه بالجمع يضمن ألّا ينحرف الرقم أبداً عن الحركات المسجلة.
 */
export async function getBalance(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${walletTransactions.amount}), 0)` })
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, userId))

  return Math.round(Number(row?.total ?? 0) * 100) / 100
}

export async function getWalletHistory(userId: string, limit = 50): Promise<WalletTx[]> {
  const rows = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, userId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind as WalletTx['kind'],
    amount: Number(row.amount),
    description: row.description,
    createdAt: row.createdAt,
  }))
}

export async function getMyTopupRequests(userId: string): Promise<TopupRequest[]> {
  const rows = await db
    .select()
    .from(topupRequests)
    .where(eq(topupRequests.userId, userId))
    .orderBy(desc(topupRequests.createdAt))
    .limit(20)

  return rows.map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    method: row.method as TopupMethod,
    reference: row.reference,
    status: row.status as TopupRequest['status'],
    adminNote: row.adminNote,
    createdAt: row.createdAt,
  }))
}

/** طرق التحويل المتاحة للعميل — المفعّلة فقط والتي اكتملت بياناتها */
export async function getActivePayoutMethods(): Promise<PayoutMethod[]> {
  const rows = await db.select().from(payoutSettings)

  return rows
    .filter((row) => row.enabled && row.number.trim().length > 0)
    .map(toPayoutMethod)
}

/** كل طرق التحويل بما فيها الفارغة — للوحة التحكم */
export async function getAllPayoutMethods(): Promise<PayoutMethod[]> {
  const rows = await db.select().from(payoutSettings)
  return rows.map(toPayoutMethod)
}

function toPayoutMethod(row: typeof payoutSettings.$inferSelect): PayoutMethod {
  return {
    id: row.id,
    label: row.label,
    holder: row.holder,
    number: row.number,
    note: row.note,
    enabled: row.enabled,
  }
}

/* ── قراءة لوحة التحكم ── */

export async function countPendingTopups(): Promise<number> {
  const [row] = await db
    .select({ count: sql<string>`count(*)` })
    .from(topupRequests)
    .where(eq(topupRequests.status, 'pending'))

  return Number(row?.count ?? 0)
}

/* ── الكتابة ── */

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

/**
 * يقرأ الرصيد بعد قَفل صفّ المستخدم، فتُنفَّذ عمليات المحفظة للعميل
 * الواحد بالتتابع ولا يمكن لطلبين متزامنين أن يصرفا الرصيد نفسه.
 *
 * القفل على صفّ المستخدم لا على صفوف الحركات، لأن Postgres يمنع
 * FOR UPDATE مع دوال التجميع مثل sum().
 */
export async function lockedBalance(
  tx: Pick<typeof db, 'select' | 'execute'>,
  userId: string,
): Promise<number> {
  await tx.execute(sql`select 1 from "user" where id = ${userId} for update`)

  const [row] = await tx
    .select({ total: sql<string>`coalesce(sum(${walletTransactions.amount}), 0)` })
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, userId))

  return Number(row?.total ?? 0)
}

/**
 * خصم من الرصيد داخل معاملة واحدة.
 * يتحقق من الكفاية قبل الخصم فلا يمكن أن يصبح الرصيد سالباً
 * حتى لو أُرسل طلبان في اللحظة نفسها.
 */
export async function debitWallet(input: {
  userId: string
  amount: number
  description: string
  refId?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { ok: false, error: 'مبلغ غير صحيح' }
  }

  return db.transaction(async (tx) => {
    const balance = await lockedBalance(tx, input.userId)

    if (balance + 1e-9 < input.amount) {
      return { ok: false as const, error: 'الرصيد غير كافٍ' }
    }

    await tx.insert(walletTransactions).values({
      id: newId('wtx'),
      userId: input.userId,
      kind: 'order',
      amount: (-input.amount).toFixed(2),
      description: input.description,
      refId: input.refId ?? null,
    })

    return { ok: true as const }
  })
}

/** إعادة مبلغ إلى المحفظة (عند إلغاء طلب مثلاً) */
export async function refundWallet(input: {
  userId: string
  amount: number
  description: string
  refId?: string
}) {
  await db.insert(walletTransactions).values({
    id: newId('wtx'),
    userId: input.userId,
    kind: 'refund',
    amount: input.amount.toFixed(2),
    description: input.description,
    refId: input.refId ?? null,
  })
}

/**
 * استبدال بطاقة شحن.
 * تُقفل البطاقة داخل المعاملة ثم يُتحقق من حالتها، فلا يمكن
 * استخدام الكود مرتين ولو جرت المحاولتان في اللحظة نفسها.
 */
export async function redeemCard(
  userId: string,
  rawCode: string,
): Promise<{ ok: true; amount: number } | { ok: false; error: string }> {
  const code = normalizeCardCode(rawCode)

  if (code.length < 8) {
    return { ok: false, error: 'كود البطاقة غير صحيح' }
  }

  return db.transaction(async (tx) => {
    const [card] = await tx
      .select()
      .from(prepaidCards)
      .where(eq(prepaidCards.code, code))
      .for('update')

    if (!card) {
      return { ok: false as const, error: 'هذا الكود غير موجود' }
    }

    if (card.status === 'redeemed') {
      return { ok: false as const, error: 'هذه البطاقة مستخدمة بالفعل' }
    }

    if (card.status !== 'active') {
      return { ok: false as const, error: 'هذه البطاقة موقوفة' }
    }

    const amount = Number(card.amount)

    await tx
      .update(prepaidCards)
      .set({ status: 'redeemed', redeemedBy: userId, redeemedAt: new Date() })
      .where(eq(prepaidCards.id, card.id))

    await tx.insert(walletTransactions).values({
      id: newId('wtx'),
      userId,
      kind: 'card',
      amount: amount.toFixed(2),
      description: `بطاقة شحن ${maskCode(code)}`,
      refId: card.id,
    })

    return { ok: true as const, amount }
  })
}

/** تقديم طلب تعبئة بالتحويل — لا يضيف رصيداً حتى يعتمده المدير */
export async function createTopupRequest(input: {
  userId: string
  amount: number
  method: TopupMethod
  reference: string
  receipt: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const pending = await db
    .select({ id: topupRequests.id })
    .from(topupRequests)
    .where(
      and(eq(topupRequests.userId, input.userId), eq(topupRequests.status, 'pending')),
    )

  if (pending.length >= 3) {
    return { ok: false, error: 'لديك طلبات معلقة كثيرة، انتظر مراجعتها أولاً' }
  }

  await db.insert(topupRequests).values({
    id: newId('top'),
    userId: input.userId,
    amount: input.amount.toFixed(2),
    method: input.method,
    reference: input.reference,
    receipt: input.receipt,
  })

  return { ok: true }
}

/**
 * اعتماد طلب تعبئة وإضافة الرصيد.
 * الطلب يُقفل ويُتحقق أنه معلق قبل الإضافة، فلا يمكن اعتماده مرتين.
 */
export async function approveTopup(
  requestId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return db.transaction(async (tx) => {
    const [req] = await tx
      .select()
      .from(topupRequests)
      .where(eq(topupRequests.id, requestId))
      .for('update')

    if (!req) return { ok: false as const, error: 'الطلب غير موجود' }
    if (req.status !== 'pending') {
      return { ok: false as const, error: 'تمت مراجعة هذا الطلب بالفعل' }
    }

    await tx
      .update(topupRequests)
      .set({ status: 'approved', reviewedAt: new Date() })
      .where(eq(topupRequests.id, requestId))

    await tx.insert(walletTransactions).values({
      id: newId('wtx'),
      userId: req.userId,
      kind: 'topup',
      amount: Number(req.amount).toFixed(2),
      description: `تعبئة عبر ${TOPUP_METHODS[req.method as TopupMethod] ?? req.method}`,
      refId: req.id,
    })

    return { ok: true as const }
  })
}

export async function rejectTopup(
  requestId: string,
  note: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return db.transaction(async (tx) => {
    const [req] = await tx
      .select()
      .from(topupRequests)
      .where(eq(topupRequests.id, requestId))
      .for('update')

    if (!req) return { ok: false as const, error: 'الطلب غير موجود' }
    if (req.status !== 'pending') {
      return { ok: false as const, error: 'تمت مراجعة هذا الطلب بالفعل' }
    }

    await tx
      .update(topupRequests)
      .set({ status: 'rejected', adminNote: note, reviewedAt: new Date() })
      .where(eq(topupRequests.id, requestId))

    return { ok: true as const }
  })
}

/* ── أكواد البطاقات ── */

/** حروف وأرقام بلا رموز متشابهة (0/O و1/I/L) لتقليل الخطأ عند الإدخال */
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export function generateCardCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  const chars = Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length])

  return `TSW-${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars
    .slice(8, 12)
    .join('')}`
}

/**
 * يقبل الكود بأي تنسيق يكتبه العميل: بمسافات أو شرطات أو حروف صغيرة،
 * ومع بادئة TSW أو بدونها — لأن العميل يكتب ما يراه على البطاقة.
 */
export function normalizeCardCode(raw: string): string {
  let clean = raw
    .toUpperCase()
    .replace(/[\s\u0600-\u06FF]/g, '')
    .replace(/[^0-9A-Z]/g, '')

  // تُحذف البادئة إن كتبها العميل، فيتبقى الجزء المميز (12 خانة)
  if (clean.length === 15 && clean.startsWith('TSW')) {
    clean = clean.slice(3)
  }

  if (clean.length !== 12) return clean

  return `TSW-${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`
}

function maskCode(code: string) {
  return `••••${code.slice(-4)}`
}
