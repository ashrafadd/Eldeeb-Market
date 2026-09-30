'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Plus, Timer } from 'lucide-react'
import { discountPercent, formatEGP, type Product } from '@/lib/data'
import { useStore } from '@/components/store-provider'

export function OffersSection({ offers }: { offers: Product[] }) {
  const { addToCart } = useStore()

  if (!offers.length) return null

  return (
    <section aria-label="العروض والخصومات" className="pt-6">
      <div className="mx-4 rounded-3xl bg-secondary/70 p-3">
        <div className="flex items-center justify-between gap-2 px-1 pb-3">
          <h2 className="text-[15px] font-extrabold text-foreground">العروض والخصومات</h2>
          <span className="flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-extrabold text-destructive-foreground">
            <Timer className="size-3.5" aria-hidden="true" />
            ينتهي اليوم
          </span>
        </div>

        <ul className="flex flex-col gap-2">
          {offers.map((product) => (
            <li
              key={product.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5"
            >
              <Link
                href={`/product/${product.id}`}
                className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted/50"
              >
                <Image
                  src={product.image || '/placeholder.svg'}
                  alt={product.title}
                  fill
                  sizes="64px"
                  className="object-contain p-1.5"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[13px] font-bold text-foreground">
                  <Link href={`/product/${product.id}`}>{product.title}</Link>
                </h3>
                <p className="text-[11px] text-muted-foreground">{product.unit}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[13px] font-extrabold text-primary">
                    {formatEGP(product.price)}
                  </span>
                  <span className="text-[11px] text-muted-foreground line-through">
                    {formatEGP(product.oldPrice ?? 0)}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-center gap-1.5">
                <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-extrabold text-destructive-foreground">
                  {`-${discountPercent(product)}%`}
                </span>
                <button
                  type="button"
                  onClick={() => addToCart(product.id)}
                  className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform active:scale-90"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  <span className="sr-only">{`أضف ${product.title} إلى السلة`}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
