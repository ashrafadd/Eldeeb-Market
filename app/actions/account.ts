'use server'

import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  addresses,
  branches,
  branchStock,
  cartItems,
  cities,
  orderItems,
  orders,
  pointEvents,
  user,
  villages,
  walletTransactions,
} from '@/lib/db/schema'
import { DEFAULT_CITY } from '@/lib/locations'
import { lockedBalance } from '@/lib/wallet'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

/** يُرجع رقم موبايل الحساب بالصيغة المحلية (01…) لعرضه وربطه بالطلب. */
async function getSessionPhone() {
  const session = await auth.api.getSession({ headers: await headers() })
  const intl = (session?.user as { phoneNumber?: string } | undefined)?.phoneNumber
  if (!intl) return null
  // نحوّل +201xxxxxxxxx إلى 01xxxxxxxxx للعرض المحلي.
  return intl.startsWith('+20') ? `0${intl.slice(3)}` : intl
}

/* ── العناوين ── */

export async function getAddresses() {
  const userId = await getUserId()
  return db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .orderBy(desc(addresses.createdAt))
}

export type SaveAddressInput = {
  branchId: string
  cityId: string
  villageId: string
  details: string
}

export async function saveAddress(input: SaveAddressInput) {
  const userId = await getUserId()
  const cleanDetails = input.details.trim()

  if (!input.branchId || !input.cityId || !input.villageId) {
    return { ok: false as const, error: 'من فضلك اختر الفرع والمدينة والمنطقة / القرية' }
  }
  if (cleanDetails.length < 5) {
    return { ok: false as const, error: 'اكتب تفصيل العنوان (شارع، علامة مميزة، رقم المنزل)' }
  }

  // نتحقق من الانتماء الهرمي ونستنتج النصوص من قاعدة البيانات (لا نثق بمدخلات العميل)
  const [branch] = await db
    .select({ id: branches.id, name: branches.name, active: branches.active })
    .from(branches)
    .where(eq(branches.id, input.branchId))
    .limit(1)
  if (!branch || !branch.active) return { ok: false as const, error: 'الفرع غير متاح' }

  const [city] = await db
    .select({ id: cities.id, name: cities.name, branchId: cities.branchId, active: cities.active })
    .from(cities)
    .where(eq(cities.id, input.cityId))
    .limit(1)
  if (!city || city.branchId !== branch.id || !city.active) {
    return { ok: false as const, error: 'المدينة غير متاحة لهذا الفرع' }
  }

  const [village] = await db
    .select({ id: villages.id, name: villages.name, cityId: villages.cityId, active: villages.active })
    .from(villages)
    .where(eq(villages.id, input.villageId))
    .limit(1)
  if (!village || village.cityId !== city.id || !village.active) {
    return { ok: false as const, error: 'المنطقة / القرية غير متاحة لهذه المدينة' }
  }

  await db.update(addresses).set({ isActive: false }).where(eq(addresses.userId, userId))

  const [row] = await db
    .insert(addresses)
    .values({
      userId,
      city: city.name,
      village: village.name,
      details: cleanDetails,
      branchId: branch.id,
      cityId: city.id,
      villageId: village.id,
      isActive: true,
    })
    .returning()

  revalidatePath('/')
  revalidatePath('/account')
  return { ok: true as const, address: row }
}

export async function selectAddress(id: number) {
  const userId = await getUserId()

  await db
    .update(addresses)
    .set({ isActive: false })
    .where(eq(addresses.userId, userId))

  await db
    .update(addresses)
    .set({ isActive: true })
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))

  revalidatePath('/')
  return { ok: true as const }
}

