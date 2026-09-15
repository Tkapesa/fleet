import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

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

const DOT_TONE = {
  active: 'absolute left-1/2 top-full mt-1.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_0_4px_rgba(255,75,43,0.25)]',
  done: 'absolute left-1/2 top-full mt-1.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-green shadow-[0_0_0_4px_rgba(51,209,122,0.25)]',
}

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
      if (dotRef.current) dotRef.current.className = DOT_TONE[phase.tone] ?? DOT_TONE.active
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [truck])

  return (
    <div className="absolute top-1/2 z-10 -translate-x-1/2" ref={wrapRef} style={{ left: '4%' }}>
      <div className="min-w-[120px] rounded-lg border border-border bg-card/95 px-3 py-2 text-center shadow-float backdrop-blur-sm">
        <strong className="block font-head text-[11px] font-bold tracking-wide text-ink">{truck.id}</strong>
        <span ref={labelRef} className="mt-0.5 block font-head text-[10px] font-semibold uppercase tracking-wider text-accent">Loading cargo</span>
        <em className="mt-0.5 block text-[10px] not-italic text-muted">{truck.cargo}</em>
      </div>
      <span className={DOT_TONE.active} ref={dotRef} />
    </div>
  )
}

export function FleetMotionBoard() {
  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card/80 to-dark/80 p-6 shadow-card md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-3 w-3 rounded-full bg-green animate-[hub-pulse_1.8s_ease-out_infinite]" />
        <div>
          <strong className="block font-head text-sm font-semibold text-ink">Newark, NJ</strong>
          <small className="text-[11px] uppercase tracking-wider text-muted">Origin hub</small>
        </div>
      </div>
      <div className="relative mx-2 h-24 md:mx-8">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-green via-accent to-green opacity-70" />
        {FLEET_TRUCKS.map((truck) => (
          <FleetTruckToken key={truck.id} truck={truck} />
        ))}
      </div>
      <div className="mt-6 flex flex-row-reverse items-center gap-3 text-right">
        <span className="h-3 w-3 rounded-full bg-green animate-[hub-pulse_1.8s_ease-out_infinite]" />
        <div>
          <strong className="block font-head text-sm font-semibold text-ink">Boston, MA</strong>
          <small className="text-[11px] uppercase tracking-wider text-muted">Delivery hub</small>
        </div>
      </div>
    </div>
  )
}

const GPS_ROUTE = [
  [40.7128, -74.006],
  [40.595, -74.16],
  [40.462, -74.33],
  [40.35, -74.46],
  [40.217, -74.63],
]

