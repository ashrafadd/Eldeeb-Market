'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, MapPin, Plus, Trash2, X } from 'lucide-react'
import { useStore } from '@/components/store-provider'
import { AddressForm } from '@/components/address-form'

export function AddressPicker() {
  const {
    addresses,
    activeAddress,
    addressesLoading,
    isSignedIn,
    selectAddress,
    removeAddress,
  } = useStore()
  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) setShowForm(false)
  }, [open])

  return (
    <div className="relative px-4 pt-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex max-w-full items-center gap-1.5 rounded-full bg-primary-foreground/10 px-2.5 py-1 text-xs text-primary-foreground/80 ring-1 ring-primary-foreground/20 transition-colors hover:bg-primary-foreground/20"
      >
        <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="shrink-0">التوصيل إلى</span>
        <span className="truncate font-bold text-primary-foreground">
          {activeAddress
            ? `${activeAddress.city} - ${activeAddress.village}`
            : 'اختر عنوان التوصيل'}
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="إغلاق قائمة العناوين"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-foreground/25"
          />
          <div
            ref={panelRef}
            className="absolute inset-x-4 top-full z-50 mt-2 flex max-h-[calc(100dvh-13rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold">عناوين التوصيل</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
              >
                <X className="size-4" />
                <span className="sr-only">إغلاق</span>
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="p-2">
                {addressesLoading ? (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                    جارٍ تحميل عناوينك...
                  </p>
                ) : null}

                {!addressesLoading && addresses.length === 0 && (
                  <p className="px-2 py-6 text-center text-xs leading-relaxed text-muted-foreground text-pretty">
                    {isSignedIn
                      ? 'لا توجد عناوين محفوظة. أضف عنوانك الأول.'
                      : 'سجل الدخول من صفحة حسابي لحفظ عناوين التوصيل بشكل دائم.'}
                  </p>
                )}

                <ul className="flex flex-col gap-1.5">
                  {addresses.map((address) => {
                    const isActive = activeAddress?.id === address.id
                    return (
                      <li key={address.id} className="flex items-stretch gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            selectAddress(address.id)
                            setOpen(false)
                          }}
                          className={`flex flex-1 items-start gap-2 rounded-2xl px-3 py-2.5 text-right transition-colors ${
                            isActive
                              ? 'bg-secondary ring-1 ring-primary/35'
                              : 'hover:bg-secondary/60'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            {isActive ? (
                              <Check className="size-3" />
                            ) : (
                              <MapPin className="size-3" />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-bold">
                              {address.city} - {address.village}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                              {address.details}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAddress(address.id)}
                          className="flex w-9 shrink-0 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">حذف العنوان</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="border-t border-border p-3">
                {!isSignedIn ? (
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary py-2.5 text-xs font-bold text-primary-foreground"
                  >
                    تسجيل الدخول لإضافة عنوان
                  </Link>
                ) : !showForm ? (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-primary/45 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
                  >
                    <Plus className="size-4" />
                    إضافة عنوان جديد
                  </button>
                ) : (
                  <AddressForm
                    onSaved={() => setShowForm(false)}
                    onCancel={() => setShowForm(false)}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
