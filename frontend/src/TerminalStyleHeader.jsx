import { useEffect, useState } from 'react'
import { AtondaWordmark, BRAND } from './atondaBrand'

const NAV_MENUS = [
  {
    key: 'system',
    label: 'System',
    columns: [
      {
        title: 'Platform',
        items: [
          { label: `What is ${BRAND.productShort}`, href: '#platform' },
          { label: 'SmartYard™ YMS', href: '#platform' },
          { label: 'The Agentic AI Yard', href: '#platform' },
          { label: `Why ${BRAND.name}`, href: '#yos-intro' },
          { label: 'YOS vs YMS', href: '#faqs' },
        ],
      },
      {
        title: 'From gate to dock',
        items: [
          { label: `${BRAND.name} at the Gate`, href: '#platform' },
          { label: `${BRAND.name} in the Yard`, href: '#platform' },
          { label: `${BRAND.name} at the Dock`, href: '#platform' },
          { label: 'Across Your Operations', href: '#platform' },
          { label: 'AI Computer Vision', href: '#yos-intro' },
        ],
      },
      {
        title: 'Top yard problems',
        items: [
          { label: 'Real-Time Visibility', href: '#product-grid' },
          { label: 'Inefficient Operations', href: '#calculator' },
          { label: 'High Operational Costs', href: '#calculator' },
          { label: 'Security & Safety', href: '#faqs' },
          { label: 'Labor Shortages', href: '#faqs' },
        ],
      },
    ],
  },
  {
    key: 'markets',
    label: 'Markets',
    columns: [
      {
        title: 'By size',
        items: [
          { label: 'Enterprise Operations', href: '#product-grid' },
          { label: 'Medium-Sized Operations', href: '#product-grid' },
        ],
      },
      {
        title: 'Modules',
        items: [
          { label: 'Gate Management', href: '#platform' },
          { label: 'Dispatch & Spotter Orchestration', href: '#platform' },
          { label: 'Yard Visibility', href: '#platform' },
          { label: 'Load Verification', href: '#platform' },
          { label: 'Carrier Appointments', href: '#contact' },
        ],
      },
      {
        title: 'By industry',
        items: [
          { label: 'Third Party Logistics', href: '#logo-wall' },
          { label: 'Retail & Grocery', href: '#logo-wall' },
          { label: 'Manufacturing Facilities', href: '#logo-wall' },
          { label: 'Warehouse Yards', href: '#logo-wall' },
        ],
      },
    ],
  },
  {
    key: 'featured',
    label: 'Featured',
    columns: [
      {
        title: 'Featured',
        items: [
          { label: 'Yard Efficiency Calculator', href: '#calculator' },
          { label: 'Platform modules', href: '#platform' },
          { label: 'Customer stories', href: '#testimonials' },
          { label: 'FAQs', href: '#faqs' },
        ],
      },
    ],
  },
  {
    key: 'resources',
    label: 'Resources',
    columns: [
      {
        title: 'Learn',
        items: [
          { label: 'FAQs', href: '#faqs' },
          { label: 'ROI Calculator', href: '#calculator' },
          { label: 'Contact our team', href: '#contact' },
        ],
      },
    ],
  },
]

const CTAS = [
  {
    variant: 'primary',
    line1: 'Explore',
    line2: 'Product',
    href: '#platform',
  },
  {
    variant: 'secondary',
    line1: 'Request',
    line2: 'Demo',
    href: '#contact',
  },
  {
    variant: 'tertiary',
    line1: 'Contact',
    line2: 'Us',
    href: '#contact',
  },
]

