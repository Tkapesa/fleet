import { useId, useMemo, useState } from 'react'
import TerminalStyleNotch from './TerminalStyleNotch'

const DEFAULTS = {
  gates: '2',
  shifts: '3',
  days: '6',
  spotters: '3',
  checkins: '45',
  wage: '28',
  demurrage: 4,
}

function num(v) {
  if (v === '' || Number.isNaN(Number(v))) return 0
  return Number(v)
}

/** Terminal Industries yard ROI model (from their calculator bundle). */
function computeSavings(inputs) {
  const gates = num(inputs.gates)
  const shifts = num(inputs.shifts)
  const days = num(inputs.days)
  const spotters = num(inputs.spotters)
  const checkins = num(inputs.checkins)
  const wage = num(inputs.wage)
  const demurrage = inputs.demurrage

  const annualHours = 8 * shifts * days * 52
  const gateLabor = gates * 2 * wage * annualHours
  const trafficLabor = (checkins > 50 ? 2 : 1) * 6 * shifts * days * 52 * wage
  const dispatchLabor = 1 * 8 * shifts * days * 52 * wage
  const spotterLeases = spotters * 4000 * 12
  const spotterWages = spotters * wage * annualHours
  const checkinDetention = checkins * 0.1 * 2 * 50 * 365
  const demurrageBase = 200000 + (demurrage - 1) * (1800000 / 9)

  const labor = (gateLabor + trafficLabor + dispatchLabor) * 0.25
  const spotter = (spotterLeases + spotterWages) * 0.25
  const detention = (checkinDetention + demurrageBase) * 0.2
  const total = labor + spotter + detention
  const costBase =
    gateLabor + trafficLabor + dispatchLabor + spotterLeases + spotterWages + checkinDetention + demurrageBase
  const pct = costBase === 0 ? 0 : Math.round((total / costBase) * 100)

  return {
    labor: Math.round(labor),
    spotter: Math.round(spotter),
    detention: Math.round(detention),
    total: Math.round(total),
    pct,
  }
}

function money(n) {
  return n.toLocaleString('en-US')
}

function SavingsRow({ label, detail, value }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/8 py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 sm:border-0 sm:py-1.5 md:gap-6 md:py-2">
      <p className="m-0 min-w-0 text-[12px] leading-[1.4] text-white sm:text-[13px] md:text-[14px] lg:text-[18px] xl:text-[20px]">
        {label}
        {detail ? <span className="text-white/55"> {detail}</span> : null}:
      </p>
      <p className="m-0 shrink-0 font-head text-[16px] leading-none text-white sm:text-[17px] md:whitespace-nowrap lg:text-[22px] xl:text-[27px]">
        $ {money(value)}
      </p>
    </div>
  )
}

function onlyDigits(raw, maxLen) {
  return raw.replace(/\D/g, '').slice(0, maxLen)
}

function onlyDecimal(raw, maxLen) {
  const cleaned = raw.replace(/[^\d.]/g, '')
  const parts = cleaned.split('.')
  const next = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : parts[0]
  return next.slice(0, maxLen)
}

/** Terminal results notch — objectBoundingBox units so it scales with the card. */
const RESULTS_CLIP =
  'M0 0 L0.47596 0 A0.02261 0.0266 0 0 1 0.49426 0.01102 L0.50574 0.02974 A0.02258 0.02656 0 0 0 0.52404 0.04076 L0.87596 0.04076 A0.02258 0.02656 0 0 0 0.89426 0.02974 L0.90574 0.01102 A0.02276 0.02678 0 0 1 0.92404 0 L1 0 L1 1 L0 1 L0 0.77376 A0.0151 0.01777 0 0 1 0.00625 0.7594 L0.02839 0.7406 A0.01505 0.0177 0 0 0 0.03464 0.72624 L0.03464 0.47376 A0.01505 0.0177 0 0 0 0.02839 0.4594 L0.00625 0.4406 A0.01508 0.01774 0 0 1 0 0.42624 Z'

const FIELD_LABEL = 'mb-1 block text-[14px] text-[#052424]/80 md:text-[15px]'
const FIELD_INPUT =
  'w-full appearance-none border-0 bg-transparent pb-3 pt-1 text-[14px] tracking-[0.0225rem] text-[#052424]/70 outline-none placeholder:text-[#052424]/50 focus:text-[#052424] md:text-[16px]'
