/* eslint-disable no-restricted-globals */
// Service Worker لتطبيق تسويقة الديب (PWA)
// استراتيجية محافظة تناسب تطبيقاً يتعامل مع أموال:
// - الأصول الثابتة: من الكاش أولاً (أسرع)
// - الصفحات: من الشبكة أولاً مع صفحة بديلة عند انقطاع الاتصال
// - أي طلب لواجهات البيانات أو المصادقة أو غير GET: يمر للشبكة مباشرة دون تخزين

const VERSION = 'v1'
const STATIC_CACHE = `tasweeqa-static-${VERSION}`
const PAGES_CACHE = `tasweeqa-pages-${VERSION}`
const OFFLINE_URL = '/offline'

// الأصول الأساسية التي تُخزَّن مسبقاً عند التثبيت
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/splash.png',
  '/icon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![STATIC_CACHE, PAGES_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

// هل هذا الطلب أصلاً ثابتاً يمكن تخزينه بأمان؟
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/brand/') ||
    url.pathname.startsWith('/banners/') ||
    url.pathname.startsWith('/catalog/') ||
    url.pathname.startsWith('/products/') ||
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:png|jpe?g|svg|gif|webp|ico|woff2?|ttf|otf|css|js)$/.test(url.pathname)
  )
}

// طلبات يجب ألا تُخزَّن أبداً: البيانات، المصادقة، طلبات RSC الديناميكية
function shouldBypass(request, url) {
  if (request.method !== 'GET') return true
  if (url.pathname.startsWith('/api/')) return true
  if (url.searchParams.has('_rsc')) return true
  if (request.headers.get('RSC') === '1') return true
  if (request.headers.has('Authorization')) return true
  return false
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // نتعامل فقط مع طلبات نفس الأصل (same-origin)
  if (url.origin !== self.location.origin) return

  // البيانات والمصادقة تمر مباشرة للشبكة
  if (shouldBypass(request, url)) return

  // الأصول الثابتة: من الكاش أولاً ثم الشبكة (مع تحديث الكاش في الخلفية)
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone()
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy))
            }
            return response
          })
          .catch(() => cached)
        return cached || network
      }),
    )
    return
  }

  // التنقل بين الصفحات: من الشبكة أولاً، والكاش/صفحة عدم الاتصال احتياطياً
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone()
            caches.open(PAGES_CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          return cached || caches.match(OFFLINE_URL)
        }),
    )
  }
})

// السماح للصفحة بطلب تفعيل النسخة الجديدة فوراً
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})
