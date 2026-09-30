import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

/* ── جداول Better Auth (أسماء الأعمدة كما يتوقعها Better Auth) ── */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').default(false).notNull(),
  // رقم الموبايل هو المعرّف الأساسي للدخول (يُخزَّن بالصيغة الدولية +20…)
  phoneNumber: text('phoneNumber').unique(),
  phoneNumberVerified: boolean('phoneNumberVerified').default(false).notNull(),
  image: text('image'),
  // الدور: customer | rep | branch_manager | inventory | accountant | purchasing | super_admin
  role: text('role').default('user').notNull(),
  // الفرع الذي ينتمي إليه المستخدم (عميلاً كان أو موظفاً)
  branchId: text('branchId'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  // مطلوب في Better Auth 1.7+
  issuer: text('issuer').notNull().default('credential'),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

/* ── جداول التطبيق ── */

/** الفروع — كل فرع مخزونه وطلباته وموظفوه مستقلون */
export const branches = pgTable('branch', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  city: text('city'),
  phone: text('phone'),
  address: text('address'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

/** مخزون كل منتج داخل كل فرع (كمية مستقلة) */
export const branchStock = pgTable('branch_stock', {
  id: text('id').primaryKey(),
  branchId: text('branchId')
    .notNull()
    .references(() => branches.id, { onDelete: 'cascade' }),
  productId: text('productId').notNull(),
  stock: integer('stock').default(0).notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

/** المدن التابعة لكل فرع */
export const cities = pgTable('city', {
  id: text('id').primaryKey(),
  branchId: text('branchId')
    .notNull()
    .references(() => branches.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

/** المناطق/القرى التابعة لكل مدينة */
export const villages = pgTable('village', {
  id: text('id').primaryKey(),
  cityId: text('cityId')
    .notNull()
    .references(() => cities.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

/** حركات المخزون لكل فرع — مشتريات (delta موجب) وتعديلات (موجب/سالب) */
export const stockMovements = pgTable('stock_movement', {
  id: text('id').primaryKey(),
  branchId: text('branchId')
    .notNull()
    .references(() => branches.id, { onDelete: 'cascade' }),
  productId: text('productId').notNull(),
  /** التغيّر في الكمية: موجب إضافة، سالب خصم */
  delta: integer('delta').notNull(),
  /** purchase | adjustment (يوسّعها الجرد لاحقاً: damage | stocktake) */
  reason: text('reason').notNull(),
  note: text('note').default('').notNull(),
  userId: text('userId').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

/** مصروفات كل فرع — تُخصم من الإيرادات لحساب صافي الربح */
export const expenses = pgTable('expense', {
  id: text('id').primaryKey(),
  branchId: text('branchId')
    .notNull()
    .references(() => branches.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  note: text('note').default('').notNull(),
  userId: text('userId').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

/** تسويات عهد المناديب — نقد سلّمه المندوب للمحاسبة من تحصيل الدفع عند الاستلام */
export const custodySettlements = pgTable('custody_settlement', {
  id: text('id').primaryKey(),
  repId: text('repId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  branchId: text('branchId')
    .notNull()
    .references(() => branches.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  note: text('note').default('').notNull(),
  settledBy: text('settledBy').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

/** كتالوج المنتجات — المصدر الوحيد لبيانات المنتجات في المتجر */
export const products = pgTable('product', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  unit: text('unit').default('').notNull(),
  image: text('image').default('').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).default('0').notNull(),
  oldPrice: numeric('oldPrice', { precision: 10, scale: 2 }),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('4.5').notNull(),
  reviews: integer('reviews').default(0).notNull(),
  brand: text('brand').default('').notNull(),
  stock: integer('stock').default(0).notNull(),
  description: text('description').default('').notNull(),
  subCategoryId: text('subCategoryId').notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  sortOrder: integer('sortOrder').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

/** سجل حركات المحفظة — الرصيد يُحسب بجمع المبالغ فلا يحدث تضارب */
export const walletTransactions = pgTable('wallet_transaction', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  /** topup | card | order | refund | adjustment */
  kind: text('kind').notNull(),
  /** موجب = إضافة رصيد، سالب = خصم */
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').default('').notNull(),
  refId: text('refId'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

/** طلبات تعبئة الرصيد بالتحويل — تنتظر اعتماد المدير */
export const topupRequests = pgTable('topup_request', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  /** bank | wallet | instapay */
  method: text('method').notNull(),
  reference: text('reference').default('').notNull(),
  /** صورة الإيصال بصيغة Base64 */
  receipt: text('receipt').default('').notNull(),
  /** pending | approved | rejected */
  status: text('status').default('pending').notNull(),
  adminNote: text('adminNote').default('').notNull(),
  reviewedAt: timestamp('reviewedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

/** بطاقات الشحن المسبقة الدفع التي تُوزَّع على المتاجر */
export const prepaidCards = pgTable('prepaid_card', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  batch: text('batch').default('').notNull(),
  /** active | redeemed | disabled */
  status: text('status').default('active').notNull(),
  redeemedBy: text('redeemedBy').references(() => user.id, { onDelete: 'set null' }),
  redeemedAt: timestamp('redeemedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

/** بيانات التحويل التي يعرضها المتجر للعميل — يملأها المدير */
export const payoutSettings = pgTable('payout_setting', {
  /** bank | wallet | instapay */
  id: text('id').primaryKey(),
  label: text('label').default('').notNull(),
  holder: text('holder').default('').notNull(),
  number: text('number').default('').notNull(),
  note: text('note').default('').notNull(),
  enabled: boolean('enabled').default(false).notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const addresses = pgTable('addresses', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  // نصوص العرض (تبقى للتوافق مع العناوين القديمة)
  city: text('city').notNull(),
  village: text('village').notNull(),
  details: text('details').notNull(),
  // الربط الهرمي الجديد (فرع ← مدينة ← منطقة/قرية)
  branchId: text('branchId').references(() => branches.id),
  cityId: text('cityId').references(() => cities.id),
  villageId: text('villageId').references(() => villages.id),
  isActive: boolean('isActive').default(false).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  })

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  reference: text('reference').notNull(),
  status: text('status').default('processing').notNull(),
  paymentMethod: text('paymentMethod').notNull(),
  paymentRef: text('paymentRef'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  delivery: numeric('delivery', { precision: 10, scale: 2 }).default('0').notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  pointsEarned: integer('pointsEarned').default(0).notNull(),
  addressText: text('addressText').notNull(),
  phone: text('phone'),
  // الفرع الذي يخدم الطلب، والمندوب المُسنَد للتوصيل
  branchId: text('branchId'),
  assignedRepId: text('assignedRepId'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('orderId').notNull(),
  userId: text('userId').notNull(),
  productId: text('productId').notNull(),
  title: text('title').notNull(),
  unit: text('unit'),
  image: text('image'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  qty: integer('qty').notNull(),
})

export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  productId: text('productId').notNull(),
  qty: integer('qty').default(1).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  planId: text('planId').notNull(),
  status: text('status').default('active').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).default('0').notNull(),
  cycle: text('cycle').default('monthly').notNull(),
  startedAt: timestamp('startedAt').defaultNow().notNull(),
  renewsAt: timestamp('renewsAt').notNull(),
  cancelledAt: timestamp('cancelledAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export const pointEvents = pgTable('point_events', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  label: text('label').notNull(),
  points: integer('points').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})
