import { useCallback, useEffect, useState } from 'react'
import TerminalStyleNotch from './TerminalStyleNotch'
import { BRAND } from './atondaBrand'

const FEATURES = [
  {
    id: 'gate',
    tab: 'AT THE GATE',
    title: 'Automate and Expedite Gate Operations',
    description:
      'Our system automates and streamlines the entire check-in and check-out process. The AI Computer Vision system accelerates gate flow, improves data accuracy, reduces manual labor, and by integrating with your TMS, manages arrivals and enables digital compliance forms, replacing paper-based inspections.',
    href: '#contact',
    image: 'https://a.storyblok.com/f/337048/768x432/ce73b10067/gate-entry.jpg/m/1200x0/filters:format(jpeg):quality(85)',
    collapsedBg: '#ABFF02',
    collapsedColor: '#052424',
  },
  {
    id: 'yard',
    tab: 'IN THE YARD',
    title: 'Real-Time Visibility and Workflow Automation',
    description:
      'Track every trailer and chassis in real time with computer vision, automate move tasks for spotters, and give dispatch a live prioritized worklist — so the yard runs on facts, not radio chatter.',
    href: '#contact',
    image: 'https://a.storyblok.com/f/337048/1272x1196/29dcba4210/yard.png/m/1200x0/filters:format(png):quality(85)',
    collapsedBg: '#c2c2c2',
    collapsedColor: '#052424',
  },
  {
    id: 'dock',
    tab: 'AT THE DOCK',
    title: 'Optimize Loading and Improve Dock Efficiency',
    description:
      'See dock door status, synchronize schedules with live yard activity, and connect to your WMS so receiving teams know what is coming — cutting dwell and unlocking the warehouse you already run.',
    href: '#contact',
    image: 'https://a.storyblok.com/f/337048/565x336/e5f3b11568/dock-doors.png/m/1200x0/filters:format(png):quality(85)',
    collapsedBg: '#052424',
    collapsedColor: '#ffffff',
  },
  {
    id: 'ops',
    tab: 'ACROSS OPERATIONS',
    title: 'A Unified, Connected Data-Driven System',
    description:
      'One control tower across every site — compare KPIs, dwell, and exceptions network-wide from a single pane of glass, then grow module by module as your operation expands.',
    href: '#contact',
    image: 'https://a.storyblok.com/f/337048/2034x1150/c561abc6ba/r.webp/m/1200x0/filters:format(webp):quality(85)',
    collapsedBg: '#ABFF02',
    collapsedColor: '#052424',
  },
]

