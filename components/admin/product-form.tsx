'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, Trash2, X } from 'lucide-react'
import { catalogGroups, departmentsOf, subCategoriesOf } from '@/lib/catalog'
import { fileToCompressedDataUrl } from '@/lib/image'
import type { AdminProduct } from '@/lib/products'
import { cn } from '@/lib/utils'

const FIELD =
  'w-full rounded-2xl border border-border bg-secondary/40 px-3.5 py-3 text-[13px] font-medium text-foreground outline-none placeholder:text-muted-foreground focus:border-primary'

const LABEL = 'block pb-1.5 text-[11px] font-bold text-muted-foreground'

export type ProductFormValues = {
  id?: string
  title: string
  subCategoryId: string
  price: string
  oldPrice: string
  unit: string
  brand: string
  stock: string
  description: string
  image: string
  isActive: boolean
}

export function emptyValues(subCategoryId: string): ProductFormValues {
  return {
    title: '',
    subCategoryId,
    price: '',
    oldPrice: '',
    unit: '',
    brand: '',
    stock: '10',
    description: '',
    image: '',
    isActive: true,
  }
}

export function valuesFromProduct(product: AdminProduct): ProductFormValues {
  return {
    id: product.id,
    title: product.title,
    subCategoryId: product.subCategoryId,
    price: String(product.price),
    oldPrice: product.oldPrice ? String(product.oldPrice) : '',
    unit: product.unit,
    brand: product.brand,
    stock: String(product.stock),
    description: product.description,
    // الصور الافتراضية للأقسام تُترك فارغة حتى لا تُحفظ كصورة مخصصة
    image: product.image.startsWith('/catalog/') ? '' : product.image,
    isActive: product.isActive,
  }
}

