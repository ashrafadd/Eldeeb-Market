'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Minus, Plus, ShoppingBasket, Trash2 } from 'lucide-react'
import { formatEGP, type Product } from '@/lib/data'
import { useStore } from '@/components/store-provider'
import { CheckoutSheet } from '@/components/checkout-sheet'

const DELIVERY_FEE = 25
const FREE_DELIVERY_LIMIT = 300

export function CartView({
  products,
  balance,
}: {
  products: Product[]
  balance: number
}) {
  const router = useRouter()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const { cart, cartCount, subtotal, savings, setQty, removeFromCart, clearCart } = useStore()

  const delivery = subtotal >= FREE_DELIVERY_LIMIT || subtotal === 0 ? 0 : DELIVERY_FEE
  const total = subtotal + delivery
  const remaining = Math.max(0, FREE_DELIVERY_LIMIT - subtotal)

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

        <h1 className="text-sm font-extrabold text-foreground">
          {`سلة التسوق (${cartCount})`}
        </h1>

        {cart.length > 0 ? (
          <button
            type="button"
            onClick={clearCart}
            className="text-[11px] font-bold text-destructive"
          >
            إفراغ السلة
          </button>
        ) : (
          <span className="size-9" aria-hidden="true" />
        )}
      </header>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-8 py-20 text-center">
          <span className="flex size-16 items-center justify-center rounded-3xl bg-secondary">
            <ShoppingBasket className="size-7 text-primary" aria-hidden="true" />
          </span>
          <h2 className="text-base font-extrabold text-foreground">سلتك فارغة</h2>
          <p className="text-[13px] leading-relaxed text-muted-foreground text-pretty">
            لم تقم بإضافة أي منتجات بعد. تصفح المنتجات وابدأ التسوق الآن.
          </p>
          <Link
            href="/"
            className="mt-1 rounded-2xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground"
          >
            تصفح المنتجات
          </Link>
        </div>
      ) : (
        <>
          {remaining > 0 ? (
            <p className="mx-4 mt-4 rounded-2xl bg-secondary/70 px-3.5 py-2.5 text-[11px] font-bold leading-4 text-secondary-foreground text-pretty">
              {`أضف ${formatEGP(remaining)} للحصول على توصيل مجاني`}
            </p>
          ) : (
            <p className="mx-4 mt-4 rounded-2xl bg-secondary/70 px-3.5 py-2.5 text-[11px] font-bold text-secondary-foreground">
              مبروك! حصلت على توصيل مجاني
            </p>
          )}

          <ul className="flex flex-col gap-2 px-4 pt-3">
            {cart.map((line) => {
              const product = products.find((item) => item.id === line.id)
              if (!product) return null
              return (
                <li
                  key={line.id}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <Link
                    href={`/product/${product.id}`}
                    className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted/50"
                  >
                    <Image
                      src={product.image || '/placeholder.svg'}
                      alt={product.title}
                      fill
                      sizes="80px"
                      className="object-contain p-2"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="line-clamp-2 text-[13px] font-bold leading-5 text-foreground">
                        <Link href={`/product/${product.id}`}>{product.title}</Link>
                      </h2>
                      <button
                        type="button"
                        onClick={() => removeFromCart(line.id)}
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        <span className="sr-only">{`حذف ${product.title}`}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-muted-foreground">{product.unit}</p>

                    <div className="flex items-end justify-between gap-2 pt-2">
                      <div className="leading-tight">
                        <p className="text-[13px] font-extrabold text-primary">
                          {formatEGP(product.price * line.qty)}
                        </p>
                        {product.oldPrice ? (
                          <p className="text-[11px] text-muted-foreground line-through">
                            {formatEGP(product.oldPrice * line.qty)}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1 rounded-xl border border-border p-0.5">
                        <button
                          type="button"
                          onClick={() => setQty(line.id, line.qty - 1)}
                          className="flex size-7 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
                        >
                          <Minus className="size-3.5" aria-hidden="true" />
                          <span className="sr-only">تقليل الكمية</span>
                        </button>
                        <span className="w-6 text-center text-[13px] font-extrabold text-foreground">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(line.id, line.qty + 1)}
                          className="flex size-7 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                          <span className="sr-only">زيادة الكمية</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <section
            aria-label="ملخص الطلب"
            className="mx-4 mt-5 rounded-3xl bg-secondary/60 p-4"
          >
            <h2 className="pb-3 text-sm font-extrabold text-foreground">ملخص الطلب</h2>
            <dl className="flex flex-col gap-2 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">إجمالي المنتجات</dt>
                <dd className="font-bold text-foreground">{formatEGP(subtotal)}</dd>
              </div>
              {savings > 0 ? (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">وفرت</dt>
                  <dd className="font-bold text-destructive">{`- ${formatEGP(savings)}`}</dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">رسوم التوصيل</dt>
                <dd className="font-bold text-foreground">
                  {delivery === 0 ? 'مجاناً' : formatEGP(delivery)}
                </dd>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-border pt-2.5">
                <dt className="text-sm font-extrabold text-foreground">الإجمالي النهائي</dt>
                <dd className="text-base font-extrabold text-primary">{formatEGP(total)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="mt-4 w-full rounded-2xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              إتمام الشراء
            </button>
          </section>
        </>
      )}

      {checkoutOpen ? (
        <CheckoutSheet
          subtotal={subtotal}
          delivery={delivery}
          balance={balance}
          onClose={() => setCheckoutOpen(false)}
        />
      ) : null}
    </>
  )
}
