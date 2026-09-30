'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { banners } from '@/lib/data'
import { cn } from '@/lib/utils'

export function PromoSlider() {
  const [index, setIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length)
    }, 4500)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const slide = track.children[index] as HTMLElement | undefined
    if (!slide) return
    // Direction-agnostic horizontal scroll of the track only.
    // Never use scrollIntoView here: it also scrolls the page vertically,
    // which yanks the user back to the top of the page while they read.
    const delta =
      slide.getBoundingClientRect().left - track.getBoundingClientRect().left
    if (Math.abs(delta) < 1) return
    track.scrollBy({ left: delta, behavior: 'smooth' })
  }, [index])

  return (
    <section aria-label="عروض وإعلانات" className="pt-4">
      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3"
      >
        {banners.map((banner) => (
          <article
            key={banner.id}
            className="relative flex h-36 w-full shrink-0 snap-center items-center overflow-hidden rounded-3xl"
            style={{ backgroundColor: banner.tint }}
          >
            <Image
              src={banner.image || '/placeholder.svg'}
              alt=""
              fill
              sizes="420px"
              className="object-cover opacity-40"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background: `linear-gradient(270deg, transparent 15%, ${banner.tint} 75%)`,
              }}
            />

            <div className="relative z-10 flex flex-col items-start gap-2 p-4">
              <h2 className="max-w-[62%] text-lg font-extrabold leading-6 text-primary-foreground text-balance">
                {banner.title}
              </h2>
              <p className="max-w-[68%] text-[11px] font-medium leading-4 text-primary-foreground/85 text-pretty">
                {banner.subtitle}
              </p>
              <button
                type="button"
                className="mt-0.5 flex items-center gap-1.5 rounded-full bg-primary-foreground px-3.5 py-1.5 text-[11px] font-extrabold text-primary"
              >
                {banner.cta}
                <ArrowLeft className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {banners.map((banner, dot) => (
          <button
            key={banner.id}
            type="button"
            onClick={() => setIndex(dot)}
            aria-label={`الانتقال إلى العرض ${dot + 1}`}
            aria-current={dot === index}
            className={cn(
              'h-1.5 rounded-full transition-all',
              dot === index ? 'w-5 bg-primary' : 'w-1.5 bg-border',
            )}
          />
        ))}
      </div>
    </section>
  )
}
