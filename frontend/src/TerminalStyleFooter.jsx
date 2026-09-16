import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AtondaWordmark, BRAND } from './atondaBrand'

gsap.registerPlugin(ScrollTrigger)

const TECH_LINKS = [
  { label: 'Homepage', href: '#top' },
  { label: 'Yard Operating System', href: '#platform' },
  { label: 'The Agentic AI Yard', href: '#yos-intro' },
  { label: 'Yard Efficiency Calculator', href: '#calculator' },
]

const COMPANY_LINKS = [
  { label: 'About', href: '#contact' },
  { label: 'Resources', href: '#faqs' },
  { label: 'Contact', href: '#contact' },
]

const SOCIALS = [
  {
    label: 'linkedin',
    href: BRAND.site,
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.8v2h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.48V23h-4V8.5z" />
      </svg>
    ),
  },
  {
    label: 'x',
    href: BRAND.site,
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.57l-5.14-6.71L5.2 22H1.94l8.03-9.17L1.5 2h6.73l4.64 6.15L18.244 2zm-1.15 18h1.8L7.01 3.94H5.08L17.094 20z" />
      </svg>
    ),
  },
  {
    label: 'youtube',
    href: BRAND.site,
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
      </svg>
    ),
  },
]

const FOOTER_BG = '#052623'

/** Terminal Industries top edge: high shoulders, recessed center cradle */
function FooterNotchEdge() {
  return (
    <svg
      className="block w-full"
      viewBox="0 0 1521 31"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ height: 'clamp(28px, 4vw, 48px)', marginBottom: '-1px' }}
    >
      <path
        fill={FOOTER_BG}
        d="M0,0 L215.84,0 A65.13,65.13 0 0 1 239.6,4.52 L292.75,25.48 A64.74,64.74 0 0 0 316.51,30 L1204.49,30 A64.74,64.74 0 0 0 1228.25,25.48 L1281.4,4.52 A65.13,65.13 0 0 1 1305.16,0 L1521,0 L1521,31 L0,31 Z"
      />
    </svg>
  )
}

function CircuitBackground() {
  const svgRef = useRef(null)

  const traces = [
    {
      id: 'c1',
      d: 'M 608.4,0 L 608.4,114.7 A 50,50 0 0 1 558.4,164.7 L 430.25,164.7 L 202.1,164.7 A 50,50 0 0 0 152.1,214.7 L 152.1,528.9 A 25.52,25.52 0 0 1 106.36,544.46 L 0,406.26',
      travel: -2.2,
    },
    {
      id: 'c2',
      d: 'M 912.6,0 L 912.6,202.54 A 50,50 0 0 0 962.6,252.54 L 1318.9,252.54 A 50,50 0 0 1 1368.9,302.54 L 1368.9,444.1 A 50,50 0 0 0 1418.9,494.1 L 1521,494.1',
      travel: -1.8,
    },
    {
      id: 'c3',
      d: 'M 1521,878.4 L 1382.47,728.39 A 45.69,45.69 0 0 0 1348.9,713.7 L 1038.65,713.7 A 50,50 0 0 0 988.65,763.7 L 988.65,1098',
      travel: -2.4,
    },
    {
      id: 'c4',
      d: 'M 0,713.7 L 336.3,713.7 A 58.06,58.06 0 0 1 381.82,807.79 L 152.1,1098',
      travel: -1.6,
    },
  ]

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const trigger = svg.closest('[data-footer-scroll]') || svg
    const flows = svg.querySelectorAll('.circuit-flow')

    const ctx = gsap.context(() => {
      flows.forEach((el) => {
        const travel = Number(el.getAttribute('data-travel') || -2)
        gsap.fromTo(
          el,
          { attr: { 'stroke-dashoffset': 0 } },
          {
            attr: { 'stroke-dashoffset': travel },
            ease: 'none',
            scrollTrigger: {
              trigger,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.65,
            },
          },
        )
      })

      gsap.to(svg.querySelectorAll('.circuit-node'), {
        opacity: 0.7,
        ease: 'none',
        scrollTrigger: {
          trigger,
          start: 'top 80%',
          end: 'center center',
          scrub: 0.5,
        },
      })
    }, svg)

    return () => ctx.revert()
  }, [])

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1521 1098"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id="circuit-glow" x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="circuit-soft" x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
        </filter>
      </defs>

      {traces.map((trace) => (
        <g key={trace.id}>
          <path d={trace.d} stroke="#A2A2A2" strokeOpacity="0.16" strokeWidth="1" pathLength="1" />

          <path
            className="circuit-flow circuit-flow--bloom"
            d={trace.d}
            stroke="#FFFFFF"
            strokeWidth="16"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="0.1 0.9"
            strokeDashoffset="0"
            data-travel={trace.travel}
            filter="url(#circuit-soft)"
          />

          <path
            className="circuit-flow circuit-flow--head"
            d={trace.d}
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="0.045 0.955"
            strokeDashoffset="0"
            data-travel={trace.travel}
            filter="url(#circuit-glow)"
          />
        </g>
      ))}

      <rect className="circuit-node" x="933" y="248" width="7" height="7" rx="1" fill="#FFFFFF" opacity="0.25" />
      <rect className="circuit-node" x="188" y="709" width="7" height="7" rx="1" fill="#FFFFFF" opacity="0.25" />
      <rect className="circuit-node" x="984" y="759" width="7" height="7" rx="1" fill="#FFFFFF" opacity="0.25" />
    </svg>
  )
}

