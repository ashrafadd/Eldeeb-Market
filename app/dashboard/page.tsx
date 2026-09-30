import { redirect } from 'next/navigation'
import { getCurrentUser, ROLE_HOME } from '@/lib/roles'

// يوجّه كل مستخدم للوحته حسب دوره؛ العميل غير المصرّح يعود للمتجر.
export default async function DashboardRouterPage() {
  const current = await getCurrentUser()
  if (!current) redirect('/account')
  redirect(ROLE_HOME[current.role])
}
