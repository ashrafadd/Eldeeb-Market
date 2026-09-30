import Link from 'next/link'
import { Building2 } from 'lucide-react'

/** يظهر لموظف غير مرتبط بأي فرع بعد */
export function NoBranchNotice({ title }: { title: string }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
        <Building2 className="size-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="text-lg font-extrabold text-foreground">{title}</h1>
      <p className="text-[13px] leading-6 text-muted-foreground text-pretty">
        حسابك غير مرتبط بأي فرع بعد. راجع المدير العام لربط حسابك بفرع قبل استخدام هذه اللوحة.
      </p>
      <Link
        href="/dashboard"
        className="rounded-2xl bg-primary px-5 py-3 text-[13px] font-bold text-primary-foreground"
      >
        رجوع
      </Link>
    </main>
  )
}
