import Image from 'next/image'
import { cn } from '@/lib/utils'

type LogoProps = {
  /** حجم العلامة بالبكسل */
  size?: number
  /** إظهار اسم المتجر بجانب العلامة */
  withText?: boolean
  /** استخدم "light" فوق الخلفيات الخضراء و "dark" فوق الخلفيات البيضاء */
  tone?: 'light' | 'dark'
  className?: string
}

export function Logo({ size = 40, withText = true, tone = 'light', className }: LogoProps) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-card',
          tone === 'light' ? 'ring-1 ring-primary-foreground/30' : 'ring-1 ring-border',
        )}
        style={{ width: size, height: size }}
      >
        <Image
          src="/brand/tasweeqa-crest.png"
          alt=""
          width={size}
          height={size}
          className="size-full object-contain p-[3px]"
          priority
        />
      </span>

      {withText ? (
        <span className="leading-tight">
          <span
            className={cn(
              'block font-extrabold',
              size >= 56 ? 'text-2xl' : 'text-base',
              tone === 'light' ? 'text-primary-foreground' : 'text-foreground',
            )}
          >
            تسويقة
          </span>
          <span
            className={cn(
              'block text-[11px] font-medium tracking-[0.2em]',
              tone === 'light' ? 'text-primary-foreground/70' : 'text-muted-foreground',
            )}
          >
            TASWEEQA ELDEEB
          </span>
        </span>
      ) : (
        <span className="sr-only">تسويقة الديب - Tasweeqa Eldeeb</span>
      )}
    </span>
  )
}