function NavArrow({ direction, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={direction === 'left' ? 'Previous feature' : 'Next feature'}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center border border-[#d0d0d0] text-[#052424] transition enabled:hover:border-[#052424] enabled:hover:bg-[#052424] enabled:hover:text-[#ABFF02] disabled:cursor-default disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#052424]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="13"
        fill="none"
        viewBox="0 0 12 13"
        className={direction === 'right' ? 'rotate-90' : '-rotate-90'}
        aria-hidden="true"
      >
        <path
          stroke="currentColor"
          strokeLinecap="square"
          strokeLinejoin="round"
          strokeWidth="2"
          d="m10.997 2.004-9.849-.142v9.85"
        />
      </svg>
    </button>
  )
}

export default function TerminalStylePlatform() {
  const [active, setActive] = useState(0)

  const go = useCallback((index) => {
    setActive(Math.max(0, Math.min(FEATURES.length - 1, index)))
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') go(active - 1)
      if (e.key === 'ArrowRight') go(active + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, go])

  return (
    <>
      <TerminalStyleNotch />
      <section
        id="platform"
        className="relative z-20 bg-white px-4 py-16 text-[#052424] sm:px-6 sm:py-20 lg:px-10 lg:py-24"
        aria-labelledby="platform-heading"
      >
        <div className="mx-auto max-w-[1200px] text-center">
          <p data-animate="up" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8a8a]">
            Platform
          </p>
          <h2
            id="platform-heading"
            data-animate="up"
            className="mt-4 font-head text-[clamp(28px,4.2vw,44px)] font-semibold leading-[1.15] tracking-[-0.02em]"
          >
            <span className="text-[#052424]">One Modular Platform</span>{' '}
            <span className="text-black">Infinite Possibilities</span>
          </h2>
          <p
            data-animate="up"
            className="mx-auto mt-5 max-w-[62ch] text-[15px] leading-relaxed text-[#1f1f1f] sm:text-[16px]"
          >
            Build your Yard Operating System one application at a time. From gate to dock, start with the application you
            need most and then expand as your needs grow. {BRAND.name} is designed to automate workflows, optimize worker
            productivity, and deliver maximum visibility of every asset and movement in the yard.
          </p>
        </div>

        <div data-animate="up" className="mx-auto mt-10 max-w-[1280px] sm:mt-12">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Platform modules"
            >
              {FEATURES.map((feature, index) => {
                const isActive = index === active
                return (
                  <button
                    key={feature.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`platform-panel-${feature.id}`}
                    onClick={() => go(index)}
                    className={`shrink-0 rounded-[4px] px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] transition duration-200 ${
                      isActive
                        ? 'border border-[#052424] bg-white text-[#052424] shadow-sm'
                        : 'border border-transparent bg-transparent text-[#6b6b6b] hover:border-[#d0d0d0] hover:text-[#052424]'
                    }`}
                  >
                    {feature.tab}
                  </button>
                )
              })}
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <NavArrow direction="left" disabled={active === 0} onClick={() => go(active - 1)} />
              <NavArrow direction="right" disabled={active === FEATURES.length - 1} onClick={() => go(active + 1)} />
            </div>
          </div>

          <ul className="m-0 flex list-none flex-col gap-3 p-0 lg:flex-row lg:items-stretch">
            {FEATURES.map((feature, index) => {
              const expanded = index === active
              if (expanded) {
                return (
                  <li
                    key={feature.id}
                    id={`platform-panel-${feature.id}`}
                    role="tabpanel"
                    className="min-h-[420px] transition-[flex] duration-500 ease-out lg:min-h-[520px] lg:min-w-0 lg:flex-[1.85]"
                  >
                    <article
                      className="relative flex h-full min-h-[420px] overflow-hidden rounded-[18px] lg:min-h-[520px]"
                      aria-expanded="true"
                      aria-label={feature.tab}
                    >
                      <div className="absolute inset-0">
                        <img
                          src={feature.image}
                          alt=""
                          className="h-full w-full object-cover transition duration-700 scale-100"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
                      </div>

                      <div className="relative z-10 flex h-full flex-col justify-between p-6 text-white sm:p-8">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/80">
                            {feature.tab}
                          </span>
                          <h3 className="mt-4 max-w-[16ch] font-head text-[clamp(26px,3vw,36px)] font-semibold leading-[1.15]">
                            {feature.title}
                          </h3>
                          <p className="mt-4 max-w-[42ch] text-[14px] leading-relaxed text-white/90 sm:text-[15px]">
                            {feature.description}
                          </p>
                        </div>
                        <div className="mt-8 flex justify-end">
                          <a
                            href={feature.href}
                            className="inline-flex items-center rounded-[4px] bg-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#052424] transition duration-200 hover:bg-[#ABFF02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                          >
                            More
                          </a>
                        </div>
                      </div>
                    </article>
                  </li>
                )
              }

              return (
                <li
                  key={feature.id}
                  className="hidden min-h-[160px] transition-[flex] duration-500 ease-out lg:block lg:min-h-[520px] lg:min-w-0 lg:flex-[0.72]"
                >
                  <button
                    type="button"
                    onClick={() => go(index)}
                    className="flex h-full min-h-[160px] w-full flex-col rounded-[18px] p-5 text-left transition duration-300 hover:brightness-[0.97] lg:min-h-[520px] lg:justify-between lg:p-6"
                    style={{ backgroundColor: feature.collapsedBg, color: feature.collapsedColor }}
                    aria-expanded="false"
                    aria-label={`Expand ${feature.tab}`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-70">{feature.tab}</span>
                    <h3 className="mt-4 font-head text-[clamp(20px,2vw,26px)] font-semibold leading-[1.2] lg:mt-auto">
                      {feature.title}
                    </h3>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-5 flex items-center justify-center gap-2 sm:hidden">
            <NavArrow direction="left" disabled={active === 0} onClick={() => go(active - 1)} />
            <NavArrow direction="right" disabled={active === FEATURES.length - 1} onClick={() => go(active + 1)} />
          </div>
        </div>
      </section>
    </>
  )
}
