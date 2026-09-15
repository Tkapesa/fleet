import { useEffect, useState } from 'react'

const PHONE_NUMBER = '+1 (737) 279-5032'
const PHONE_HREF = 'tel:+17372795032'
const BASE = 'https://terminal-industries.com'

const NAV_MENUS = [
  {
    key: 'system',
    label: 'System',
    columns: [
      {
        title: 'Platform',
        items: [
          { label: 'What is YOS™', href: `${BASE}/what-is-terminal-yos` },
          { label: 'SmartYard™ YMS', href: `${BASE}/smart-yard-tm-yms` },
          { label: 'The Agentic AI Yard', href: `${BASE}/the-agentic-ai-yard` },
          { label: 'Why Terminal', href: `${BASE}/why-terminal` },
          { label: 'YOS vs YMS', href: `${BASE}/yos-vs-yms` },
        ],
      },
      {
        title: 'From gate to dock',
        items: [
          { label: 'Terminal at the Gate', href: `${BASE}/terminal-at-the-gate` },
          { label: 'Terminal In the Yard', href: `${BASE}/terminal-in-the-yard` },
          { label: 'Terminal at the Dock', href: `${BASE}/terminal-at-the-dock` },
          { label: 'Terminal Across Your Operations', href: `${BASE}/terminal-across-your-operation` },
          { label: 'Terminal AI Computer Vision', href: `${BASE}/terminal-ai-computer-vision` },
        ],
      },
      {
        title: 'Top yard problems',
        items: [
          { label: 'Real-Time Visibility', href: `${BASE}/top-yard-problems/real-time-visibility` },
          { label: 'Inefficient Operations', href: `${BASE}/top-yard-problems/inefficient-operations` },
          { label: 'High Operational Costs', href: `${BASE}/top-yard-problems/high-operational-costs` },
          { label: 'Poor Customer Experience', href: `${BASE}/top-yard-problems/poor-customer-experience` },
          { label: 'Security, Safety, and Fraud', href: `${BASE}/top-yard-problems/security-safety-and-fraud` },
          { label: 'Supply Chain Resilience', href: `${BASE}/top-yard-problems/lack-of-supply-chain-resilience` },
          { label: 'Slow Tech Adoption', href: `${BASE}/top-yard-problems/slow-technology-adoption` },
          { label: 'Meeting Sustainability Targets', href: `${BASE}/top-yard-problems/meeting-sustainability-targets` },
          { label: 'Labor Shortages and Workforce Issues', href: `${BASE}/top-yard-problems/labor-shortages-and-workforce-issues` },
          { label: 'Lack of Integration and Data', href: `${BASE}/top-yard-problems/lack-of-integration-and-data` },
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
          { label: 'Enterprise Operations', href: `${BASE}/what-is-terminal-yos` },
          { label: 'Medium-Sized Operations', href: `${BASE}/markets/terminal-for-medium-sized-operations` },
        ],
      },
      {
        title: 'Modules',
        items: [
          { label: 'Gate Management', href: `${BASE}/modules/gate-management` },
          { label: 'Carrier Risk Assessment & Driver ID', href: `${BASE}/modules/carrier-risk-assessment-and-driver-id` },
          { label: 'Dispatch & Spotter Orchestration', href: `${BASE}/modules/dispatch-and-spotter-orchestration` },
          { label: 'Yard Visibility', href: `${BASE}/modules/yard-visibility` },
          { label: 'Load Verification', href: `${BASE}/modules/load-verification` },
          { label: 'Carrier Appointments', href: `${BASE}/modules/carrier-appointments` },
          { label: 'End to End Yard Security', href: `${BASE}/yard-security` },
        ],
      },
      {
        title: 'By role',
        items: [
          { label: 'Executive Leadership', href: `${BASE}/markets/terminal-for-executive-leadership` },
          { label: 'Financial Decision Makers', href: `${BASE}/markets/terminal-for-financial-decision-makers` },
          { label: 'Digital Transformation & Innovation', href: `${BASE}/markets/terminal-for-digital-transformation-innovation-teams` },
          { label: 'IT & Technology Professionals', href: `${BASE}/markets/terminal-for-it-technology-professionals` },
          { label: 'Operations Management', href: `${BASE}/markets/terminal-for-operations-management` },
          { label: 'Logistics Specialists', href: `${BASE}/markets/terminal-for-logistics-specialists` },
          { label: 'Frontline Users', href: `${BASE}/markets/terminal-for-frontline-users` },
        ],
      },
      {
        title: 'By industry',
        items: [
          { label: 'Third Party Logistics', href: `${BASE}/markets/terminal-for-3pls` },
          { label: 'Retail & Grocery', href: `${BASE}/markets/terminal-for-retail-grocery` },
          { label: 'Consumer Packaged Goods', href: `${BASE}/markets/terminal-for-consumer-packaged-goods-cpg-` },
          { label: 'Refrigerated Warehousing', href: `${BASE}/markets/terminal-for-refrigerated-warehousing` },
          { label: 'Contract Carriers', href: `${BASE}/markets/terminal-for-contract-carriers` },
          { label: 'Warehouse Yards', href: `${BASE}/markets/terminal-for-warehouse-yards` },
          { label: 'Manufacturing Facilities', href: `${BASE}/markets/terminal-for-manufacturing-facilities` },
          { label: 'Drop Lots', href: `${BASE}/markets/terminal-for-drop-lots` },
          { label: 'Maintenance & Fueling Depots', href: `${BASE}/markets/terminal-for-maintenance-fueling-depots` },
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
          { label: 'Explore the Survey', href: `${BASE}/interactive-highlights-2026-state-of-the-yard-survey` },
          { label: 'Terminal on the Road', href: `${BASE}/events` },
          { label: 'Grade your yard security now.', href: `${BASE}/yard-security-grader` },
          { label: 'Go to Calculator', href: `${BASE}/yard-efficiency-calculator` },
          { label: 'Register Today', href: `${BASE}/all-resources/lights-out-yard-episode-5` },
        ],
      },
    ],
  },
  {
    key: 'resources',
    label: 'Resources',
    columns: [
      {
        title: 'Resources',
        items: [
          { label: 'All Resources', href: `${BASE}/resources` },
          { label: 'Press Releases', href: `${BASE}/resources/press-releases` },
          { label: 'Podcasts & Articles', href: `${BASE}/resources/podcasts-articles` },
          { label: 'Videos', href: `${BASE}/resources/videos` },
          { label: 'Blogs', href: `${BASE}/resources/blogs` },
          { label: 'Case Studies', href: `${BASE}/resources/case-studies` },
          { label: 'Webinars', href: `${BASE}/resources/webinars` },
          { label: 'Yard Efficiency Calculator', href: `${BASE}/yard-efficiency-calculator` },
          { label: 'State of the Yard Survey', href: `${BASE}/interactive-highlights-2026-state-of-the-yard-survey` },
          { label: 'Yard Security Grader', href: `${BASE}/yard-security-grader` },
        ],
      },
    ],
  },
]

