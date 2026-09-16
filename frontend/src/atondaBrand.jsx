/** AtondaFleet brand — shared across landing sections */
export const BRAND = {
  name: 'AtondaFleet',
  short: 'Atonda',
  site: 'https://atondafleet.com',
  tagline: 'The future of fleet & yard operations',
  product: 'Yard Operating System',
  productShort: 'YOS™',
  phone: '+1 (800) 286-6323',
  phoneHref: 'tel:+18002866323',
  phoneDisplay: '800-ATONDA',
  email: 'hello@atondafleet.com',
  lime: '#ABFF02',
  ink: '#052424',
  year: 2026,
}

export function AtondaWordmark({ className = 'h-7 w-auto', markClass = 'text-[#ABFF02]', textClass = 'text-white' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-hidden="true">
      <svg viewBox="0 0 36 36" className={`h-[1.15em] w-[1.15em] shrink-0 ${markClass}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1.5" width="33" height="33" rx="8" stroke="currentColor" strokeWidth="2" />
        <path
          d="M10 24.5 L18 9.5 L26 24.5"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M13.2 18.8 H22.8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="27.5" cy="10.5" r="2.2" fill="currentColor" />
      </svg>
      <span className={`font-head text-[1.05em] font-semibold leading-none tracking-[-0.04em] ${textClass}`}>
        Atonda<span className={markClass}>Fleet</span>
      </span>
    </span>
  )
}
