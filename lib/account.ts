export type PaymentMethodId = 'balance' | 'wallet' | 'instapay' | 'cod'

export type PaymentMethod = {
  id: PaymentMethodId
  name: string
  hint: string
  icon: string
  /** رسوم إضافية على طريقة الدفع */
  fee: number
  /** يحتاج رقم محفظة أو حساب */
  needsAccount: boolean
  accountLabel?: string
  accountPlaceholder?: string
}

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'balance',
    name: 'رصيد المحفظة',
    hint: 'يُخصم المبلغ من رصيدك في تسويقة فوراً',
    icon: 'Wallet',
    fee: 0,
    needsAccount: false,
  },
  {
    id: 'wallet',
    name: 'محفظة إلكترونية',
    hint: 'فودافون كاش، اتصالات كاش، أورنج كاش',
    icon: 'Smartphone',
    fee: 0,
    needsAccount: true,
    accountLabel: 'رقم المحفظة',
    accountPlaceholder: '01xxxxxxxxx',
  },
  {
    id: 'instapay',
    name: 'انستاباي',
    hint: 'تحويل فوري من حسابك البنكي',
    icon: 'Landmark',
    fee: 0,
    needsAccount: true,
    accountLabel: 'عنوان الدفع (IPA)',
    accountPlaceholder: 'name@instapay',
  },
  {
    id: 'cod',
    name: 'الدفع عند التوصيل',
    hint: 'ادفع نقداً للمندوب عند وصول الطلب',
    icon: 'Banknote',
    fee: 10,
    needsAccount: false,
  },
]

export function getPaymentMethod(id: PaymentMethodId) {
  return paymentMethods.find((method) => method.id === id) ?? paymentMethods[0]
}

export type OrderLine = {
  productId: string
  title: string
  qty: number
  price: number
}

export type OrderStatus = 'processing' | 'onway' | 'delivered' | 'cancelled'

export type Order = {
  id: number
  reference: string
  status: string
  paymentMethod: string
  total: number
  pointsEarned: number
  createdAt: string
  items: OrderLine[]
}

export const orderStatusLabel: Record<string, string> = {
  processing: 'قيد التجهيز',
  onway: 'في الطريق إليك',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
}

/** نقطة واحدة لكل 10 جنيهات */
export const POINTS_PER_EGP = 0.1

export function pointsFor(total: number) {
  return Math.floor(total * POINTS_PER_EGP)
}

/** كل 100 نقطة = 10 جنيه خصم */
export function pointsValue(points: number) {
  return Math.floor(points / 100) * 10
}

export type PointsTier = {
  id: string
  name: string
  min: number
  perk: string
}

export const pointsTiers: PointsTier[] = [
  { id: 'green', name: 'عضو أخضر', min: 0, perk: 'خصم 5% على أول طلب كل شهر' },
  { id: 'silver', name: 'عضو فضي', min: 500, perk: 'توصيل مجاني على كل الطلبات' },
  { id: 'gold', name: 'عضو ذهبي', min: 1500, perk: 'عروض حصرية + توصيل في نفس اليوم' },
]

export function tierFor(points: number) {
  return [...pointsTiers].reverse().find((tier) => points >= tier.min) ?? pointsTiers[0]
}

export function nextTierFor(points: number) {
  return pointsTiers.find((tier) => points < tier.min) ?? null
}

export const contactChannels = [
  {
    id: 'phone',
    label: 'اتصل بنا',
    value: '01001234567',
    hint: 'يومياً من 9 صباحاً حتى 11 مساءً',
    icon: 'Phone',
    href: 'tel:01001234567',
  },
  {
    id: 'whatsapp',
    label: 'واتساب',
    value: '01001234567',
    hint: 'رد سريع خلال دقائق',
    icon: 'MessageCircle',
    href: 'https://wa.me/201001234567',
  },
  {
    id: 'email',
    label: 'البريد الإلكتروني',
    value: 'support@eldeebmarket.com',
    hint: 'للشكاوى والاقتراحات',
    icon: 'Mail',
    href: 'mailto:support@eldeebmarket.com',
  },
  {
    id: 'branch',
    label: 'الفرع الرئيسي',
    value: 'ديروط - شارع المحطة، أمام مسجد النور',
    hint: 'استلام من الفرع متاح',
    icon: 'MapPin',
    href: null,
  },
]

export function formatOrderDate(date: string) {
  return new Date(date).toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
