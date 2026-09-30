/**
 * باقات اشتراك تسويقة الديب.
 * الأسعار والمواصفات هنا قيم مبدئية — عدّلها من هذا الملف فقط
 * وستتحدث تلقائياً في كل صفحات البرنامج.
 */

export type PlanId = 'basic' | 'silver' | 'gold'

export type Plan = {
  id: PlanId
  /** اسم الباقة كما يظهر للعميل */
  name: string
  /** وصف سطر واحد */
  tagline: string
  /** السعر الشهري بالجنيه المصري (0 = مجانية) */
  price: number
  /** سعر الاشتراك السنوي (اختياري) */
  yearlyPrice?: number
  /** أبرز ميزة تُعرض كشريط على الكارت */
  highlight: string
  /** المواصفات المضمّنة */
  features: string[]
  /** مواصفات غير متاحة في هذه الباقة */
  missing?: string[]
  /** مضاعف نقاط الولاء */
  pointsMultiplier: number
  /** حد التوصيل المجاني بالجنيه (0 = مجاني دائماً، null = غير متاح) */
  freeDeliveryOver: number | null
  /** نسبة الخصم على المنتجات */
  discountPercent: number
  /** الباقة الموصى بها */
  recommended?: boolean
  /** أيقونة lucide */
  icon: 'Leaf' | 'Medal' | 'Crown'
}

export const plans: Plan[] = [
  {
    id: 'basic',
    name: 'الباقة العادية',
    tagline: 'ابدأ التسوق بدون أي اشتراك',
    price: 0,
    highlight: 'مجانية للأبد',
    icon: 'Leaf',
    pointsMultiplier: 1,
    freeDeliveryOver: 300,
    discountPercent: 0,
    features: [
      'تسوق كل الأقسام بدون حد أدنى',
      'توصيل مجاني للطلبات فوق 300 جنيه',
      'نقطة واحدة على كل 10 جنيهات',
      'متابعة الطلب من صفحة حسابي',
      'دعم عبر الهاتف من 9 صباحاً حتى 11 مساءً',
    ],
    missing: ['خصم على المنتجات', 'توصيل في نفس اليوم', 'عروض حصرية'],
  },
  {
    id: 'silver',
    name: 'الباقة الفضية',
    tagline: 'الأفضل للأسرة الصغيرة',
    price: 99,
    yearlyPrice: 990,
    highlight: 'الأكثر اشتراكاً',
    icon: 'Medal',
    pointsMultiplier: 1.5,
    freeDeliveryOver: 150,
    discountPercent: 5,
    recommended: true,
    features: [
      'توصيل مجاني للطلبات فوق 150 جنيه',
      'خصم 5% على كل المنتجات',
      'نقاط مضاعفة ×1.5 على كل طلب',
      'أولوية في مواعيد التوصيل',
      'دعم عبر واتساب برد سريع',
      'إلغاء الاشتراك في أي وقت',
    ],
    missing: ['توصيل في نفس اليوم', 'مندوب مخصص'],
  },
  {
    id: 'gold',
    name: 'الباقة الذهبية',
    tagline: 'كل الميزات بدون حدود',
    price: 199,
    yearlyPrice: 1990,
    highlight: 'أعلى وفر شهري',
    icon: 'Crown',
    pointsMultiplier: 2,
    freeDeliveryOver: 0,
    discountPercent: 10,
    features: [
      'توصيل مجاني بدون حد أدنى',
      'خصم 10% على كل المنتجات',
      'نقاط مضاعفة ×2 على كل طلب',
      'توصيل في نفس اليوم داخل ديروط',
      'عروض وأسعار حصرية للأعضاء',
      'دعم أولوية 24 ساعة طوال الأسبوع',
      'استرجاع مجاني خلال 48 ساعة',
    ],
  },
]

export function getPlan(id: string) {
  return plans.find((plan) => plan.id === id) ?? plans[0]
}

export function isPlanId(value: string): value is PlanId {
  return plans.some((plan) => plan.id === value)
}

export function deliveryLabel(plan: Plan) {
  if (plan.freeDeliveryOver === null) return 'التوصيل بالسعر العادي'
  if (plan.freeDeliveryOver === 0) return 'توصيل مجاني دائماً'
  return `توصيل مجاني فوق ${plan.freeDeliveryOver.toLocaleString('ar-EG')} جنيه`
}

export function formatCycle(cycle: string) {
  return cycle === 'yearly' ? 'سنوي' : 'شهري'
}
