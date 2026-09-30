import { betterAuth } from 'better-auth'
import { phoneNumber } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'
import { pool } from '@/lib/db'
import { deliverOtp } from '@/lib/otp'

function resolveBaseURL() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.V0_RUNTIME_URL
}

function resolveTrustedOrigins() {
  const origins: string[] = []

  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000')
    for (const url of [
      process.env.V0_RUNTIME_URL,
      process.env.V0_DEV_APP_URL,
      process.env.V0_BUILD_URL,
      process.env.V0_SANDBOX_URL,
    ]) {
      if (url) origins.push(url)
    }
  } else {
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
      origins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
    if (process.env.VERCEL_URL) origins.push(`https://${process.env.VERCEL_URL}`)
  }

  return Array.from(new Set(origins))
}

/** يحوّل الرقم المصري (01xxxxxxxxx) إلى الصيغة الدولية (+201xxxxxxxxx). */
export function toEgyptE164(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '')
  if (digits.startsWith('20')) return `+${digits}`
  if (digits.startsWith('0')) return `+20${digits.slice(1)}`
  return `+20${digits}`
}

export const auth = betterAuth({
  database: pool,
  baseURL: resolveBaseURL(),
  trustedOrigins: resolveTrustedOrigins(),
  // الدخول والتسجيل يتمّان حصراً عبر رقم الموبايل + OTP، فلا كلمة سر.
  emailAndPassword: { enabled: false },
  plugins: [
    phoneNumber({
      // إرسال رمز التحقق — الوضع التجريبي يعرض الرمز، ويُستبدل بمزوّد SMS لاحقاً.
      sendOTP: async ({ phoneNumber: phone, code }) => {
        await deliverOtp(phone, code)
      },
      otpLength: 6,
      expiresIn: 300, // 5 دقائق
      // عند التحقق لأول مرة يُنشأ الحساب تلقائياً (تسجيل + دخول في خطوة واحدة).
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone.replace(/[^\d]/g, '')}@phone.tasweeqa.local`,
        // اسم عرض ودّي افتراضي؛ الرقم يبقى هو المعرّف الأساسي ويظهر أسفله.
        getTempName: () => 'عميل تسويقة الديب',
      },
    }),
    // يجب أن يبقى آخر عنصر ليصل كوكي الجلسة إلى Next.js عند الدخول من Server Action.
    nextCookies(),
  ],
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // مطلوب لأن معاينة v0 تعمل داخل إطار من نطاق مختلف،
          // وبدون هذه الخصائص يفقد المتصفح كوكي الجلسة بعد الدخول.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
