import Link from 'next/link'
import {
  BadgeCheck,
  Baby,
  Beef,
  Candy,
  Carrot,
  Croissant,
  CupSoda,
  Milk,
  Package,
  Snowflake,
  Sparkles,
  SprayCan,
  Wheat,
} from 'lucide-react'
import { departments } from '@/lib/catalog'
import { SectionHeader } from '@/components/section-header'

const icons = {
  Carrot,
  Milk,
  Beef,
  Wheat,
  CupSoda,
  SprayCan,
  Baby,
  Candy,
  Snowflake,
  Croissant,
  Sparkles,
  BadgeCheck,
} as const

export function CategoriesRow() {
  return (
    <section className="pt-5" aria-label="الفئات">
      <SectionHeader title="الفئات" href="/categories" />
      <div className="no-scrollbar mt-3 flex gap-4 overflow-x-auto px-4 pb-1">
        {departments.map((department) => {
          const Icon = icons[department.icon as keyof typeof icons] ?? Package
          return (
            <Link
              key={department.id}
              href={`/department/${department.id}`}
              className="flex w-[72px] shrink-0 flex-col items-center gap-2 text-center"
            >
              <span
                className="flex size-[68px] items-center justify-center rounded-full ring-1 ring-border transition-transform active:scale-95"
                style={{ backgroundColor: department.tint }}
              >
                <Icon className="size-7 text-primary" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-bold leading-4 text-foreground text-pretty">
                {department.name}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
