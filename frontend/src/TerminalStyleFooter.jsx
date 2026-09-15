import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const BASE = 'https://terminal-industries.com'

const TECH_LINKS = [
  { label: 'Homepage', href: `${BASE}/` },
  { label: 'Yard Operating System', href: `${BASE}/what-is-terminal-yos` },
  { label: 'The Agentic AI Yard', href: `${BASE}/the-agentic-ai-yard` },
  { label: 'Yard Efficiency Calculator', href: `${BASE}/yard-efficiency-calculator` },
]

const COMPANY_LINKS = [
  { label: 'About', href: `${BASE}/about` },
  { label: 'Resources', href: `${BASE}/resources` },
  { label: 'Contact', href: `${BASE}/contact` },
]

const SOCIALS = [
  {
    label: 'linkedin',
    href: 'https://www.linkedin.com/company/terminal-industries/',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.8v2h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.48V23h-4V8.5z" />
      </svg>
    ),
  },
  {
    label: 'x',
    href: 'https://x.com/Terminal_Indust',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.57l-5.14-6.71L5.2 22H1.94l8.03-9.17L1.5 2h6.73l4.64 6.15L18.244 2zm-1.15 18h1.8L7.01 3.94H5.08L17.094 20z" />
      </svg>
    ),
  },
  {
    label: 'youtube',
    href: 'https://www.youtube.com/@Terminal-Industries',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
      </svg>
    ),
  },
]

const FOOTER_BG = '#052623'

function TerminalFooterLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 203 45" className="h-9 w-auto" aria-hidden="true">
      <path fill="#ABFF02" d="M8.654 0C7.8 0 6.982.34 6.378.939L.945 6.359A3.22 3.22 0 0 0 0 8.635v35.527c0 .46.378.838.84.838h31.59c.852 0 1.671-.34 2.276-.943l9.426-9.415c.604-.6.944-1.421.944-2.272V.838a.84.84 0 0 0-.84-.838H8.655Zm29.983 14.705c0 .755-.613 1.367-1.37 1.367h-16.37c-.73 0-1.39.6-1.369 1.329.013.318.143.612.349.834.02.02.038.042.063.063l7.028 7.021c.256.256.404.604.404.964v10.928c0 .755-.613 1.367-1.37 1.367H19.08a1.37 1.37 0 0 1-1.369-1.367V17.444c0-.755-.613-1.367-1.369-1.367H7.81a1.37 1.37 0 0 1-1.37-1.367V7.797c0-.755.614-1.367 1.37-1.367h9.333c.366 0 .714.143.97.403l7.016 7.004a1.3 1.3 0 0 0 .882.423c.748.043 1.36-.62 1.36-1.366V7.801c0-.754.614-1.366 1.37-1.366h8.531c.756 0 1.369.612 1.369 1.366v6.913z" />
      <path fill="#fff" d="M54.739 13.045V8.593h22.673v4.452h-8.608v23.366h-5.496V13.045h-8.57Zm29.664 19.757c1.612 0 3.266-.575 4.341-2.377h5.459c-1.113 3.068-4.149 6.485-9.762 6.485-6.647 0-10.53-4.951-10.53-10.895s4.265-10.706 10.374-10.706 10.375 4.95 10.144 12.24H79.175c.27 3.53 2.73 5.257 5.228 5.257zm4.652-8.9c-.113-3.492-2.574-4.72-4.803-4.72-1.999 0-4.573 1.266-4.997 4.72zm17.639-3.144c-2.612 0-4.342.96-4.342 4.834V36.41h-5.303V15.77h5.228v3.605c1.192-2.532 3.073-3.567 5.458-3.567.344 0 .806.037 1.155.075v4.989a21 21 0 0 0-2.192-.114zm23.21 4.909v10.744h-5.303V24.4c0-2.264-.193-4.833-3.304-4.833-3.535 0-4.111 2.955-4.111 6.099V36.41h-5.303V15.77h5.303v2.725c1.155-2.033 3.267-3.186 5.765-3.186 3.536 0 5.072 1.882 5.878 3.374 1.613-2.301 3.691-3.374 6.802-3.374 5.19 0 6.996 3.223 6.996 8.094v13.008h-5.303V24.4c0-2.264-.194-4.833-3.305-4.833-3.535 0-4.11 2.955-4.11 6.099h-.005Zm21.137-12.161h-5.303V8.598h5.303zm0 22.905h-5.303V15.77h5.303v20.64Zm14.72-21.102c4.959 0 7.147 3.03 7.147 8.094v13.008h-5.303V24.556c0-2.687-.575-4.988-3.573-4.988-3.498 0-4.266 2.838-4.266 6.099v10.744h-5.303V15.77h5.303v2.725c1.192-2.071 3.459-3.186 5.995-3.186m9.683 15.539c0-4.87 5.496-6.33 13.604-7.252v-.344c0-3.185-1.73-4.296-3.88-4.296-2.036 0-3.728 1.073-3.842 3.337h-4.959c.387-4.067 3.767-7.06 9.07-7.06 4.916 0 8.914 2.109 8.914 9.093 0 .654-.076 3.374-.076 5.256 0 3.261.231 5.102.613 6.829h-4.879c-.155-.654-.269-1.572-.344-2.57-1.461 2.146-3.649 3.069-6.764 3.069-3.96 0-7.457-2.302-7.457-6.062m5.458-.268c0 1.496 1.193 2.725 3.573 2.725 3.305 0 4.728-1.803 4.728-4.796v-1.534c-5.916.612-8.301 1.303-8.301 3.605m16.795 5.83V8.594H203v27.814h-5.303v.004Z" />
    </svg>
  )
}

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
              href={`${BASE}/contact`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center justify-center rounded-[6px] border border-white/25 bg-white/5 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition hover:border-white/50 hover:bg-white/10"
            >
              Take charge of your yard
            </a>
          </div>

          <div className="relative z-10 grid gap-12 border-t border-white/10 pt-12 lg:grid-cols-[1.1fr_1fr_1fr] lg:gap-10">
            <div>
              <a href={BASE} target="_blank" rel="noopener noreferrer" aria-label="Terminal Industries">
                <TerminalFooterLogo />
              </a>
              <div className="mt-8 flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-white/15 bg-white/5 text-[10px] font-bold tracking-wide text-white/80">
                  Gartner
                </div>
                <p className="text-[12px] leading-relaxed text-white/55">
                  2025 Market Guide
                  <br />
                  Yard Management
                  <br />
                  Featured Vendor
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">Technology</p>
                <ul className="space-y-3">
                  {TECH_LINKS.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-[14px] text-white/80 transition hover:text-white">
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
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-[14px] text-white/80 transition hover:text-white">
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
                <a href={`${BASE}/contact`} target="_blank" rel="noopener noreferrer" className="block text-[15px] text-white/85 transition hover:text-white">
                  Ready for your yard of the future?
                </a>
                <a href="tel:737-279-5032" className="mt-2 block text-[15px] text-white transition hover:text-[#ABFF02]">
                  +1 (737) 279-5032
                </a>
                <p className="mt-2 text-[14px] text-white/55">Give us a call today.</p>
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
            <p>Copyright Terminal Industries © 2025 All Rights Reserved</p>
            <a href={`${BASE}/technical-index`} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
              Technical Index
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
