'use client'

import { useCallback, useEffect, useState } from 'react'

// حدث beforeinstallprompt غير معرّف في أنواع TS الافتراضية
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// ── التقاط عالمي على مستوى الوحدة ──────────────────────────────
// المتصفح يطلق beforeinstallprompt مرة واحدة ومبكراً. نلتقطه هنا فور
// تحميل ملف الوحدة (قبل أن تُركّب أي قائمة/صفحة) ونخزّنه، حتى يجده أي
// مكوّن يُركّب لاحقاً بدل أن يفوته الحدث.
let storedPrompt: BeforeInstallPromptEvent | null = null
let appInstalled = false
const listeners = new Set<() => void>()

function notify() {
  for (const fn of listeners) fn()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    storedPrompt = event as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    appInstalled = true
    storedPrompt = null
    notify()
  })
}

/**
 * يكشف ما إذا كان التطبيق قابلاً للتثبيت، أو مثبّتاً بالفعل،
 * أو على iOS (الذي يحتاج خطوات يدوية عبر مشاركة سفاري).
 */
export function usePwaInstall() {
  const [hasPrompt, setHasPrompt] = useState(storedPrompt !== null)
  const [isInstalled, setIsInstalled] = useState(appInstalled)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // هل التطبيق يعمل بالفعل بوضع مستقل (مثبّت)؟
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) setIsInstalled(true)

    // اكتشاف iOS (لا يدعم beforeinstallprompt)
    const ua = window.navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(ua)) setIsIos(true)

    // نتزامن مع الحالة العالمية ونشترك في أي تحديث لاحق
    const sync = () => {
      setHasPrompt(storedPrompt !== null)
      setIsInstalled(appInstalled)
    }
    sync()
    listeners.add(sync)
    return () => {
      listeners.delete(sync)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!storedPrompt) return
    await storedPrompt.prompt()
    const { outcome } = await storedPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    // لا يمكن استخدام الحدث مرة أخرى
    storedPrompt = null
    notify()
  }, [])

  // الزر يظهر إذا كان قابلاً للتثبيت (Android/Desktop) أو على iOS وغير مثبّت
  const canInstall = !isInstalled && (hasPrompt || isIos)

  return { canInstall, isIos, isInstalled, promptInstall }
}
