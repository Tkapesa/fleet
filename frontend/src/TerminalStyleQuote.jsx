import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const QUOTE_IMG =
  'https://a.storyblok.com/f/337048/5112x3410/74c4e40128/quote-image.jpg/m/1920x0/filters:format(jpeg):quality(85)'

function CradleMask({ side }) {
  const isTop = side === 'top'

  const topTongue = [
    'M215.84,0',
    'A65.13,65.13 0 0 1 239.6,4.52',
    'L292.75,25.48',
    'A64.74,64.74 0 0 0 316.51,30',
    'L1204.49,30',
    'A64.74,64.74 0 0 0 1228.25,25.48',
    'L1281.4,4.52',
    'A65.13,65.13 0 0 1 1305.16,0',
    'Z',
  ].join(' ')

  const bottomTongue = [
    'M215.84,31',
    'A65.13,65.13 0 0 0 239.6,26.48',
    'L292.75,5.52',
    'A64.74,64.74 0 0 1 316.51,1',
    'L1204.49,1',
    'A64.74,64.74 0 0 1 1228.25,5.52',
    'L1281.4,26.48',
    'A65.13,65.13 0 0 0 1305.16,31',
    'Z',
  ].join(' ')

  return (
    <svg
      className={`pointer-events-none absolute inset-x-0 z-20 block w-full ${isTop ? 'top-0' : 'bottom-0'}`}
      viewBox="0 0 1521 31"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ height: 'clamp(32px, 4.2vw, 52px)' }}
    >
      <path fill="#ffffff" d={isTop ? topTongue : bottomTongue} />
    </svg>
  )
}

export default function TerminalStyleQuote() {
  const sectionRef = useRef(null)
  const imageRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    const image = imageRef.current
    if (!section || !image) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo(
        image,
        { yPercent: -8, scale: 1.06 },
        {
          yPercent: 8,
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      )
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="relative z-10 isolate bg-white"
      aria-label="Customer quote"
    >
      <div className="relative overflow-hidden bg-white">
        <div className="relative min-h-[360px] sm:min-h-[480px] lg:min-h-[640px]">
          <div ref={imageRef} className="absolute inset-[-10%] will-change-transform">
            <img
              src={QUOTE_IMG}
              alt=""
              className="h-full w-full object-cover object-[center_40%]"
              decoding="async"
              draggable={false}
            />
          </div>

          <div className="absolute inset-0 bg-black/55" aria-hidden="true" />

          <CradleMask side="top" />
          <CradleMask side="bottom" />

          <div className="relative z-10 flex min-h-[360px] items-center justify-center px-5 py-20 text-center sm:min-h-[480px] sm:px-12 sm:py-24 lg:min-h-[640px] lg:px-24 lg:py-28">
            <div data-animate="scale" className="mx-auto max-w-[900px]">
              <blockquote className="m-0">
                <p className="font-head text-[clamp(20px,4.5vw,38px)] font-semibold leading-[1.32] tracking-[-0.02em] text-white">
                  &ldquo;We have not seen this kind of accuracy with computer-vision technology&hellip; this is a significant
                  milestone in the race to modernize the yard.&rdquo;
                </p>
              </blockquote>
              <footer className="mt-9 text-[15px] leading-[1.5] text-white/90 sm:mt-11 sm:text-[16px]">
                <p className="font-medium text-white">Karen Jones</p>
                <p className="mt-1 text-white/75">Head of New Product</p>
                <p className="text-white/75">Ryder System, Inc.</p>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
