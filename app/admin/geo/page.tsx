import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/roles'
import { getBranches } from '@/lib/branches'
import { getGeoTree, type CityWithVillages } from '@/lib/geo'
import { GeoManager } from '@/components/dashboard/geo-manager'

export const metadata: Metadata = {
  title: 'المدن والمناطق | تسويقة',
  description: 'إدارة المدن والمناطق/القرى التابعة لكل فرع',
  robots: { index: false, follow: false },
}

export default async function AdminGeoPage() {
  const current = await getCurrentUser()
  if (!current) redirect('/account?next=/admin/geo')
  if (current.role !== 'super_admin') redirect('/dashboard')

  const branches = await getBranches()
  const trees: Record<string, CityWithVillages[]> = {}
  for (const branch of branches) {
    trees[branch.id] = await getGeoTree(branch.id)
  }

  return (
    <GeoManager
      branches={branches.map((branch) => ({
        id: branch.id,
        name: branch.name,
        active: branch.active,
      }))}
      trees={trees}
    />
  )
}
