import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { LayoutDashboard } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getAdmin } from '@/lib/admin'
import { getBalance } from '@/lib/wallet'
import { getActiveBranches } from '@/lib/branches'
import { getCurrentUser } from '@/lib/roles'
import { getAddresses, getOrders, getPoints } from '@/app/actions/account'
import { getActiveSubscription } from '@/app/actions/subscriptions'
import { BottomNav } from '@/components/bottom-nav'
import { AccountView } from '@/components/account-view'
import { BranchSelector } from '@/components/branch-selector'
import { AuthForm } from '@/components/auth-form'

export const metadata: Metadata = {
  title: 'حسابي | تسويقة الديب',
  description: 'تسجيل الدخول، مشترياتي السابقة، نقاطي، والتواصل مع خدمة عملاء تسويقة الديب.',
}

/** يحوّل رقم الحساب من الصيغة الدولية (+201…) إلى المحلية (01…) للعرض. */
function intlToLocalPhone(user: { phoneNumber?: string | null }): string {
  const intl = user.phoneNumber
  if (!intl) return '—'
  return intl.startsWith('+20') ? `0${intl.slice(3)}` : intl
}

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <main className="flex-1 pb-24">
        {session?.user ? <AccountContent /> : <AuthForm />}
      </main>
      <BottomNav />
    </div>
  )
}

async function AccountContent() {
  const session = await auth.api.getSession({ headers: await headers() })

  const [orders, points, addresses, subscription, balance, admin, branches, current] =
    await Promise.all([
      getOrders(),
      getPoints(),
      getAddresses(),
      getActiveSubscription(),
      session?.user ? getBalance(session.user.id) : Promise.resolve(0),
      getAdmin(),
      getActiveBranches(),
      getCurrentUser(),
    ])

  return (
    <>
      {admin ? (
        <div className="px-4 pt-4">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-3.5 py-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <LayoutDashboard className="size-4.5 text-primary" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[13px] font-bold text-foreground">لوحة التحكم</span>
              <span className="truncate pt-0.5 text-[10px] font-medium text-muted-foreground">
                إدارة منتجات المتجر
              </span>
            </span>
          </Link>
        </div>
      ) : null}
      {branches.length > 0 ? (
        <BranchSelector
          branches={branches.map((branch) => ({
            id: branch.id,
            name: branch.name,
            city: branch.city,
          }))}
          currentBranchId={current?.branchId ?? null}
        />
      ) : null}
      <AccountView
      user={{ name: session!.user.name, phone: intlToLocalPhone(session!.user) }}
      orders={orders.map((order) => ({
        id: order.id,
        reference: order.reference,
        status: order.status,
        paymentMethod: order.paymentMethod,
        total: Number(order.total),
        pointsEarned: order.pointsEarned,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          productId: item.productId,
          title: item.title,
          price: Number(item.price),
          qty: item.qty,
        })),
      }))}
      points={points.balance}
      pointHistory={points.history.map((event) => ({
        id: event.id,
        label: event.label,
        points: event.points,
        createdAt: event.createdAt.toISOString(),
      }))}
      subscription={subscription}
      balance={balance}
      addresses={addresses.map((address) => ({
        id: address.id,
        city: address.city,
        village: address.village,
          details: address.details,
        }))}
      />
    </>
  )
}
