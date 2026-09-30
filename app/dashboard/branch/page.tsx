import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/roles'
import { resolveBranchScope } from '@/lib/dashboard-scope'
import { getBranchStockRows, summarizeStock } from '@/lib/inventory'
import { getBranchAccounting, getRepCustody } from '@/lib/accounting'
import { BranchDashboard } from '@/components/dashboard/branch-dashboard'
import { NoBranchNotice } from '@/components/dashboard/no-branch-notice'

export const metadata: Metadata = {
  title: 'لوحة مدير الفرع | تسويقة',
  description: 'نظرة شاملة على مخزون الفرع وحساباته وعهد المناديب',
  robots: { index: false, follow: false },
}

const ALLOWED = ['branch_manager', 'super_admin']

export default async function BranchDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>
}) {
  const current = await getCurrentUser()
  if (!current) redirect('/account?next=/dashboard/branch')
  if (!ALLOWED.includes(current.role)) redirect('/dashboard')

  const { branch } = await searchParams
  const scope = await resolveBranchScope(current, branch)
  if (!scope.branchId) {
    return <NoBranchNotice title="لوحة مدير الفرع" />
  }

  const [rows, accounting, custody] = await Promise.all([
    getBranchStockRows(scope.branchId),
    getBranchAccounting(scope.branchId),
    getRepCustody(scope.branchId),
  ])
  const stock = summarizeStock(rows)
  const outstandingCustody = custody.reduce((sum, rep) => sum + Math.max(rep.outstanding, 0), 0)

  return (
    <BranchDashboard
      branchId={scope.branchId}
      branchName={scope.branchName}
      branches={scope.selectable}
      managerName={current.name}
      summary={{
        stockTotal: stock.total,
        lowCount: stock.lowCount,
        outCount: stock.outCount,
        netProfit: accounting.netProfit,
        outstandingCustody,
        openOrders: accounting.openOrdersCount,
      }}
    />
  )
}
