import { useState } from 'react'
import TerminalStyleNotch from './TerminalStyleNotch'

const HELP_OPTIONS = [
  'Schedule a 30-minute meeting with a yard expert',
  'Schedule an AtondaFleet demo',
  'Arrange ROI consultation',
  'Set up a 2-day proof of value on site',
  'Something else',
]

const BULLETS = ['30-minute demo', 'Needs discovery call', 'Yard ROI assessment']

const LOGO_STRIPE = 'https://a.storyblok.com/f/337048/1130x140/8e14227e2e/logo-stripe.png'

const FIELD =
  'w-full border-0 border-b border-white/35 bg-transparent pb-2.5 pt-1 text-[15px] text-white outline-none transition placeholder:text-white/35 focus:border-[#ABFF02]'

const LABEL = 'mb-2 block text-[12px] font-medium text-white/90'

export default function TerminalStyleContact() {
  const [form, setForm] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    company: '',
    help: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const canSubmit =
    form.name.trim() && form.role.trim() && form.email.trim() && form.company.trim() && form.help

  return (
    <>
      <TerminalStyleNotch />
      <section id="contact" className="relative z-10 isolate bg-white text-[#052424]">
        <div className="mx-auto max-w-[1280px] px-6 pb-6 pt-16 sm:px-8 sm:pt-20 lg:px-10 lg:pt-24">
          <h2
            data-animate="up"
            className="mx-auto max-w-4xl text-center font-head text-[clamp(32px,4.6vw,52px)] font-semibold leading-[1.12] tracking-[-0.02em] text-[#052424]"
          >
            Contact us and we will be in touch
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            same day, your way
          </h2>

          <div className="mt-12 grid items-start gap-10 lg:mt-16 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
            <div data-animate="left" className="max-w-xl pt-1">
              <p className="text-[16px] leading-relaxed text-[#1f1f1f]">
                Fill out the form, and we&apos;ll be happy to discuss how AtondaFleet can help you with your yard of the
                future:
              </p>

              <ul className="mt-6 space-y-3">
                {BULLETS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[16px] text-[#1f1f1f]">
                    <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-[#ABFF02]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-14 text-[15px] text-[#7F7F7F]">Trusted by those in the know.</p>
              <img
                src={LOGO_STRIPE}
                alt="Trusted by Ryder, Honda, Ocean Spray, DSV, NFI, and Goodyear"
                className="mt-4 w-full max-w-[520px] object-contain object-left opacity-90"
                loading="lazy"
              />
            </div>

            <form
              data-animate="right"
              className="rounded-[18px] bg-[#052424] p-6 text-white shadow-[0_20px_60px_rgba(5,36,36,0.12)] sm:p-8 lg:p-9"
              onSubmit={(e) => {
                e.preventDefault()
                if (!canSubmit) return
                setSubmitted(true)
              }}
            >
              {submitted ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                  <p className="font-head text-[22px] font-semibold text-[#ABFF02]">Thank you!</p>
                  <p className="mt-3 max-w-[32ch] text-[15px] leading-relaxed text-white/80">
                    A yard expert will reach out same day — your way.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                    <div>
                      <label className={LABEL} htmlFor="f-name">
                        Full Name <span>*</span>
                      </label>
                      <input
                        id="f-name"
                        className={FIELD}
                        type="text"
                        name="name"
                        placeholder="John Doe"
                        required
                        autoComplete="name"
                        value={form.name}
                        onChange={set('name')}
                      />
                    </div>

                    <div>
                      <label className={LABEL} htmlFor="f-role">
                        Role or position <span>*</span>
                      </label>
                      <input
                        id="f-role"
                        className={FIELD}
                        type="text"
                        name="role_or_position"
                        placeholder="Project manager"
                        required
                        autoComplete="organization-title"
                        value={form.role}
                        onChange={set('role')}
                      />
                    </div>

                    <div>
                      <label className={LABEL} htmlFor="f-phone">
                        Phone number
                      </label>
                      <input
                        id="f-phone"
                        className={FIELD}
                        type="tel"
                        name="phone"
                        placeholder="(323) 555-0147"
                        autoComplete="tel"
                        inputMode="numeric"
                        value={form.phone}
                        onChange={set('phone')}
                      />
                    </div>

                    <div>
                      <label className={LABEL} htmlFor="f-email">
                        Email <span>*</span>
                      </label>
                      <input
                        id="f-email"
                        className={FIELD}
                        type="email"
                        name="email"
                        placeholder="name@email.com"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={set('email')}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={LABEL} htmlFor="f-company">
                        Company name <span>*</span>
                      </label>
                      <input
                        id="f-company"
                        className={FIELD}
                        type="text"
                        name="company"
                        placeholder="Acme"
                        required
                        autoComplete="organization"
                        value={form.company}
                        onChange={set('company')}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={LABEL} htmlFor="f-help">
                        How Can We Help? <span>*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="f-help"
                          className={`${FIELD} appearance-none pr-8 ${form.help ? 'text-white' : 'text-white/35'}`}
                          name="help"
                          required
                          value={form.help}
                          onChange={set('help')}
                        >
                          <option value="" disabled>
                            Select options
                          </option>
                          {HELP_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="bg-[#052424] text-white">
                              {opt}
                            </option>
                          ))}
                        </select>
                        <span
                          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/50"
                          aria-hidden="true"
                        >
                          ▾
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="mt-9 w-full rounded-[4px] bg-[#1a3333] py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition duration-200 enabled:hover:bg-[#ABFF02] enabled:hover:text-[#052424] disabled:cursor-default disabled:opacity-55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ABFF02]"
                  >
                    Submit
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
