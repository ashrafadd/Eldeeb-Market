import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { StoreProvider } from '@/components/store-provider'
import { PwaRegister } from '@/components/pwa-register'
import { getPriceIndex } from '@/lib/products'
import './globals.css'

const _cairo = Cairo({ subsets: ['arabic', 'latin'] })

export const metadata: Metadata = {
  title: 'تسويقة الديب | Tasweeqa Eldeeb',
  description:
    'تسويقة الديب - السوق في بيتك بضغطة زر. تسوق البقالة والخضروات والفاكهة والمنظفات بأفضل الأسعار وتوصيل سريع لباب البيت.',
  generator: 'v0.app',
  applicationName: 'تسويقة الديب',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'تسويقة',
    statusBarStyle: 'black-translucent',
    startupImage: [{ url: '/icons/splash.png' }],
  },
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: '/icons/apple-icon-180.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2e7d32' },
    { media: '(prefers-color-scheme: dark)', color: '#1d2620' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const priceIndex = await getPriceIndex()

  return (
    <html lang="ar" dir="rtl" className="bg-background" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <StoreProvider priceIndex={priceIndex}>{children}</StoreProvider>
        </ThemeProvider>
        <PwaRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
