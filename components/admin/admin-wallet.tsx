'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Ban,
  Check,
  ChevronLeft,
  Copy,
  CreditCard,
  Landmark,
  Loader2,
  Plus,
  Smartphone,
  TriangleAlert,
  Wallet,
  X,
} from 'lucide-react'
import { formatEGP } from '@/lib/data'
import type { PayoutMethod } from '@/lib/wallet'
import {
  approveTopupRequest,
  disableCard,
  generateCards,
  listCardsOfBatch,
  rejectTopupRequest,
  savePayoutMethod,
  type AdminCard,
  type AdminTopup,
  type CardBatchSummary,
} from '@/app/actions/admin-wallet'

type Tab = 'topups' | 'cards' | 'payout'

const METHOD_ICONS = {
  bank: Landmark,
  wallet: Smartphone,
  instapay: CreditCard,
} as const

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function AdminWallet({
  topups,
  batches,
  methods,
}: {
  topups: AdminTopup[]
  batches: CardBatchSummary[]
  methods: PayoutMethod[]
}) {
  const [tab, setTab] = useState<Tab>('topups')

  const pendingCount = topups.filter((item) => item.status === 'pending').length

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <header className="sticky top-0 z-20 flex flex-col gap-3 border-b border-border bg-card px-4 pb-3 pt-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground"
            aria-label="رجوع للمنتجات"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-extrabold text-foreground">
              المحفظة والبطاقات
            </h1>
            <p className="truncate pt-0.5 text-[11px] font-medium text-muted-foreground">
              {pendingCount > 0
                ? `${pendingCount} طلب تعبئة في انتظار المراجعة`
                : 'لا طلبات في الانتظار'}
            </p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="أقسام المحفظة"
          className="flex gap-1 rounded-2xl bg-muted p-1"
        >
          <TabButton active={tab === 'topups'} onClick={() => setTab('topups')} badge={pendingCount}>
            الطلبات
          </TabButton>
          <TabButton active={tab === 'cards'} onClick={() => setTab('cards')}>
            البطاقات
          </TabButton>
          <TabButton active={tab === 'payout'} onClick={() => setTab('payout')}>
            بيانات التحويل
          </TabButton>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">
        {tab === 'topups' ? <TopupsPanel topups={topups} /> : null}
        {tab === 'cards' ? <CardsPanel batches={batches} /> : null}
        {tab === 'payout' ? <PayoutPanel methods={methods} /> : null}
      </main>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  badge,
  children,
}: {
  active: boolean
  onClick: () => void
  badge?: number
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative flex-1 rounded-xl py-2 text-[12px] font-bold transition-colors ${
        active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
      }`}
    >
      {children}
      {badge && badge > 0 ? (
        <span className="ms-1 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
          {badge}
        </span>
      ) : null}
    </button>
  )
}

/* ── طلبات التعبئة ── */

function TopupsPanel({ topups }: { topups: AdminTopup[] }) {
  if (topups.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="size-7 text-muted-foreground" aria-hidden="true" />}
        title="لا توجد طلبات تعبئة"
        body="ستظهر هنا طلبات العملاء بعد أن يحوّلوا المبلغ ويرفعوا الإيصال."
      />
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {topups.map((item) => (
        <li key={item.id}>
          <TopupCard topup={item} />
        </li>
      ))}
    </ul>
  )
}

function TopupCard({ topup }: { topup: AdminTopup }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [zoom, setZoom] = useState(false)

  function approve() {
    setError(null)
    start(async () => {
      const result = await approveTopupRequest(topup.id)
      if (!result.ok) setError(result.error)
      else router.refresh()
    })
  }

  function reject() {
    setError(null)
    start(async () => {
      const result = await rejectTopupRequest(topup.id, note)
      if (!result.ok) setError(result.error)
      else {
        setRejecting(false)
        router.refresh()
      }
    })
  }

  const isPending = topup.status === 'pending'

  return (
    <article
      className={`rounded-2xl border bg-card p-3.5 ${
        isPending ? 'border-primary/30' : 'border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-foreground">{topup.customerName}</p>
          <p className="truncate pt-0.5 text-[11px] text-muted-foreground">{topup.customerEmail}</p>
        </div>
        <span className="shrink-0 text-[15px] font-extrabold text-primary">
          {formatEGP(topup.amount)}
        </span>
      </div>

      <dl className="mt-3 flex flex-col gap-1.5 rounded-xl bg-muted/60 px-3 py-2.5">
        <Row label="الطريقة" value={topup.methodLabel} />
        <Row label="رقم العملية" value={topup.reference || '—'} mono />
        <Row label="التاريخ" value={formatDate(topup.createdAt)} />
      </dl>

      {topup.receipt ? (
        <button
          type="button"
          onClick={() => setZoom(true)}
          className="mt-2.5 flex w-full items-center gap-2.5 rounded-xl border border-border px-3 py-2 text-start"
        >
          <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image src={topup.receipt} alt="" fill className="object-cover" unoptimized />
          </span>
          <span className="min-w-0 flex-1 text-[11px] font-bold text-foreground">
            اضغط لعرض الإيصال
          </span>
          <ChevronLeft className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      ) : (
        <p className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-muted/60 px-3 py-2 text-[11px] font-medium text-muted-foreground">
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          لم يرفع العميل إيصالاً
        </p>
      )}

      {topup.status === 'approved' ? (
        <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-primary">
          <Check className="size-3.5" aria-hidden="true" />
          تم الاعتماد وأُضيف الرصيد
        </p>
      ) : null}

      {topup.status === 'rejected' ? (
        <p className="mt-2.5 text-[11px] font-medium text-destructive">
          {`مرفوض — ${topup.adminNote}`}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2.5 text-[11px] font-bold text-destructive">
          {error}
        </p>
      ) : null}

      {isPending && !rejecting ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={approve}
            disabled={pending}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[12px] font-bold text-primary-foreground disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="size-3.5" aria-hidden="true" />
            )}
            اعتماد وإضافة الرصيد
          </button>
          <button
            type="button"
            onClick={() => setRejecting(true)}
            disabled={pending}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-3.5 py-2.5 text-[12px] font-bold text-destructive disabled:opacity-60"
          >
            <X className="size-3.5" aria-hidden="true" />
            رفض
          </button>
        </div>
      ) : null}

      {isPending && rejecting ? (
        <div className="mt-3 flex flex-col gap-2">
          <label htmlFor={`note-${topup.id}`} className="text-[11px] font-bold text-foreground">
            سبب الرفض (يظهر للعميل)
          </label>
          <input
            id={`note-${topup.id}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="مثال: رقم العملية غير صحيح"
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-[12px] text-foreground outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reject}
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive py-2.5 text-[12px] font-bold text-destructive-foreground disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
              تأكيد الرفض
            </button>
            <button
              type="button"
              onClick={() => {
                setRejecting(false)
                setNote('')
              }}
              className="rounded-xl border border-border px-3.5 py-2.5 text-[12px] font-bold text-muted-foreground"
            >
              إلغاء
            </button>
          </div>
        </div>
      ) : null}

      {zoom ? (
        <div
          role="dialog"
          aria-label="الإيصال"
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4"
          onClick={() => setZoom(false)}
        >
          <div className="relative max-h-[80dvh] w-full max-w-sm overflow-auto rounded-2xl bg-card p-2">
            <Image
              src={topup.receipt}
              alt={`إيصال تحويل ${formatEGP(topup.amount)}`}
              width={800}
              height={1200}
              className="h-auto w-full rounded-xl"
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={() => setZoom(false)}
            className="absolute end-4 top-4 flex size-10 items-center justify-center rounded-full bg-card"
            aria-label="إغلاق"
          >
            <X className="size-4 text-foreground" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </article>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-[11px] font-medium text-muted-foreground">{label}</dt>
      <dd
        className={`min-w-0 truncate text-[11px] font-bold text-foreground ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

/* ── بطاقات الشحن ── */

const CARD_PRESETS = [25, 50, 100, 200]

function CardsPanel({ batches }: { batches: CardBatchSummary[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [amount, setAmount] = useState('50')
  const [count, setCount] = useState('10')
  const [error, setError] = useState<string | null>(null)
  const [fresh, setFresh] = useState<{ batch: string; codes: string[] } | null>(null)
  const [confirming, setConfirming] = useState(false)

  const countNum = Math.trunc(Number(count))
  const amountNum = Number(amount)
  const totalValue = countNum > 0 && amountNum > 0 ? countNum * amountNum : 0

  function submit() {
    setError(null)
    setConfirming(false)
    start(async () => {
      const result = await generateCards({ amount: amountNum, count: countNum })
      if (!result.ok) setError(result.error)
      else {
        setFresh({ batch: result.batch, codes: result.codes })
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-border bg-card p-3.5">
        <h2 className="text-[13px] font-extrabold text-foreground">إنشاء دفعة بطاقات</h2>
        <p className="pt-1 text-[11px] leading-5 text-muted-foreground text-pretty">
          تُنشئ الأكواد هنا ثم تطبعها وتوزعها على المتاجر. يشتريها العميل ويدخل الكود ليُضاف الرصيد
          فوراً.
        </p>

        <div className="mt-3 flex flex-col gap-2.5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-foreground">قيمة البطاقة</span>
            <div className="flex flex-wrap gap-1.5">
              {CARD_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold ${
                    amount === String(preset)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {formatEGP(preset)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-[11px] font-bold text-foreground">القيمة (جنيه)</span>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] font-bold text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-[11px] font-bold text-foreground">عدد البطاقات</span>
              <input
                type="number"
                inputMode="numeric"
                value={count}
                onChange={(event) => setCount(event.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] font-bold text-foreground outline-none focus:border-primary"
              />
            </label>
          </div>

          {error ? (
            <p role="alert" className="text-[11px] font-bold text-destructive">
              {error}
            </p>
          ) : null}

          {confirming ? (
            <div className="flex flex-col gap-2 rounded-xl bg-secondary/60 p-3">
              <p className="text-[12px] font-bold leading-5 text-foreground text-pretty">
                {`سيتم إنشاء ${countNum} بطاقة بقيمة ${formatEGP(amountNum)} للواحدة — إجمالي ${formatEGP(totalValue)}. تأكد من العدد قبل التأكيد.`}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[12px] font-bold text-primary-foreground disabled:opacity-60"
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  تأكيد الإنشاء
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={pending}
                  className="rounded-xl border border-border px-4 py-2.5 text-[12px] font-bold text-muted-foreground disabled:opacity-60"
                >
                  رجوع
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setError(null)
                if (!Number.isFinite(amountNum) || amountNum <= 0) {
                  setError('أدخل قيمة صحيحة للبطاقة')
                  return
                }
                if (!Number.isFinite(countNum) || countNum < 1) {
                  setError('أدخل عدد البطاقات')
                  return
                }
                setConfirming(true)
              }}
              disabled={pending}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-3 text-[13px] font-bold text-primary-foreground disabled:opacity-60"
            >
              <Plus className="size-4" aria-hidden="true" />
              إنشاء الأكواد
            </button>
          )}
        </div>
      </section>

      {fresh ? <FreshCodes batch={fresh.batch} codes={fresh.codes} /> : null}

      <section className="flex flex-col gap-2.5">
        <h2 className="text-[13px] font-extrabold text-foreground">الدفعات</h2>
        {batches.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-3.5 py-6 text-center text-[12px] text-muted-foreground">
            لم تُنشئ أي دفعة بعد
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {batches.map((batch) => (
              <li key={`${batch.batch}-${batch.amount}`}>
                <BatchCard batch={batch} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function FreshCodes({ batch, codes }: { batch: string; codes: string[] }) {
  const [copied, setCopied] = useState(false)

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[13px] font-extrabold text-primary">
            {`تم إنشاء ${codes.length} بطاقة`}
          </h2>
          <p className="truncate pt-0.5 font-mono text-[10px] text-muted-foreground">{batch}</p>
        </div>
        <button
          type="button"
          onClick={copyAll}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground"
        >
          <Copy className="size-3.5" aria-hidden="true" />
          {copied ? 'تم النسخ' : 'نسخ الكل'}
        </button>
      </div>

      <p className="pt-2 text-[10px] font-medium leading-4 text-muted-foreground text-pretty">
        انسخ الأكواد الآن واحفظها للطباعة. تظل متاحة في تفاصيل الدفعة أدناه.
      </p>

      <ul className="mt-2.5 flex max-h-48 flex-col gap-1 overflow-auto rounded-xl bg-card p-2">
        {codes.map((code) => (
          <li key={code} className="font-mono text-[11px] font-bold text-foreground">
            {code}
          </li>
        ))}
      </ul>
    </section>
  )
}

function BatchCard({ batch }: { batch: CardBatchSummary }) {
  const [open, setOpen] = useState(false)
  const [cards, setCards] = useState<AdminCard[] | null>(null)
  const [pending, start] = useTransition()

  function toggle() {
    if (open) {
      setOpen(false)
      return
    }

    setOpen(true)

    if (!cards) {
      start(async () => {
        setCards(await listCardsOfBatch(batch.batch))
      })
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-3.5">
      <button type="button" onClick={toggle} className="flex w-full items-center gap-3 text-start">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <CreditCard className="size-4.5 text-primary" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold text-foreground">
            {`${batch.total} بطاقة × ${formatEGP(batch.amount)}`}
          </span>
          <span className="block truncate pt-0.5 text-[11px] text-muted-foreground">
            {`متاحة ${batch.active} · مستخدمة ${batch.redeemed}`}
          </span>
        </span>
        <ChevronLeft
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${
            open ? '-rotate-90' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="mt-3 border-t border-border pt-3">
          {pending && !cards ? (
            <p className="flex items-center justify-center gap-2 py-3 text-[11px] text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              جارٍ التحميل
            </p>
          ) : null}

          {cards ? (
            <ul className="flex max-h-64 flex-col gap-1.5 overflow-auto">
              {cards.map((card) => (
                <li key={card.id}>
                  <CardRow card={card} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function CardRow({ card }: { card: AdminCard }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function toggle() {
    start(async () => {
      await disableCard(card.id)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-2.5 py-2">
      <span className="min-w-0 flex-1 font-mono text-[11px] font-bold text-foreground">
        {card.code}
      </span>

      {card.status === 'redeemed' ? (
        <span className="shrink-0 text-[10px] font-bold text-muted-foreground">
          {card.redeemedByName ? `استخدمها ${card.redeemedByName}` : 'مستخدمة'}
        </span>
      ) : (
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold disabled:opacity-60 ${
            card.status === 'disabled'
              ? 'bg-primary/10 text-primary'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {pending ? (
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          ) : (
            <Ban className="size-3" aria-hidden="true" />
          )}
          {card.status === 'disabled' ? 'تشغيل' : 'إيقاف'}
        </button>
      )}
    </div>
  )
}

/* ── بيانات التحويل ── */

function PayoutPanel({ methods }: { methods: PayoutMethod[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-2xl bg-muted/60 px-3.5 py-3 text-[11px] leading-5 text-muted-foreground text-pretty">
        أدخل بيانات الحساب أو المحفظة التي تستقبل عليها الأموال. الطريقة لا تظهر للعملاء إلا بعد
        تفعيلها، والتفعيل يتطلب اسم صاحب الحساب والرقم.
      </p>

      {methods.map((method) => (
        <PayoutForm key={method.id} method={method} />
      ))}
    </div>
  )
}

function PayoutForm({ method }: { method: PayoutMethod }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [holder, setHolder] = useState(method.holder)
  const [number, setNumber] = useState(method.number)
  const [note, setNote] = useState(method.note)
  const [enabled, setEnabled] = useState(method.enabled)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const Icon = METHOD_ICONS[method.id as keyof typeof METHOD_ICONS] ?? Landmark

  function submit() {
    setError(null)
    setSaved(false)
    start(async () => {
      const result = await savePayoutMethod({ id: method.id, holder, number, note, enabled })
      if (!result.ok) {
        setError(result.error)
        setEnabled(method.enabled)
      } else {
        setSaved(true)
        router.refresh()
        window.setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="size-4 text-primary" aria-hidden="true" />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-[13px] font-extrabold text-foreground">
          {method.label}
        </h2>
        <span
          className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold ${
            method.enabled
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {method.enabled ? 'مفعّلة' : 'متوقفة'}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-foreground">اسم صاحب الحساب</span>
          <input
            value={holder}
            onChange={(event) => setHolder(event.target.value)}
            placeholder="الاسم كما يظهر في الحساب"
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-[12px] text-foreground outline-none focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-foreground">
            {method.id === 'bank' ? 'رقم الحساب / IBAN' : 'الرقم'}
          </span>
          <input
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            placeholder={method.id === 'bank' ? 'EG…' : '01…'}
            dir="ltr"
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-start font-mono text-[12px] text-foreground outline-none focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-foreground">ملاحظة للعميل (اختياري)</span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="مثال: اسم البنك أو الفرع"
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-[12px] text-foreground outline-none focus:border-primary"
          />
        </label>

        <label className="flex items-center gap-2.5 rounded-xl bg-muted/60 px-3 py-2.5">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="size-4 accent-primary"
          />
          <span className="text-[11px] font-bold text-foreground">
            إظهار هذه الطريقة للعملاء
          </span>
        </label>

        {error ? (
          <p role="alert" className="text-[11px] font-bold text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[12px] font-bold text-primary-foreground disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
          {saved ? 'تم الحفظ' : 'حفظ'}
        </button>
      </div>
    </section>
  )
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">{icon}</div>
      <h2 className="text-[13px] font-extrabold text-foreground">{title}</h2>
      <p className="text-[11px] leading-5 text-muted-foreground text-pretty">{body}</p>
    </div>
  )
}
