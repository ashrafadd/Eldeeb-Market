import { NextResponse } from 'next/server'
import { peekDemoOtp, isDemoOtpMode } from '@/lib/otp'
import { toEgyptE164 } from '@/lib/auth'

/**
 * يُرجع آخر رمز OTP في الوضع التجريبي فقط، لعرضه للمستخدم أثناء التطوير.
 * في وضع الإرسال الحقيقي (OTP_MODE=live) لا يُرجع شيئاً.
 */
export async function GET(request: Request) {
  if (!isDemoOtpMode()) {
    return NextResponse.json({ demo: false, code: null })
  }

  const phone = new URL(request.url).searchParams.get('phone') ?? ''
  if (!phone) return NextResponse.json({ demo: true, code: null })

  const code = peekDemoOtp(toEgyptE164(phone))
  return NextResponse.json({ demo: true, code })
}