const FIELD_LINE = 'h-px bg-[#052424]/20'

function Field({ id, label, value, onChange, placeholder, maxLength, inputMode = 'numeric', prefix }) {
  return (
    <div className="relative flex min-w-0 flex-1 flex-col">
      <label className={FIELD_LABEL} htmlFor={id}>
        {label}
      </label>
      <div className="flex items-baseline gap-3">
        {prefix ? <span className="shrink-0 text-[14px] tracking-[0.0225rem] text-[#052424]/50 md:text-[16px]">{prefix}</span> : null}
        <input
          id={id}
          className={FIELD_INPUT}
          type="text"
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
      <div className={FIELD_LINE} />
    </div>
  )
}

export default function TerminalStyleCalculator() {
  const clipId = useId().replace(/:/g, '')
  const glowId = `roi-glow-${clipId}`
  const resultsClipId = `roi-results-clip-${clipId}`

  const [gates, setGates] = useState(DEFAULTS.gates)
  const [shifts, setShifts] = useState(DEFAULTS.shifts)
  const [days, setDays] = useState(DEFAULTS.days)
  const [spotters, setSpotters] = useState(DEFAULTS.spotters)
  const [checkins, setCheckins] = useState(DEFAULTS.checkins)
  const [wage, setWage] = useState(DEFAULTS.wage)
  const [demurrage, setDemurrage] = useState(DEFAULTS.demurrage)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const results = useMemo(
    () => computeSavings({ gates, shifts, days, spotters, checkins, wage, demurrage }),
    [gates, shifts, days, spotters, checkins, wage, demurrage],
  )

  const sliderPct = ((demurrage - 1) / 9) * 100
  const canSubmit = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const demurrageText = demurrage <= 3 ? `${demurrage}, Low` : demurrage <= 6 ? `${demurrage}, Medium` : `${demurrage}, High`

  return (
    <>
      <TerminalStyleNotch />
      <section id="calculator" className="relative z-20 overflow-x-clip bg-white text-[#052424]">
      <div className="mx-auto max-w-[1280px] px-5 pb-4 pt-16 sm:px-6 sm:pt-20 lg:px-10 lg:pt-24">
        <p data-animate="up" className="text-center text-[15px] tracking-[-0.01em] text-[#7F7F7F] sm:text-[17px]">
          Yard Efficiency Calculator
        </p>
        <h2
          data-animate="up"
          className="mx-auto mt-4 max-w-[18ch] text-center font-head text-[clamp(32px,5.2vw,56px)] font-semibold leading-[1.05] tracking-[-0.03em] text-[#052424]"
        >
          What&apos;s your yard costing you?
        </h2>
      </div>

      <div className="mx-auto flex max-w-[120rem] flex-col gap-8 px-5 pb-12 pt-8 sm:gap-10 sm:px-6 sm:pb-14 sm:pt-10 lg:flex-row lg:items-stretch lg:gap-8 lg:px-8 lg:pb-16 lg:pt-12 xl:gap-10 2xl:px-16">
        {/* Form */}
        <div data-animate="left" className="flex min-w-0 flex-1 flex-col gap-5 xl:min-w-[17.5rem]">
          <div>
            <p className="mb-2 text-[11px] tracking-[-0.01em] text-[#7F7F7F] sm:text-[12px]">Calculator</p>
            <h3 className="font-head text-[26px] font-normal leading-tight tracking-[-0.02em] text-[#052424] sm:text-[30px] md:text-[34px]">
              Tell us about your yard:
            </h3>
          </div>

          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="flex flex-col gap-5 md:flex-row md:gap-6">
              <Field
                id="roi-gates"
                label="Number of gates"
                value={gates}
                placeholder="e.g. 2"
                maxLength={3}
                onChange={(e) => setGates(onlyDigits(e.target.value, 3))}
              />
              <Field
                id="roi-shifts"
                label="Shifts per day"
                value={shifts}
                placeholder="e.g. 3"
                maxLength={2}
                onChange={(e) => setShifts(onlyDigits(e.target.value, 2))}
              />
            </div>

            <div className="flex flex-col gap-5 md:flex-row md:gap-6">
              <Field
                id="roi-days"
                label="Operating days per week"
                value={days}
                placeholder="e.g. 6"
                maxLength={1}
                onChange={(e) => setDays(onlyDigits(e.target.value, 1))}
              />
              <Field
                id="roi-spotters"
                label="Spotters per shift"
                value={spotters}
                placeholder="e.g. 3"
                maxLength={3}
                onChange={(e) => setSpotters(onlyDigits(e.target.value, 3))}
              />
            </div>

            <Field
              id="roi-checkins"
              label="Check-ins per day"
              value={checkins}
              placeholder="e.g. 45"
              maxLength={5}
              onChange={(e) => setCheckins(onlyDigits(e.target.value, 5))}
            />

            <Field
              id="roi-wage"
              label="Blended hourly wage"
              value={wage}
              placeholder="Please Enter"
              maxLength={6}
              inputMode="decimal"
              prefix="$"
              onChange={(e) => setWage(onlyDecimal(e.target.value, 6))}
            />

            <div className="flex flex-col gap-2 pt-1">
              <label className={FIELD_LABEL} htmlFor="roi-demurrage">
                How significant are your annual detention and demurrage costs?
              </label>
              <div className="flex flex-col gap-2.5 py-3">
                <input
                  id="roi-demurrage"
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={demurrage}
                  aria-valuemin={1}
                  aria-valuemax={10}
                  aria-valuenow={demurrage}
                  aria-valuetext={demurrageText}
                  aria-label="Demurrage volume from low to high"
                  onChange={(e) => setDemurrage(Number(e.target.value))}
                  className="roi-slider h-1 w-full cursor-pointer appearance-none rounded-full"
                  style={{
                    background: `linear-gradient(to right, #052424 0%, #052424 ${sliderPct}%, rgba(5,36,36,0.2) ${sliderPct}%, rgba(5,36,36,0.2) 100%)`,
                  }}
                />
                <div className="flex justify-between pt-1 text-[11px] tracking-[0.18em]">
                  <span className="text-[#7F7F7F]">1 - LOW</span>
                  <span className="text-[#052424]">5 - MEDIUM</span>
                  <span className="text-[#7F7F7F]">10 - HIGH</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results notch card */}
        <div
          data-animate="right"
          className="min-w-0 flex-1 lg:min-w-[20rem] -mx-5 w-[calc(100%+2.5rem)] sm:-mx-6 sm:w-[calc(100%+3rem)] lg:mx-0 lg:w-full"
        >
          <svg width="0" height="0" className="absolute" aria-hidden="true">
            <defs>
              <clipPath id={resultsClipId} clipPathUnits="objectBoundingBox">
                <path d={RESULTS_CLIP} />
              </clipPath>
            </defs>
          </svg>
          <div
            className="relative overflow-hidden text-white"
            style={{
              clipPath: `url(#${resultsClipId})`,
              WebkitClipPath: `url(#${resultsClipId})`,
              background: 'linear-gradient(165deg, #071f1f 0%, #052424 38%, #041818 100%)',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
              style={{
                background:
                  'radial-gradient(ellipse 80% 40% at 72% 8%, rgba(171,255,2,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 10% 90%, rgba(171,255,2,0.06) 0%, transparent 60%)',
              }}
            />
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 866 736" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <filter id={glowId} x="0" y="0" width="155" height="89" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feGaussianBlur stdDeviation="17" />
                </filter>
              </defs>
              <path
                fillOpacity="0.35"
                filter={`url(#${glowId})`}
                d="M55.1257 34C40.6277 34 34 36.52 34 44.5C34 54.16 38.9708 55 55.1257 55C78.4606 55 121.817 45.34 120.988 44.5C119.817 43.312 78.4606 34 55.1257 34Z"
                fill="#ABFF02"
                transform="translate(752 145)"
              />
              <path
                d="M 0,221.4 L 22.5,205.4 A 86.47,86.47 0 0 1 72.61,189.4 L 866,189.4"
                stroke="#ABFF02"
                fill="none"
                strokeOpacity="0.22"
                strokeWidth="1"
              />
            </svg>

            <div className="relative z-[2] flex flex-col gap-6 px-5 pb-7 pt-10 sm:gap-7 sm:px-6 sm:pb-8 sm:pt-14 md:gap-8 lg:px-8 lg:pb-9 lg:pt-16 xl:gap-10 xl:px-10 xl:pb-10 xl:pt-[4.5rem]">
              {/* Header — title left, total right */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 md:gap-8">
                <div className="font-head text-[22px] leading-[1.15] tracking-[-0.02em] sm:text-[28px] lg:text-[36px] xl:text-[40px]">
                  <span className="block text-white">With AtondaFleet</span>
                  <span className="mt-1 block text-white/55">your yard saves</span>
                </div>
                <div className="shrink-0 sm:text-right">
                  <p className="m-0 font-head text-[32px] leading-none tracking-[-0.02em] text-white sm:text-[40px] lg:text-[46px] xl:text-[50px]">
                    $ {money(results.total)}
                  </p>
                  <p className="mt-2 text-[14px] text-white/85 sm:text-[15px] xl:mt-3 xl:text-[20px]">
                    Est. Savings:{' '}
                    <span className="font-head text-[18px] text-white sm:text-[20px] xl:text-[27px]">{results.pct}%</span>
                  </p>
                </div>
              </div>

              {/* Category breakdown — label + value on one row */}
              <div className="flex flex-col gap-3 sm:gap-4">
                <p className="m-0 font-head text-[14px] text-white sm:text-[15px] xl:text-[20px]">
                  Estimated annual savings by category:
                </p>
                <div className="flex flex-col gap-1 sm:gap-1.5">
                  <SavingsRow
                    label="Labor Savings"
                    detail="(Gate, Traffic, Dispatch, Yard Check)"
                    value={results.labor}
                  />
                  <SavingsRow label="Spotter Savings" detail="(Drivers and Unit Leases)" value={results.spotter} />
                  <SavingsRow label="Detention & Demurrage Savings" value={results.detention} />
                </div>
              </div>

              {/* Lead form — title left / copy right, then email + button */}
              <div className="rounded-[10px] bg-[#0a3232] p-5 sm:p-6 lg:p-7">
                {submitted ? (
                  <p className="m-0 text-center text-[14px] text-[#ABFF02] sm:text-[15px]">
                    Thanks — a yard expert will follow up shortly.
                  </p>
                ) : (
                  <>
                    <div className="mb-5 grid gap-3 sm:mb-6 sm:gap-4 md:grid-cols-[minmax(0,11rem)_1fr] md:items-start md:gap-8 lg:gap-10 xl:gap-14">
                      <p className="m-0 font-head text-[16px] leading-snug text-white sm:text-[17px] lg:text-[18px]">
                        Want to know more?
                      </p>
                      <p className="m-0 max-w-[42ch] text-[12px] leading-[1.55] text-white/55 sm:text-[13px] lg:text-[14px]">
                        Enter your work email below if you would like to run a custom ROI analysis with one of our team
                        of yard experts.
                      </p>
                    </div>

                    <form
                      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5 md:gap-6"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!canSubmit) return
                        setSubmitted(true)
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <label className="mb-1.5 block text-[12px] text-white/80 sm:text-[13px]" htmlFor="roi-email">
                          Work Email
                        </label>
                        <input
                          id="roi-email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="name@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full border-0 border-b border-white/30 bg-transparent pb-2.5 pt-1 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-white/60"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!canSubmit}
                        className="h-[46px] w-full shrink-0 rounded-[6px] bg-[#b5c0c0] px-8 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[#052424] transition enabled:hover:bg-[#c8d4d4] disabled:cursor-not-allowed disabled:opacity-45 sm:h-[50px] sm:w-auto sm:min-w-[9.5rem]"
                      >
                        SUBMIT
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .roi-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #052424;
          border: 3px solid #fff;
          box-shadow: 0 0 0 1px #052424;
          cursor: pointer;
          margin-top: -6px;
          transition: transform 0.15s ease;
        }
        .roi-slider::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 999px;
        }
        .roi-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #052424;
          border: none;
          box-shadow: 0 0 0 1px #052424;
          cursor: pointer;
        }
        .roi-slider::-moz-range-track {
          height: 4px;
          border-radius: 999px;
          background: rgba(5, 36, 36, 0.2);
        }
        .roi-slider:hover::-webkit-slider-thumb,
        .roi-slider:focus-visible::-webkit-slider-thumb {
          transform: scale(1.1);
        }
        .roi-slider:focus-visible {
          outline: 2px solid #052424;
          outline-offset: 6px;
          border-radius: 999px;
        }
      `}</style>
    </section>
    </>
  )
}
