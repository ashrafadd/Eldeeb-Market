import type { Metadata } from 'next'
import { BottomNav } from '@/components/bottom-nav'
import { CategoriesView } from '@/components/categories-view'
import { subCategoryCounts, subCategoryImages } from '@/lib/products'

export const metadata: Metadata = {
  title: 'الأقسام | تسويقة الديب',
  description: 'تصفح أقسام تسويقة الديب: خضروات، ألبان، بقالة، مشروبات، منظفات وأكثر.',
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  const { c } = await searchParams
  const [counts, images] = await Promise.all([subCategoryCounts(), subCategoryImages()])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <main className="flex-1 pb-24">
        <CategoriesView initialCategoryId={c} stats={{ counts, images }} />
      </main>
      <BottomNav />
    </div>
  )
}
