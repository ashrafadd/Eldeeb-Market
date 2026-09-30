// ثوابت وأنواع الأدوار — نقية بلا أي تبعية خادم، آمنة للاستيراد في مكوّنات العميل.

/** الأدوار السبعة في النظام مرتبة من الأدنى صلاحية للأعلى */
export const ROLES = [
  'customer',
  'rep',
  'branch_manager',
  'inventory',
  'accountant',
  'purchasing',
  'super_admin',
] as const

export type Role = (typeof ROLES)[number]

/** التسميات العربية لكل دور */
export const ROLE_LABELS: Record<Role, string> = {
  customer: 'عميل',
  rep: 'مندوب توصيل',
  branch_manager: 'مدير فرع',
  inventory: 'أمين مخزون',
  accountant: 'محاسب',
  purchasing: 'مسؤول مشتريات',
  super_admin: 'مدير عام',
}

/** اللوحة التي يُوجَّه إليها كل دور بعد الدخول */
export const ROLE_HOME: Record<Role, string> = {
  customer: '/',
  rep: '/dashboard/rep',
  branch_manager: '/dashboard/branch',
  inventory: '/dashboard/inventory',
  accountant: '/dashboard/accounting',
  purchasing: '/dashboard/purchasing',
  super_admin: '/admin',
}

/** الأدوار التي تُعدّ من طاقم الإدارة (تدخل لوحات التحكم لا واجهة العميل) */
export const STAFF_ROLES: Role[] = [
  'rep',
  'branch_manager',
  'inventory',
  'accountant',
  'purchasing',
  'super_admin',
]

/**
 * يُطبّع القيمة المخزّنة إلى دور معروف.
 * القيم القديمة ('user' → customer، 'admin' → super_admin) تُترجم للتوافق.
 */
export function normalizeRole(raw: string | null | undefined): Role {
  if (!raw) return 'customer'
  if (raw === 'user') return 'customer'
  if (raw === 'admin') return 'super_admin'
  return (ROLES as readonly string[]).includes(raw) ? (raw as Role) : 'customer'
}

export function isStaff(role: Role): boolean {
  return STAFF_ROLES.includes(role)
}
