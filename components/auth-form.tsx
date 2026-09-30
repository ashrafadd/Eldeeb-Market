'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Phone, ShieldCheck, ArrowRight } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Logo } from '@/components/logo'

type Step = 'phone' | 'otp'

/** يتحقق أن الرقم مصري صحيح: 11 رقماً يبدأ بـ 01. */
function isValidEgyptPhone(raw: string): boolean {
  const digits = raw.replace(/[^\d]/g, '')
  return /^01[0-25]\d{8}$/.test(digits)
}

/** يحوّل المُدخل إلى الصيغة الدولية +20 التي يخزّنها الخادم. */
function toE164(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '')
  if (digits.startsWith('20')) return `+${digits}`
  if (digits.startsWith('0')) return `+20${digits.slice(1)}`
  return `+20${digits}`
}

export function AuthForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [demoCode, setDemoCode] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const otpInputRef = useRef<HTMLInputElement>(null)

  // عدّاد إعادة الإرسال
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  // في الوضع التجريبي نعرض الرمز الفعلي لتسهيل الاختبار
  useEffect(() => {
    if (step !== 'otp') return
    let active = true
    async function pull() {
      try {
        const res = await fetch(`/api/otp-demo?phone=${encodeURIComponent(phone)}`)
        const data = (await res.json()) as { demo: boolean; code: string | null }
        if (active && data.demo && data.code) setDemoCode(data.code)
      } catch {
        /* تجاهل */
      }
    }
    pull()
    return () => {
      active = false
    }
  }, [step, phone])

  useEffect(() => {
    if (step === 'otp') otpInputRef.current?.focus()
  }, [step])

  async function sendCode() {
    setError(null)
    if (!isValidEgyptPhone(phone)) {
      setError('أدخل رقم موبايل مصري صحيح (11 رقماً يبدأ بـ 01)')
      return
    }
    setPending(true)
    const result = await authClient.phoneNumber.sendOtp({ phoneNumber: toE164(phone) })
    setPending(false)

    if (result.error) {
      console.error('send otp failed:', result.error)
      setError('تعذر إرسال رمز التحقق. حاول مرة أخرى.')
      return
    }
    setStep('otp')
    setResendIn(45)
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (code.replace(/[^\d]/g, '').length !== 6) {
      setError('أدخل رمز التحقق المكوّن من 6 أرقام')
      return
    }
    setPending(true)
    // التحقق ينشئ الحساب تلقائياً أول مرة (تسجيل + دخول)، أو يسجّل الدخول لاحقاً.
    const result = await authClient.phoneNumber.verify({
      phoneNumber: toE164(phone),
      code: code.replace(/[^\d]/g, ''),
      disableSession: false,
    })
    setPending(false)

    if (result.error) {
      console.error('verify otp failed:', result.error)
      setError('رمز التحقق غير صحيح أو انتهت صلاحيته')
      return
    }
    router.refresh()
  }

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col items-center gap-3 pb-6 text-center">
        <Logo size={56} withText={false} tone="dark" />
        <div>
          <h1 className="text-lg font-extrabold text-foreground">
            {step === 'phone' ? 'الدخول برقم الموبايل' : 'تأكيد رقم الموبايل'}
          </h1>
          <p className="pt-1 text-[12px] leading-5 text-muted-foreground text-pretty">
            {step === 'phone'
              ? 'أدخل رقم موبايلك لاستلام رمز تحقق والدخول أو إنشاء حسابك'
              : `أرسلنا رمز تحقق إلى الرقم ${phone}`}
          </p>
        </div>
      </div>

      {step === 'phone' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void sendCode()
          }}
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-foreground">رقم الموبايل</span>
            <span className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-3">
              <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="shrink-0 text-[13px] font-bold text-muted-foreground" dir="ltr">
                +20
              </span>
              <input
                type="tel"
                inputMode="numeric"
                dir="ltr"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                placeholder="01012345678"
                maxLength={11}
                className="w-full bg-transparent text-start text-[14px] font-bold tracking-wide text-foreground outline-none placeholder:font-medium placeholder:text-muted-foreground"
              />
            </span>
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-destructive/10 px-3 py-2.5 text-[12px] font-bold text-destructive"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-70"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="size-4" aria-hidden="true" />
            )}
            إرسال رمز التحقق
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-col gap-3">
          {demoCode ? (
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-3.5 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                <span className="text-[11px] font-bold text-foreground">
                  وضع تجريبي — الرمز:
                </span>
              </div>
              <span className="text-[15px] font-extrabold tracking-[0.3em] text-primary" dir="ltr">
                {demoCode}
              </span>
            </div>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-foreground">رمز التحقق</span>
            <input
              ref={otpInputRef}
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              autoComplete="one-time-code"
              placeholder="______"
              maxLength={6}
              className="rounded-2xl border border-border bg-card px-3 py-3.5 text-center text-2xl font-extrabold tracking-[0.5em] text-foreground outline-none placeholder:text-muted-foreground/40"
            />
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-destructive/10 px-3 py-2.5 text-[12px] font-bold text-destructive"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-70"
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            تأكيد ودخول
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => {
                setStep('phone')
                setCode('')
                setDemoCode(null)
                setError(null)
              }}
              className="text-[12px] font-bold text-muted-foreground"
            >
              تغيير الرقم
            </button>
            <button
              type="button"
              disabled={resendIn > 0 || pending}
              onClick={() => void sendCode()}
              className="text-[12px] font-bold text-primary disabled:text-muted-foreground"
            >
              {resendIn > 0 ? `إعادة الإرسال بعد ${resendIn}ث` : 'إعادة إرسال الرمز'}
            </button>
          </div>
        </form>
      )}

      <p className="mt-5 rounded-2xl border border-dashed border-border px-3.5 py-3 text-[11px] leading-5 text-muted-foreground text-pretty">
        رقم موبايلك هو معرّف حسابك، وترتبط به طلباتك ومحفظتك وعناوين التوصيل لتسهيل
        التواصل والتوصيل.
      </p>
    </div>
  )
}
