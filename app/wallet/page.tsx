import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { WalletView } from '@/components/wallet-view'
import { BottomNav } from '@/components/bottom-nav'
import {
  getActivePayoutMethods,
  getBalance,
  getMyTopupRequests,
  getWalletHistory,
} from '@/lib/wallet'

export const metadata: Metadata = {
  title: 'محفظتي | تسويقة الديب',
  description: 'اشحن رصيد مشترياتك عبر التحويل أو بطاقة شحن واستخدمه في طلباتك.',
}

export default async function WalletPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/account')
  }

  const [balance, history, requests, methods] = await Promise.all([
    getBalance(session.user.id),
    getWalletHistory(session.user.id),
    getMyTopupRequests(session.user.id),
    getActivePayoutMethods(),
  ])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <main className="flex-1 pb-24">
        <WalletView
          balance={balance}
          history={history}
          requests={requests}
          methods={methods}
        />
      </main>
      <BottomNav />
    </div>
  )
}
