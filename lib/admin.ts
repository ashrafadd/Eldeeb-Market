import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'

/**
 * الحسابات التي تُمنح صلاحية الإدارة تلقائياً عند تسجيل الدخول.
 * تُستخدم كقائمة تأسيسية حتى لو لم يكن الحساب مسجلاً بعد.
 */
const ADMIN_EMAILS = ['ashrafadd@hotmail.com']

export type AdminUser = {
  id: string
  name: string
  email: string
}

function isAllowlisted(email: string) {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase())
}

/** يعيد بيانات المدير الحالي أو null إذا لم يكن مديراً */
export async function getAdmin(): Promise<AdminUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  const current = session?.user
  if (!current?.email) return null

  const [row] = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role })
    .from(user)
    .where(eq(user.id, current.id))
    .limit(1)

  if (!row) return null

  const allowlisted = isAllowlisted(row.email)

  // يُرقّى الحساب المدرج في القائمة التأسيسية إلى المدير العام مرة واحدة
  if (allowlisted && row.role !== 'super_admin') {
    await db.update(user).set({ role: 'super_admin' }).where(eq(user.id, row.id))
  }

  // المدير العام (أو القيمة القديمة admin) والحساب المدرج فقط
  const isAdminRole = row.role === 'super_admin' || row.role === 'admin'
  if (!isAdminRole && !allowlisted) return null

  return { id: row.id, name: row.name, email: row.email }
}

/** يرفع خطأ إذا لم يكن المستخدم الحالي مديراً — يُستخدم في كل إجراء إداري */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin()
  if (!admin) throw new Error('غير مصرح بالوصول')
  return admin
}
