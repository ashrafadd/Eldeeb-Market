import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/roles'
import { resolveBranchScope } from '@/lib/dashboard-scope'
import {
  getBranchAccounting,
  getExpenses,
  getRepCustody,
  getSettlements,
} from '@/lib/accounting'
import { AccountingDashboard } from '@/components/dashboard/accounting-dashboard'
import { NoBranchNotice } from '@/components/dashboard/no-branch-notice'

export const metadata: Metadata = {
  title: 'المحاسبة | تسويقة',
  description: 'مبيعات ومصروفات وصافي ربح الفرع وتسويات عهد المناديب',
  robots: { index: false, follow: false },
}

const ALLOWED = ['accountant', 'branch_manager', 'super_admin']

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>
}) {
  const current = await getCurrentUser()
  if (!current) redirect('/account?next=/dashboard/accounting')
  if (!ALLOWED.includes(current.role)) redirect('/dashboard')

  const { branch } = await searchParams
  const scope = await resolveBranchScope(current, branch)
  if (!scope.branchId) {
    return <NoBranchNotice title="المحاسبة" />
  }

  const [accounting, custody, expenseRows, settlements] = await Promise.all([
    getBranchAccounting(scope.branchId),
    getRepCustody(scope.branchId),
    getExpenses(scope.branchId),
    getSettlements(scope.branchId),
  ])

  return (
    <AccountingDashboard
      branchId={scope.branchId}
      branchName={scope.branchName}
      branches={scope.selectable}
      staffName={current.name}
      accounting={accounting}
      custody={custody}
      expenses={expenseRows}
      settlements={settlements}
    />
  )
}
