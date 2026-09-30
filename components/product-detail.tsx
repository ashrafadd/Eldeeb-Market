'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react'
import { discountPercent, formatEGP, type Product } from '@/lib/data'
import { useStore } from '@/components/store-provider'
import { cn } from '@/lib/utils'

const highlights = [
  { icon: Truck, label: 'توصيل خلال ساعة' },
  { icon: ShieldCheck, label: 'إرجاع مجاني 14 يوم' },
]

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter()
  const { addToCart, toggleWishlist, isWished } = useStore()
  const [qty, setQty] = useState(1)
  const wished = isWished(product.id)
  const discount = discountPercent(product)

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex size-9 items-center justify-center rounded-xl border border-border bg-card"
        >
          <ArrowRight className="size-5 text-foreground" aria-hidden="true" />
          <span className="sr-only">رجوع</span>
        </button>

        <h1 className="truncate text-sm font-extrabold text-foreground">{product.title}</h1>

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={wished}
          className="flex size-9 items-center justify-center rounded-xl border border-border bg-card"
        >
          <Heart
            className={cn(
              'size-5',
              wished ? 'fill-destructive text-destructive' : 'text-muted-foreground',
            )}
            aria-hidden="true"
          />
          <span className="sr-only">
            {wished ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          </span>
        </button>
      </header>

      <div className="relative mx-4 mt-4 aspect-square overflow-hidden rounded-3xl bg-muted/40">
        <Image
          src={product.image || '/placeholder.svg'}
          alt={product.title}
          fill
          sizes="420px"
          priority
          className="object-contain p-6"
        />
        {discount > 0 ? (
          <span className="absolute top-3 start-3 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-extrabold text-destructive-foreground">
            {`خصم ${discount}%`}
          </span>
        ) : null}
      </div>

      <section className="px-4 pt-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-extrabold text-secondary-foreground">
            {product.brand}
          </span>
          <span className="text-[11px] text-muted-foreground">{product.category}</span>
        </div>

        <h2 className="pt-2 text-lg font-extrabold leading-7 text-foreground text-balance">
          {product.title}
        </h2>

        <div className="flex items-center gap-2 pt-1.5">
          <span className="flex items-center gap-1 rounded-lg bg-accent/15 px-2 py-1">
            <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
            <span className="text-[11px] font-extrabold text-foreground">{product.rating}</span>
          </span>
          <span className="text-[11px] text-muted-foreground">
            {`${product.reviews.toLocaleString('ar-EG')} تقييم • ${product.unit}`}
          </span>
        </div>

        <div className="flex items-end gap-2.5 pt-3">
          <span className="text-2xl font-extrabold text-primary">
            {formatEGP(product.price)}
          </span>
          {product.oldPrice ? (
            <span className="pb-1 text-sm text-muted-foreground line-through">
              {formatEGP(product.oldPrice)}
            </span>
          ) : null}
        </div>

        <p className="pt-1 text-[11px] font-bold text-primary">
          {`متوفر في المخزون (${product.stock} قطعة)`}
        </p>

        <ul className="flex gap-2 pt-4">
          {highlights.map((item) => (
            <li
              key={item.label}
              className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-3 py-2.5"
            >
              <item.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-[11px] font-bold leading-4 text-foreground text-pretty">
                {item.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="pt-5">
          <h3 className="text-sm font-extrabold text-foreground">وصف المنتج</h3>
          <p className="pt-1.5 text-[13px] leading-relaxed text-muted-foreground text-pretty">
            {product.description}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-5">
          <div className="flex items-center gap-1 rounded-2xl border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setQty((prev) => Math.max(1, prev - 1))}
              className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"
            >
              <Minus className="size-4" aria-hidden="true" />
              <span className="sr-only">تقليل الكمية</span>
            </button>
            <span className="w-8 text-center text-sm font-extrabold text-foreground">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((prev) => Math.min(product.stock, prev + 1))}
              className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"
            >
              <Plus className="size-4" aria-hidden="true" />
              <span className="sr-only">زيادة الكمية</span>
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            الإجمالي
            <span className="block text-sm font-extrabold text-foreground">
              {formatEGP(product.price * qty)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => addToCart(product.id, qty)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            <ShoppingCart className="size-[18px]" aria-hidden="true" />
            أضف إلى السلة
          </button>
          <Link
            href="/cart"
            className="rounded-2xl border border-primary px-4 py-3.5 text-sm font-extrabold text-primary"
          >
            السلة
          </Link>
        </div>
      </section>
    </>
  )
}
