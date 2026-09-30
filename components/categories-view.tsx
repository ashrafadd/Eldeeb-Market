'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import * as Icons from 'lucide-react'
import { ChevronLeft, Search } from 'lucide-react'
import {
  catalogGroups,
  departmentsOf,
  subCategoriesOf,
  type Department,
} from '@/lib/catalog'
import { cn } from '@/lib/utils'

/** إحصاءات الأقسام تأتي من قاعدة البيانات عبر الخادم */
export type SectionStats = {
  counts: Record<string, number>
  images: Record<string, string>
}

function DepartmentIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Package
  return <Icon className={className} aria-hidden="true" />
}

function DepartmentTile({
  department,
  stats,
}: {
  department: Department
  stats: SectionStats
}) {
  const thumbs = subCategoriesOf(department.id).slice(0, 4)
  const total = subCategoriesOf(department.id).reduce(
    (sum, item) => sum + (stats.counts[item.id] ?? 0),
    0,
  )

  return (
    <Link
      href={`/department/${department.id}`}
      className="flex w-[132px] shrink-0 flex-col overflow-hidden rounded-2xl p-3"
      style={{ backgroundColor: department.tint }}
    >
      <div className="flex items-start justify-between gap-1">
        <h3 className="text-[13px] font-extrabold leading-4 text-foreground text-pretty">
          {department.name}
        </h3>
        <ChevronLeft className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden="true" />
      </div>

      <div className="mt-auto grid grid-cols-2 gap-1 pt-2">
        {thumbs.map((item) => (
          <div key={item.id} className="relative aspect-square rounded-lg bg-card/60">
            <Image
              src={stats.images[item.id] || '/placeholder.svg'}
              alt=""
              fill
              sizes="60px"
              className="object-contain p-1"
            />
          </div>
        ))}
      </div>

      <p className="pt-2 text-[10px] font-bold text-foreground/70">
        {`${total} منتج`}
      </p>
    </Link>
  )
}

function SubCategoryTile({
  id,
  name,
  count,
  image,
}: {
  id: string
  name: string
  count: number
  image?: string
}) {
  return (
    <Link
      href={`/category/${id}`}
      className="flex w-[132px] shrink-0 flex-col overflow-hidden rounded-2xl bg-muted/60 p-3"
    >
      <h3 className="min-h-8 text-[13px] font-extrabold leading-4 text-foreground text-pretty">
        {name}
      </h3>
      <div className="relative mt-1 aspect-square w-full">
        <Image
          src={image || '/placeholder.svg'}
          alt={name}
          fill
          sizes="140px"
          className="object-contain"
        />
      </div>
      <p className="text-[10px] font-bold text-muted-foreground">{`${count} منتج`}</p>
    </Link>
  )
}

export function CategoriesView({
  initialCategoryId,
  stats,
}: {
  initialCategoryId?: string
  stats: SectionStats
}) {
  const initialGroup =
    catalogGroups.find((group) =>
      departmentsOf(group.id).some((department) => department.id === initialCategoryId),
    )?.id ?? catalogGroups[0].id

  const [activeGroup, setActiveGroup] = useState(initialGroup)
  const group = catalogGroups.find((item) => item.id === activeGroup) ?? catalogGroups[0]

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <h1 className="pb-3 text-base font-extrabold text-foreground">كل الأقسام</h1>

        <Link
          href="/search"
          className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-3 py-2.5 text-[13px] font-medium text-muted-foreground"
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          ابحث في كل الأقسام والمنتجات
        </Link>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {catalogGroups.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveGroup(item.id)}
              aria-pressed={item.id === activeGroup}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-[12px] font-bold transition-colors',
                item.id === activeGroup
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-muted-foreground',
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pb-8">
        <p className="pt-4 text-[12px] font-bold text-muted-foreground">{group.subtitle}</p>

        {departmentsOf(group.id).map((department) => (
          <section key={department.id} className="pt-5" aria-label={department.name}>
            <div className="flex items-center justify-between gap-2 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className="flex size-8 items-center justify-center rounded-xl"
                  style={{ backgroundColor: department.tint }}
                >
                  <DepartmentIcon name={department.icon} className="size-4 text-foreground" />
                </span>
                <h2 className="text-[14px] font-extrabold text-foreground">{department.name}</h2>
              </div>
              <Link
                href={`/department/${department.id}`}
                className="flex items-center gap-0.5 text-[12px] font-bold text-primary"
              >
                عرض الكل
                <ChevronLeft className="size-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
              <DepartmentTile department={department} stats={stats} />
              {subCategoriesOf(department.id).map((sub) => (
                <SubCategoryTile
                  key={sub.id}
                  id={sub.id}
                  name={sub.name}
                  count={stats.counts[sub.id] ?? 0}
                  image={stats.images[sub.id]}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
