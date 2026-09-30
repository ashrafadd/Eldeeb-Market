import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser, getManagedUsers } from '@/lib/roles'
import { getBranches } from '@/lib/branches'
import { UsersManager } from '@/components/dashboard/users-manager'

export const metadata: Metadata = {
  title: 'إدارة المستخدمين | تسويقة',
  description: 'تعيين الأدوار والفروع للمستخدمين',
  robots: { index: false, follow: false },
}

export default async function AdminUsersPage() {
  const current = await getCurrentUser()
  if (!current) redirect('/account?next=/admin/users')
  if (current.role !== 'super_admin') redirect('/dashboard')

  const [users, branches] = await Promise.all([getManagedUsers(), getBranches()])

  return <UsersManager users={users} branches={branches} currentUserId={current.id} />
}
