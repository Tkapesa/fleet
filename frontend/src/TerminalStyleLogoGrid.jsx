const BASE = import.meta.env.BASE_URL || '/'

const LOGOS = [
  { name: '8VC', src: `${BASE}logos/8vc.svg`, scale: 0.75 },
  { name: 'Ryder', src: `${BASE}logos/ryder.svg`, scale: 0.9 },
  { name: 'Lineage', src: `${BASE}logos/lineage.svg`, scale: 0.9 },
  { name: 'Prologis', src: `${BASE}logos/prologis.svg`, scale: 0.9 },
  { name: 'NFI', src: `${BASE}logos/nfi.svg`, scale: 0.9 },
]

function Cross({ className, delay = '0s' }) {
  return (
    <div className={`pointer-events-none absolute z-20 ${className}`} aria-hidden="true">
      <div className="relative h-[11px] w-[11px]">
        <span
          className="logo-grid-cross__v absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#bdbdbd]"
          style={{ animationDelay: delay }}
        />
        <span
          className="logo-grid-cross__h absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#bdbdbd]"
          style={{ animationDelay: delay }}
        />
      </div>
    </div>
  )
}

export default function TerminalStyleLogoGrid() {
  return (
    <section id="logo-grid" className="relative z-20 w-full bg-white" aria-label="Trusted brands">
      <div className="mx-auto w-full max-w-[1440px] py-12 sm:py-16">
        <div className="grid grid-cols-2 border-y border-[#e4e4e4] md:grid-cols-3 lg:grid-cols-5">
          {LOGOS.map((logo, index) => {
            const isLast = index === LOGOS.length - 1
            return (
              <div
                key={logo.name}
                className={`relative flex min-h-[128px] items-center justify-center border-[#e4e4e4] px-4 py-10 sm:min-h-[148px] lg:min-h-[168px] ${
                  !isLast ? 'lg:border-r' : ''
                } ${index % 2 === 0 ? 'max-md:border-r' : ''} ${
                  index !== 2 ? 'md:max-lg:border-r' : ''
                } ${index === 2 ? 'md:max-lg:border-r-0' : ''} ${
                  index === 3 ? 'md:max-lg:border-r-0 lg:border-r' : ''
                } ${index < 4 ? 'border-b lg:border-b-0' : ''} ${
                  index < 3 ? 'md:border-b lg:border-b-0' : 'md:border-b-0'
                } ${isLast ? 'col-span-2 md:col-span-1' : ''}`}
              >
                <Cross className="-left-[5px] -top-[5px]" delay="0s" />
                <Cross className="-right-[5px] -top-[5px]" delay="0.35s" />
                <Cross className="-bottom-[5px] -right-[5px]" delay="0.7s" />
                <Cross className="-bottom-[5px] -left-[5px]" delay="1.05s" />

                <img
                  src={logo.src}
                  alt={logo.name}
                  width={160}
                  height={48}
                  loading="eager"
                  className="h-8 w-auto max-w-[78%] object-contain sm:h-10"
                  style={{ opacity: 0.5, transform: `scale(${logo.scale})` }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
