import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'لا يوجد اتصال | تسويقة الديب',
}

export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <Image
        src="/icons/icon-192.png"
        alt="تسويقة الديب"
        width={96}
        height={96}
        className="rounded-2xl"
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-foreground text-balance">
          لا يوجد اتصال بالإنترنت
        </h1>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
          تعذّر تحميل هذه الصفحة. تحقّق من اتصالك بالشبكة ثم حاول مرة أخرى.
        </p>
      </div>
      <a
        href="/"
        className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
      >
        إعادة المحاولة
      </a>
    </main>
  )
}
