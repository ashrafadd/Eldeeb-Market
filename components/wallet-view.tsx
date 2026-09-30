'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Check,
  Copy,
  CreditCard,
  Landmark,
  Loader2,
  Receipt,
  Smartphone,
  Ticket,
  Upload,
  Wallet,
  X,
} from 'lucide-react'
import { formatEGP } from '@/lib/data'
import { fileToCompressedDataUrl } from '@/lib/image'
import { cn } from '@/lib/utils'
import { redeemPrepaidCard, submitTopup } from '@/app/actions/wallet'
import type { PayoutMethod, TopupRequest, WalletTx } from '@/lib/wallet'

const MIN_TOPUP = 50
const MAX_TOPUP = 20000
const QUICK_AMOUNTS = [100, 200, 500, 1000]

const METHOD_ICONS = {
  bank: Landmark,
  wallet: Smartphone,
  instapay: CreditCard,
} as const

const TX_STYLE = {
  topup: { label: 'تعبئة بتحويل', icon: Receipt },
  card: { label: 'بطاقة شحن', icon: Ticket },
  order: { label: 'دفع طلب', icon: Wallet },
  refund: { label: 'استرداد', icon: ArrowRight },
  adjustment: { label: 'تسوية إدارية', icon: Wallet },
} as const

const STATUS_STYLE = {
  pending: { label: 'قيد المراجعة', className: 'bg-amber-100 text-amber-800' },
  approved: { label: 'تم الاعتماد', className: 'bg-primary/15 text-primary' },
  rejected: { label: 'مرفوض', className: 'bg-destructive/10 text-destructive' },
} as const

type Tab = 'topup' | 'card' | 'history'

export function WalletView({
  balance,
  history,
  requests,
  methods,
}: {
  balance: number
  history: WalletTx[]
  requests: TopupRequest[]
  methods: PayoutMethod[]
}) {
  const [tab, setTab] = useState<Tab>('topup')

  return (
    <div className="flex flex-col">
      <header className="bg-primary px-4 pb-6 pt-5 text-primary-foreground">
        <div className="flex items-center gap-2">
          <Link
            href="/account"
            aria-label="رجوع إلى حسابي"
            className="flex size-8 items-center justify-center rounded-full bg-primary-foreground/15"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="text-base font-extrabold">محفظتي</h1>
        </div>

        <div className="pt-5">
          <p className="text-[11px] font-semibold text-primary-foreground/80">
            رصيد المشتريات المتاح
          </p>
          <p className="pt-1 text-[32px] font-extrabold leading-none tabular-nums">
            {formatEGP(balance)}
          </p>
          <p className="pt-2 text-[11px] font-medium text-primary-foreground/75">
            اختر «رصيد المحفظة» عند الدفع لتخصم من هذا الرصيد
          </p>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="أقسام المحفظة"
        className="sticky top-0 z-20 flex gap-1 border-b border-border bg-card/95 px-3 py-2 backdrop-blur"
      >
        <TabButton id="topup" active={tab === 'topup'} onClick={() => setTab('topup')}>
          تعبئة بتحويل
        </TabButton>
        <TabButton id="card" active={tab === 'card'} onClick={() => setTab('card')}>
          بطاقة شحن
        </TabButton>
        <TabButton
          id="history"
          active={tab === 'history'}
          onClick={() => setTab('history')}
        >
          السجل
        </TabButton>
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="px-4 py-4"
      >
        {tab === 'topup' ? <TopupTab methods={methods} requests={requests} /> : null}
        {tab === 'card' ? <CardTab /> : null}
        {tab === 'history' ? <HistoryTab history={history} /> : null}
      </div>
    </div>
  )
}

