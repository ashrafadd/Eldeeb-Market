'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import type { Product } from '@/lib/data'
import { ProductList } from '@/components/product-list'
import { cn } from '@/lib/utils'

type SortKey = 'default' | 'cheap' | 'expensive' | 'rating'

const sorts: { id: SortKey; label: string }[] = [
  { id: 'default', label: 'الأكثر شعبية' },
  { id: 'cheap', label: 'الأقل سعراً' },
  { id: 'expensive', label: 'الأعلى سعراً' },
  { id: 'rating', label: 'الأعلى تقييماً' },
]

export type ChipLink = { id: string; label: string; href: string; active?: boolean }

export function CatalogBrowser({
  title,
  subtitle,
  backHref,
  chips,
  items,
}: {
  title: string
  subtitle?: string
  backHref: string
  chips?: ChipLink[]
  items: Product[]
}) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('default')
  const [showSort, setShowSort] = useState(false)

  const list = useMemo(() => {
    const term = query.trim()
    const filtered = items.filter((product) =>
      term === ''
        ? true
        : product.title.includes(term) ||
          product.brand.includes(term) ||
          product.category.includes(term),
    )
    const sorted = [...filtered]
    if (sort === 'cheap') sorted.sort((a, b) => a.price - b.price)
    if (sort === 'expensive') sorted.sort((a, b) => b.price - a.price)
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating)
    return sorted
  }, [items, query, sort])

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2 pb-3">
          <Link
            href={backHref}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card"
          >
            <ChevronRight className="size-4 text-foreground" aria-hidden="true" />
            <span className="sr-only">رجوع</span>
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-extrabold text-foreground">{title}</h1>
            {subtitle ? (
              <p className="truncate text-[11px] font-bold text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-3 py-2.5">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث داخل القسم..."
              className="w-full bg-transparent text-[13px] font-medium text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowSort((prev) => !prev)}
            aria-expanded={showSort}
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-2xl border transition-colors',
              showSort
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground',
            )}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            <span className="sr-only">ترتيب المنتجات</span>
          </button>
        </div>

        {showSort ? (
          <div className="flex flex-wrap gap-1.5 pt-2.5">
            {sorts.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSort(option.id)}
                aria-pressed={sort === option.id}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors',
                  sort === option.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        {chips && chips.length > 0 ? (
          <nav aria-label="الأقسام الفرعية" className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {chips.map((chip) => (
              <Link
                key={chip.id}
                href={chip.href}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors',
                  chip.active
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-muted-foreground',
                )}
              >
                {chip.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <section className="px-3 py-3" aria-label={title}>
        <p className="pb-2.5 text-[11px] font-bold text-muted-foreground">
          {`${list.length.toLocaleString('ar-EG')} منتج`}
        </p>

        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-12 text-center">
            <p className="text-[13px] font-bold text-foreground">لا توجد نتائج</p>
            <p className="text-[11px] leading-4 text-muted-foreground text-pretty">
              جرب البحث بكلمة أخرى أو تصفح قسماً مختلفاً.
            </p>
          </div>
        ) : (
          <ProductList items={list} />
        )}
      </section>
    </>
  )
}
