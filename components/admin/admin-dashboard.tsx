'use client'

import { useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calculator,
  Eye,
  EyeOff,
  GitBranch,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  TriangleAlert,
  Users,
  Wallet,
} from 'lucide-react'
import {
  createProduct,
  deleteProduct,
  toggleProduct,
  updateProduct,
} from '@/app/actions/admin-products'
import { departments, subCategories } from '@/lib/catalog'
import { formatEGP } from '@/lib/data'
import type { AdminProduct } from '@/lib/products'
import { cn } from '@/lib/utils'
import {
  ProductForm,
  emptyValues,
  valuesFromProduct,
  type ProductFormValues,
} from '@/components/admin/product-form'

type Sheet =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; id: string }

export function AdminDashboard({
  products,
  adminName,
  pendingTopups,
}: {
  products: AdminProduct[]
  adminName: string
  pendingTopups: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [query, setQuery] = useState('')
  const [departmentId, setDepartmentId] = useState('all')
  const [sheet, setSheet] = useState<Sheet>({ kind: 'closed' })
  const [values, setValues] = useState<ProductFormValues>(() =>
    emptyValues(subCategories[0]?.id ?? ''),
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const stats = useMemo(() => {
    return {
      total: products.length,
      hidden: products.filter((item) => !item.isActive).length,
      out: products.filter((item) => item.stock === 0).length,
      deals: products.filter((item) => item.oldPrice).length,
    }
  }, [products])

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return products.filter((item) => {
      if (departmentId !== 'all' && item.departmentId !== departmentId) return false
      if (!term) return true
      return (
        item.title.toLowerCase().includes(term) ||
        item.brand.toLowerCase().includes(term) ||
        item.id.toLowerCase().includes(term)
      )
    })
  }, [products, query, departmentId])

  function flash(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 2600)
  }

  function openCreate() {
    setFormError(null)
    setValues(emptyValues(subCategories[0]?.id ?? ''))
    setSheet({ kind: 'create' })
  }

  function openEdit(product: AdminProduct) {
    setFormError(null)
    setValues(valuesFromProduct(product))
    setSheet({ kind: 'edit', id: product.id })
  }

  function submit() {
    setFormError(null)

    const payload = {
      id: sheet.kind === 'edit' ? sheet.id : undefined,
      title: values.title,
      subCategoryId: values.subCategoryId,
      price: Number(values.price),
      oldPrice: values.oldPrice === '' ? null : Number(values.oldPrice),
      unit: values.unit,
      brand: values.brand,
      stock: Number(values.stock),
      description: values.description,
      image: values.image,
      isActive: values.isActive,
    }

    startTransition(async () => {
      const result =
        sheet.kind === 'edit'
          ? await updateProduct(payload)
          : await createProduct(payload)

      if (!result.ok) {
        setFormError(result.error)
        return
      }

      setSheet({ kind: 'closed' })
      flash(sheet.kind === 'edit' ? 'تم حفظ التعديلات' : 'تمت إضافة المنتج')
      router.refresh()
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteProduct(id)
      setConfirmId(null)
      flash(result.ok ? 'تم حذف المنتج' : result.error)
      if (result.ok) router.refresh()
    })
  }

  function toggle(product: AdminProduct) {
    startTransition(async () => {
      const result = await toggleProduct(product.id, !product.isActive)
      flash(
        result.ok
          ? product.isActive
            ? 'تم إخفاء المنتج'
            : 'تم إظهار المنتج'
          : result.error,
      )
      if (result.ok) router.refresh()
    })
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      {/* الرأس */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-extrabold text-foreground">لوحة التحكم</h1>
            <p className="truncate pt-0.5 text-[11px] font-medium text-muted-foreground">
              {`مرحباً ${adminName}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/admin/users"
              className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground"
              aria-label="إدارة المستخدمين"
            >
              <Users className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/admin/branches"
              className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground"
              aria-label="إدارة الفروع"
            >
              <GitBranch className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/admin/geo"
              className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground"
              aria-label="المدن والمناطق"
            >
              <MapPin className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard/purchasing"
              className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground"
              aria-label="المشتريات والمخزون"
            >
              <ShoppingCart className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard/accounting"
              className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground"
              aria-label="المحاسبة والعهد"
            >
              <Calculator className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/admin/wallet"
              className="relative flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground"
              aria-label={
                pendingTopups > 0
                  ? `المحفظة والبطاقات، ${pendingTopups} طلب في الانتظار`
                  : 'المحفظة والبطاقات'
              }
            >
              <Wallet className="size-4" aria-hidden="true" />
              {pendingTopups > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -end-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground"
                >
                  {pendingTopups}
                </span>
              ) : null}
            </Link>
            <Link
              href="/"
              className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground"
              aria-label="العودة للمتجر"
            >
              <Store className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* الإحصاءات */}
        <div className="grid grid-cols-4 gap-2 px-4 pb-3.5">
          <Stat label="منتج" value={stats.total} />
          <Stat label="مخفي" value={stats.hidden} tone={stats.hidden ? 'warn' : 'plain'} />
          <Stat label="نفد" value={stats.out} tone={stats.out ? 'danger' : 'plain'} />
          <Stat label="بخصم" value={stats.deals} tone="accent" />
        </div>
      </header>

      <main className="flex-1 px-4 pb-32 pt-4">
        {/* البحث والتصفية */}
        <div className="flex flex-col gap-2.5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث بالاسم أو العلامة أو المعرّف"
              aria-label="��حث في المنتجات"
              className="w-full rounded-2xl border border-border bg-card px-3.5 py-3 pe-10 text-[13px] font-medium text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <select
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
            aria-label="تصفية بالقسم"
            className="w-full appearance-none rounded-2xl border border-border bg-card px-3.5 py-3 text-[13px] font-medium text-foreground outline-none focus:border-primary"
          >
            <option value="all">كل الأقسام</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-extrabold text-primary-foreground"
          >
            <Plus className="size-4.5" aria-hidden="true" />
            إضافة منتج جديد
          </button>
        </div>

        <p className="pb-2 pt-4 text-[11px] font-bold text-muted-foreground">
          {`${visible.length} من ${products.length} منتج`}
        </p>

        {/* قائمة المنتجات */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-12 text-center">
            <p className="text-[13px] font-bold text-foreground">لا توجد نتائج</p>
            <p className="px-8 text-[11px] leading-5 text-muted-foreground text-pretty">
              جرّب تعديل كلمة البحث أو اختيار قسم آخر.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {visible.map((product) => (
              <li
                key={product.id}
                className={cn(
                  'rounded-2xl border border-border bg-card p-3',
                  !product.isActive && 'opacity-70',
                )}
              >
                <div className="flex gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-secondary/40">
                    <Image
                      src={product.image || '/placeholder.svg'}
                      alt=""
                      fill
                      unoptimized={product.image.startsWith('data:')}
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold leading-5 text-foreground">
                      {product.title}
                    </p>
                    <p className="truncate pt-0.5 text-[10px] font-medium text-muted-foreground">
                      {[product.category, product.unit, product.brand]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1.5">
                      <span className="text-[13px] font-extrabold text-primary">
                        {formatEGP(product.price)}
                      </span>
                      {product.oldPrice ? (
                        <span className="text-[10px] font-medium text-muted-foreground line-through">
                          {formatEGP(product.oldPrice)}
                        </span>
                      ) : null}

                      {product.stock === 0 ? (
                        <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
                          نفد
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {`${product.stock} متاح`}
                        </span>
                      )}

                      {!product.isActive ? (
                        <span className="rounded-md bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold text-accent-foreground">
                          مخفي
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* الإجراءات */}
                {confirmId === product.id ? (
                  <div className="mt-3 rounded-xl bg-destructive/10 p-2.5">
                    <p className="flex items-center gap-1.5 pb-2 text-[11px] font-bold text-destructive">
                      <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
                      سيُحذف المنتج نهائياً
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => remove(product.id)}
                        disabled={pending}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive py-2 text-[11px] font-bold text-destructive-foreground disabled:opacity-60"
                      >
                        {pending ? (
                          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        ) : null}
                        تأكيد الحذف
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="flex-1 rounded-xl border border-border bg-card py-2 text-[11px] font-bold text-foreground"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2.5 flex gap-2 border-t border-border pt-2.5">
                    <ActionButton onClick={() => openEdit(product)} disabled={pending}>
                      <Pencil className="size-3.5" aria-hidden="true" />
                      تعديل
                    </ActionButton>
                    <ActionButton onClick={() => toggle(product)} disabled={pending}>
                      {product.isActive ? (
                        <EyeOff className="size-3.5" aria-hidden="true" />
                      ) : (
                        <Eye className="size-3.5" aria-hidden="true" />
                      )}
                      {product.isActive ? 'إخفاء' : 'إظهار'}
                    </ActionButton>
                    <ActionButton
                      onClick={() => setConfirmId(product.id)}
                      disabled={pending}
                      tone="danger"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      حذف
                    </ActionButton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* إشعار سريع */}
      {notice ? (
        <div
          role="status"
          className="fixed bottom-6 start-1/2 z-50 -translate-x-1/2 rounded-2xl bg-foreground px-4 py-3 text-[12px] font-bold text-background shadow-lg"
        >
          {notice}
        </div>
      ) : null}

      {sheet.kind !== 'closed' ? (
        <ProductForm
          values={values}
          onChange={setValues}
          onSubmit={submit}
          onClose={() => setSheet({ kind: 'closed' })}
          pending={pending}
          error={formError}
          mode={sheet.kind}
        />
      ) : null}
    </div>
  )
}

function Stat({
  label,
  value,
  tone = 'plain',
}: {
  label: string
  value: number
  tone?: 'plain' | 'warn' | 'danger' | 'accent'
}) {
  return (
    <div className="rounded-xl border border-border bg-background px-2 py-2 text-center">
      <p
        dir="ltr"
        className={cn(
          'text-[15px] font-extrabold leading-5',
          tone === 'plain' && 'text-foreground',
          tone === 'warn' && 'text-accent-foreground',
          tone === 'danger' && 'text-destructive',
          tone === 'accent' && 'text-primary',
        )}
      >
        {value}
      </p>
      <p className="pt-0.5 text-[9px] font-bold text-muted-foreground">{label}</p>
    </div>
  )
}

function ActionButton({
  children,
  onClick,
  disabled,
  tone = 'plain',
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  tone?: 'plain' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-[11px] font-bold disabled:opacity-50',
        tone === 'plain' && 'border-border bg-background text-foreground',
        tone === 'danger' && 'border-destructive/30 bg-destructive/5 text-destructive',
      )}
    >
      {children}
    </button>
  )
}
