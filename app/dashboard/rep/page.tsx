import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/roles'
import { getRepOrders } from '@/lib/dashboard'
import { getBranch } from '@/lib/branches'
import { RepDashboard } from '@/components/dashboard/rep-dashboard'

export const metadata: Metadata = {
  title: 'لوحة المندوب | تسويقة',
  description: 'طلبات التوصيل المُسنَدة إليك',
  robots: { index: false, follow: false },
}

export default async function RepDashboardPage() {
  const current = await getCurrentUser()
  if (!current) redirect('/account?next=/dashboard/rep')
  // super_admin يُسمح له بالمعاينة، غير ذلك يجب أن يكون مندوباً
  if (current.role !== 'rep' && current.role !== 'super_admin') redirect('/dashboard')

  const [repOrders, branch] = await Promise.all([
    getRepOrders(current.id, current.branchId),
    current.branchId ? getBranch(current.branchId) : Promise.resolve(null),
  ])

  return (
    <RepDashboard
      orders={repOrders}
      repId={current.id}
      repName={current.name}
      branchName={branch?.name ?? 'بدون فرع'}
    />
  )
}
