'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { discountPercent, formatEGP, type Product } from '@/lib/data'
import { useStore } from '@/components/store-provider'

/** قائمة منتجات رأسية مدمجة تُستخدم في صفحات الأقسام والبحث */
export function ProductList({ items }: { items: Product[] }) {
  const { addToCart } = useStore()

  return (
    <ul className="flex flex-col gap-2">
      {items.map((product) => {
        const off = discountPercent(product)
        return (
          <li
            key={product.id}
            className="flex gap-2.5 rounded-2xl border border-border bg-card p-2.5"
          >
            <Link
              href={`/product/${product.id}`}
              className="relative size-[76px] shrink-0 overflow-hidden rounded-xl bg-muted/40"
            >
              <Image
                src={product.image || '/placeholder.svg'}
                alt={product.title}
                fill
                sizes="76px"
                className="object-contain p-1.5"
              />
              {off > 0 ? (
                <span className="absolute start-1 top-1 rounded-md bg-destructive px-1 py-0.5 text-[9px] font-extrabold text-destructive-foreground">
                  {`-${off}%`}
                </span>
              ) : null}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <h3 className="line-clamp-2 text-[12px] font-bold leading-4 text-foreground">
                  <Link href={`/product/${product.id}`}>{product.title}</Link>
                </h3>
                <p className="line-clamp-1 pt-0.5 text-[10px] leading-4 text-muted-foreground">
                  {product.description}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-muted-foreground">{product.unit}</span>
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-foreground">
                    <Star className="size-3 fill-accent text-accent" aria-hidden="true" />
                    {product.rating.toLocaleString('ar-EG')}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{product.brand}</span>
                </div>
              </div>

              <div className="flex items-end justify-between gap-2 pt-1.5">
                <div className="leading-tight">
                  <p className="text-[13px] font-extrabold text-primary">
                    {formatEGP(product.price)}
                  </p>
                  {product.oldPrice ? (
                    <p className="text-[10px] text-muted-foreground line-through">
                      {formatEGP(product.oldPrice)}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => addToCart(product.id)}
                  className="rounded-xl bg-primary px-3 py-1.5 text-[11px] font-extrabold text-primary-foreground transition-transform active:scale-95"
                >
                  أضف
                </button>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
