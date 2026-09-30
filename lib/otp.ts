import 'server-only'

/**
 * تسليم رمز التحقق (OTP).
 *
 * الوضع الحالي «تجريبي»: يُسجَّل الرمز في سجل الخادم ويُحفظ آخر رمز مؤقتاً
 * حتى تعرضه الواجهة، دون إرسال SMS فعلي.
 *
 * للتحويل إلى إرسال حقيقي لاحقاً: استبدل محتوى هذه الدالة باستدعاء مزوّد
 * الرسائل (Twilio أو غيره) — ولا شيء آخر في التطبيق يحتاج تعديلاً.
 */

const DEMO_MODE = process.env.OTP_MODE !== 'live'

// ذاكرة مؤقتة لآخر رمز لكل رقم (للوضع التجريبي فقط).
const lastCodes = new Map<string, { code: string; at: number }>()

export async function deliverOtp(phone: string, code: string): Promise<void> {
  if (DEMO_MODE) {
    lastCodes.set(phone, { code, at: Date.now() })
    console.log(`[v0] OTP (وضع تجريبي) للرقم ${phone}: ${code}`)
    return
  }

  // مكان ربط مزوّد SMS الحقيقي مستقبلاً:
  // await smsProvider.send({ to: phone, text: `رمز تسويقة الديب: ${code}` })
  console.log(`[v0] OTP live-mode requested for ${phone} (لا مزوّد مربوط بعد)`)
}

/** يُرجع آخر رمز في الوضع التجريبي فقط، لعرضه للمستخدم أثناء التطوير. */
export function peekDemoOtp(phone: string): string | null {
  if (!DEMO_MODE) return null
  const entry = lastCodes.get(phone)
  if (!entry) return null
  // نعرض الرمز خلال نافذة صلاحيته فقط.
  if (Date.now() - entry.at > 5 * 60 * 1000) {
    lastCodes.delete(phone)
    return null
  }
  return entry.code
}

export function isDemoOtpMode(): boolean {
  return DEMO_MODE
}
