import type { Metadata } from 'next'
import { BadgePercent, Bell, Gift, Truck } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata: Metadata = {
  title: 'الإشعارات | تسويقة الديب',
  description: 'تابع حالة طلباتك وأحدث العروض والنقاط المكتسبة من تسويقة الديب.',
}

const notifications = [
  {
    id: 'n1',
    icon: Truck,
    title: 'طلبك EM-10842 في الطريق',
    body: 'المندوب سيصل إلى ديروط الشريف خلال 40 دقيقة تقريباً.',
    time: 'منذ 12 دقيقة',
    unread: true,
  },
  {
    id: 'n2',
    icon: BadgePercent,
    title: 'خصم 20% على الخضروات والفاكهة',
    body: 'العرض ساري اليوم فقط على كل منتجات قسم الخضروات والفاكهة.',
    time: 'منذ ساعتين',
    unread: true,
  },
  {
    id: 'n3',
    icon: Gift,
    title: 'ربحت 33 نقطة جديدة',
    body: 'تم إضافة نقاط طلبك الأخير إلى رصيدك. اجمع 100 نقطة لتحصل على 10 جنيهات خصم.',
    time: 'أمس',
    unread: true,
  },
  {
    id: 'n4',
    icon: Truck,
    title: 'تم توصيل طلبك EM-10715',
    body: 'نتمنى أن تكون راضياً عن الخدمة. قيّم طلبك ليصلك عرض خاص.',
    time: 'منذ 13 يوم',
    unread: false,
  },
]

export default function NotificationsPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-card/95 px-4 py-4 backdrop-blur">
        <Bell className="size-[18px] text-primary" aria-hidden="true" />
        <h1 className="text-base font-extrabold text-foreground">الإشعارات</h1>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">
        <ul className="flex flex-col gap-2.5">
          {notifications.map((item) => (
            <li
              key={item.id}
              className={`flex gap-3 rounded-2xl border p-3.5 ${
                item.unread ? 'border-primary/25 bg-primary/5' : 'border-border bg-card'
              }`}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <item.icon className="size-[18px] text-primary" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-[12.5px] font-extrabold leading-4 text-foreground text-pretty">
                    {item.title}
                  </h2>
                  {item.unread ? (
                    <span
                      aria-label="غير مقروء"
                      className="mt-1 size-2 shrink-0 rounded-full bg-primary"
                    />
                  ) : null}
                </div>
                <p className="pt-1 text-[11px] leading-4 text-muted-foreground text-pretty">
                  {item.body}
                </p>
                <p className="pt-1.5 text-[10px] font-medium text-muted-foreground">{item.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </main>

      <BottomNav />
    </div>
  )
}
