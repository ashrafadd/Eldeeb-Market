'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { fetchBranches, fetchCities, fetchVillages } from '@/app/actions/branch'
import { useStore } from '@/components/store-provider'

type Option = { id: string; name: string }

/**
 * نموذج عنوان بقوائم مرتبطة: فرع ← مدينة ← منطقة/قرية ← تفصيل.
 * يُستخدم في منتقي العنوان وصفحة تأكيد الطلب.
 */
export function AddressForm({
  onSaved,
  onCancel,
}: {
  onSaved?: () => void
  onCancel?: () => void
}) {
  const { saveAddress } = useStore()

  const [branches, setBranches] = useState<Option[]>([])
  const [cities, setCities] = useState<Option[]>([])
  const [villages, setVillages] = useState<Option[]>([])

  const [branchId, setBranchId] = useState('')
  const [cityId, setCityId] = useState('')
  const [villageId, setVillageId] = useState('')
  const [details, setDetails] = useState('')

  const [loadingBranches, setLoadingBranches] = useState(true)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingVillages, setLoadingVillages] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // تحميل الفروع مرة واحدة
  useEffect(() => {
    let cancelled = false
    fetchBranches()
      .then((rows) => {
        if (cancelled) return
        setBranches(rows)
      })
      .finally(() => {
        if (!cancelled) setLoadingBranches(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // عند تغيّر الفرع: حمّل مدنه وأعد ضبط ما تحته
  useEffect(() => {
    setCities([])
    setCityId('')
    setVillages([])
    setVillageId('')
    if (!branchId) return
    let cancelled = false
    setLoadingCities(true)
    fetchCities(branchId)
      .then((rows) => {
        if (!cancelled) setCities(rows)
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false)
      })
    return () => {
      cancelled = true
    }
  }, [branchId])

  // عند تغيّر المدينة: حمّل قراها وأعد ضبط القرية
  useEffect(() => {
    setVillages([])
    setVillageId('')
    if (!cityId) return
    let cancelled = false
    setLoadingVillages(true)
    fetchVillages(cityId)
      .then((rows) => {
        if (!cancelled) setVillages(rows)
      })
      .finally(() => {
        if (!cancelled) setLoadingVillages(false)
      })
    return () => {
      cancelled = true
    }
  }, [cityId])

  async function handleSave() {
    if (!branchId || !cityId || !villageId) {
      setError('اختر الفرع والمدينة والمنطقة / القرية')
      return
    }
    if (details.trim().length < 5) {
      setError('اكتب تفصيل العنوان (شارع، علامة مميزة، رقم المنزل)')
      return
    }
    setError('')
    setSaving(true)
    const result = await saveAddress({ branchId, cityId, villageId, details: details.trim() })
    setSaving(false)
    if (!result.ok) {
      setError(result.error ?? 'تعذر حفظ العنوان')
      return
    }
    setBranchId('')
    setDetails('')
    onSaved?.()
  }

  const selectClass =
    'rounded-2xl border border-input bg-card px-3 py-2.5 text-xs font-bold text-foreground outline-none focus:border-primary disabled:opacity-60'

  return (
    <div className="flex flex-col gap-3">
      {/* الفرع */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="branch-select" className="text-[11px] font-bold text-muted-foreground">
          فرع التوصيل
        </label>
        <select
          id="branch-select"
          value={branchId}
          onChange={(event) => setBranchId(event.target.value)}
          disabled={loadingBranches}
          className={selectClass}
        >
          <option value="">{loadingBranches ? 'جارٍ التحميل...' : 'اختر الفرع'}</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      {/* المدينة */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="city-select" className="text-[11px] font-bold text-muted-foreground">
          المدينة
        </label>
        <select
          id="city-select"
          value={cityId}
          onChange={(event) => setCityId(event.target.value)}
          disabled={!branchId || loadingCities}
          className={selectClass}
        >
          <option value="">
            {!branchId
              ? 'اختر الفرع أولاً'
              : loadingCities
                ? 'جارٍ التحميل...'
                : cities.length === 0
                  ? 'لا توجد مدن متاحة'
                  : 'اختر المدينة'}
          </option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      {/* المنطقة / القرية */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="village-select" className="text-[11px] font-bold text-muted-foreground">
          المنطقة / القرية
        </label>
        <select
          id="village-select"
          value={villageId}
          onChange={(event) => setVillageId(event.target.value)}
          disabled={!cityId || loadingVillages}
          className={selectClass}
        >
          <option value="">
            {!cityId
              ? 'اختر المدينة أولاً'
              : loadingVillages
                ? 'جارٍ التحميل...'
                : villages.length === 0
                  ? 'لا توجد مناطق متاحة'
                  : 'اختر المنطقة / القرية'}
          </option>
          {villages.map((village) => (
            <option key={village.id} value={village.id}>
              {village.name}
            </option>
          ))}
        </select>
      </div>

      {/* تفصيل العنوان */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="address-details" className="text-[11px] font-bold text-muted-foreground">
          تفصيل العنوان
        </label>
        <textarea
          id="address-details"
          rows={2}
          value={details}
          onChange={(event) => {
            setDetails(event.target.value)
            setError('')
          }}
          placeholder="الشارع، رقم المنزل، علامة مميزة..."
          className="resize-none rounded-2xl border border-input bg-card px-3 py-2.5 text-xs leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        {error ? (
          <p role="alert" className="text-[11px] font-bold text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary py-2.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
        >
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {saving ? 'جارٍ الحفظ...' : 'حفظ العنوان'}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl bg-secondary px-4 py-2.5 text-xs font-bold text-secondary-foreground transition-colors hover:bg-secondary/70"
          >
            إلغاء
          </button>
        ) : null}
      </div>
    </div>
  )
}
