const LOGOS = [
  { name: 'DSV', src: 'https://a.storyblok.com/f/337048/1280x395/5d869ff961/dsv-b-w.svg', scale: 0.7 },
  { name: 'Lineage', src: 'https://a.storyblok.com/f/337048/170x44/9386c9fae8/lineage.svg', scale: 0.85 },
  { name: 'Goodyear', src: 'https://a.storyblok.com/f/337048/160x120/90aa0c203e/goodyear2.svg', scale: 1.15 },
  { name: 'Mile Hi', src: 'https://a.storyblok.com/f/337048/3105x2321/a78fb6a73e/mile-hi.png', scale: 0.85 },
  { name: 'Honda', src: 'https://a.storyblok.com/f/337048/3840x2160/a5610b2e1d/honda-logo-2000.png', scale: 0.85 },
  { name: 'NFI', src: 'https://a.storyblok.com/f/337048/161x62/44ea74f049/nfi.svg', scale: 0.85 },
  { name: 'Ryder', src: 'https://a.storyblok.com/f/337048/176x49/27affef2ea/ryder-green.svg', scale: 0.85 },
  { name: 'HP', src: 'https://a.storyblok.com/f/337048/2500x2500/6c9f6434ea/hp.svg', scale: 0.7 },
  { name: 'T.J. Maxx', src: 'https://a.storyblok.com/f/337048/1280x319/621d5efa86/tjx-b-w.svg', scale: 1 },
  { name: 'Prologis', src: 'https://a.storyblok.com/f/337048/249x47/15a7349d4e/prologis.svg', scale: 1 },
  { name: 'Vince', src: 'https://a.storyblok.com/f/337048/900x500/fe6a1384ae/vince-logo-vector.png', scale: 1 },
  { name: 'Stanley', src: 'https://a.storyblok.com/f/337048/1366x768/f672774b7b/untitled-design-2.svg', scale: 0.85 },
  { name: 'R&C', src: 'https://a.storyblok.com/f/337048/1366x768/3b2ae6c538/rac-b-w-website.svg', scale: 1.75 },
  { name: 'Marc Jacobs', src: 'https://a.storyblok.com/f/337048/1366x768/802a86b588/marc-jacobs2.svg', scale: 1 },
  { name: 'PODS', src: 'https://a.storyblok.com/f/337048/1280x302/92b80c4809/pods-b-w-1.svg', scale: 1 },
  { name: 'Foxconn', src: 'https://a.storyblok.com/f/337048/1280x142/4da4eb329e/foxconn-b-w.svg', scale: 1 },
  { name: 'Nine West', src: 'https://a.storyblok.com/f/337048/200x100/3cd9d313bd/nine-west-b-w-200-x-100-px-1.svg', scale: 0.85 },
  { name: 'Kirkland Signature', src: 'https://a.storyblok.com/f/337048/3840x1181/df7256d5e0/kirkland-b-w.svg', scale: 1 },
  { name: 'DB Schenker', src: 'https://a.storyblok.com/f/337048/869x147/26858fd378/db-schenker-2.svg', scale: 1 },
  { name: 'Kasper', src: 'https://a.storyblok.com/f/337048/225x225/fc77667383/kasper-logo.png', scale: 1 },
]

function Cross({ className, delay = '0s' }) {
  return (
    <div className={`pointer-events-none absolute z-20 ${className}`} aria-hidden="true">
      <div className="logo-grid-cross relative h-[11px] w-[11px]">
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
    <section
      id="logo-wall"
      className="relative z-20 bg-white text-[#052424]"
      aria-label="Brand partners"
      style={{ '--lw-intro-h': 'clamp(160px, 38vw, 240px)' }}
    >
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="relative px-5 sm:px-8" style={{ minHeight: 'var(--lw-intro-h)' }}>
          <div
            data-animate="up"
            className="absolute inset-x-5 top-12 flex items-start justify-center text-center sm:inset-x-8 sm:top-20 lg:top-24"
          >
            <h2 className="mx-auto max-w-[16ch] font-head text-[clamp(26px,6.5vw,56px)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#052424]">
              Powering the yards behind the brands you trust
            </h2>
          </div>
        </div>

        <div className="pb-14 sm:pb-16 lg:pb-20">
          <div className="grid grid-cols-2 gap-px bg-[#e8e8e8] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10">
            {LOGOS.map((logo, index) => (
              <div
                key={logo.name}
                className="group relative flex min-h-[110px] items-center justify-center bg-white px-4 py-8 transition-colors duration-300 hover:bg-[#fafafa] sm:min-h-[130px] sm:px-5 sm:py-10 lg:min-h-[150px]"
                style={{ zIndex: LOGOS.length - index }}
              >
                <Cross className="-left-[5px] -top-[5px]" delay={`${(index % 5) * 0.15}s`} />
                <Cross className="-right-[5px] -top-[5px]" delay={`${(index % 5) * 0.15 + 0.08}s`} />
                <Cross className="-bottom-[5px] -right-[5px]" delay={`${(index % 5) * 0.15 + 0.16}s`} />
                <Cross className="-bottom-[5px] -left-[5px]" delay={`${(index % 5) * 0.15 + 0.24}s`} />

                <img
                  src={logo.src}
                  alt={logo.name}
                  loading="lazy"
                  decoding="async"
                  className="h-8 w-auto max-w-[78%] object-contain opacity-90 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 sm:h-9 lg:h-10"
                  style={{ transform: `scale(${logo.scale})` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
