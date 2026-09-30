import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/roles'
import { resolveBranchScope } from '@/lib/dashboard-scope'
import {
  getBranchStockRows,
  getStockMovements,
  summarizeStock,
  LOW_STOCK_THRESHOLD,
} from '@/lib/inventory'
import { StockManager } from '@/components/dashboard/stock-manager'
import { NoBranchNotice } from '@/components/dashboard/no-branch-notice'

export const metadata: Metadata = {
  title: 'إدارة المخزون | تسويقة',
  description: 'متابعة كميات المخزون وضبطها وتنبيهات النفاد',
  robots: { index: false, follow: false },
}

const ALLOWED = ['inventory', 'purchasing', 'branch_manager', 'super_admin']

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>
}) {
  const current = await getCurrentUser()
  if (!current) redirect('/account?next=/dashboard/inventory')
  if (!ALLOWED.includes(current.role)) redirect('/dashboard')

  const { branch } = await searchParams
  const scope = await resolveBranchScope(current, branch)
  if (!scope.branchId) {
    return <NoBranchNotice title="إدارة المخزون" />
  }

  const [rows, movements] = await Promise.all([
    getBranchStockRows(scope.branchId),
    getStockMovements(scope.branchId),
  ])

  return (
    <StockManager
      mode="inventory"
      branchId={scope.branchId}
      branchName={scope.branchName}
      branches={scope.selectable}
      rows={rows}
      movements={movements}
      summary={summarizeStock(rows)}
      threshold={LOW_STOCK_THRESHOLD}
      staffName={current.name}
    />
  )
}
