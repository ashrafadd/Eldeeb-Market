import { headers } from 'next/headers'
import { BottomNav } from '@/components/bottom-nav'
import { CartView } from '@/components/cart-view'
import { getProducts } from '@/lib/products'
import { auth } from '@/lib/auth'
import { getBalance } from '@/lib/wallet'

export default async function CartPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  const [products, balance] = await Promise.all([
    getProducts(),
    session?.user ? getBalance(session.user.id) : Promise.resolve(0),
  ])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-card shadow-sm">
      <main className="flex-1 pb-24">
        <CartView products={products} balance={balance} />
      </main>

      <BottomNav />
    </div>
  )
}
