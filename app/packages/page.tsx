import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getActiveSubscription } from '@/app/actions/subscriptions'
import { BottomNav } from '@/components/bottom-nav'
import { PackagesView } from '@/components/packages-view'

export const metadata: Metadata = {
  title: 'الباقات | تسويقة الديب',
  description:
    'باقات اشتراك تسويقة الديب: الباقة العادية، الفضية، والذهبية — توصيل مجاني، خصومات على المنتجات، ونقاط مضاعفة.',
}

export default async function PackagesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const subscription = session?.user ? await getActiveSubscription() : null

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <main className="flex-1 pb-24">
        <PackagesView isSignedIn={Boolean(session?.user)} subscription={subscription} />
      </main>
      <BottomNav />
    </div>
  )
}
