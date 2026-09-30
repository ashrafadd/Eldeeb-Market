import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { normalizeRole, type Role } from '@/lib/roles-shared'

// إعادة تصدير الثوابت والأنواع المشتركة لتبقى نقاط الاستيراد كما هي في الخادم
export {
  ROLES,
  ROLE_LABELS,
  ROLE_HOME,
  STAFF_ROLES,
  normalizeRole,
  isStaff,
  type Role,
} from '@/lib/roles-shared'

export type SessionUser = {
  id: string
  name: string
  role: Role
  branchId: string | null
}

/** المستخدم الحالي مع دوره المُطبّع وفرعه — أو null إذا لم يسجّل دخوله */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  const current = session?.user
  if (!current?.id) return null

  const [row] = await db
    .select({ id: user.id, name: user.name, role: user.role, branchId: user.branchId })
    .from(user)
    .where(eq(user.id, current.id))
    .limit(1)

  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    role: normalizeRole(row.role),
    branchId: row.branchId ?? null,
  }
}

/**
 * يتحقق أن المستخدم الحالي يملك أحد الأدوار المسموحة.
 * super_admin يمرّ دائماً. يرفع خطأ إن لم يكن مصرحاً.
 */
export async function requireRole(...allowed: Role[]): Promise<SessionUser> {
  const current = await getCurrentUser()
  if (!current) throw new Error('غير مصرح بالوصول')
  if (current.role === 'super_admin') return current
  if (!allowed.includes(current.role)) throw new Error('غير مصرح بالوصول')
  return current
}

export type ManagedUser = {
  id: string
  name: string
  phoneNumber: string | null
  role: Role
  branchId: string | null
  createdAt: string
}

/** كل المستخدمين لإدارتهم في لوحة المدير العام */
export async function getManagedUsers(): Promise<ManagedUser[]> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      branchId: user.branchId,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    phoneNumber: row.phoneNumber ?? null,
    role: normalizeRole(row.role),
    branchId: row.branchId ?? null,
    createdAt: row.createdAt.toISOString(),
  }))
}
