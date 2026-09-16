import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const LIME = '#ABFF02'
const WHITE = '#FFFFFF'

const FRAME_BASE = 'https://terminal-industries.com/static/frames/home'
const DESKTOP = { template: `${FRAME_BASE}/desktop/webp/hero_anim_desktop_60_{index}.webp`, count: 410 }
const MOBILE = { template: `${FRAME_BASE}/mobile/webp/hero_anim_mobile_60_{index}.webp`, count: 409 }

/** AtondaFleet hero sequence — lime statements, then white payoff. */
const TITLES = [
  { color: LIME, lines: ['AtondaFleet reinvents', 'the future of logistics', 'through the yard.'] },
  {
    color: LIME,
    lines: ['AI-native technology', 'that turns the space', 'between your gate and', 'your dock...'],
  },
  { color: WHITE, lines: ['into one connected,', 'automated fleet system.'] },
]

const INDICATOR = 'Scroll to explore'

/**
 * The sequence finishes scrubbing at this share of the section's scroll, so the
 * last frame and the closing line stay on screen instead of being cut off by
 * the handoff to the next section.
 */
const SCRUB_END = 0.8

function buildFrames({ template, count }) {
  return Array.from({ length: count }, (_, index) => template.replace('{index}', String(index)))
}

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

function Title({ block, index }) {
  return (
    <h2
      data-hero-title
      aria-label={block.lines.join(' ')}
      className="absolute bottom-0 w-[90%] text-center font-head text-[clamp(28px,5.6vw,58px)] font-normal leading-[0.95] tracking-[-0.01em] lg:w-[min(62.5vw,1600px)]"
      style={{ visibility: index === 0 ? 'visible' : 'hidden' }}
    >
      {block.lines.map((line) => (
        <span key={line} className="block text-center" aria-hidden="true">
          {Array.from(line).map((char, charIndex) => (
            <span
              key={`${line}-${charIndex}`}
              className="hero-char inline-block whitespace-pre will-change-[opacity]"
              style={{ color: block.color, opacity: 0, transition: 'opacity 0.1s linear' }}
            >
              {char}
            </span>
          ))}
        </span>
      ))}
    </h2>
  )
}

