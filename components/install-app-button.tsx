'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, Share, SquarePlus, X } from 'lucide-react'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { cn } from '@/lib/utils'

type Props = {
  /** نمط العرض: زر بارز في صفحة الحساب أو صف داخل القائمة الجانبية */
  variant?: 'card' | 'menu'
  onDone?: () => void
}

export function InstallAppButton({ variant = 'card', onDone }: Props) {
  const { canInstall, isIos, promptInstall } = usePwaInstall()
  const [showIosHelp, setShowIosHelp] = useState(false)

  // لا نعرض الزر إطلاقاً إن لم يكن التثبيت متاحاً (مثبّت بالفعل أو غير مدعوم)
  if (!canInstall) return null

  async function handleClick() {
    if (isIos) {
      setShowIosHelp(true)
      return
    }
    await promptInstall()
    onDone?.()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          variant === 'card'
            ? 'flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-start transition-colors active:bg-primary/15'
            : 'flex w-full items-center gap-2.5 rounded-2xl bg-primary/10 px-2.5 py-2.5 text-start transition-colors active:bg-primary/15',
        )}
      >
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground',
            variant === 'card' ? 'size-10 rounded-2xl' : 'size-8',
          )}
        >
          <Download className={variant === 'card' ? 'size-[18px]' : 'size-4'} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block font-extrabold text-primary',
              variant === 'card' ? 'text-[12px]' : 'text-[12.5px]',
            )}
          >
            تثبيت التطبيق على الشاشة الرئيسية
          </span>
          {variant === 'card' ? (
            <span className="block truncate text-[10.5px] text-muted-foreground">
              أضِف تسويقة الديب كأيقونة على هاتفك للوصول السريع
            </span>
          ) : null}
        </span>
      </button>

      {showIosHelp && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[60] flex items-end justify-center">
              <button
                type="button"
                aria-label="إغلاق"
                onClick={() => setShowIosHelp(false)}
                className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px]"
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="طريقة التثبيت على آيفون"
                className="relative w-full max-w-[420px] rounded-t-3xl bg-card p-5 shadow-2xl animate-in slide-in-from-bottom duration-200"
              >
                <div className="flex items-center justify-between pb-3">
                  <h2 className="text-[14px] font-extrabold text-foreground">
                    التثبيت على آيفون
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowIosHelp(false)}
                    className="flex size-8 items-center justify-center rounded-xl bg-secondary"
                  >
                    <X className="size-4" aria-hidden="true" />
                    <span className="sr-only">إغلاق</span>
                  </button>
                </div>
                <ol className="flex flex-col gap-3 pt-1">
                  <li className="flex items-center gap-3 text-[12.5px] text-foreground">
                    <Share className="size-5 shrink-0 text-primary" aria-hidden="true" />
                    اضغط زر «مشاركة» في شريط سفاري بالأسفل.
                  </li>
                  <li className="flex items-center gap-3 text-[12.5px] text-foreground">
                    <SquarePlus className="size-5 shrink-0 text-primary" aria-hidden="true" />
                    اختر «إضافة إلى الشاشة الرئيسية».
                  </li>
                </ol>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
