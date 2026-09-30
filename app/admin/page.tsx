import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { ShieldAlert } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getAdmin } from '@/lib/admin'
import { getAllProductsForAdmin } from '@/lib/products'
import { countPendingTopups } from '@/lib/wallet'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export const metadata: Metadata = {
  title: 'لوحة التحكم | إدارة المنتجات',
  description: 'إضافة وتعديل وحذف منتجات المتجر',
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/account?next=/admin')
  }

  const admin = await getAdmin()

  if (!admin) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-card px-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldAlert className="size-8 text-destructive" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-extrabold text-foreground">لا تملك صلاحية الوصول</h1>
        <p className="text-[13px] leading-6 text-muted-foreground text-pretty">
          هذه الصفحة مخصصة لإدارة المتجر فقط. إذا كنت تعتقد أنه يجب أن تملك صلاحية الوصول،
          راجع مدير المتجر.
        </p>
        <Link
          href="/"
          className="rounded-2xl bg-primary px-5 py-3 text-[13px] font-bold text-primary-foreground"
        >
          العودة للمتجر
        </Link>
      </div>
    )
  }

  const [products, pendingTopups] = await Promise.all([
    getAllProductsForAdmin(),
    countPendingTopups(),
  ])

  return (
    <AdminDashboard products={products} adminName={admin.name} pendingTopups={pendingTopups} />
  )
}
