'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, Plus, Star } from 'lucide-react'
import { discountPercent, formatEGP, type Product } from '@/lib/data'
import { useStore } from '@/components/store-provider'
import { cn } from '@/lib/utils'

export function ProductCard({
  product,
  className,
}: {
  product: Product
  className?: string
}) {
  const { addToCart, toggleWishlist, isWished } = useStore()
  const wished = isWished(product.id)
  const discount = discountPercent(product)

  return (
    <article
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card',
        className,
      )}
    >
      <Link href={`/product/${product.id}`} className="relative aspect-square w-full bg-muted/40">
        <Image
          src={product.image || '/placeholder.svg'}
          alt={product.title}
          fill
          sizes="180px"
          className="object-contain p-3"
        />
        <span className="sr-only">{`عرض تفاصيل ${product.title}`}</span>
      </Link>

      {product.badge ? (
        <span className="absolute top-2 start-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
          {product.badge}
        </span>
      ) : null}

      <button
        type="button"
        onClick={() => toggleWishlist(product.id)}
        aria-pressed={wished}
        className="absolute top-2 end-2 flex size-8 items-center justify-center rounded-full border border-border bg-card transition-colors"
      >
        <Heart
          className={cn(
            'size-4 transition-colors',
            wished ? 'fill-destructive text-destructive' : 'text-muted-foreground',
          )}
          aria-hidden="true"
        />
        <span className="sr-only">
          {wished ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-3 pt-2">
        <div className="flex items-center gap-1">
          <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
          <span className="text-[11px] font-bold text-foreground">{product.rating}</span>
          <span className="text-[11px] text-muted-foreground">• {product.unit}</span>
        </div>

        <h3 className="line-clamp-2 text-[13px] font-bold leading-5 text-foreground text-pretty">
          <Link href={`/product/${product.id}`}>{product.title}</Link>
        </h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="leading-tight">
            <p className="text-[13px] font-extrabold text-primary">
              {formatEGP(product.price)}
            </p>
            {product.oldPrice ? (
              <p className="flex items-center gap-1.5 text-[11px]">
                <span className="text-muted-foreground line-through">
                  {formatEGP(product.oldPrice)}
                </span>
                <span className="font-bold text-destructive">{`-${discount}%`}</span>
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => addToCart(product.id)}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform active:scale-90"
          >
            <Plus className="size-5" aria-hidden="true" />
            <span className="sr-only">{`أضف ${product.title} إلى السلة`}</span>
          </button>
        </div>
      </div>
    </article>
  )
}