const CTAS = [
  {
    key: 'explore',
    variant: 'primary',
    line1: 'Explore',
    line2: 'Product',
    href: 'https://explore.terminal-industries.com/?utm_source=website&utm_medium=header_cta',
    external: true,
  },
  {
    key: 'demo',
    variant: 'secondary',
    line1: 'Request',
    line2: 'Demo',
    href: `${BASE}/demo-landing-page`,
    external: false,
  },
  {
    key: 'contact',
    variant: 'tertiary',
    line1: 'Contact',
    line2: 'Us',
    href: `${BASE}/contact`,
    external: false,
  },
]

/** Exact Terminal Industries wordmark from their site header */
function TerminalLogo({ className = 'h-7 w-auto text-white' }) {
  return (
    <svg viewBox="0 0 215 49" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M9.16512 0C8.26239 0 7.39524 0.369725 6.75488 1.02245L1.00056 6.92436C0.360201 7.58165 0 8.47629 0 9.40289V48.0871C0 48.5892 0.400223 49 0.889385 49H34.3481C35.2508 49 36.1179 48.6303 36.7583 47.973L46.7416 37.7211C47.382 37.0684 47.7422 36.1737 47.7422 35.2471V0.912902C47.7422 0.410806 47.342 0 46.8528 0H9.16512ZM40.9206 16.0123C40.9206 16.8339 40.2714 17.5003 39.4709 17.5003H22.1324C21.3586 17.5003 20.6604 18.1531 20.6827 18.9473C20.696 19.2942 20.8339 19.6137 21.0518 19.8556C21.074 19.8784 21.0918 19.9013 21.1185 19.9241L28.5626 27.5696C28.8339 27.8481 28.9895 28.2269 28.9895 28.6195V40.5191C28.9895 41.3408 28.3403 42.0072 27.5398 42.0072H20.2068C19.4064 42.0072 18.7571 41.3408 18.7571 40.5191V18.9929C18.7571 18.1713 18.1079 17.5049 17.3074 17.5049H8.27128C7.47084 17.5049 6.82159 16.8385 6.82159 16.0169V8.48999C6.82159 7.66838 7.47084 7.00196 8.27128 7.00196H18.1568C18.5437 7.00196 18.9128 7.15715 19.184 7.44015L26.6149 15.0674C26.6415 15.0994 26.6771 15.1359 26.7082 15.1633C26.9306 15.3733 27.2241 15.5056 27.5487 15.5285C28.3403 15.5741 28.9895 14.8529 28.9895 14.0404V8.49455C28.9895 7.67294 29.6388 7.00652 30.4392 7.00652H39.4754C40.2758 7.00652 40.9251 7.67294 40.9251 8.49455V16.0214L40.9206 16.0123Z" fill="currentColor" />
      <path d="M57.9746 14.2048V9.35724H81.988V14.2048H72.8718V39.6473H67.0508V14.2048H57.9746Z" fill="currentColor" />
      <path d="M89.3921 35.7173C91.0997 35.7173 92.8518 35.0919 93.9902 33.1292H99.7712C98.5928 36.4704 95.3777 40.1905 89.4321 40.1905C82.3927 40.1905 78.2793 34.7998 78.2793 28.3273C78.2793 21.8549 82.7973 16.6696 89.2676 16.6696C95.7379 16.6696 100.256 22.0603 100.011 29.998H83.8557C84.1403 33.8413 86.7462 35.7218 89.3921 35.7218V35.7173ZM94.3193 26.0268C94.1992 22.2246 91.5933 20.8872 89.232 20.8872C87.1153 20.8872 84.3893 22.2657 83.9402 26.0268H94.3193Z" fill="currentColor" />
      <path d="M113.001 22.6034C110.235 22.6034 108.403 23.6487 108.403 27.8663V39.6473H102.786V17.1717H108.323V21.0972C109.586 18.3402 111.578 17.2128 114.104 17.2128C114.468 17.2128 114.957 17.2538 115.327 17.2949V22.7267C114.513 22.6445 113.819 22.6034 113.005 22.6034H113.001Z" fill="currentColor" />
      <path d="M137.583 27.9485V39.6473H131.967V26.57C131.967 24.1052 131.762 21.3071 128.467 21.3071C124.723 21.3071 124.114 24.5251 124.114 27.9485V39.6473H118.497V17.1717H124.114V20.1386C125.337 17.9248 127.573 16.6696 130.219 16.6696C133.964 16.6696 135.591 18.7191 136.445 20.344C138.153 17.8381 140.354 16.6696 143.649 16.6696C149.145 16.6696 151.058 20.1797 151.058 25.4837V39.6473H145.441V26.57C145.441 24.1052 145.237 21.3071 141.941 21.3071C138.197 21.3071 137.588 24.5251 137.588 27.9485H137.583Z" fill="currentColor" />
      <path d="M159.969 14.7068H154.353V9.36181H159.969V14.7068ZM159.969 39.6473H154.353V17.1717H159.969V39.6473Z" fill="currentColor" />
      <path d="M175.56 16.6696C180.812 16.6696 183.129 19.9697 183.129 25.4837V39.6473H177.512V26.7389C177.512 23.813 176.903 21.3071 173.728 21.3071C170.024 21.3071 169.21 24.3973 169.21 27.9485V39.6473H163.594V17.1717H169.21V20.1386C170.473 17.8837 172.874 16.6696 175.56 16.6696Z" fill="currentColor" />
      <path d="M185.815 33.5902C185.815 28.2863 191.636 26.6978 200.223 25.6936V25.3193C200.223 21.8503 198.391 20.6407 196.114 20.6407C193.957 20.6407 192.165 21.8092 192.045 24.2741H186.793C187.202 19.8465 190.782 16.5874 196.399 16.5874C201.606 16.5874 205.839 18.8834 205.839 26.4878C205.839 27.1999 205.759 30.1623 205.759 32.2117C205.759 35.7629 206.004 37.7668 206.409 39.6473H201.241C201.077 38.9353 200.957 37.9356 200.877 36.8493C199.329 39.1863 197.012 40.1905 193.713 40.1905C189.519 40.1905 185.815 37.6846 185.815 33.5902ZM191.596 33.2981C191.596 34.9276 192.859 36.265 195.38 36.265C198.88 36.265 200.387 34.3023 200.387 31.0432V29.3726C194.122 30.039 191.596 30.7922 191.596 33.2981Z" fill="currentColor" />
      <path d="M209.384 39.6473V9.35724H215V39.6428H209.384V39.6473Z" fill="currentColor" />
    </svg>
  )
}

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

