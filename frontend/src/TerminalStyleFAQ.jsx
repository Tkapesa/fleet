import { useId, useState } from 'react'

const TABS = [
  {
    id: 'core',
    label: 'Core Technology',
    items: [
      {
        q: 'What does AtondaFleet actually do?',
        a: (
          <>
            AtondaFleet is an AI-native Yard Operating System<sup>TM</sup> (YOS<sup>TM</sup>) that uses computer vision to
            automate yard execution from gate to dock. It replaces manual logs with a system that proactively decides and
            executes the next best move in real-time.
          </>
        ),
      },
      {
        q: 'How is this different from a traditional Yard Management System (YMS)?',
        a: (
          <>
            Traditional YMS are &quot;digital clipboards&quot; that record what already happened; AtondaFleet is an{' '}
            <em>operating</em> system that sees what is happening now and orchestrates what needs to happen next in the
            yard.
          </>
        ),
      },
      {
        q: 'What is "Agentic AI" in the context of the yard?',
        a: (
          <>
            It acts as a 24/7 autonomous supervisor that handles exceptions and reprioritizes tasks based on real-time
            conditions, ensuring the most critical moves happen first (e.g. how to prepare and reallocate resources for a
            late appointment)
          </>
        ),
      },
      {
        q: 'How accurate is the data captured by your system?',
        a: (
          <>
            Our proprietary computer vision stack delivers 50% or more improvement in data accuracy vs. manual
            operations, virtually eliminating the human error and &quot;lost assets&quot; common with manual entry.
          </>
        ),
      },
      {
        q: 'Can we manage multiple sites from a single login?',
        a: (
          <>
            Yes; AtondaFleet provides a &quot;Global Control Tower&quot; view, allowing you to compare KPIs, dwell times, and
            performance across all facilities in your network in one place.
          </>
        ),
      },
    ],
  },
  {
    id: 'value',
    label: 'Value',
    items: [
      {
        q: 'What ROI can we expect?',
        a: (
          <>
            Customers typically see measurable payback in months — often under 5 months — through higher throughput, lower
            detention, and less labor spent searching for assets or running the gate.
          </>
        ),
      },
      {
        q: 'Where do the savings come from?',
        a: (
          <>
            Primary levers include spotter and labor efficiency, detention & demurrage reduction, faster gate cycles, and
            fewer lost or misplaced trailers across the yard.
          </>
        ),
      },
      {
        q: 'Do we need a large capital project to start?',
        a: (
          <>
            No. AtondaFleet is priced as a service with modular deployment — start with the application that fixes your
            biggest pain, then expand without a rip-and-replace project.
          </>
        ),
      },
      {
        q: 'How quickly can we prove value on one site?',
        a: (
          <>
            Many teams go live in days on a single workflow (gate, yard, or dock), prove the uplift, then roll the same OS
            to additional sites on their own timeline.
          </>
        ),
      },
      {
        q: 'Is this only for large enterprise networks?',
        a: (
          <>
            No. The same computer vision and orchestration work for a single yard or a full network — you get the automation
            big operators run, sized to your operation.
          </>
        ),
      },
    ],
  },
  {
    id: 'implementation',
    label: 'Implementation',
    items: [
      {
        q: 'How long does implementation take?',
        a: (
          <>
            Core workflows can go live in as little as 5 days. AtondaFleet Vision Kits deploy without trenching
            or heavy construction, keeping IT lift low.
          </>
        ),
      },
      {
        q: 'Do we need to tag trailers or install RFID?',
        a: (
          <>
            No. AtondaFleet reads trucks and trailers with computer vision, so there is nothing to tag, scan, or maintain on
            every asset.
          </>
        ),
      },
      {
        q: 'How much IT involvement is required?',
        a: (
          <>
            Minimal. The platform is cloud-based — no on-prem servers to buy, and no heavy infrastructure to manage after
            cameras and connectivity are in place.
          </>
        ),
      },
      {
        q: 'Can we start with one module and expand later?',
        a: (
          <>
            Yes. Begin with the application you need most (gate, yard, or dock), then add modules as value is proven —
            without re-implementing the whole system.
          </>
        ),
      },
      {
        q: 'Will this disrupt current yard operations?',
        a: (
          <>
            Deployment is designed for low disruption: phased rollout, parallel running where needed, and go-live scoped to
            the workflow you choose first.
          </>
        ),
      },
    ],
  },
  {
    id: 'ops',
    label: 'Site Operations',
    items: [
      {
        q: 'What happens at the gate?',
        a: (
          <>
            Computer vision automates check-in and check-out, improves data accuracy, reduces manual labor, and can connect
            to your TMS for arrivals and digital compliance — replacing paper-heavy processes.
          </>
        ),
      },
      {
        q: 'How does AtondaFleet help in the yard?',
        a: (
          <>
            You get real-time location of assets and automated move workflows so spotters and supervisors always know what
            to move next — without clipboard hunts.
          </>
        ),
      },
      {
        q: 'What about dock operations?',
        a: (
          <>
            Dock workflows are optimized with live visibility into appointments, door status, and yard-to-dock sequencing so
            loading stays efficient even when plans change.
          </>
        ),
      },
      {
        q: 'Can operations run overnight or in bad weather?',
        a: (
          <>
            Yes. The vision stack is built for real-world yards — rain, glare, night shifts, and peak season pressure —
            so automation holds when conditions get hard.
          </>
        ),
      },
      {
        q: 'How do multi-site teams run day-to-day?',
        a: (
          <>
            A unified control tower rolls up KPIs, dwell, and exceptions across facilities so network leaders can compare
            sites and act from one place.
          </>
        ),
      },
    ],
  },
]

