'use client'

import { useEffect } from 'react'

/**
 * يسجّل الـ Service Worker على التطبيق المنشور فقط.
 * في وضع التطوير يُترك معطّلاً حتى لا يتعارض تخزين الملفات
 * مع إعادة التحميل الحيّة (HMR) في Next.js.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('[v0] فشل تسجيل Service Worker:', error)
      })
    }

    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register)

    return () => window.removeEventListener('load', register)
  }, [])

  return null
}
