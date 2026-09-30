'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useSession } from '@/lib/auth-client'
import {
  addCartItem,
  clearCartItems,
  getAddresses,
  getCart,
  removeAddress as removeAddressAction,
  removeCartItem,
  saveAddress as saveAddressAction,
  selectAddress as selectAddressAction,
  setCartQty,
} from '@/app/actions/account'

const GUEST_CART_KEY = 'eldeeb-guest-cart'

function readGuestCart(): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeGuestCart(lines: CartLine[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(lines))
  } catch {
    // يتم تجاهل أخطاء التخزين
  }
}

export type CartLine = { id: string; qty: number }

/** فهرس أسعار المنتجات يأتي من الخادم لحساب إجماليات السلة */
export type PriceIndex = Record<string, { price: number; oldPrice?: number }>

export type DbAddress = {
  id: number
  city: string
  village: string
  details: string
  branchId: string | null
  cityId: string | null
  villageId: string | null
  isActive: boolean
}

export type SaveAddressArgs = {
  branchId: string
  cityId: string
  villageId: string
  details: string
}

type StoreValue = {
  cart: CartLine[]
  cartCount: number
  subtotal: number
  savings: number
  addToCart: (id: string, qty?: number) => void
  setQty: (id: string, qty: number) => void
  removeFromCart: (id: string) => void
  clearCart: () => void
  wishlist: string[]
  toggleWishlist: (id: string) => void
  isWished: (id: string) => boolean
  isSignedIn: boolean
  addresses: DbAddress[]
  activeAddress: DbAddress | null
  addressesLoading: boolean
  saveAddress: (args: SaveAddressArgs) => Promise<{ ok: boolean; error?: string }>
  selectAddress: (id: number) => Promise<void>
  removeAddress: (id: number) => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({
  children,
  priceIndex = {},
}: {
  children: React.ReactNode
  priceIndex?: PriceIndex
}) {
  const { data: session, isPending } = useSession()
  const isSignedIn = Boolean(session?.user)

  const [cart, setCart] = useState<CartLine[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [addresses, setAddresses] = useState<DbAddress[]>([])
  const [addressesLoading, setAddressesLoading] = useState(false)

  // تُحمَّل السلة: من قاعدة البيانات للمسجلين، ومن التخزين المحلي للزوار
  useEffect(() => {
    if (isPending) return

    let cancelled = false

    if (!isSignedIn) {
      setCart(readGuestCart())
      return
    }

    async function syncCart() {
      const guestLines = readGuestCart()

      // تُدمج سلة الزائر في حسابه بعد تسجيل الدخول
      if (guestLines.length) {
        writeGuestCart([])
        for (const line of guestLines) {
          try {
            await addCartItem(line.id, line.qty)
          } catch (error) {
            console.log('[v0] merge guest cart failed:', error)
          }
        }
      }

      try {
        const rows = await getCart()
        if (cancelled) return
        setCart(rows.map((row) => ({ id: row.productId, qty: row.qty })))
      } catch (error) {
        console.log('[v0] failed to load cart:', error)
      }
    }

    syncCart()

    return () => {
      cancelled = true
    }
  }, [isSignedIn, isPending])

  // تُجلب العناوين من قاعدة البيانات بعد تسجيل الدخول
  useEffect(() => {
    if (isPending) return
    if (!isSignedIn) {
      setAddresses([])
      return
    }

    let cancelled = false
    setAddressesLoading(true)

    getAddresses()
      .then((rows) => {
        if (cancelled) return
        setAddresses(
          rows.map((row) => ({
            id: row.id,
            city: row.city,
            village: row.village,
            details: row.details,
            branchId: row.branchId ?? null,
            cityId: row.cityId ?? null,
            villageId: row.villageId ?? null,
            isActive: row.isActive,
          })),
        )
      })
      .catch((error) => {
        console.log('[v0] failed to load addresses:', error)
      })
      .finally(() => {
        if (!cancelled) setAddressesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isSignedIn, isPending])

  const saveAddress = useCallback(async (args: SaveAddressArgs) => {
    const result = await saveAddressAction(args)
    if (!result.ok) return { ok: false, error: result.error }

    const saved = result.address
    setAddresses((prev) => [
      {
        id: saved.id,
        city: saved.city,
        village: saved.village,
        details: saved.details,
        branchId: saved.branchId,
        cityId: saved.cityId,
        villageId: saved.villageId,
        isActive: true,
      },
      ...prev.map((item) => ({ ...item, isActive: false })),
    ])
    return { ok: true }
  }, [])

  const selectAddress = useCallback(async (id: number) => {
    setAddresses((prev) => prev.map((item) => ({ ...item, isActive: item.id === id })))
    await selectAddressAction(id)
  }, [])

  const removeAddress = useCallback(async (id: number) => {
    setAddresses((prev) => {
      const next = prev.filter((item) => item.id !== id)
      if (next.length && !next.some((item) => item.isActive)) {
        next[0] = { ...next[0], isActive: true }
      }
      return next
    })
    await removeAddressAction(id)
  }, [])

  const addToCart = useCallback(
    (id: string, qty = 1) => {
      setCart((prev) => {
        const existing = prev.find((line) => line.id === id)
        const next = existing
          ? prev.map((line) =>
              line.id === id ? { ...line, qty: Math.min(line.qty + qty, 20) } : line,
            )
          : [...prev, { id, qty: Math.min(qty, 20) }]
        if (!isSignedIn) writeGuestCart(next)
        return next
      })
      if (isSignedIn) {
        addCartItem(id, qty).catch((error) =>
          console.log('[v0] addCartItem failed:', error),
        )
      }
    },
    [isSignedIn],
  )

  const setQty = useCallback(
    (id: string, qty: number) => {
      setCart((prev) => {
        const next =
          qty <= 0
            ? prev.filter((line) => line.id !== id)
            : prev.map((line) =>
                line.id === id ? { ...line, qty: Math.min(qty, 20) } : line,
              )
        if (!isSignedIn) writeGuestCart(next)
        return next
      })
      if (isSignedIn) {
        setCartQty(id, qty).catch((error) =>
          console.log('[v0] setCartQty failed:', error),
        )
      }
    },
    [isSignedIn],
  )

  const removeFromCart = useCallback(
    (id: string) => {
      setCart((prev) => {
        const next = prev.filter((line) => line.id !== id)
        if (!isSignedIn) writeGuestCart(next)
        return next
      })
      if (isSignedIn) {
        removeCartItem(id).catch((error) =>
          console.log('[v0] removeCartItem failed:', error),
        )
      }
    },
    [isSignedIn],
  )

  const clearCart = useCallback(() => {
    setCart([])
    if (isSignedIn) {
      clearCartItems().catch((error) =>
        console.log('[v0] clearCartItems failed:', error),
      )
    } else {
      writeGuestCart([])
    }
  }, [isSignedIn])

  const toggleWishlist = useCallback((id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }, [])

  const totals = useMemo(() => {
    return cart.reduce(
      (acc, line) => {
        const entry = priceIndex[line.id]
        if (!entry) return acc
        acc.count += line.qty
        acc.subtotal += entry.price * line.qty
        if (entry.oldPrice) {
          acc.savings += (entry.oldPrice - entry.price) * line.qty
        }
        return acc
      },
      { count: 0, subtotal: 0, savings: 0 },
    )
  }, [cart, priceIndex])

  const value = useMemo<StoreValue>(
    () => ({
      cart,
      cartCount: totals.count,
      subtotal: totals.subtotal,
      savings: totals.savings,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      wishlist,
      toggleWishlist,
      isWished: (id: string) => wishlist.includes(id),
      isSignedIn,
      addresses,
      activeAddress: addresses.find((item) => item.isActive) ?? addresses[0] ?? null,
      addressesLoading,
      saveAddress,
      selectAddress,
      removeAddress,
    }),
    [
      cart,
      totals,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      wishlist,
      toggleWishlist,
      isSignedIn,
      addresses,
      addressesLoading,
      saveAddress,
      selectAddress,
      removeAddress,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used inside StoreProvider')
  }
  return context
}
