import { notFound } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { CatalogBrowser } from '@/components/catalog-browser'
import { getDepartment, getSubCategory, subCategoriesOf } from '@/lib/catalog'
import { productsOfSubCategory } from '@/lib/products'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sub = getSubCategory(id)
  return { title: sub ? `${sub.name} | تسويقة` : 'قسم غير موجود' }
}

export default async function SubCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sub = getSubCategory(id)

  if (!sub) {
    notFound()
  }

  const department = getDepartment(sub.departmentId)
  const chips = subCategoriesOf(sub.departmentId).map((item) => ({
    id: item.id,
    label: item.name,
    href: `/category/${item.id}`,
    active: item.id === sub.id,
  }))

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-card shadow-sm">
      <main className="flex-1 pb-24">
        <CatalogBrowser
          title={sub.name}
          subtitle={department?.name}
          backHref={department ? `/department/${department.id}` : '/categories'}
          chips={chips}
          items={await productsOfSubCategory(sub.id)}
        />
      </main>

      <BottomNav />
    </div>
  )
}