export default function TerminalStyleHero() {
  const sectionRef = useRef(null)
  const canvasHostRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    const host = canvasHostRef.current
    if (!section || !host) return undefined

    const titles = Array.from(section.querySelectorAll('[data-hero-title]'))
    const charSets = titles.map((title) => Array.from(title.querySelectorAll('.hero-char')))
    const indicator = section.querySelector('[data-hero-indicator]')
    const wrapper = section.querySelector('[data-hero-sequence-wrapper]')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ── Canvas frame sequence ────────────────────────────────────────────────
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    const frames = buildFrames(isDesktop ? DESKTOP : MOBILE)
    const images = new Array(frames.length)
    const canvas = document.createElement('canvas')
    canvas.className = 'block h-full w-full'
    const ctx = canvas.getContext('2d')
    host.appendChild(canvas)

    let progress = 0
    let lastDrawn = -1

    const ready = (index) => {
      const image = images[index]
      return image && image.complete && image.naturalWidth ? image : null
    }

    /** Falls back to the closest loaded neighbour so the scrub never stalls mid-load. */
    const nearestReady = (target) => {
      for (let offset = 0; offset < frames.length; offset += 1) {
        const before = ready(target - offset)
        if (before) return { image: before, index: target - offset }
        const after = ready(target + offset)
        if (after) return { image: after, index: target + offset }
      }
      return null
    }

    const draw = (force = false) => {
      if (!ctx) return
      const target = Math.min(frames.length - 1, Math.max(0, Math.round(progress * (frames.length - 1))))
      const hit = nearestReady(target)
      if (!hit) return
      const { image, index } = hit
      if (index === lastDrawn && !force) return
      lastDrawn = index

      const boxWidth = host.offsetWidth
      const boxHeight = host.offsetHeight
      const scale = Math.max(boxWidth / image.naturalWidth, boxHeight / image.naturalHeight)
      const width = image.naturalWidth * scale
      const height = image.naturalHeight * scale
      ctx.clearRect(0, 0, boxWidth, boxHeight)
      ctx.drawImage(image, (boxWidth - width) / 2, (boxHeight - height) / 2, width, height)
    }

    const loadFrame = (index) =>
      new Promise((resolve) => {
        if (images[index]) return resolve()
        const image = new Image()
        image.decoding = 'async'
        image.onload = () => {
          images[index] = image
          resolve()
        }
        image.onerror = () => resolve()
        image.src = frames[index]
      })

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = host.offsetWidth * dpr
      canvas.height = host.offsetHeight * dpr
      canvas.style.width = `${host.offsetWidth}px`
      canvas.style.height = `${host.offsetHeight}px`
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(true)
    }

    let cancelled = false
    const loadAll = async () => {
      await loadFrame(0)
      draw(true)
      // Stagger the rest so the first paint is not blocked by 400+ requests.
      const batch = 8
      for (let start = 1; start < frames.length; start += batch) {
        if (cancelled) return
        await Promise.all(
          Array.from({ length: Math.min(batch, frames.length - start) }, (_, offset) => loadFrame(start + offset)),
        )
        draw(true)
        await new Promise((resolve) => setTimeout(resolve, 30))
      }
    }

    resize()
    loadAll()
    window.addEventListener('resize', resize)

    // ── Character reveal ─────────────────────────────────────────────────────
    const slice = 1 / TITLES.length
    const typeIn = 0.55
    const clearAt = 0.82

    const renderTitles = (value) => {
      titles.forEach((title, index) => {
        const local = (value - index * slice) / slice
        const isLast = index === TITLES.length - 1
        const active = local > -0.05 && (isLast ? true : local < 1.05)
        title.style.visibility = active ? 'visible' : 'hidden'
        if (!active) return

        const chars = charSets[index]
        const total = chars.length
        const fillHead = clamp01(local / typeIn) * total
        const clearHead = isLast ? 0 : clamp01((local - clearAt) / (1 - clearAt)) * total

        chars.forEach((char, charIndex) => {
          const filled = charIndex < fillHead
          const cleared = !isLast && charIndex < clearHead
          char.style.opacity = filled && !cleared ? '1' : '0'
        })
      })
    }

    if (reduced) {
      titles.forEach((title, index) => {
        title.style.visibility = index === TITLES.length - 1 ? 'visible' : 'hidden'
      })
      charSets[charSets.length - 1].forEach((char) => {
        char.style.opacity = '1'
      })
      if (indicator) indicator.style.opacity = '0'
      progress = 1
      draw(true)
    } else {
      renderTitles(0)
    }

    const ctxGsap = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          progress = clamp01(self.progress / SCRUB_END)
          draw()
          if (!reduced) renderTitles(progress)
        },
        onRefresh: (self) => {
          progress = clamp01(self.progress / SCRUB_END)
          draw(true)
          if (!reduced) renderTitles(progress)
        },
      })

      if (reduced) return

      if (indicator) {
        gsap.fromTo(
          indicator.querySelectorAll('.indicator-char'),
          { opacity: 0 },
          { opacity: 1, duration: 0.5, stagger: 0.03, ease: 'none', delay: 0.4 },
        )
        gsap.to(indicator, {
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: '+=30%', scrub: true },
        })
      }

      // Terminal pushes the sequence down as the section hands off to the next block.
      if (wrapper) {
        gsap.fromTo(
          wrapper,
          { yPercent: 0 },
          {
            yPercent: 50,
            ease: 'none',
            scrollTrigger: { trigger: section, start: 'bottom bottom', end: 'bottom top', scrub: true },
          },
        )
      }
    }, section)

    return () => {
      cancelled = true
      window.removeEventListener('resize', resize)
      ctxGsap.revert()
      images.forEach((image) => {
        if (image) image.src = ''
      })
      canvas.remove()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="video-carousel relative z-10 h-[400svh] overflow-clip bg-white"
      aria-label="AtondaFleet reinvents the future of logistics through the yard"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <div data-hero-sequence-wrapper className="absolute inset-0" aria-hidden="true">
          <div ref={canvasHostRef} className="h-full w-full" />
        </div>

        {/* Titles sit low in the frame, as on terminal-industries.com */}
        <div className="pointer-events-none relative z-[2] flex h-[100svh] items-end justify-center pb-[3.75rem] lg:pb-[8.4375rem]">
          <div className="relative flex w-full justify-center">
            {TITLES.map((block, index) => (
              <Title key={block.lines[0]} block={block} index={index} />
            ))}
          </div>
        </div>

        <div
          data-hero-indicator
          className="pointer-events-none absolute inset-x-0 top-[22%] z-[3] flex justify-center font-mono text-[11px] uppercase tracking-[0.18em] lg:left-[18%] lg:right-auto lg:top-[20%]"
        >
          <p aria-label={INDICATOR}>
            {Array.from(INDICATOR).map((char, index) => {
              const shade = Math.round(120 + (index / INDICATOR.length) * 90)
              return (
                <span
                  key={`ind-${index}`}
                  className="indicator-char inline-block whitespace-pre"
                  aria-hidden="true"
                  style={{ color: `rgb(${shade},${shade},${shade})`, opacity: 0 }}
                >
                  {char}
                </span>
              )
            })}
          </p>
        </div>
      </div>
    </section>
  )
}
