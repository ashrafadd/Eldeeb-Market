import Image from 'next/image'

export function HeroBanner() {
  return (
    <section aria-label="السوق في بيتك بضغطة زر" className="px-4 pt-3">
      <div className="overflow-hidden rounded-3xl border border-border bg-secondary/40 shadow-sm">
        <Image
          src="/brand/tasweeqa-banner.png"
          alt="تسويقة الديب - السوق في بيتك بضغطة زر، توصيل سريع للمواد الغذائية أونلاين"
          width={934}
          height={586}
          className="h-auto w-full object-contain"
          priority
        />
      </div>
    </section>
  )
}