function PlusIcon({ open }) {
  return (
    <svg
      className={`mt-0.5 h-5 w-5 shrink-0 text-[#a3a3a3] transition-transform duration-300 ${open ? 'rotate-45 text-[#052424]' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect x="10.91" y="0" width="2.182" height="24" fill="currentColor" />
      <rect x="24" y="10.91" width="2.182" height="24" transform="rotate(90 24 10.91)" fill="currentColor" />
    </svg>
  )
}

export default function TerminalStyleFAQ() {
  const baseId = useId()
  const [activeTab, setActiveTab] = useState(0)
  const [openIndex, setOpenIndex] = useState(null)
  const tab = TABS[activeTab]

  return (
    <section
      id="faqs"
      className="relative z-10 isolate bg-white text-[#1f1f1f]"
      aria-labelledby={`${baseId}-title`}
    >
      <div className="mx-auto grid max-w-[1280px] gap-12 px-6 pb-8 pt-20 sm:px-8 sm:pt-24 lg:grid-cols-[1fr_1.75fr] lg:gap-20 lg:px-10 lg:pb-10 lg:pt-28">
        <div data-animate="left" className="lg:sticky lg:top-28 lg:max-w-[340px] lg:self-start">
          <h2
            id={`${baseId}-title`}
            className="font-head text-[clamp(42px,5.2vw,58px)] font-semibold leading-[1.05] tracking-[-0.03em] text-black"
          >
            FAQs
          </h2>
          <p className="mt-6 text-[16px] leading-[1.65] text-[#1f1f1f] sm:text-[17px]">
            Here are the most common questions teams have before getting started with AtondaFleet.
          </p>
        </div>

        <div data-animate="right" className="min-w-0">
          <div
            className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="FAQ categories"
          >
            {TABS.map((item, index) => {
              const active = index === activeTab
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveTab(index)
                    setOpenIndex(null)
                  }}
                  className={`shrink-0 rounded-full px-[14px] py-[10px] text-[11px] font-semibold uppercase tracking-[0.07em] transition duration-200 ${
                    active
                      ? 'border border-[#052424] bg-[#052424] text-[#ABFF02]'
                      : 'border border-[#d6d6d6] bg-transparent text-[#8c8c8c] hover:border-[#052424] hover:text-[#052424]'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="mt-3" role="tabpanel">
            {tab.items.map((item, index) => {
              const open = openIndex === index
              const panelId = `${baseId}-panel-${tab.id}-${index}`
              const buttonId = `${baseId}-btn-${tab.id}-${index}`

              return (
                <div key={item.q} className="border-b border-[#e8e2d4]">
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
                    className="flex w-full items-start justify-between gap-4 py-5 text-left transition hover:text-[#052424] sm:items-center sm:gap-8 sm:py-[22px]"
                  >
                    <span
                      className={`min-w-0 text-[15px] font-medium leading-snug sm:text-[16px] md:text-[17px] ${open ? 'text-[#052424]' : 'text-black'}`}
                    >
                      {item.q}
                    </span>
                    <PlusIcon open={open} />
                  </button>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-5 pr-2 text-[14px] leading-relaxed text-[#1f1f1f] sm:pb-6 sm:pr-8 sm:text-[15px] lg:pr-12 [&_em]:italic [&_sup]:text-[10px]">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