function CtaButton({ variant, line1, line2, href, external }) {
  const styles = {
    primary: 'bg-[#C8FF00] text-[#111111] hover:bg-[#d4ff3d]',
    secondary: 'bg-white text-[#111111] hover:bg-white/92',
    tertiary: 'bg-[#D9D9D9] text-[#111111] hover:bg-[#e4e4e4]',
  }

  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
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
                    target="_blank"
                    rel="noopener noreferrer"
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

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') closeAll()
    }
    function onPointerDown(event) {
      if (!event.target.closest?.('[data-header-shell]')) {
        setOpenMenu(null)
        setPhoneOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

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
            <a href={BASE} className="flex shrink-0 items-center text-white" aria-label="Go to homepage" onClick={closeAll}>
              <TerminalLogo className="h-[26px] w-auto text-white sm:h-[28px]" />
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
              <a href={`${BASE}/about`} target="_blank" rel="noopener noreferrer" className="text-[15px] font-medium text-white transition hover:text-white/80">
                About
              </a>
            </nav>
          </div>

          <div className="header-actions flex shrink-0 items-center gap-2 sm:gap-2.5">
            <div className="phone-popdown relative hidden sm:block">
              <button
                type="button"
                className="phone-trigger grid h-[42px] w-[42px] place-items-center rounded-[8px] border border-white/40 text-white transition hover:bg-white/10"
                aria-label="Show phone number"
                aria-expanded={phoneOpen}
                onClick={() => setPhoneOpen((value) => !value)}
              >
                <PhoneIcon />
              </button>
              {phoneOpen ? (
                <div className="absolute top-[calc(100%+10px)] right-0 z-50 min-w-[210px] rounded-[12px] border border-white/12 bg-[rgba(28,26,24,0.96)] p-3 shadow-card backdrop-blur-xl">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">Call us</p>
                  <a href={PHONE_HREF} className="mt-1 block text-sm font-semibold text-white hover:text-[#C8FF00]">
                    {PHONE_NUMBER}
                  </a>
                </div>
              ) : null}
            </div>

            <div className="header-cta hidden items-center gap-2 md:flex">
              {CTAS.map((cta) => (
                <CtaButton key={cta.key} {...cta} />
              ))}
            </div>

            <button
              type="button"
              className="toggle-mobile-menu-button grid h-[42px] w-[42px] place-items-center rounded-[8px] border border-white/30 text-white lg:hidden"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <span className="relative block h-3.5 w-[18px]">
                <span className={`absolute left-0 block h-[1.5px] w-full bg-current transition ${menuOpen ? 'top-[6px] rotate-45' : 'top-0'}`} />
                <span className={`absolute top-[6px] left-0 block h-[1.5px] w-full bg-current transition ${menuOpen ? 'opacity-0' : 'opacity-100'}`} />
                <span className={`absolute left-0 block h-[1.5px] w-full bg-current transition ${menuOpen ? 'top-[6px] -rotate-45' : 'top-[12px]'}`} />
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className={`mobile-menu fixed inset-0 z-[70] lg:hidden ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <button
          type="button"
          className={`mobile-menu-overlay absolute inset-0 bg-black/50 transition ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Close menu"
          onClick={closeAll}
        />
        <aside
          className={`mobile-menu-panel absolute top-0 right-0 flex h-full w-[min(100%,400px)] flex-col bg-[#161412] shadow-2xl transition-transform duration-300 ease-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="mobile-drawer-logo flex items-center justify-between px-5 py-5">
            <a href={BASE} className="text-white" onClick={closeAll} aria-label="Go to homepage">
              <TerminalLogo className="h-7 w-auto text-white" />
            </a>
            <button type="button" className="grid h-10 w-10 place-items-center rounded-[8px] border border-white/25 text-white" onClick={closeAll} aria-label="Close menu">
              ✕
            </button>
          </div>

          <nav id="mobile-menu" className="mobile-menu-items flex-1 overflow-y-auto px-3 pb-4" aria-hidden={!menuOpen}>
            <ul className="mobile-menu-items-level-1">
              {NAV_MENUS.map((menu) => (
                <li key={menu.key} className="border-b border-white/10">
                  <button
                    type="button"
                    className="drawer-dropdown-title flex w-full items-center justify-between px-2 py-4 text-[16px] font-medium text-white"
                    onClick={() => setOpenMenu((current) => (current === menu.key ? null : menu.key))}
                    aria-expanded={openMenu === menu.key}
                  >
                    <span>{menu.label}</span>
                    <Chevron className={`drawer-chevron transition ${openMenu === menu.key ? 'rotate-90' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition ${openMenu === menu.key ? 'max-h-[900px] pb-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                    {menu.columns.map((column) => (
                      <div key={column.title} className="mb-3 px-1">
                        <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#C8FF00]">{column.title}</p>
                        {column.items.map((item) => (
                          <a
                            key={item.href + item.label}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="drawer-link block rounded-lg px-2 py-2 text-[13px] text-white/85 hover:bg-white/[0.05]"
                            onClick={closeAll}
                          >
                            {item.label}
                          </a>
                        ))}
                      </div>
                    ))}
                  </div>
                </li>
              ))}
              <li>
                <a href={`${BASE}/about`} target="_blank" rel="noopener noreferrer" className="drawer-link block px-2 py-4 text-[16px] font-medium text-white" onClick={closeAll}>
                  About
                </a>
              </li>
            </ul>
          </nav>

          <div className="grid grid-cols-3 gap-2 border-t border-white/10 p-4">
            {CTAS.map((cta) => (
              <CtaButton key={cta.key} {...cta} />
            ))}
          </div>
          <div className="px-4 pb-5">
            <a href={PHONE_HREF} className="flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-white/30 text-sm font-semibold text-white">
              <PhoneIcon /> {PHONE_NUMBER}
            </a>
          </div>
        </aside>
      </div>
    </header>
  )
}
