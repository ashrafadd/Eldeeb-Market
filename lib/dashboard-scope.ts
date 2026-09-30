import 'server-only'
import { getBranch, getBranches } from '@/lib/branches'
import type { SessionUser } from '@/lib/roles'

export type BranchScope = {
  branchId: string | null
  branchName: string
  /** قائمة الفروع القابلة للاختيار — للمدير العام فقط، فارغة لبقية الموظفين */
  selectable: { id: string; name: string }[]
}

/**
 * يحدّد الفرع الذي تعمل عليه اللوحة:
 * - المدير العام: يختار أي فرع (افتراضياً الأول) عبر ?branch=
 * - بقية الموظفين: مقيّدون بفرعهم فقط
 */
export async function resolveBranchScope(
  current: SessionUser,
  requested?: string,
): Promise<BranchScope> {
  if (current.role === 'super_admin') {
    const all = await getBranches()
    const selectable = all.map((branch) => ({ id: branch.id, name: branch.name }))
    const chosen = all.find((branch) => branch.id === requested) ?? all[0]
    return {
      branchId: chosen?.id ?? null,
      branchName: chosen?.name ?? 'بدون فرع',
      selectable,
    }
  }

  if (!current.branchId) {
    return { branchId: null, branchName: 'بدون فرع', selectable: [] }
  }
  const branch = await getBranch(current.branchId)
  return {
    branchId: current.branchId,
    branchName: branch?.name ?? 'بدون فرع',
    selectable: [],
  }
}
