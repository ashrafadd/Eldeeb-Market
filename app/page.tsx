import Link from 'next/link'
import { BadgePercent, ChevronLeft, Clock3, Crown, Truck } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { BrandsRow } from '@/components/brands-row'
import { CategoriesRow } from '@/components/categories-row'
import { HeroBanner } from '@/components/hero-banner'
import { OffersSection } from '@/components/offers-section'
import { ProductCarousel, ProductGrid } from '@/components/product-carousel'
import { PromoSlider } from '@/components/promo-slider'
import { TopBar } from '@/components/top-bar'
import { getHomeSections } from '@/lib/products'

const perks = [
  { icon: Truck, label: 'توصيل مجاني', hint: 'للطلبات فوق 300 جنيه' },
  { icon: Clock3, label: 'خلال ساعة', hint: 'توصيل سريع' },
  { icon: BadgePercent, label: 'عروض يومية', hint: 'خصومات حتى 40%' },
]

export default async function HomePage() {
  const { mostViewed, newArrivals, offers } = await getHomeSections()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-card shadow-sm">
      <TopBar />

      <main className="flex-1 pb-24">
        <HeroBanner />
        <PromoSlider />

        <section aria-label="مميزات المتجر" className="px-4 pt-2">
          <ul className="grid grid-cols-3 gap-2">
            {perks.map((perk) => (
              <li
                key={perk.label}
                className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-secondary/60 px-2 py-3 text-center"
              >
                <perk.icon className="size-5 text-primary" aria-hidden="true" />
                <span className="text-[11px] font-extrabold text-foreground">{perk.label}</span>
                <span className="text-[10px] leading-3 text-muted-foreground text-pretty">
                  {perk.hint}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="باقات الاشتراك" className="px-4 pt-3">
          <Link
            href="/packages"
            className="flex items-center gap-3 rounded-2xl bg-primary p-3.5 text-primary-foreground"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15 ring-1 ring-primary-foreground/25">
              <Crown className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-extrabold">اشترك ووفّر كل شهر</span>
              <span className="block text-[11px] leading-4 text-primary-foreground/80 text-pretty">
                باقات عادية وفضية وذهبية — توصيل مجاني وخصومات تصل إلى 10%
              </span>
            </span>
            <ChevronLeft className="size-4 shrink-0 text-primary-foreground/80" aria-hidden="true" />
          </Link>
        </section>

        <CategoriesRow />
        <BrandsRow />
        <OffersSection offers={offers} />
        <ProductCarousel title="منتجات أكثر مشاهدة" products={mostViewed} />
        <ProductGrid title="أحدث المنتجات" products={newArrivals} />
      </main>

      <BottomNav />
    </div>
  )
}
