import { Suspense } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { SearchView } from '@/components/search-view'
import { getProducts, subCategoryImages } from '@/lib/products'

export const metadata = {
  title: 'البحث | تسويقة',
  description: 'ابحث في كل أقسام تسويقة والأقسام الفرعية وجميع المنتجات.',
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const [allProducts, sectionImages] = await Promise.all([
    getProducts(),
    subCategoryImages(),
  ])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-card shadow-sm">
      <main className="flex-1 pb-24">
        <Suspense fallback={null}>
          <SearchView
            initialQuery={q ?? ''}
            allProducts={allProducts}
            sectionImages={sectionImages}
          />
        </Suspense>
      </main>

      <BottomNav />
    </div>
  )
}
