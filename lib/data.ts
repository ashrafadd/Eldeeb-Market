import { departments, type CatalogProduct } from '@/lib/catalog'

export type Product = CatalogProduct

export type Category = {
  id: string
  name: string
  icon: string
  tint: string
}

export type Brand = {
  id: string
  name: string
  latin: string
  tint: string
}

export type Banner = {
  id: string
  title: string
  subtitle: string
  cta: string
  image: string
  tint: string
}

/** الأقسام الرئيسية مشتقة من هيكل الكتالوج */
export const categories: Category[] = departments.map((department) => ({
  id: department.id,
  name: department.name,
  icon: department.icon,
  tint: department.tint,
}))

export const brands: Brand[] = [
  { id: 'juhayna', name: 'جهينة', latin: 'Juhayna', tint: 'oklch(0.93 0.05 250)' },
  { id: 'domty', name: 'دومتي', latin: 'Domty', tint: 'oklch(0.94 0.05 30)' },
  { id: 'almarai', name: 'المراعي', latin: 'Almarai', tint: 'oklch(0.93 0.055 145)' },
  { id: 'nestle', name: 'نستله', latin: 'Nestlé', tint: 'oklch(0.93 0.045 265)' },
  { id: 'lamar', name: 'لامار', latin: 'Lamar', tint: 'oklch(0.94 0.05 200)' },
  { id: 'heinz', name: 'هاينز', latin: 'Heinz', tint: 'oklch(0.93 0.06 20)' },
  { id: 'ariel', name: 'أريال', latin: 'Ariel', tint: 'oklch(0.93 0.05 285)' },
]

export const banners: Banner[] = [
  {
    id: 'b1',
    title: 'خضروات وفاكهة طازجة',
    subtitle: 'وفر حتى 40% على الطازج اليومي',
    cta: 'اشترِ الآن',
    image: '/banners/fresh.png',
    tint: 'oklch(0.42 0.1 148)',
  },
  {
    id: 'b2',
    title: 'مهرجان الألبان',
    subtitle: 'اشترِ 2 واحصل على الثالث مجاناً',
    cta: 'شاهد العروض',
    image: '/banners/dairy.png',
    tint: 'oklch(0.42 0.09 240)',
  },
  {
    id: 'b3',
    title: 'توصيل مجاني',
    subtitle: 'لأول طلب لك فوق 300 جنيه',
    cta: 'ابدأ التسوق',
    image: '/banners/delivery.png',
    tint: 'oklch(0.4 0.08 60)',
  },
]

export function discountPercent(product: Product) {
  if (!product.oldPrice) return 0
  return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
}

export function formatEGP(value: number) {
  return `${value.toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} جنيه`
}
