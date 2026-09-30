import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/roles'
import { getBranches } from '@/lib/branches'
import { BranchesManager } from '@/components/dashboard/branches-manager'

export const metadata: Metadata = {
  title: 'إدارة الفروع | تسويقة',
  description: 'إضافة وتفعيل فروع المتجر',
  robots: { index: false, follow: false },
}

export default async function AdminBranchesPage() {
  const current = await getCurrentUser()
  if (!current) redirect('/account?next=/admin/branches')
  if (current.role !== 'super_admin') redirect('/dashboard')

  const branches = await getBranches()

  return <BranchesManager branches={branches} />
}
