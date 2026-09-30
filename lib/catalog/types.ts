/** صف منتج مضغوط: الاسم، الوحدة، السعر، السعر قبل الخصم (0 = بدون)، الماركة، الوصف، صورة خاصة (اختياري) */
export type ProductRow = [
  title: string,
  unit: string,
  price: number,
  oldPrice: number,
  brand: string,
  description: string,
  image?: string,
]

/** منتجات مرتبة حسب معرّف القسم الفرعي */
export type SubCategoryProducts = Record<string, ProductRow[]>
