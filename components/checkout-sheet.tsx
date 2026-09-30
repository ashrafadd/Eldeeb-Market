'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as Icons from 'lucide-react'
import { Check, CircleCheckBig, Loader2, MapPin, Plus, X } from 'lucide-react'
import { formatEGP } from '@/lib/data'
import { paymentMethods, type PaymentMethodId } from '@/lib/account'
import { placeOrder } from '@/app/actions/account'
import { useStore } from '@/components/store-provider'
import { AddressForm } from '@/components/address-form'
import { cn } from '@/lib/utils'

function MethodIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Wallet
  return <Icon className={className} aria-hidden="true" />
}

export function CheckoutSheet({
  subtotal,
  delivery,
  balance,
  onClose,
}: {
  subtotal: number
  delivery: number
  balance: number
  onClose: () => void
}) {
  const router = useRouter()
  const { addresses, activeAddress, isSignedIn, selectAddress, clearCart } = useStore()
  const [methodId, setMethodId] = useState<PaymentMethodId>('cod')
  const [account, setAccount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState<{ reference: string; points: number } | null>(null)
  // إدارة العنوان داخل الصفحة: تبديل بين العرض واختيار عنوان محفوظ وإضافة جديد
  const [addressMode, setAddressMode] = useState<'view' | 'list' | 'add'>('view')

  const method = paymentMethods.find((item) => item.id === methodId) ?? paymentMethods[0]
  const total = subtotal + delivery + method.fee
  const addressText = activeAddress
    ? `${activeAddress.city} - ${activeAddress.village}`
    : null

  async function handleConfirm() {
    if (!isSignedIn) {
      setError('سجل الدخول أولاً لحفظ طلبك ونقاطك')
      return
    }
    if (!addressText) {
      setError('اختر عنوان التوصيل أولاً من أعلى الصفحة')
      return
    }
    if (method.needsAccount && account.trim().length < 5) {
      setError(`أدخل ${method.accountLabel} بشكل صحيح`)
      return
    }
    if (methodId === 'balance' && balance < total) {
      setError(`رصيدك ${formatEGP(balance)} ولا يكفي. اشحن رصيدك أولاً من صفحة المحفظة`)
      return
    }

    setError(null)
    setPending(true)

    const result = await placeOrder({
      paymentMethod: methodId,
      paymentRef: method.needsAccount ? account.trim() : undefined,
    })

    setPending(false)

    if (!result.ok) {
      setError(result.error ?? 'تعذر إتمام الطلب، حاول مرة أخرى')
      return
    }

    clearCart()
    setDone({ reference: result.reference, points: result.pointsEarned })
    router.refresh()
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-md rounded-t-3xl bg-card p-6 pb-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-16 items-center justify-center rounded-3xl bg-secondary">
              <CircleCheckBig className="size-8 text-primary" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-extrabold text-foreground">تم تأكيد طلبك</h2>
            <p className="text-[13px] leading-relaxed text-muted-foreground text-pretty">
              {`رقم الطلب ${done.reference} — سيتم التوصيل إلى ${addressText} خلال 60 دقيقة.`}
            </p>
            <p className="rounded-2xl bg-secondary/70 px-4 py-2 text-[12px] font-bold text-secondary-foreground">
              {`ربحت ${done.points.toLocaleString('ar-EG')} نقطة من هذا الطلب`}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-5">
            <Link
              href="/account"
              className="rounded-2xl bg-primary py-3.5 text-center text-sm font-extrabold text-primary-foreground"
            >
              تتبع الطلب في حسابي
            </Link>
            <Link
              href="/"
              onClick={onClose}
              className="rounded-2xl border border-border py-3.5 text-center text-sm font-bold text-foreground"
            >
              متابعة التسوق
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 backdrop-blur-sm">
      <div className="mx-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card">
        <header className="sticky top-0 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3.5">
          <h2 className="text-sm font-extrabold text-foreground">إتمام الشراء</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl border border-border"
          >
            <X className="size-4 text-foreground" aria-hidden="true" />
            <span className="sr-only">إغلاق</span>
          </button>
        </header>

        <div className="px-4 py-4">
          <section aria-label="عنوان التوصيل" className="rounded-2xl bg-secondary/50 p-3.5">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-muted-foreground">التوصيل إلى</p>
                  {isSignedIn && addressMode === 'view' ? (
                    <button
                      type="button"
                      onClick={() => setAddressMode(addresses.length > 0 ? 'list' : 'add')}
                      className="text-[11px] font-bold text-primary underline"
                    >
                      {activeAddress ? 'تغيير' : 'إضافة عنوان'}
                    </button>
                  ) : null}
                </div>

                {/* وضع العرض */}
                {addressMode === 'view' ? (
                  activeAddress ? (
                    <>
                      <p className="text-[13px] font-extrabold text-foreground">{addressText}</p>
                      <p className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                        {activeAddress.details}
                      </p>
                    </>
                  ) : (
                    <p className="text-[12px] font-bold text-destructive">
                      {isSignedIn
                        ? 'لم يتم اختيار عنوان بعد'
                        : 'سجل الدخول أولاً لاختيار عنوان التوصيل'}
                    </p>
                  )
                ) : null}

                {/* وضع اختيار عنوان محفوظ */}
                {addressMode === 'list' ? (
                  <div className="mt-2 flex flex-col gap-1.5">
                    <ul className="flex flex-col gap-1.5">
                      {addresses.map((address) => {
                        const isActive = activeAddress?.id === address.id
                        return (
                          <li key={address.id}>
                            <button
                              type="button"
                              onClick={() => {
                                selectAddress(address.id)
                                setAddressMode('view')
                                setError(null)
                              }}
                              className={cn(
                                'flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-right transition-colors',
                                isActive ? 'bg-card ring-1 ring-primary/35' : 'hover:bg-card/60',
                              )}
                            >
                              <span
                                className={cn(
                                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
                                  isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card text-muted-foreground',
                                )}
                              >
                                {isActive ? <Check className="size-2.5" /> : null}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[12px] font-bold text-foreground">
                                  {address.city} - {address.village}
                                </span>
                                <span className="block text-[10px] leading-4 text-muted-foreground">
                                  {address.details}
                                </span>
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setAddressMode('add')}
                        className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-dashed border-primary/45 py-2 text-[11px] font-bold text-primary"
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                        عنوان جديد
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddressMode('view')}
                        className="rounded-xl bg-card px-3 py-2 text-[11px] font-bold text-foreground"
                      >
                        رجوع
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* وضع إضافة عنوان جديد */}
                {addressMode === 'add' ? (
                  <div className="mt-2">
                    <AddressForm
                      onSaved={() => {
                        setAddressMode('view')
                        setError(null)
                      }}
                      onCancel={() =>
                        setAddressMode(addresses.length > 0 ? 'list' : 'view')
                      }
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <h3 className="pb-2.5 pt-5 text-sm font-extrabold text-foreground">طريقة الدفع</h3>
          <ul className="flex flex-col gap-2">
            {paymentMethods.map((item) => {
              const isActive = item.id === methodId
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setMethodId(item.id)
                      setAccount('')
                      setError(null)
                    }}
                    aria-pressed={isActive}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border p-3 text-start transition-colors',
                      isActive ? 'border-primary bg-secondary/60' : 'border-border bg-card',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl',
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary',
                      )}
                    >
                      <MethodIcon name={item.icon} className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-extrabold text-foreground">
                        {item.name}
                      </span>
                      <span className="block text-[11px] leading-4 text-muted-foreground text-pretty">
                        {item.hint}
                      </span>
                      {item.fee > 0 ? (
                        <span className="block pt-0.5 text-[10px] font-bold text-accent-foreground">
                          {`رسوم إضافية ${formatEGP(item.fee)}`}
                        </span>
                      ) : (
                        <span className="block pt-0.5 text-[10px] font-bold text-primary">
                          بدون رسوم إضافية
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                        isActive ? 'border-primary bg-primary' : 'border-border',
                      )}
                    >
                      {isActive ? (
                        <Check className="size-3 text-primary-foreground" aria-hidden="true" />
                      ) : null}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {method.needsAccount ? (
            <div className="pt-4">
              <label
                htmlFor="pay-account"
                className="block pb-1.5 text-[11px] font-bold text-muted-foreground"
              >
                {method.accountLabel}
              </label>
              <input
                id="pay-account"
                value={account}
                onChange={(event) => {
                  setAccount(event.target.value)
                  setError(null)
                }}
                inputMode={methodId === 'wallet' ? 'tel' : 'text'}
                dir="ltr"
                placeholder={method.accountPlaceholder}
                className="w-full rounded-2xl border border-border bg-secondary/40 px-3.5 py-3 text-start text-[13px] font-medium text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
              <p className="pt-1.5 text-[10px] leading-4 text-muted-foreground text-pretty">
                {methodId === 'wallet'
                  ? 'سيصلك كود تأكيد على رقم المحفظة لإتمام الدفع.'
                  : 'سيتم إرسال طلب تحويل انستاباي إلى عنوان الدفع الخاص بك.'}
              </p>
            </div>
          ) : null}

          <section aria-label="ملخص الدفع" className="mt-5 rounded-2xl bg-secondary/50 p-3.5">
            <dl className="flex flex-col gap-2 text-[12px]">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">إجمالي المنتجات</dt>
                <dd className="font-bold text-foreground">{formatEGP(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">رسوم التوصيل</dt>
                <dd className="font-bold text-foreground">
                  {delivery === 0 ? 'مجاناً' : formatEGP(delivery)}
                </dd>
              </div>
              {method.fee > 0 ? (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{`رسوم ${method.name}`}</dt>
                  <dd className="font-bold text-foreground">{formatEGP(method.fee)}</dd>
                </div>
              ) : null}
              <div className="mt-1 flex items-center justify-between border-t border-border pt-2.5">
                <dt className="text-[13px] font-extrabold text-foreground">المطلوب دفعه</dt>
                <dd className="text-base font-extrabold text-primary">{formatEGP(total)}</dd>
              </div>
              {methodId === 'balance' ? (
                <div className="flex items-center justify-between border-t border-border pt-2.5">
                  <dt className="text-muted-foreground">
                    {balance >= total ? 'الرصيد بعد الدفع' : 'رصيدك الحالي'}
                  </dt>
                  <dd
                    className={cn(
                      'font-bold',
                      balance >= total ? 'text-foreground' : 'text-destructive',
                    )}
                  >
                    {formatEGP(balance >= total ? balance - total : balance)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          {methodId === 'balance' && balance < total ? (
            <Link
              href="/wallet"
              className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-destructive/10 px-3.5 py-3"
            >
              <span className="min-w-0 text-[12px] font-bold text-destructive">
                {`ينقصك ${formatEGP(total - balance)} — اشحن رصيدك`}
              </span>
              <span className="shrink-0 text-[11px] font-bold text-destructive underline">
                المحفظة
              </span>
            </Link>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-2xl bg-destructive/10 px-3.5 py-2.5 text-[12px] font-bold text-destructive"
            >
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="mt-4 mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-70"
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {methodId === 'cod' ? 'تأكيد الطلب' : `ادفع ${formatEGP(total)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