function GpsTrackingPanel() {
  const mapRef = useRef(null)

  useEffect(() => {
    const element = mapRef.current
    if (!element) return undefined

    const map = L.map(element, {
      attributionControl: true,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      keyboard: false,
      zoomAnimation: false,
      fadeAnimation: false,
    }).setView([40.47, -74.33], 10)

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 16,
    }).addTo(map)

    L.polyline(GPS_ROUTE, {
      color: '#ff5a1f',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map)

    L.circle([40.217, -74.63], {
      radius: 4200,
      color: '#f7dc04',
      weight: 2,
      fillColor: '#f7dc04',
      fillOpacity: 0.08,
    }).addTo(map)

    const truck = L.circleMarker(GPS_ROUTE[1], {
      radius: 9,
      color: '#ffffff',
      weight: 2,
      fillColor: '#ff5a1f',
      fillOpacity: 1,
    }).addTo(map)

    let progress = 0.17
    const interval = window.setInterval(() => {
      progress = progress >= 0.79 ? 0.17 : progress + 0.006
      const segment = Math.min(GPS_ROUTE.length - 2, Math.floor(progress * (GPS_ROUTE.length - 1)))
      const localProgress = (progress * (GPS_ROUTE.length - 1)) - segment
      const [startLat, startLng] = GPS_ROUTE[segment]
      const [endLat, endLng] = GPS_ROUTE[segment + 1]
      truck.setLatLng([
        startLat + (endLat - startLat) * localProgress,
        startLng + (endLng - startLng) * localProgress,
      ])
    }, 80)

    const resizeObserver = new ResizeObserver(() => map.invalidateSize())
    resizeObserver.observe(element)
    return () => {
      window.clearInterval(interval)
      resizeObserver.disconnect()
      map.remove()
    }
  }, [])

  return (
    <section
      className="mt-6 grid overflow-hidden rounded-lg border border-border bg-[#10161f] text-ink shadow-card md:grid-cols-[minmax(280px,0.82fr)_minmax(320px,1.18fr)]"
      aria-labelledby="gps-tracking-title"
    >
      <div className="flex flex-col justify-center p-8 md:p-12">
        <span className="flex items-center gap-2 font-head text-[11px] font-bold uppercase tracking-[0.12em] text-accent-hot">
          <i className="inline-block h-2 w-2 rounded-full bg-green shadow-[0_0_0_5px_rgba(82,208,135,0.13)]" />
          Live GPS tracking
        </span>
        <h3 id="gps-tracking-title" className="mt-4 font-head text-[clamp(27px,3vw,41px)] font-semibold leading-tight text-ink">
          Every route has a live position.
        </h3>
        <p className="mt-3 max-w-[37ch] text-body">
          Follow each truck from dispatch through delivery with location, route progress, and destination status in one clear view.
        </p>
        <dl className="my-7 flex gap-6">
          <div>
            <dt className="font-head text-[9px] font-bold tracking-wider text-muted">VEHICLE</dt>
            <dd className="mt-1 font-head text-base font-bold text-ink">ATD-1048</dd>
          </div>
          <div>
            <dt className="font-head text-[9px] font-bold tracking-wider text-muted">SPEED</dt>
            <dd className="mt-1 font-head text-base font-bold text-ink">64 mph</dd>
          </div>
          <div>
            <dt className="font-head text-[9px] font-bold tracking-wider text-muted">ETA</dt>
            <dd className="mt-1 font-head text-base font-bold text-ink">1h 42m</dd>
          </div>
        </dl>
        <div className="flex items-center justify-between gap-2 border-t border-border pt-4 font-head text-[11px] font-semibold text-body">
          <span>Newark, NJ</span>
          <b className="font-bold uppercase tracking-wider text-green">In transit</b>
          <span>Trenton, NJ</span>
        </div>
      </div>
      <div className="relative min-h-[370px] border-t border-border md:border-l md:border-t-0">
        <div ref={mapRef} className="h-full min-h-[370px] w-full" aria-label="Live route map from Newark to Trenton" />
        <div className="absolute right-4 top-4 z-[500] flex items-center gap-2 border border-border bg-dark/90 px-2.5 py-2 font-head text-[10px] font-bold tracking-wide text-ink">
          <i className="inline-block h-2 w-2 rounded-full bg-green shadow-[0_0_0_5px_rgba(82,208,135,0.13)]" />
          ATD-1048 reporting live
        </div>
      </div>
    </section>
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
    // intentional: count-up fires once when section enters viewport
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
  return value
}

function StatCounter({ label, target, suffix, active }) {
  const value = useCountUp(target, active)
  return (
    <div className="relative flex min-h-[100px] flex-col justify-center rounded-2xl border border-border bg-gradient-to-br from-card/70 to-dark/60 px-5 py-4 shadow-card backdrop-blur-sm">
      <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-green animate-[hub-pulse_1.8s_ease-out_infinite]" />
      <strong className="font-head text-2xl font-bold tracking-tight text-ink md:text-3xl">{formatStat(value, suffix)}</strong>
      <small className="mt-1 text-xs text-muted">{label}</small>
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
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" ref={ref}>
      {STATS_SEED.map((s, i) => (
        <StatCounter key={s.key} label={s.label} target={live[i]} suffix={s.suffix} active={active} />
      ))}
    </div>
  )
}

export { GpsTrackingPanel }