export async function removeAddress(id: number) {
  const userId = await getUserId()
  await db
    .delete(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
  revalidatePath('/')
  revalidatePath('/account')
  return { ok: true as const }
}

/* ── السلة ── */

const MAX_QTY = 20

export async function getCart() {
  const userId = await getUserId()
  return db
    .select({ productId: cartItems.productId, qty: cartItems.qty })
    .from(cartItems)
    .where(eq(cartItems.userId, userId))
    .orderBy(desc(cartItems.createdAt))
}

export async function addCartItem(productId: string, qty = 1) {
  const userId = await getUserId()
  const { getProduct } = await import('@/lib/products')

  if (!(await getProduct(productId))) {
    return { ok: false as const, error: 'منتج غير موجود' }
  }

  const amount = Math.min(Math.max(Math.floor(Number(qty)) || 1, 1), MAX_QTY)

  await db
    .insert(cartItems)
    .values({ userId, productId, qty: amount })
    .onConflictDoUpdate({
      target: [cartItems.userId, cartItems.productId],
      set: { qty: sql`least(${cartItems.qty} + ${amount}, ${MAX_QTY})` },
    })

  revalidatePath('/cart')
  return { ok: true as const }
}

export async function setCartQty(productId: string, qty: number) {
  const userId = await getUserId()
  const amount = Math.floor(Number(qty))

  if (!Number.isFinite(amount) || amount <= 0) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
    revalidatePath('/cart')
    return { ok: true as const }
  }

  await db
    .update(cartItems)
    .set({ qty: Math.min(amount, MAX_QTY) })
    .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))

  revalidatePath('/cart')
  return { ok: true as const }
}

export async function removeCartItem(productId: string) {
  const userId = await getUserId()
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
  revalidatePath('/cart')
  return { ok: true as const }
}

export async function clearCartItems() {
  const userId = await getUserId()
  await db.delete(cartItems).where(eq(cartItems.userId, userId))
  revalidatePath('/cart')
  return { ok: true as const }
}

/* ── الطلبات ── */

const PAYMENT_LABELS: Record<string, string> = {
  balance: 'رصيد المحفظة',
  wallet: 'محفظة إلكترونية',
  instapay: 'انستاباي',
  cod: 'الدفع عند التوصيل',
}

