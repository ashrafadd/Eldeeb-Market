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
  title: 'المشتريات والمخزون | تسويقة',
  description: 'توريد الأصناف وضبط كميات مخزون الفرع',
  robots: { index: false, follow: false },
}

const ALLOWED = ['purchasing', 'inventory', 'branch_manager', 'super_admin']

export default async function PurchasingPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>
}) {
  const current = await getCurrentUser()
  if (!current) redirect('/account?next=/dashboard/purchasing')
  if (!ALLOWED.includes(current.role)) redirect('/dashboard')

  const { branch } = await searchParams
  const scope = await resolveBranchScope(current, branch)
  if (!scope.branchId) {
    return <NoBranchNotice title="المشتريات والمخزون" />
  }

  const [rows, movements] = await Promise.all([
    getBranchStockRows(scope.branchId),
    getStockMovements(scope.branchId),
  ])

  return (
    <StockManager
      mode="purchasing"
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