function Chevron({ className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className={className} aria-hidden="true">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function CtaButton({ variant, line1, line2, href }) {
  const styles = {
    primary: 'bg-[#C8FF00] text-[#111111] hover:bg-[#d4ff3d]',
    secondary: 'bg-white text-[#111111] hover:bg-white/92',
    tertiary: 'bg-[#D9D9D9] text-[#111111] hover:bg-[#e4e4e4]',
  }

  return (
    <a
      href={href}
      className={`inline-flex h-[42px] w-[112px] shrink-0 flex-col items-center justify-center rounded-[8px] text-center text-[11px] font-extrabold uppercase leading-[1.05] tracking-[0.02em] transition select-none ${styles[variant]}`}
    >
      <span>{line1}</span>
      <span>{line2}</span>
    </a>
  )
}

function MegaPanel({ menu, onNavigate }) {
  const wide = menu.columns.length > 2
  return (
    <div
      className={`rounded-[14px] border border-white/12 bg-[rgba(28,26,24,0.97)] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl ${wide ? 'min-w-[720px]' : 'min-w-[280px]'}`}
    >
      <div className={`grid gap-6 ${wide ? 'grid-cols-2 xl:grid-cols-4' : menu.columns.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {menu.columns.map((column) => (
          <div key={column.title}>
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#C8FF00]">{column.title}</p>
            <ul className="space-y-0.5">
              {column.items.map((item) => (
                <li key={item.href + item.label}>
                  <a
                    href={item.href}
                    className="block rounded-lg px-2 py-2 text-[13px] font-medium text-white/90 transition hover:bg-white/[0.06] hover:text-white"
                    onClick={onNavigate}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TerminalStyleHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)
  const [phoneOpen, setPhoneOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  function closeAll() {
    setMenuOpen(false)
    setOpenMenu(null)
    setPhoneOpen(false)
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50" id="top">
      <div className="pointer-events-auto px-4 pt-4 sm:px-6 lg:px-8" data-header-shell>
        <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between gap-4 rounded-[16px] border border-white/15 bg-[rgba(42,38,35,0.52)] px-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-[18px] sm:h-[68px] sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-6 lg:gap-8">
            <a href="#top" className="flex shrink-0 items-center text-white" aria-label={`${BRAND.name} home`} onClick={closeAll}>
              <AtondaWordmark className="text-[22px] sm:text-[24px]" />
            </a>

            <nav className="hidden items-center gap-5 xl:gap-6 lg:flex" aria-label="Main">
              {NAV_MENUS.map((menu) => (
                <div
                  key={menu.key}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(menu.key)}
                  onMouseLeave={() => setOpenMenu((current) => (current === menu.key ? null : current))}
                >
                  <button
                    type="button"
                    className="nav-dropdown-trigger inline-flex items-center gap-1.5 text-[15px] font-medium text-white transition hover:text-white/80"
                    aria-expanded={openMenu === menu.key}
                    onClick={() => setOpenMenu((current) => (current === menu.key ? null : menu.key))}
                  >
                    {menu.label}
                    <Chevron className={`arrow-icon opacity-90 transition ${openMenu === menu.key ? 'rotate-180' : ''}`} />
                  </button>

                  <div
                    className={`absolute top-full left-0 z-50 pt-4 transition ${openMenu === menu.key ? 'visible opacity-100' : 'invisible pointer-events-none opacity-0'} ${menu.columns.length > 2 ? 'left-0 xl:-left-24' : ''}`}
                    aria-hidden={openMenu !== menu.key}
                  >
                    <MegaPanel menu={menu} onNavigate={closeAll} />
                  </div>
                </div>
              ))}
              <a href="#contact" className="text-[15px] font-medium text-white transition hover:text-white/80">
                About
              </a>
            </nav>
          </div>

          <div className="header-actions flex shrink-0 items-center gap-2 sm:gap-2.5">
            <div className="phone-popdown relative hidden sm:block">
              <button
                type="button"
                className="grid h-[42px] w-[42px] place-items-center rounded-[8px] border border-white/20 text-white transition hover:bg-white/10"
                aria-label="Call us"
                aria-expanded={phoneOpen}
                onClick={() => setPhoneOpen((v) => !v)}
              >
                <PhoneIcon />
              </button>
              {phoneOpen ? (
                <div className="absolute right-0 top-full z-50 pt-3">
                  <div className="min-w-[220px] rounded-[12px] border border-white/12 bg-[rgba(28,26,24,0.97)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Talk to AtondaFleet</p>
                    <a href={BRAND.phoneHref} className="mt-2 block font-head text-[18px] font-semibold text-[#C8FF00]">
                      {BRAND.phone}
                    </a>
                    <p className="mt-1 text-[12px] text-white/55">24/7 dispatch support</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="hidden items-center gap-2 md:flex">
              {CTAS.map((cta) => (
                <CtaButton key={cta.line1} {...cta} />
              ))}
            </div>

            <button
              type="button"
              className="grid h-[42px] w-[42px] place-items-center rounded-[8px] border border-white/20 text-white lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="sr-only">Menu</span>
              <span className="flex flex-col gap-1.5">
                <span className={`block h-0.5 w-5 bg-white transition ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
                <span className={`block h-0.5 w-5 bg-white transition ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 w-5 bg-white transition ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
              </span>
            </button>
          </div>
        </div>
      </div>

      {menuOpen ? (
        <div className="pointer-events-auto fixed inset-0 z-40 bg-[rgba(12,14,14,0.96)] pt-[88px] lg:hidden">
          <div className="mx-auto flex h-full max-w-[1280px] flex-col overflow-y-auto px-6 pb-10">
            <a href="#top" className="mb-8" onClick={closeAll}>
              <AtondaWordmark className="text-[26px]" />
            </a>
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {NAV_MENUS.map((menu) => (
                <div key={menu.key} className="border-b border-white/10 py-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8FF00]">{menu.label}</p>
                  {menu.columns.flatMap((column) =>
                    column.items.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        className="block py-2 text-[16px] text-white/90"
                        onClick={closeAll}
                      >
                        {item.label}
                      </a>
                    )),
                  )}
                </div>
              ))}
            </nav>
            <div className="mt-8 flex flex-wrap gap-3">
              {CTAS.map((cta) => (
                <CtaButton key={cta.line1} {...cta} />
              ))}
            </div>
            <a href={BRAND.phoneHref} className="mt-6 text-[15px] text-[#C8FF00]">
              {BRAND.phone}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  )
}
