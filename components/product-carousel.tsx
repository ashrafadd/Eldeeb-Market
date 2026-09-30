import type { Product } from '@/lib/data'
import { ProductCard } from '@/components/product-card'
import { SectionHeader } from '@/components/section-header'

export function ProductCarousel({
  title,
  products,
}: {
  title: string
  products: Product[]
}) {
  return (
    <section className="pt-6" aria-label={title}>
      <SectionHeader title={title} />
      <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} className="w-[164px] shrink-0" />
        ))}
      </div>
    </section>
  )
}

export function ProductGrid({
  title,
  products,
}: {
  title: string
  products: Product[]
}) {
  return (
    <section className="pt-6" aria-label={title}>
      <SectionHeader title={title} />
      <div className="mt-3 grid grid-cols-2 gap-3 px-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