export function ProductForm({
  values,
  onChange,
  onSubmit,
  onClose,
  pending,
  error,
  mode,
}: {
  values: ProductFormValues
  onChange: (next: ProductFormValues) => void
  onSubmit: () => void
  onClose: () => void
  pending: boolean
  error: string | null
  mode: 'create' | 'edit'
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [reading, setReading] = useState(false)

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    onChange({ ...values, [key]: value })
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    setImageError(null)
    setReading(true)
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      set('image', dataUrl)
    } catch (cause) {
      setImageError(cause instanceof Error ? cause.message : 'تعذر قراءة الصورة')
    } finally {
      setReading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const discount =
    Number(values.oldPrice) > Number(values.price) && Number(values.price) > 0
      ? Math.round(
          ((Number(values.oldPrice) - Number(values.price)) / Number(values.oldPrice)) * 100,
        )
      : 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3.5">
        <div>
          <h2 className="text-[15px] font-extrabold text-foreground">
            {mode === 'create' ? 'إضافة منتج جديد' : 'تعديل المنتج'}
          </h2>
          {mode === 'edit' && values.id ? (
            <p dir="ltr" className="pt-0.5 text-[10px] font-medium text-muted-foreground">
              {values.id}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        className="flex-1 overflow-y-auto px-4 pb-32 pt-4"
      >
        <div className="flex flex-col gap-4">
          {/* صورة المنتج */}
          <div>
            <span className={LABEL}>صورة المنتج</span>
            <div className="flex items-center gap-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary/40">
                {values.image ? (
                  <Image
                    src={values.image || '/placeholder.svg'}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <ImagePlus className="size-6 text-muted-foreground" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={reading}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-2.5 text-[12px] font-bold text-foreground disabled:opacity-60"
                >
                  {reading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ImagePlus className="size-4" aria-hidden="true" />
                  )}
                  {reading ? 'جارٍ المعالجة' : 'اختر صورة'}
                </button>
                {values.image ? (
                  <button
                    type="button"
                    onClick={() => set('image', '')}
                    className="flex items-center justify-center gap-1.5 rounded-2xl py-1.5 text-[11px] font-bold text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    إزالة الصورة
                  </button>
                ) : null}
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />

            <p className="pt-2 text-[10px] leading-4 text-muted-foreground text-pretty">
              تُضغط الصورة تلقائياً وتُحفظ داخل قاعدة البيانات. إن تركتها فارغة ستُستخدم صورة
              القسم الافتراضية.
            </p>
            {imageError ? (
              <p className="pt-1 text-[11px] font-bold text-destructive">{imageError}</p>
            ) : null}
          </div>

          {/* اسم المنتج */}
          <div>
            <label htmlFor="p-title" className={LABEL}>
              اسم المنتج
            </label>
            <input
              id="p-title"
              value={values.title}
              onChange={(event) => set('title', event.target.value)}
              placeholder="مثال: جبنة بيضاء كاملة الدسم"
              className={FIELD}
            />
          </div>

          {/* القسم */}
          <div>
            <label htmlFor="p-sub" className={LABEL}>
              القسم
            </label>
            <select
              id="p-sub"
              value={values.subCategoryId}
              onChange={(event) => set('subCategoryId', event.target.value)}
              className={cn(FIELD, 'appearance-none')}
            >
              {catalogGroups.map((group) =>
                departmentsOf(group.id).map((department) => (
                  <optgroup key={department.id} label={`${group.name} — ${department.name}`}>
                    {subCategoriesOf(department.id).map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </optgroup>
                )),
              )}
            </select>
          </div>

          {/* الأسعار */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="p-price" className={LABEL}>
                السعر (ج.م)
              </label>
              <input
                id="p-price"
                value={values.price}
                onChange={(event) => set('price', event.target.value)}
                inputMode="decimal"
                dir="ltr"
                placeholder="0"
                className={cn(FIELD, 'text-start')}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="p-old" className={LABEL}>
                قبل الخصم
              </label>
              <input
                id="p-old"
                value={values.oldPrice}
                onChange={(event) => set('oldPrice', event.target.value)}
                inputMode="decimal"
                dir="ltr"
                placeholder="اختياري"
                className={cn(FIELD, 'text-start')}
              />
            </div>
          </div>

          {discount > 0 ? (
            <p className="-mt-2 text-[11px] font-bold text-primary">
              {`سيظهر المنتج بشارة خصم ${discount}%`}
            </p>
          ) : null}

          {/* الوحدة والعلامة */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="p-unit" className={LABEL}>
                الوحدة
              </label>
              <input
                id="p-unit"
                value={values.unit}
                onChange={(event) => set('unit', event.target.value)}
                placeholder="500 جم"
                className={FIELD}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="p-brand" className={LABEL}>
                العلامة التجارية
              </label>
              <input
                id="p-brand"
                value={values.brand}
                onChange={(event) => set('brand', event.target.value)}
                placeholder="اختياري"
                className={FIELD}
              />
            </div>
          </div>

          {/* المخزون */}
          <div>
            <label htmlFor="p-stock" className={LABEL}>
              الكمية المتاحة
            </label>
            <input
              id="p-stock"
              value={values.stock}
              onChange={(event) => set('stock', event.target.value)}
              inputMode="numeric"
              dir="ltr"
              placeholder="0"
              className={cn(FIELD, 'text-start')}
            />
          </div>

          {/* الوصف */}
          <div>
            <label htmlFor="p-desc" className={LABEL}>
              الوصف
            </label>
            <textarea
              id="p-desc"
              value={values.description}
              onChange={(event) => set('description', event.target.value)}
              rows={3}
              placeholder="وصف قصير يظهر في صفحة المنتج"
              className={cn(FIELD, 'resize-none leading-6')}
            />
          </div>

          {/* الإظهار في المتجر */}
          <button
            type="button"
            onClick={() => set('isActive', !values.isActive)}
            className="flex items-center justify-between rounded-2xl border border-border bg-card px-3.5 py-3 text-start"
          >
            <span className="flex flex-col">
              <span className="text-[13px] font-bold text-foreground">ظاهر في المتجر</span>
              <span className="pt-0.5 text-[10px] font-medium text-muted-foreground">
                {values.isActive ? 'يراه العملاء الآن' : 'مخفي عن العملاء'}
              </span>
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                values.isActive ? 'bg-primary' : 'bg-border',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-5 rounded-full bg-card transition-all',
                  values.isActive ? 'start-0.5' : 'start-5.5',
                )}
              />
            </span>
          </button>

          {error ? (
            <p className="rounded-2xl bg-destructive/10 px-3.5 py-3 text-[12px] font-bold text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </form>

      <div className="border-t border-border bg-card px-4 py-3.5">
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending || reading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-extrabold text-primary-foreground disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {mode === 'create' ? 'إضافة المنتج' : 'حفظ التعديلات'}
        </button>
      </div>
    </div>
  )
}
