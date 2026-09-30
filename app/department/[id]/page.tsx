import { notFound } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { CatalogBrowser } from '@/components/catalog-browser'
import { catalogGroups, getDepartment, subCategoriesOf } from '@/lib/catalog'
import { productsOfDepartment } from '@/lib/products'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const department = getDepartment(id)
  return { title: department ? `${department.name} | تسويقة` : 'قسم غير موجود' }
}

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const department = getDepartment(id)

  if (!department) {
    notFound()
  }

  const group = catalogGroups.find((item) => item.id === department.groupId)
  const chips = subCategoriesOf(department.id).map((sub) => ({
    id: sub.id,
    label: sub.name,
    href: `/category/${sub.id}`,
  }))

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-card shadow-sm">
      <main className="flex-1 pb-24">
        <CatalogBrowser
          title={department.name}
          subtitle={group?.name}
          backHref="/categories"
          chips={chips}
          items={await productsOfDepartment(department.id)}
        />
      </main>

      <BottomNav />
    </div>
  )
}
