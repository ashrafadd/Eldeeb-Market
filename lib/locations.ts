export const DEFAULT_CITY = 'ديروط'

export const villages = [
  'ديروط الشريف',
  'ديروط أم نخلة',
  'البنجا',
  'دير أبو حنس',
  'الزرابي',
  'صنبو',
  'الشيخ داود',
  'نزلة عبد اللاه',
  'الحوارتة',
  'بيادية الأخصاص',
  'الرايدة',
  'أخرى',
] as const

export type Address = {
  id: string
  city: string
  village: string
  details: string
}
