import { brands } from '@/lib/data'
import { SectionHeader } from '@/components/section-header'

export function BrandsRow() {
  return (
    <section className="pt-6" aria-label="الماركات">
      <SectionHeader title="الماركات" />
      <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
        {brands.map((brand) => (
          <button
            key={brand.id}
            type="button"
            className="flex w-[104px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card p-3 transition-transform active:scale-95"
          >
            <span
              className="flex h-12 w-full items-center justify-center rounded-xl text-sm font-extrabold text-primary"
              style={{ backgroundColor: brand.tint }}
            >
              {brand.latin}
            </span>
            <span className="text-[11px] font-bold text-foreground">{brand.name}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
