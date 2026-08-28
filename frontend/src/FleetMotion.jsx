import { useEffect, useRef, useState } from 'react'

// ─── Animated fleet route: trucks loop origin → transit → delivery → reload ──
const PHASES = [
  { max: 0.08, label: 'Loading cargo', tone: 'active' },
  { max: 0.82, label: 'In transit', tone: 'active' },
  { max: 0.95, label: 'Delivering', tone: 'done' },
  { max: 1.001, label: 'Reloaded \u2713', tone: 'done' },
]

function phaseFor(t) {
  return PHASES.find((p) => t <= p.max) ?? PHASES[PHASES.length - 1]
}

const FLEET_TRUCKS = [
  { id: 'ATD-101', cargo: 'Refrigerated produce', speed: 0.000085, offset: 0 },
  { id: 'ATD-108', cargo: 'Palletized freight', speed: 0.000065, offset: 0.3 },
  { id: 'ATD-104', cargo: 'Auto parts', speed: 0.000105, offset: 0.56 },
  { id: 'ATD-112', cargo: 'Construction materials', speed: 0.000075, offset: 0.8 },
]

function FleetTruckToken({ truck }) {
  const wrapRef = useRef(null)
  const labelRef = useRef(null)
  const dotRef = useRef(null)

  useEffect(() => {
    let raf
    let last = performance.now()
    let t = truck.offset

    function tick(now) {
      const dt = now - last
      last = now
      t += truck.speed * dt
      if (t > 1) t -= 1
      const phase = phaseFor(t)
      const wrap = wrapRef.current
      if (wrap) {
        wrap.style.left = `${4 + t * 92}%`
        wrap.style.transform = `translateY(calc(-50% + ${Math.sin(t * Math.PI * 8) * 6}px))`
      }
      if (labelRef.current && labelRef.current.dataset.phase !== phase.label) {
        labelRef.current.dataset.phase = phase.label
        labelRef.current.textContent = phase.label
      }
      if (dotRef.current) dotRef.current.className = `fleet-token-dot ${phase.tone}`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [truck])

  return (
    <div className="fleet-token" ref={wrapRef}>
      <div className="fleet-token-card tilt-card" data-cursor-hover>
        <strong>{truck.id}</strong>
        <span ref={labelRef} className="fleet-token-phase">Loading cargo</span>
        <em>{truck.cargo}</em>
      </div>
      <span className="fleet-token-dot active" ref={dotRef} />
    </div>
  )
}

export function FleetMotionBoard() {
  return (
    <div className="fleet-motion-board" data-reveal="scale">
      <div className="fleet-motion-hub start">
        <span className="fleet-hub-dot" />
        <div>
          <strong>Newark, NJ</strong>
          <small>Origin hub</small>
        </div>
      </div>
      <div className="fleet-motion-track">
        <div className="fleet-motion-line" />
        {FLEET_TRUCKS.map((truck) => (
          <FleetTruckToken key={truck.id} truck={truck} />
        ))}
      </div>
      <div className="fleet-motion-hub end">
        <div>
          <strong>Boston, MA</strong>
          <small>Delivery hub</small>
        </div>
        <span className="fleet-hub-dot" />
      </div>
    </div>
  )
}

// ─── Live data strip: count-up on reveal + slow simulated ticking ────────────
const STATS_SEED = [
  { key: 'trucks', label: 'Active trucks on the road', value: 1284, suffix: '', step: 1 },
  { key: 'deliveries', label: 'Deliveries completed today', value: 342, suffix: '', step: 1 },
  { key: 'onTime', label: 'On-time delivery rate', value: 98.7, suffix: '%', step: 0 },
  { key: 'miles', label: 'Miles covered today', value: 128460, suffix: '', step: 40 },
]

function formatStat(n, suffix) {
  if (suffix === '%') return n.toFixed(1) + '%'
  return Math.round(n).toLocaleString('en-US')
}

function useCountUp(target, active, duration = 1400) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) { setValue(0); return undefined }
    let raf
    const start = performance.now()
    const from = 0
    function tick(now) {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - p) ** 3
      setValue(from + (target - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
  return active ? target : value
}

function StatCounter({ label, target, suffix, active }) {
  const value = useCountUp(target, active)
  return (
    <div className="live-stat-card tilt-card" data-reveal>
      <span className="live-stat-pulse" />
      <strong>{formatStat(value, suffix)}</strong>
      <small>{label}</small>
    </div>
  )
}

export function LiveStatsStrip() {
  const ref = useRef(null)
  const [active, setActive] = useState(false)
  const [live, setLive] = useState(STATS_SEED.map((s) => s.value))

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setActive(true)
        obs.disconnect()
      }
    }, { threshold: 0.35 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!active) return undefined
    const id = setInterval(() => {
      setLive((prev) => prev.map((v, i) => {
        if (STATS_SEED[i].suffix === '%') {
          return Math.min(99.9, Math.max(96.5, v + (Math.random() - 0.45) * 0.15))
        }
        return v + Math.round(Math.random() * STATS_SEED[i].step)
      }))
    }, 2600)
    return () => clearInterval(id)
  }, [active])

  return (
    <div className="live-stats-strip" ref={ref}>
      {STATS_SEED.map((s, i) => (
        <StatCounter key={s.key} label={s.label} target={live[i]} suffix={s.suffix} active={active} />
      ))}
    </div>
  )
}
