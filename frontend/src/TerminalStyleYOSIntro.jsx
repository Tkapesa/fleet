import TerminalStyleNotch from './TerminalStyleNotch'
import { BRAND } from './atondaBrand'

const BENEFITS = [
  {
    title: 'Orchestrate Yard Execution',
    body: 'Computer vision automates check-in, location, and validation gate to dock — up to 50% more throughput and 85% faster gate processing.',
  },
  {
    title: 'Build the System You Need',
    body: 'Start with the applications you need most and expand as your operations grow. Live in 5 days, low IT lift, no third-party devices to support.',
  },
  {
    title: 'Eliminates Unnecessary Labor',
    body: 'Automated workflows eliminate labor at the gate, dispatch, yard checks, and make the dock more efficient.',
  },
  {
    title: 'Fast Payback',
    body: 'All-inclusive, priced as a service. Measurable payback in months, without a capital project.',
  },
]

export default function TerminalStyleYOSIntro() {
  return (
    <>
      <TerminalStyleNotch />
      <section className="relative z-20 bg-white px-5 py-16 text-[#052424] sm:px-6 sm:py-20 lg:px-10 lg:py-24" id="yos-intro">
        <div className="mx-auto max-w-[1280px]">
          <div data-animate="up" className="mx-auto max-w-[900px] text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a8a8a]">{BRAND.name}</p>
            <h2 className="mt-3 font-head text-[clamp(28px,4.5vw,48px)] font-semibold leading-[1.12] tracking-[-0.03em] text-[#052424]">
              Introducing the {BRAND.name} {BRAND.product}
            </h2>
            <p className="mx-auto mt-5 max-w-[62ch] text-[15px] leading-relaxed text-[#1f1f1f] sm:text-[16px]">
              The {BRAND.name} {BRAND.product}™ ({BRAND.productShort}) uses computer vision and autonomous decision
              intelligence to turn chaotic, manually run yards into self-aware logistics environments. Its key benefits
              include:
            </p>
          </div>

          <ul className="mt-10 grid list-none gap-5 p-0 sm:mt-14 sm:grid-cols-2 sm:gap-8 lg:mt-16 lg:gap-10">
            {BENEFITS.map((item, index) => (
              <li
                key={item.title}
                data-animate="up"
                className="border-t border-[#e0e0e0] pt-6 sm:pt-7"
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                <h3 className="font-head text-[18px] font-semibold leading-snug tracking-[-0.02em] text-[#052424] sm:text-[20px]">
                  {item.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[#1f1f1f]">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
