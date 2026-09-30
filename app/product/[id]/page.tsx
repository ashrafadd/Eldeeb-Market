import { notFound } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { ProductDetail } from '@/components/product-detail'
import { ProductCarousel } from '@/components/product-carousel'
import { getProduct, getProducts } from '@/lib/products'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  const products = await getProducts()

  const sameSection = products.filter(
    (item) => item.subCategoryId === product.subCategoryId && item.id !== product.id,
  )
  const sameDepartment = products.filter(
    (item) =>
      item.departmentId === product.departmentId &&
      item.subCategoryId !== product.subCategoryId,
  )
  const related = [...sameSection, ...sameDepartment].slice(0, 6)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-card shadow-sm">
      <main className="flex-1 pb-24">
        <ProductDetail product={product} />
        <ProductCarousel title="منتجات ذات صلة" products={related} />
      </main>

      <BottomNav />
    </div>
  )
}