export async function placeOrder(input: {
  paymentMethod: 'balance' | 'wallet' | 'instapay' | 'cod'
  paymentRef?: string
  phone?: string
}) {
  const userId = await getUserId()
  // رقم موبايل الحساب هو الأساس في التواصل والتوصيل؛ نلتقطه تلقائياً.
  const accountPhone = await getSessionPhone()
  const { getProducts } = await import('@/lib/products')
  const products = await getProducts()

  if (!PAYMENT_LABELS[input.paymentMethod]) {
    return { ok: false as const, error: 'طريقة دفع غير معروفة' }
  }

  // فرع الطلب يأتي من العنوان النشط؛ ونرجع لفرع الحساب للعناوين القديمة بلا فرع
  const [activeAddr] = await db
    .select({ branchId: addresses.branchId })
    .from(addresses)
    .where(and(eq(addresses.userId, userId), eq(addresses.isActive, true)))
    .limit(1)
  const [customer] = await db
    .select({ branchId: user.branchId })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  const orderBranchId = activeAddr?.branchId ?? customer?.branchId ?? null

  // تُقرأ السلة من قاعدة البيانات، والأسعار تُحسب على السيرفر فقط
  const lines = await db
    .select({ productId: cartItems.productId, qty: cartItems.qty })
    .from(cartItems)
    .where(eq(cartItems.userId, userId))

  if (!lines.length) {
    return { ok: false as const, error: 'السلة فارغة' }
  }

  const resolved = lines.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId)
    if (!product) return []
    const qty = Math.floor(Number(line.qty))
    if (!Number.isFinite(qty) || qty < 1) return []
    return [{ product, qty: Math.min(qty, MAX_QTY) }]
  })

  if (!resolved.length) {
    return { ok: false as const, error: 'لا توجد منتجات صحيحة في السلة' }
  }

  const subtotal = resolved.reduce(
    (sum, line) => sum + line.product.price * line.qty,
    0,
  )
  const deliveryBase = subtotal >= 300 ? 0 : 25
  const codFee = input.paymentMethod === 'cod' ? 10 : 0
  const delivery = deliveryBase + codFee
  const total = subtotal + delivery
  const pointsEarned = Math.floor(total / 10)

  const [activeAddress] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.userId, userId), eq(addresses.isActive, true)))
    .limit(1)

  const addressText = activeAddress
    ? `${activeAddress.city} - ${activeAddress.village}، ${activeAddress.details}`
    : `${DEFAULT_CITY} - لم يتم تحديد عنوان`

  const reference = `ELD-${Date.now().toString().slice(-8)}`

  /*
   * كل الكتابات داخل معاملة واحدة: إن فشلت أي خطوة تُلغى جميعها.
   * هذا ضروري للدفع بالرصيد تحديداً، فلا يُخصم المال دون أن يُسجَّل الطلب.
   */
  const outcome = await db.transaction(async (tx) => {
    if (input.paymentMethod === 'balance') {
      // يُقرأ الرصيد بعد قَفل صفّ المستخدم، فلا يمكن تجاوزه بطلبين متزامنين
      const balance = await lockedBalance(tx, userId)

      if (balance + 1e-9 < total) {
        return {
          ok: false as const,
          error: `رصيدك ${balance.toFixed(2)} جنيه ولا يكفي لدفع ${total.toFixed(2)} جنيه`,
        }
      }

      await tx.insert(walletTransactions).values({
        id: `wtx_${crypto.randomUUID()}`,
        userId,
        kind: 'order',
        amount: (-total).toFixed(2),
        description: `طلب رقم ${reference}`,
        refId: reference,
      })
    }

    const [order] = await tx
      .insert(orders)
      .values({
        userId,
        reference,
        status: 'processing',
        paymentMethod: input.paymentMethod,
        paymentRef: input.paymentRef?.trim() || null,
        subtotal: subtotal.toFixed(2),
        delivery: delivery.toFixed(2),
        total: total.toFixed(2),
        pointsEarned,
          addressText,
          phone: accountPhone ?? input.phone?.trim() ?? null,
          branchId: orderBranchId,
      })
      .returning()

    await tx.insert(orderItems).values(
      resolved.map((line) => ({
        orderId: order.id,
        userId,
        productId: line.product.id,
        title: line.product.title,
        unit: line.product.unit,
        image: line.product.image,
        price: line.product.price.toFixed(2),
        qty: line.qty,
      })),
    )

    await tx.insert(pointEvents).values({
      userId,
      label: `طلب رقم ${reference}`,
      points: pointsEarned,
    })

    // خصم كميات الطلب من مخزون الفرع (لا ينزل تحت الصفر)
    if (orderBranchId) {
      for (const line of resolved) {
        await tx
          .update(branchStock)
          .set({ stock: sql`GREATEST(${branchStock.stock} - ${line.qty}, 0)`, updatedAt: new Date() })
          .where(
            and(
              eq(branchStock.branchId, orderBranchId),
              eq(branchStock.productId, line.product.id),
            ),
          )
      }
    }

    // تُفرَّغ السلة على السيرفر بعد نجاح الطلب
    await tx.delete(cartItems).where(eq(cartItems.userId, userId))

    return { ok: true as const }
  })

  if (!outcome.ok) return outcome

  revalidatePath('/')
  revalidatePath('/cart')
  revalidatePath('/account')
  revalidatePath('/wallet')
  return {
    ok: true as const,
    reference,
    total,
    delivery,
    pointsEarned,
    paymentLabel: PAYMENT_LABELS[input.paymentMethod],
  }
}

export async function getOrders() {
  const userId = await getUserId()

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(20)

  if (!rows.length) return []

  const items = await db
    .select()
    .from(orderItems)
    .where(
      and(
        eq(orderItems.userId, userId),
        inArray(
          orderItems.orderId,
          rows.map((row) => row.id),
        ),
      ),
    )

  return rows.map((order) => ({
    ...order,
    items: items.filter((item) => item.orderId === order.id),
  }))
}

/* ── النقاط ── */

export async function getPoints() {
  const userId = await getUserId()

  const [totals] = await db
    .select({ total: sql<number>`coalesce(sum(${pointEvents.points}), 0)::int` })
    .from(pointEvents)
    .where(eq(pointEvents.userId, userId))

  const history = await db
    .select()
    .from(pointEvents)
    .where(eq(pointEvents.userId, userId))
    .orderBy(desc(pointEvents.createdAt))
    .limit(12)

  return { balance: totals?.total ?? 0, history }
}
