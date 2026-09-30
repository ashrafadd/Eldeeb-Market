'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import {
  createTopupRequest,
  MAX_TOPUP,
  MIN_TOPUP,
  redeemCard,
  TOPUP_METHODS,
  type TopupMethod,
} from '@/lib/wallet'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

/** أقصى حجم لصورة الإيصال بعد الضغط في المتصفح */
const MAX_RECEIPT_CHARS = 900_000

/** استبدال بطاقة شحن مسبقة الدفع */
export async function redeemPrepaidCard(code: string) {
  const userId = await getUserId()

  if (typeof code !== 'string' || code.trim().length === 0) {
    return { ok: false as const, error: 'من فضلك أدخل كود البطاقة' }
  }

  const result = await redeemCard(userId, code)

  if (!result.ok) return result

  revalidatePath('/wallet')
  revalidatePath('/account')

  return { ok: true as const, amount: result.amount }
}

/** تقديم طلب تعبئة رصيد بعد التحويل */
export async function submitTopup(input: {
  amount: number
  method: string
  reference: string
  receipt: string
}) {
  const userId = await getUserId()

  const amount = Number(input.amount)

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false as const, error: 'من فضلك أدخل مبلغاً صحيحاً' }
  }

  if (Math.round(amount * 100) !== amount * 100) {
    return { ok: false as const, error: 'المبلغ لا يقبل أكثر من رقمين عشريين' }
  }

  if (amount < MIN_TOPUP) {
    return { ok: false as const, error: `أقل مبلغ للتعبئة ${MIN_TOPUP} جنيه` }
  }

  if (amount > MAX_TOPUP) {
    return { ok: false as const, error: `أقصى مبلغ للتعبئة ${MAX_TOPUP} جنيه` }
  }

  if (!(input.method in TOPUP_METHODS)) {
    return { ok: false as const, error: 'طريقة تحويل غير معروفة' }
  }

  const reference = String(input.reference ?? '').trim()

  if (reference.length < 4) {
    return { ok: false as const, error: 'أدخل رقم عملية التحويل' }
  }

  if (reference.length > 60) {
    return { ok: false as const, error: 'رقم العملية طويل جداً' }
  }

  const receipt = String(input.receipt ?? '')

  if (receipt && !receipt.startsWith('data:image/')) {
    return { ok: false as const, error: 'صورة الإيصال غير صالحة' }
  }

  if (receipt.length > MAX_RECEIPT_CHARS) {
    return { ok: false as const, error: 'صورة الإيصال كبيرة جداً' }
  }

  const result = await createTopupRequest({
    userId,
    amount,
    method: input.method as TopupMethod,
    reference,
    receipt,
  })

  if (!result.ok) return result

  revalidatePath('/wallet')

  return { ok: true as const }
}