function TabButton({
  id,
  active,
  onClick,
  children,
}: {
  id: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-selected={active}
      aria-controls={`panel-${id}`}
      onClick={onClick}
      className={cn(
        'flex-1 rounded-xl px-2 py-2 text-[12px] font-bold transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

/* ── تعبئة بالتحويل ── */

function TopupTab({
  methods,
  requests,
}: {
  methods: PayoutMethod[]
  requests: TopupRequest[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState(methods[0]?.id ?? '')
  const [reference, setReference] = useState('')
  const [receipt, setReceipt] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState('')

  const selected = methods.find((item) => item.id === method)

  async function pickReceipt(file: File) {
    setError('')
    try {
      // أبعاد أكبر من صور المنتجات ليبقى رقم العملية مقروءاً
      const dataUrl = await fileToCompressedDataUrl(file, { maxDimension: 1000 })
      setReceipt(dataUrl)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر قراءة الصورة')
    }
  }

  function copy(value: string, key: string) {
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(key)
        setTimeout(() => setCopied(''), 1600)
      },
      () => setError('تعذر النسخ، انسخ الرقم يدوياً'),
    )
  }

  function handleSubmit() {
    setError('')

    const value = Number(amount)

    if (!Number.isFinite(value) || value <= 0) {
      setError('من فضلك أدخل المبلغ الذي حوّلته')
      return
    }

    if (value < MIN_TOPUP) {
      setError(`أقل مبلغ للتعبئة ${MIN_TOPUP} جنيه`)
      return
    }

    if (value > MAX_TOPUP) {
      setError(`أقصى مبلغ للتعبئة ${MAX_TOPUP} جنيه`)
      return
    }

    if (!method) {
      setError('اختر طريقة التحويل')
      return
    }

    if (reference.trim().length < 4) {
      setError('أدخل رقم عملية التحويل كما يظهر في الإيصال')
      return
    }

    startTransition(async () => {
      const result = await submitTopup({
        amount: value,
        method,
        reference: reference.trim(),
        receipt,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      setDone(true)
      setAmount('')
      setReference('')
      setReceipt('')
      router.refresh()
    })
  }

  if (methods.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-card">
            <Landmark className="size-5 text-muted-foreground" aria-hidden="true" />
          </span>
          <p className="pt-3 text-[13px] font-bold text-foreground">
            التعبئة بالتحويل غير متاحة حالياً
          </p>
          <p className="pt-1.5 text-[11px] font-medium leading-relaxed text-muted-foreground">
            لم يتم تفعيل بيانات التحويل بعد. يمكنك شحن رصيدك الآن باستخدام بطاقة شحن
            تسويقة المتوفرة في المتاجر.
          </p>
        </div>
        <PendingRequests requests={requests} />
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-8 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-primary/15">
            <Check className="size-5 text-primary" aria-hidden="true" />
          </span>
          <p className="pt-3 text-[13px] font-bold text-foreground">
            تم إرسال طلب التعبئة
          </p>
          <p className="pt-1.5 text-[11px] font-medium leading-relaxed text-muted-foreground">
            سيُضاف الرصيد إلى محفظتك بعد مراجعة التحويل والتأكد من وصوله.
          </p>
          <button
            type="button"
            onClick={() => setDone(false)}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-[12px] font-bold text-primary-foreground"
          >
            طلب تعبئة آخر
          </button>
        </div>
        <PendingRequests requests={requests} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2.5">
        <h2 className="text-[12px] font-bold text-foreground">1 — المبلغ المحوّل</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(String(value))}
              className={cn(
                'rounded-xl border px-3 py-2 text-[12px] font-bold tabular-nums transition-colors',
                Number(amount) === value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground',
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <input
          type="number"
          inputMode="decimal"
          min={MIN_TOPUP}
          max={MAX_TOPUP}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder={`مبلغ آخر (${MIN_TOPUP} - ${MAX_TOPUP} جنيه)`}
          aria-label="المبلغ المحوّل"
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] font-semibold tabular-nums outline-none focus:border-primary"
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-[12px] font-bold text-foreground">2 — حوّل المبلغ إلى</h2>
        <div className="flex flex-col gap-2">
          {methods.map((item) => {
            const Icon = METHOD_ICONS[item.id as keyof typeof METHOD_ICONS] ?? Landmark
            const active = method === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMethod(item.id)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-3 py-3 text-right transition-colors',
                  active ? 'border-primary bg-primary/5' : 'border-border bg-card',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-xl',
                    active ? 'bg-primary/15' : 'bg-muted',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-4.5',
                      active ? 'text-primary' : 'text-muted-foreground',
                    )}
                    aria-hidden="true"
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[12.5px] font-bold text-foreground">
                    {item.label}
                  </span>
                  <span className="truncate pt-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                    {item.number}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {selected ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/40 px-3 py-3">
            <DetailRow
              label="الرقم"
              value={selected.number}
              onCopy={() => copy(selected.number, 'number')}
              copied={copied === 'number'}
            />
            {selected.holder ? (
              <DetailRow
                label="الاسم"
                value={selected.holder}
                onCopy={() => copy(selected.holder, 'holder')}
                copied={copied === 'holder'}
              />
            ) : null}
            {selected.note ? (
              <p className="text-[10.5px] font-medium leading-relaxed text-muted-foreground">
                {selected.note}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-[12px] font-bold text-foreground">3 — إثبات التحويل</h2>
        <input
          type="text"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="رقم عملية التحويل"
          aria-label="رقم عملية التحويل"
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] font-semibold outline-none focus:border-primary"
        />

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void pickReceipt(file)
            event.target.value = ''
          }}
        />

        {receipt ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5">
            <img
              src={receipt || '/placeholder.svg'}
              alt="صورة إيصال التحويل"
              className="size-12 rounded-xl object-cover"
            />
            <span className="flex-1 text-[11.5px] font-semibold text-foreground">
              تم إرفاق الإيصال
            </span>
            <button
              type="button"
              onClick={() => setReceipt('')}
              aria-label="إزالة صورة الإيصال"
              className="flex size-7 items-center justify-center rounded-lg bg-muted"
            >
              <X className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-3 py-3 text-[12px] font-bold text-muted-foreground"
          >
            <Upload className="size-4" aria-hidden="true" />
            إرفاق صورة الإيصال (اختياري)
          </button>
        )}
      </section>

      {error ? (
        <p role="alert" className="text-[11.5px] font-semibold text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[13px] font-bold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        إرسال طلب التعبئة
      </button>

      <PendingRequests requests={requests} />
    </div>
  )
}

function DetailRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string
  value: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-[10.5px] font-semibold text-muted-foreground">
        {label}
      </span>
      <span className="flex-1 truncate text-[12px] font-bold tabular-nums text-foreground">
        {value}
      </span>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`نسخ ${label}`}
        className="flex size-7 items-center justify-center rounded-lg bg-card"
      >
        {copied ? (
          <Check className="size-3.5 text-primary" aria-hidden="true" />
        ) : (
          <Copy className="size-3.5 text-muted-foreground" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

function PendingRequests({ requests }: { requests: TopupRequest[] }) {
  if (requests.length === 0) return null

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[12px] font-bold text-foreground">طلبات التعبئة</h2>
      <ul className="flex flex-col gap-2">
        {requests.map((request) => {
          const status = STATUS_STYLE[request.status]

          return (
            <li
              key={request.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[12.5px] font-bold tabular-nums text-foreground">
                  {formatEGP(request.amount)}
                </span>
                <span className="truncate pt-0.5 text-[10.5px] font-medium text-muted-foreground">
                  {`${new Date(request.createdAt).toLocaleDateString('ar-EG', {
                    day: 'numeric',
                    month: 'long',
                  })} · ${request.reference}`}
                </span>
                {request.adminNote ? (
                  <span className="pt-1 text-[10.5px] font-semibold text-destructive">
                    {request.adminNote}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  'shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold',
                  status.className,
                )}
              >
                {status.label}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ── بطاقة الشحن ── */

function CardTab() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [credited, setCredited] = useState<number | null>(null)

  function handleRedeem() {
    setError('')
    setCredited(null)

    if (code.trim().length === 0) {
      setError('من فضلك أدخل كود البطاقة')
      return
    }

    startTransition(async () => {
      const result = await redeemPrepaidCard(code)

      if (!result.ok) {
        setError(result.error)
        return
      }

      setCredited(result.amount)
      setCode('')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-card px-4 py-5">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10">
          <Ticket className="size-5 text-primary" aria-hidden="true" />
        </span>
        <h2 className="pt-3 text-[13px] font-bold text-foreground">
          اشحن رصيدك ببطاقة تسويقة
        </h2>
        <p className="pt-1.5 text-[11px] font-medium leading-relaxed text-muted-foreground">
          اكشط الغطاء الفضي على ظهر البطاقة وأدخل الكود كما هو مكتوب. لا يفرق حرف
          كبير أو صغير، ولا داعي لكتابة الشرطات.
        </p>

        <input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.nativeEvent.isComposing &&
              event.keyCode !== 229
            ) {
              handleRedeem()
            }
          }}
          placeholder="TSW-XXXX-XXXX-XXXX"
          aria-label="كود بطاقة الشحن"
          dir="ltr"
          className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-3 text-center text-[14px] font-bold tracking-widest outline-none focus:border-primary"
        />

        {credited !== null ? (
          <p
            role="status"
            className="pt-3 text-[12px] font-bold text-primary"
          >{`تمت إضافة ${formatEGP(credited)} إلى محفظتك`}</p>
        ) : null}

        {error ? (
          <p role="alert" className="pt-3 text-[11.5px] font-semibold text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleRedeem}
          disabled={pending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[13px] font-bold text-primary-foreground disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          شحن الرصيد
        </button>
      </div>

      <p className="px-1 text-[10.5px] font-medium leading-relaxed text-muted-foreground">
        بطاقات تسويقة متوفرة في المتاجر والأكشاك. كل بطاقة تُستخدم مرة واحدة فقط.
      </p>
    </div>
  )
}

/* ── السجل ── */

function HistoryTab({ history }: { history: WalletTx[] }) {
  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-card">
          <Wallet className="size-5 text-muted-foreground" aria-hidden="true" />
        </span>
        <p className="pt-3 text-[13px] font-bold text-foreground">لا حركات بعد</p>
        <p className="pt-1.5 text-[11px] font-medium text-muted-foreground">
          ستظهر هنا كل عمليات الشحن والدفع من محفظتك.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {history.map((tx) => {
        const style = TX_STYLE[tx.kind] ?? TX_STYLE.adjustment
        const Icon = style.icon
        const credit = tx.amount > 0

        return (
          <li
            key={tx.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5"
          >
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-xl',
                credit ? 'bg-primary/10' : 'bg-muted',
              )}
            >
              <Icon
                className={cn(
                  'size-4',
                  credit ? 'text-primary' : 'text-muted-foreground',
                )}
                aria-hidden="true"
              />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[12.5px] font-bold text-foreground">
                {tx.description || style.label}
              </span>
              <span className="pt-0.5 text-[10.5px] font-medium text-muted-foreground">
                {new Date(tx.createdAt).toLocaleDateString('ar-EG', {
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            </span>
            <span
              className={cn(
                'shrink-0 text-[12.5px] font-extrabold tabular-nums',
                credit ? 'text-primary' : 'text-foreground',
              )}
            >
              {credit ? '+' : '−'}
              {formatEGP(Math.abs(tx.amount))}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
