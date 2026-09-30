'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { catalogGroups, departments, getDepartment, subCategories } from '@/lib/catalog'
import type { Product } from '@/lib/data'
import { ProductList } from '@/components/product-list'
import { cn } from '@/lib/utils'

type Scope = 'all' | 'products' | 'sections'

const scopes: { id: Scope; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'products', label: 'المنتجات' },
  { id: 'sections', label: 'الأقسام' },
]

const suggestions = [
  'أرز',
  'حليب',
  'دجاج',
  'شوكولاتة',
  'حفاضات',
  'قهوة',
  'منظفات',
  'فواكه',
  'آيس كريم',
  'جبنة',
]

/** تطبيع النص العربي لبحث أكثر تسامحاً */
function normalize(value: string) {
  return value
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function SearchView({
  initialQuery = '',
  allProducts,
  sectionImages,
}: {
  initialQuery?: string
  allProducts: Product[]
  sectionImages: Record<string, string>
}) {
  const [query, setQuery] = useState(initialQuery)
  const [scope, setScope] = useState<Scope>('all')
  const term = normalize(query)

  const sectionHits = useMemo(() => {
    if (term === '') return []

    const departmentHits = departments
      .filter((department) => normalize(department.name).includes(term))
      .map((department) => ({
        id: department.id,
        name: department.name,
        parent: catalogGroups.find((group) => group.id === department.groupId)?.name ?? '',
        href: `/department/${department.id}`,
        image:
          sectionImages[
            subCategories.find((sub) => sub.departmentId === department.id)?.id ?? ''
          ] ?? '/placeholder.svg',
        kind: 'قسم رئيسي',
      }))

    const subHits = subCategories
      .filter((sub) => normalize(sub.name).includes(term))
      .map((sub) => ({
        id: sub.id,
        name: sub.name,
        parent: getDepartment(sub.departmentId)?.name ?? '',
        href: `/category/${sub.id}`,
        image: sectionImages[sub.id] ?? '/placeholder.svg',
        kind: 'قسم فرعي',
      }))

    return [...departmentHits, ...subHits].slice(0, 12)
  }, [term, sectionImages])

  const productHits = useMemo(() => {
    if (term === '') return []
    return allProducts
      .filter((product) => {
        const haystack = normalize(
          `${product.title} ${product.brand} ${product.category} ${product.description}`,
        )
        return haystack.includes(term)
      })
      .slice(0, 60)
  }, [term, allProducts])

  const showSections = scope !== 'products' && sectionHits.length > 0
  const showProducts = scope !== 'sections' && productHits.length > 0
  const empty = term !== '' && !showSections && !showProducts

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Link
            href="/categories"
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-card"
          >
            <ChevronRight className="size-4 text-foreground" aria-hidden="true" />
            <span className="sr-only">رجوع</span>
          </Link>

          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-3 py-2.5">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث في كل الأقسام والمنتجات..."
              aria-label="البحث في المتجر"
              className="w-full bg-transparent text-[13px] font-medium text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query ? (
              <button type="button" onClick={() => setQuery('')} className="shrink-0">
                <X className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">مسح البحث</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {scopes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setScope(item.id)}
              aria-pressed={scope === item.id}
              className={cn(
                'shrink-0 rounded-full px-4 py-1.5 text-[12px] font-bold transition-colors',
                scope === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-muted-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pb-8">
        {term === '' ? (
          <div className="pt-5">
            <h2 className="pb-2.5 text-[13px] font-extrabold text-foreground">بحث سريع</h2>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuery(item)}
                  className="rounded-full bg-secondary px-3 py-1.5 text-[12px] font-bold text-secondary-foreground"
                >
                  {item}
                </button>
              ))}
            </div>

            <h2 className="pb-2.5 pt-6 text-[13px] font-extrabold text-foreground">
              تصفح كل الأقسام
            </h2>
            <ul className="flex flex-col gap-2">
              {catalogGroups.map((group) => (
                <li key={group.id} className="rounded-2xl border border-border p-3">
                  <p className="text-[13px] font-extrabold text-foreground">{group.name}</p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {departments
                      .filter((department) => department.groupId === group.id)
                      .map((department) => (
                        <Link
                          key={department.id}
                          href={`/department/${department.id}`}
                          className="rounded-full px-2.5 py-1 text-[11px] font-bold text-foreground"
                          style={{ backgroundColor: department.tint }}
                        >
                          {department.name}
                        </Link>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {showSections ? (
          <section className="pt-4" aria-label="الأقسام المطابقة">
            <h2 className="pb-2 text-[13px] font-extrabold text-foreground">
              {`أقسام (${sectionHits.length.toLocaleString('ar-EG')})`}
            </h2>
            <ul className="flex flex-col gap-2">
              {sectionHits.map((hit) => (
                <li key={`${hit.kind}-${hit.id}`}>
                  <Link
                    href={hit.href}
                    className="flex items-center gap-2.5 rounded-2xl border border-border bg-card p-2.5"
                  >
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted/50">
                      <Image
                        src={hit.image || '/placeholder.svg'}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-foreground">
                        {hit.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {`${hit.kind} • ${hit.parent}`}
                      </span>
                    </span>
                    <ChevronLeft className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {showProducts ? (
          <section className="pt-5" aria-label="المنتجات المطابقة">
            <h2 className="pb-2 text-[13px] font-extrabold text-foreground">
              {`منتجات (${productHits.length.toLocaleString('ar-EG')})`}
            </h2>
            <ProductList items={productHits} />
          </section>
        ) : null}

        {empty ? (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-12 text-center">
            <p className="text-[13px] font-bold text-foreground">لا نتائج لبحثك</p>
            <p className="text-[11px] leading-4 text-muted-foreground text-pretty">
              تأكد من كتابة الكلمة بشكل صحيح أو جرب كلمة أعم مثل «أرز» أو «حليب».
            </p>
          </div>
        ) : null}
      </div>
    </>
  )
}