export default function TerminalStyleFooter() {
  return (
    <div className="relative z-10 isolate bg-white" data-footer-scroll>
      <FooterNotchEdge />

      <footer className="relative overflow-hidden text-white" style={{ backgroundColor: FOOTER_BG }}>
        <div className="relative mx-auto max-w-[1280px] px-6 pb-10 pt-16 sm:px-8 sm:pt-20 lg:px-10 lg:pt-24">
          <CircuitBackground />

          <div className="relative z-10 mx-auto max-w-4xl pb-20 text-center sm:pb-28">
            <h2 className="text-balance text-[clamp(36px,6vw,72px)] font-semibold leading-[1.05] tracking-[-0.02em] text-white">
              The yard of the future starts today.
            </h2>
            <a
              href="#contact"
              className="mt-8 inline-flex items-center justify-center rounded-[6px] border border-white/25 bg-white/5 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition hover:border-[#ABFF02]/50 hover:bg-[#ABFF02]/10 hover:text-[#ABFF02]"
            >
              Take charge of your yard
            </a>
          </div>

          <div className="relative z-10 grid gap-12 border-t border-white/10 pt-12 lg:grid-cols-[1.1fr_1fr_1fr] lg:gap-10">
            <div>
              <a href="#top" aria-label={`${BRAND.name} home`}>
                <AtondaWordmark className="text-[28px]" textClass="text-white" />
              </a>
              <div className="mt-8 flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-[#ABFF02]/35 bg-[#ABFF02]/10 font-head text-[11px] font-bold tracking-wide text-[#ABFF02]">
                  AF
                </div>
                <p className="text-[12px] leading-relaxed text-white/55">
                  AI-native fleet &amp; yard
                  <br />
                  operating platform
                  <br />
                  Built for modern logistics
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">Technology</p>
                <ul className="space-y-3">
                  {TECH_LINKS.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="text-[14px] text-white/80 transition hover:text-white">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">Company</p>
                <ul className="space-y-3">
                  {COMPANY_LINKS.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="text-[14px] text-white/80 transition hover:text-white">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-8">
              <div>
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">Reach us</p>
                <a href="#contact" className="block text-[15px] text-white/85 transition hover:text-white">
                  Ready for your yard of the future?
                </a>
                <a href={BRAND.phoneHref} className="mt-2 block text-[15px] text-white transition hover:text-[#ABFF02]">
                  {BRAND.phone}
                </a>
                <a href={`mailto:${BRAND.email}`} className="mt-2 block text-[14px] text-white/55 transition hover:text-white">
                  {BRAND.email}
                </a>
              </div>

              <ul className="flex items-center gap-4">
                {SOCIALS.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/80 transition hover:border-white/50 hover:text-white"
                      aria-label={social.label}
                    >
                      {social.icon}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative z-10 mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[12px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright {BRAND.name} © {BRAND.year} All Rights Reserved</p>
            <a href={BRAND.site} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
              atondafleet.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
