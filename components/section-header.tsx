import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export function SectionHeader({
  title,
  action = 'عرض الكل',
  href = '/categories',
}: {
  title: string
  action?: string
  href?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4">
      <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-foreground">
        <span aria-hidden="true" className="h-5 w-1 rounded-full bg-primary" />
        {title}
      </h2>
      <Link
        href={href}
        className="flex items-center gap-0.5 text-xs font-bold text-primary transition-opacity hover:opacity-70"
      >
        {action}
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
