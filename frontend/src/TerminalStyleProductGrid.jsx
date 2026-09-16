import TerminalStyleNotch from './TerminalStyleNotch'

const CARDS = [
  {
    eyebrow: '01 FAST START',
    title: 'Fix One Problem in the Yard',
    description:
      'Gate, security, dock — start with the single problem slowing your yard down today. Go live in days with no disruption and at low cost.',
    image: 'https://a.storyblok.com/f/337048/768x432/ce73b10067/gate-entry.jpg/m/1200x0/filters:format(jpeg):quality(85)',
    cta: 'FIX NOW',
    href: '#contact',
  },
  {
    eyebrow: '02 SINGLE SITE & GROWING',
    title: 'I Have a Few Yards to Optimize',
    description:
      'Begin with one site, prove the value, and roll out to the rest on your own timeline. No big platform commitment to get started.',
    image: 'https://a.storyblok.com/f/337048/1272x1196/29dcba4210/yard.png/m/1200x0/filters:format(png):quality(85)',
    cta: 'LEARN MORE',
    href: '#platform',
  },
  {
    eyebrow: '03 ENTERPRISE NETWORK',
    title: 'I Run a Network of Yards',
    description:
      'One control tower across every site, with the analytics and orchestration to manage your whole operation from a single view.',
    image: 'https://a.storyblok.com/f/337048/2034x1150/c561abc6ba/r.webp/m/1200x0/filters:format(webp):quality(85)',
    cta: 'ONE SYSTEM FOR ALL',
    href: '#contact',
  },
]

export default function TerminalStyleProductGrid() {
  return (
    <>
      <TerminalStyleNotch />
      <section id="product-grid" className="relative z-20 bg-white px-5 py-16 text-[#052424] sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1280px]">
          <h2
            data-animate="up"
            className="mx-auto max-w-[18ch] text-center font-head text-[clamp(32px,5vw,56px)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#052424]"
          >
            Fix one yard problem today. Expand on your timetable.
          </h2>

          <div className="mt-10 grid gap-5 sm:mt-14 sm:gap-6 md:grid-cols-2 xl:mt-16 xl:grid-cols-3 xl:gap-7">
            {CARDS.map((card, index) => (
              <article
                key={card.eyebrow}
                data-animate="up"
                className="group flex h-full flex-col rounded-[18px] bg-[#ececec] p-5 transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(5,36,36,0.08)] sm:p-6"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="flex flex-1 flex-col">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#052424]/70">
                    {card.eyebrow}
                  </p>
                  <h3 className="mt-4 font-head text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#052424] sm:text-[24px]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-[1.45] tracking-[0.01em] text-[#052424]/80 sm:text-[16px]">
                    {card.description}
                  </p>
                </div>

                <div className="mt-6 overflow-hidden rounded-[12px]">
                  <img
                    src={card.image}
                    alt=""
                    className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                </div>

                <div className="mt-5">
                  <a
                    href={card.href}
                    className="inline-flex items-center rounded-[4px] border border-[#052424] bg-transparent px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#052424] transition duration-200 hover:bg-[#052424] hover:text-[#ABFF02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#052424]"
                  >
                    {card.cta}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
