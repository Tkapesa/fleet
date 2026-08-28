import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import TruckScene from './Truck3D'
import { FleetMotionBoard, LiveStatsStrip } from './FleetMotion'
import './App.css'

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://fleet-api-tkapesa.onrender.com'
const GOOGLE_MAPS_EMBED_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY ?? ''
const NEW_JERSEY_CENTER = { lat: 40.0583, lng: -74.4057 }
const NEW_JERSEY_DEFAULT_ZOOM = 8

const RESOURCE_CONFIG = [
  {
    key: 'trucks',
    label: 'Trucks',
    path: '/trucks/',
    template: { license_plate: 'AB-1234', make: 'Volvo', model: 'FH16', year: 2021, capacity_tons: 24, latitude: 40.7357, longitude: -74.1724 },
  },
  {
    key: 'drivers',
    label: 'Drivers',
    path: '/drivers/',
    template: {
      full_name: 'Alex Driver',
      email: 'alex.driver@example.com',
      phone: '+1-555-0100',
      license_number: 'D1234567',
      license_class: 'C',
      license_state: 'NJ',
      license_issue_date: '2024-01-10',
      license_expiry: '2030-12-31',
      date_of_birth: '1992-04-18',
      address: '123 Fleet Ave, Newark, NJ',
      emergency_contact_name: 'Sam Driver',
      emergency_contact_phone: '+1-555-0101',
      notes: 'Prefers regional routes',
      assigned_truck_id: null,
    },
  },
  {
    key: 'trips',
    label: 'Trips',
    path: '/trips/',
    template: { truck_id: 1, driver_id: 1, origin: 'Dallas, TX', destination: 'Phoenix, AZ', cargo_description: 'Construction materials', cargo_weight_tons: 8, scheduled_departure: '2026-07-20T09:00:00', notes: 'Deliver before noon if possible' },
  },
  {
    key: 'routes',
    label: 'Routes',
    path: '/routes/',
    template: { reference: 'RT-3006', origin: 'Newark, NJ', destination: 'Boston, MA', truck_id: 1, driver_id: 1, cargo_description: 'Refrigerated produce', scheduled_departure: '2026-08-21T07:30:00', estimated_arrival: '2026-08-21T15:45:00', distance_miles: 392, notes: '' },
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    path: '/maintenance-services/',
    template: { truck_id: 1, service_date: '2026-07-01T10:00:00', service_type: 'Oil Change', vendor: 'RoadPro Garage', mileage_km: 152300, cost: 420.5, notes: 'Replaced filters' },
  },
  {
    key: 'ifta',
    label: 'IFTA',
    path: '/ifta/',
    template: { truck_id: 1, period_start: '2026-04-01', period_end: '2026-06-30', jurisdiction: 'TX', miles_driven: 3500, gallons_purchased: 500, tax_rate_per_gallon: 0.2, fleet_mpg: 7 },
  },
]

const DEFAULT_REGISTER = { email: '', full_name: '', password: '', account_type: 'individual', company_name: '' }
const DEFAULT_LOGIN = { email: '', password: '' }
const DUMMY_LOGIN = { email: 'demo@truckappdemo.com', password: 'Demo123!' }
const DEFAULT_RESOURCE_STATE = { items: [], loading: false, error: '' }

const FLEET_VIEW_DEMO_SEEDS = [
  { id: 101, plate: 'ATD-101', make: 'Volvo', model: 'FH16', heightM: 4.05, lengthM: 18.5, baseLat: 40.7128, baseLng: -74.0060, baseSpeed: 64, variance: 8 },
  { id: 102, plate: 'ATD-102', make: 'Freightliner', model: 'Cascadia', heightM: 4.18, lengthM: 20.0, baseLat: 39.9526, baseLng: -75.1652, baseSpeed: 58, variance: 11 },
  { id: 103, plate: 'ATD-103', make: 'Kenworth', model: 'T680', heightM: 4.25, lengthM: 21.5, baseLat: 38.9072, baseLng: -77.0369, baseSpeed: 71, variance: 7 },
  { id: 104, plate: 'ATD-104', make: 'Peterbilt', model: '579', heightM: 4.32, lengthM: 22.0, baseLat: 35.2271, baseLng: -80.8431, baseSpeed: 52, variance: 9 },
  { id: 105, plate: 'ATD-105', make: 'Mack', model: 'Anthem', heightM: 4.10, lengthM: 19.0, baseLat: 33.4484, baseLng: -112.0740, baseSpeed: 67, variance: 12 },
  { id: 106, plate: 'ATD-106', make: 'International', model: 'LT', heightM: 4.38, lengthM: 23.0, baseLat: 32.7767, baseLng: -96.7970, baseSpeed: 45, variance: 6 },
  { id: 107, plate: 'ATD-107', make: 'Volvo', model: 'VNL', heightM: 4.00, lengthM: 18.0, baseLat: 29.7604, baseLng: -95.3698, baseSpeed: 0, variance: 0, stopped: true, stopReason: 'Rest stop' },
  { id: 108, plate: 'ATD-108', make: 'Freightliner', model: 'Cascadia', heightM: 4.24, lengthM: 21.0, baseLat: 39.7392, baseLng: -104.9903, baseSpeed: 76, variance: 10 },
  { id: 109, plate: 'ATD-109', make: 'Kenworth', model: 'T680', heightM: 4.45, lengthM: 24.0, baseLat: 47.6062, baseLng: -122.3321, baseSpeed: 0, variance: 0, stopped: true, stopReason: 'Loading' },
  { id: 110, plate: 'ATD-110', make: 'Peterbilt', model: '579', heightM: 4.16, lengthM: 20.5, baseLat: 34.0522, baseLng: -118.2437, baseSpeed: 61, variance: 13 },
  { id: 111, plate: 'ATD-111', make: 'Volvo', model: 'VNL', heightM: 3.60, lengthM: 21.0, baseLat: 40.2732, baseLng: -76.8867, baseSpeed: 59, variance: 9 },
]

const ROUTE_SUGGESTIONS = [
  { name: 'I-95 Northeast Corridor', clearanceM: 4.57, maxLengthM: 25, distanceKm: 420, detail: 'Mainline route with standard truck clearances.' },
  { name: 'I-81 Freight Corridor', clearanceM: 4.42, maxLengthM: 25, distanceKm: 510, detail: 'Good heavy-freight option with fewer urban restrictions.' },
  { name: 'US-40 Commercial Route', clearanceM: 4.27, maxLengthM: 22, distanceKm: 465, detail: 'Suitable for standard combinations; check local delivery windows.' },
  { name: 'State Route 17 Alternate', clearanceM: 4.05, maxLengthM: 20, distanceKm: 390, detail: 'Shorter alternate with tighter bridge and length limits.' },
]

const DEMO_ROUTES = [
  { id: 3001, reference: 'RT-3001', status: 'In Transit', origin: 'Newark, NJ', destination: 'Boston, MA', departure: 'Aug 20, 07:30', eta: 'Aug 20, 15:45', distance: '392 mi', truck: 'ATD-101', driver: 'Jordan Lee', cargo: 'Refrigerated produce' },
  { id: 3002, reference: 'RT-3002', status: 'Scheduled', origin: 'Philadelphia, PA', destination: 'Richmond, VA', departure: 'Aug 21, 06:00', eta: 'Aug 21, 12:30', distance: '250 mi', truck: 'ATD-102', driver: 'Morgan Diaz', cargo: 'Building materials' },
  { id: 3003, reference: 'RT-3003', status: 'Delayed', origin: 'Baltimore, MD', destination: 'Charlotte, NC', departure: 'Aug 20, 05:15', eta: 'Aug 20, 19:20', distance: '410 mi', truck: 'ATD-104', driver: 'Casey Brooks', cargo: 'Automotive parts' },
  { id: 3004, reference: 'RT-3004', status: 'Completed', origin: 'Albany, NY', destination: 'Newark, NJ', departure: 'Aug 19, 08:00', eta: 'Aug 19, 13:10', distance: '170 mi', truck: 'ATD-103', driver: 'Taylor Reed', cargo: 'Packaged goods' },
  { id: 3005, reference: 'RT-3005', status: 'Scheduled', origin: 'Pittsburgh, PA', destination: 'Columbus, OH', departure: 'Aug 22, 09:00', eta: 'Aug 22, 12:45', distance: '185 mi', truck: 'ATD-105', driver: 'Riley Morgan', cargo: 'Industrial equipment' },
]

const FLEET_VIEW_DEMO_DRIVERS = FLEET_VIEW_DEMO_SEEDS.map((truck, index) => ({
  id: 201 + index,
  full_name: ['Jordan Lee', 'Morgan Diaz', 'Taylor Reed', 'Casey Brooks', 'Riley Morgan', 'Avery Smith', 'Cameron Hall', 'Drew Wilson', 'Quinn Davis', 'Parker Clark', 'Jamie Foster'][index],
  assigned_truck_id: truck.id,
}))

const STANDARD_RAIL_ITEMS = [
  { key: 'fleet-view', icon: 'FL', title: 'Fleet View', to: '/portal' },
  { key: 'fleet-manager', icon: 'FM', title: 'Fleet Manager', to: '/fleet-manager' },
  { key: 'drivers', icon: 'DR', title: 'Drivers', to: '/drivers' },
  { key: 'vehicles', icon: 'VH', title: 'Vehicles', to: '/vehicles' },
  { key: 'history', icon: 'HS', title: 'History', to: '/history' },
  { key: 'safety', icon: 'SF', title: 'Safety', to: '/safety' },
  { key: 'alerts', icon: 'AL', title: 'Alerts', to: '/alerts' },
  { key: 'cameras', icon: 'CM', title: 'Cameras', to: '/cameras' },
  { key: 'routes', icon: 'RT', title: 'Routes', to: '/routes' },
  { key: 'support', icon: 'SP', title: 'Support', to: '/fleet' },
]

function isRailRouteActive(currentPath, targetPath) {
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}

function buildHeaders(token, withJson = true) {
  const h = {}
  if (withJson) h['Content-Type'] = 'application/json'
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(token, body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  const payload = await res.json().catch(() => null)
  if (!res.ok) {
    const error = new Error(payload?.detail ?? `Request failed ${res.status}`)
    error.status = res.status
    throw error
  }
  return payload
}

function buildTruckLocation(truck, index, tick) {
  const rawLat = Number(truck.latitude ?? truck.lat)
  const rawLng = Number(truck.longitude ?? truck.lng ?? truck.lon)

  if (Number.isFinite(rawLat) && Number.isFinite(rawLng)) {
    return { lat: rawLat, lng: rawLng, simulated: false }
  }

  const seed = Number(truck.id ?? index + 1)
  const baseLat = NEW_JERSEY_CENTER.lat + ((seed % 9) - 4) * 0.05
  const baseLng = NEW_JERSEY_CENTER.lng + ((seed % 11) - 5) * 0.05
  const drift = tick / 4
  return {
    lat: baseLat + Math.sin(drift + seed) * 0.01,
    lng: baseLng + Math.cos(drift + seed * 1.7) * 0.01,
    simulated: true,
  }
}

function distanceInKm(pointA, pointB) {
  const earthRadiusKm = 6371
  const latDelta = (pointB.lat - pointA.lat) * Math.PI / 180
  const lngDelta = (pointB.lng - pointA.lng) * Math.PI / 180
  const latA = pointA.lat * Math.PI / 180
  const latB = pointB.lat * Math.PI / 180
  const haversine = Math.sin(latDelta / 2) ** 2
    + Math.sin(lngDelta / 2) ** 2 * Math.cos(latA) * Math.cos(latB)
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function metersToFeet(value) {
  return Number(value) * 3.28084
}

function formatDaysUntilExpiry(days) {
  if (days === null || days === undefined) return 'Unknown'
  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return 'Expires today'
  return `${days} days left`
}

function humanizeLicenseStatus(status) {
  if (status === 'expired') return 'Expired'
  if (status === 'expiring_soon') return 'Expiring Soon'
  if (status === 'valid') return 'Valid'
  return 'Unknown'
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function LogoIcon() {
  return (
    <svg width="50" height="42" viewBox="0 0 50 42" fill="none" aria-hidden="true">
      <path d="M0 21L18 0V42Z" fill="#E03000" />
      <path d="M18 0L36 21L18 42Z" fill="#F07B0F" />
      <path d="M32 0L50 21L32 42Z" fill="#F7DC04" />
    </svg>
  )
}

function GpsIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
    </svg>
  )
}

function EldIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function DvirIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="13" y2="15" />
    </svg>
  )
}

function IftaIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function EyebrowRow({ label = 'ATONDA' }) {
  return (
    <div className="eyebrow-row">
      <span className="eyebrow-bar" />
      <span className="eyebrow-label">{label}</span>
    </div>
  )
}

function FeatureOrbitItem({ number, icon, title, desc, align = 'left' }) {
  return (
    <div className={`orbit-item ${align}`} data-reveal>
      <div className={`orbit-num-row ${align}`}>
        <span className="orbit-num">{number}</span>
        <span className="orbit-num-line" />
      </div>
      <div className="orbit-icon-box tilt-card">{icon}</div>
      <h4 className="orbit-title">{title}</h4>
      <p className="orbit-desc">{desc}</p>
    </div>
  )
}

function BenefitCard({ title, desc }) {
  return (
    <div className="benefit-card tilt-card" data-reveal>
      <div className="benefit-check">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div>
        <h4 className="benefit-title">{title}</h4>
        <p className="benefit-desc">{desc}</p>
      </div>
    </div>
  )
}

function ComplianceStatusPill({ label, status }) {
  return (
    <span className={`fleet-pill ${status}`}>
      {label}
    </span>
  )
}

// ─── Cinematic microinteraction helpers ──────────────────────────────────────
function CursorDot() {
  const dotRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia?.('(hover: none), (pointer: coarse)').matches) return undefined
    const el = dotRef.current
    if (!el) return undefined

    function onMove(e) {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`
    }
    function onOver(e) {
      const hoverable = e.target.closest('a, button, [data-cursor-hover]')
      el.classList.toggle('cursor-hover', Boolean(hoverable))
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
    }
  }, [])

  return <div className="cursor-dot" ref={dotRef} aria-hidden="true" />
}

function useScrollReveal(deps = []) {
  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.16 },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

function useMagnetic(ref, strength = 0.35) {
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    function onMove(e) {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - (rect.left + rect.width / 2)
      const y = e.clientY - (rect.top + rect.height / 2)
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`
    }
    function onLeave() {
      el.style.transform = 'translate(0, 0)'
    }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [ref, strength])
}

function MagneticLink({ className = '', children, ...props }) {
  const ref = useRef(null)
  useMagnetic(ref)
  return (
    <a ref={ref} className={`magnetic-btn ${className}`} {...props}>
      {children}
    </a>
  )
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function Landing({ token }) {
  const [menuOpen, setMenuOpen] = useState(false)
  useScrollReveal()
  const [testimonialIdx, setTestimonialIdx] = useState(0)
  const [contactData, setContactData] = useState({
    name: '', company: '', phone: '', email: '', reason: 'demo', fleetSize: '1-4', message: '',
  })

  const testimonials = [
    { quote: 'Our platform is great! The system is straightforward, and their customer support is unbeatable!', author: 'Sarah K.', role: 'Fleet Manager' },
    { quote: 'My logs are always accurate, inspections are stress-free, and I feel more confident on the road.', author: 'Mike L.', role: 'Owner-operator' },
  ]

  function closeMenu() { setMenuOpen(false) }
  function setField(key) { return (e) => setContactData((d) => ({ ...d, [key]: e.target.value })) }

  return (
    <div className="site-wrap">
      <CursorDot />
      {/* NAV */}
      <header className="site-header" id="top">
        <div className="hdr-inner">
          <a href="#top" className="site-logo">
            <LogoIcon />
            <span className="logo-text">ATONDA</span>
          </a>
          <nav className={`main-nav${menuOpen ? ' nav-open' : ''}`}>
            <a href="#about" onClick={closeMenu}>About</a>
            <a href="#features" onClick={closeMenu}>Features</a>
            <Link to="/fleet" onClick={closeMenu}>Fleet Compliance</Link>
            <a href="#testimonials" onClick={closeMenu}>Testimonials</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
            <span className="nav-sep" />
            <Link to={token ? '/portal' : '/login'} className="nav-login-btn" onClick={closeMenu}>
              {token ? 'Portal' : 'Login'}
            </Link>
            <span className="nav-sep" />
            <div className="header-languages" aria-label="Language selector">
              <a href="#" lang="en" onClick={(e) => e.preventDefault()}>EN</a>
              <a href="#" lang="ru" onClick={(e) => e.preventDefault()}>RU</a>
              <a href="#" lang="uk" onClick={(e) => e.preventDefault()}>UA</a>
            </div>
          </nav>
          <button
            className={`ham-btn${menuOpen ? ' ham-open' : ''}`}
            onClick={() => setMenuOpen((m) => !m)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-decor-1" />
        <div className="hero-decor-2" />
        <div className="hero-inner">
          <div className="hero-body">
            <div className="hero-content-card" data-reveal="scale">
              <EyebrowRow />
              <h2 className="hero-h2">Keep your fleet on solid ground</h2>
              <h5 className="hero-h5">Your partner in compliance, safety, and efficiency.</h5>
              <div className="hero-actions">
                <MagneticLink href="#contact" className="btn-yellow">Request a demo</MagneticLink>
              </div>
            </div>
            <div className="hero-call-card" data-reveal style={{ '--reveal-delay': '.15s' }}>
              <p>Call and book an appointment</p>
              <a href="tel:7083232997" className="underline-link">(708) 323-2997</a>
            </div>
          </div>
          <div className="hero-truck-strip" data-reveal="scale" style={{ '--reveal-delay': '.1s' }}>
            <img
              className="hero-truck-photo"
              src="https://framerusercontent.com/images/18fcpAEnZV1tlSpjskrotWgKpE.jpg?width=812&height=450"
              alt="Fleet truck on the road"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* LIVE FLEET NETWORK */}
      <section className="light-sect fleet-motion-sect">
        <div className="sect-inner">
          <div className="fleet-motion-hdr" data-reveal>
            <EyebrowRow label="LIVE NETWORK" />
            <h2>Fleets in motion, coast to coast</h2>
            <p className="sect-sub">
              Every truck on the ATONDA network reports its status in real time — loading, in transit,
              delivering, and reloading for the next run.
            </p>
          </div>
          <FleetMotionBoard />
          <LiveStatsStrip />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="dark-sect features-orbit-section">
        <div className="sect-inner">
          <div className="features-orbit">
            <div className="orbit-col left">
              <FeatureOrbitItem
                number="01"
                icon={<GpsIcon />}
                title="GPS Tracking"
                desc="Monitor your fleet's live location, set up geofences, and view location history from a single dashboard."
                align="left"
              />
              <FeatureOrbitItem
                number="03"
                icon={<EldIcon />}
                title="ELD Compliance"
                desc="Automate hours-of-service tracking and stay fully compliant with ease."
                align="left"
              />
            </div>

            <div className="orbit-center">
            <div className="orbit-diamond orbit-diamond-a float-anim" />
              <TruckScene variant="orbit" className="orbit-truck-3d" />
            </div>

            <div className="orbit-col right">
              <FeatureOrbitItem
                number="02"
                icon={<DvirIcon />}
                title="Electronic DVIR"
                desc="Streamline pre-trip and post-trip inspections to save time and improve safety."
                align="right"
              />
              <FeatureOrbitItem
                number="04"
                icon={<IftaIcon />}
                title="IFTA Reporting"
                desc="Eliminate manual errors with precise, automated fuel tax reporting."
                align="right"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT CTA */}
      <section id="about" className="dark-sect about-cta-sect">
        <div className="sect-inner">
          <div className="about-cta-inner">
            <div className="about-cta-left" data-reveal>
              <EyebrowRow />
              <h2>Built for drivers, designed for success</h2>
              <p className="sect-sub">Our platform provides a powerful, easy-to-use solution to simplify fleet operations and ensure compliance.</p>
              <MagneticLink href="#contact" className="btn-yellow">Request a demo</MagneticLink>
            </div>
            <div className="about-cta-graphic">
              <div className="graphic-diamond diamond-lg" />
              <div className="graphic-diamond diamond-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="dark-sect">
        <div className="sect-inner">
          <div className="benefits-cols">
            <div className="benefits-col">
              <BenefitCard title="Paperless DVIRs" desc="Say goodbye to paperwork with our digital inspection reports." />
              <BenefitCard title="Stress-Free Setup" desc="Get started quickly with our easy installation process." />
              <BenefitCard title="24/7 Customer Support" desc="Count on expert assistance whenever you need it, day or night." />
            </div>
            <div className="benefits-col">
              <BenefitCard title="Accurate IFTA Reporting" desc="Simplify fuel tax reporting with precision and ease." />
              <BenefitCard title="No Long-Term Contracts" desc="Enjoy flexibility and freedom with contract-free solutions." />
              <BenefitCard title="User-Friendly App" desc="Manage your fleet effortlessly with our intuitive mobile app." />
            </div>
          </div>
        </div>
      </section>

      {/* STATS / WHY / PRODUCTS */}
      <section className="light-sect">
        <div className="sect-inner">
          <div className="why-grid">
            <div className="stat-block">
              <span className="stat-num">1300+</span>
              <p className="stat-label">Satisfied clients</p>
            </div>
            <div className="why-text">
              <p>
                <strong>Why choose ATONDA?</strong> Because it is built to keep your fleet rolling smoothly, no
                matter how tough the journey gets. Designed for reliable performance, it is your steadfast companion on
                the road, ensuring compliance and efficiency every step of the way.
              </p>
              <p>
                With a driver-friendly design, our platform takes the stress out of technology, so your team can stay
                focused on what matters: the road ahead. And when questions arise, our 24/7 support team is always
                ready to assist, ensuring you are never left stranded.
              </p>
            </div>
            <div className="products-block">
              <h4 className="products-title">Products That Stand SOLID</h4>
              <ul className="products-list">
                <li><span className="prod-dot" /><strong>ELD Devices</strong> — FMCSA-certified and fully compatible with all vehicle types.</li>
                <li><span className="prod-dot" /><strong>GPS Devices</strong> — Comprehensive fleet tracking with live updates and geofence capabilities.</li>
                <li><span className="prod-dot" /><strong>Dashcams</strong> — Enhance safety and accountability with high-quality dashcams for real-time recording.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="dark-sect test-sect">
        <div className="sect-inner">
          <div className="test-slider">
            {testimonials.map((t, i) => (
              <div key={i} className={`test-slide${i === testimonialIdx ? ' slide-active' : ''}`}>
                <div className="quote-mark">"</div>
                <blockquote className="test-quote">{t.quote}</blockquote>
                <div className="test-author">
                  <h5>{t.author}</h5>
                  <span className="test-role">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="test-dots">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`test-dot${i === testimonialIdx ? ' dot-active' : ''}`}
                onClick={() => setTestimonialIdx(i)}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="light-sect contact-sect">
        <div className="sect-inner">
          <h2 className="dark-h2">Contact us</h2>
          <p className="contact-sub">
            Our platform offers a powerful, easy-to-use solution designed to streamline fleet management and ensure full
            compliance with industry regulations. Ready to stay compliant and upgrade your fleet operations? Fill out the
            form below, and one of our specialists will reach out to you shortly.
          </p>
          <div className="contact-card">
            <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
              <input type="text" placeholder="Your Name" value={contactData.name} onChange={setField('name')} />
              <input type="text" placeholder="Company Name" value={contactData.company} onChange={setField('company')} />
              <input type="tel" placeholder="Phone number" value={contactData.phone} onChange={setField('phone')} />
              <input type="email" placeholder="Work email" value={contactData.email} onChange={setField('email')} />
              <div className="cf-select-wrap">
                <label className="cf-select-label">What is the reason for contacting us?</label>
                <div className="cf-select-box">
                  <select value={contactData.reason} onChange={setField('reason')}>
                    <option value="demo">Request a demo</option>
                    <option value="support">Customer support</option>
                    <option value="sales">Contact sales</option>
                    <option value="partnership">Partnership inquiry</option>
                    <option value="general">General inquiry</option>
                  </select>
                  <span className="cf-arrow">v</span>
                </div>
              </div>
              <div className="cf-select-wrap">
                <label className="cf-select-label">Please select your fleet size</label>
                <div className="cf-select-box">
                  <select value={contactData.fleetSize} onChange={setField('fleetSize')}>
                    <option>1-4</option><option>5-19</option><option>20-50</option>
                    <option>51-99</option><option>100+</option>
                  </select>
                  <span className="cf-arrow">v</span>
                </div>
              </div>
              <textarea placeholder="Please briefly describe your needs:" rows={5} value={contactData.message} onChange={setField('message')} />
              <button type="submit" className="btn-yellow btn-submit">Send message</button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="footer-cta-sect">
        <div className="sect-inner footer-cta-inner" data-reveal>
          <h3 className="footer-cta-h3">
            Ready to build a <em>rock-solid foundation</em> for your fleet? Reach out to us today!
          </h3>
          <MagneticLink href="#contact" className="btn-yellow">Request a demo</MagneticLink>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-contacts">
          <div className="footer-logo-wrap">
            <LogoIcon />
            <span className="footer-logo-text">ATONDA</span>
          </div>
          <div className="footer-contact-item">
            <span className="fc-label">Phone</span>
            <a href="tel:7083232997" className="fc-value">(708) 323-2997</a>
          </div>
          <div className="footer-contact-item">
            <span className="fc-label">E-mail</span>
            <a href="mailto:office@truckapp.us" className="fc-value">office@truckapp.us</a>
          </div>
        </div>
        <div className="footer-bottom">
          <a href="#top" className="back-top">&#8593;</a>
          <p>2026 ATONDA | All Rights Reserved</p>
        </div>
      </footer>
    </div>
  )
}

// ─── Fleet Compliance ────────────────────────────────────────────────────────
function FleetCompliance({ token, resources, refreshAllResources }) {
  const navigate = useNavigate()

  const trucks = resources.trucks?.items ?? []
  const drivers = resources.drivers?.items ?? []
  const maintenance = resources.maintenance?.items ?? []
  const ifta = resources.ifta?.items ?? []

  const now = new Date()
  const msPerDay = 24 * 60 * 60 * 1000

  const expiringDrivers = drivers.filter((driver) => {
    if (!driver.license_expiry) return false
    const expiry = new Date(driver.license_expiry)
    const diff = (expiry.getTime() - now.getTime()) / msPerDay
    return diff >= 0 && diff <= 30
  })

  const expiredDrivers = drivers.filter((driver) => {
    if (!driver.license_expiry) return false
    const expiry = new Date(driver.license_expiry)
    return expiry.getTime() < now.getTime()
  })

  const overdueMaintenance = maintenance.filter((entry) => {
    if (!entry.service_date) return false
    const serviceDate = new Date(entry.service_date)
    const diff = (now.getTime() - serviceDate.getTime()) / msPerDay
    return diff > 120
  })

  const totalRiskItems = expiredDrivers.length + expiringDrivers.length + overdueMaintenance.length

  const iftaCoverage = trucks.length === 0
    ? 0
    : Math.round((Math.min(ifta.length, trucks.length) / trucks.length) * 100)

  return (
    <div className="fleet-page-wrap">
      <header className="fleet-header">
        <div className="fleet-header-inner">
          <a href="/" className="portal-logo-link"><LogoIcon /><span>ATONDA</span></a>
          <div className="fleet-header-actions">
            <button className="p-btn" onClick={refreshAllResources} disabled={!token}>Sync Compliance Data</button>
            <button className="p-btn p-btn-sec" onClick={() => navigate('/portal')}>Back to Portal</button>
          </div>
        </div>
      </header>

      <main className="fleet-main">
        <section className="fleet-hero-card">
          <EyebrowRow label="FLEET COMPLIANCE" />
          <h1>Stay audit-ready with a clear compliance command center</h1>
          <p>
            Track driver license status, maintenance risk, and IFTA record coverage in one place.
            Designed with the same visual language as the rest of your ATONDA experience.
          </p>
        </section>

        <section className="fleet-kpi-grid">
          <article className="fleet-kpi-card">
            <p>Fleet Units</p>
            <strong>{trucks.length}</strong>
            <ComplianceStatusPill
              status={trucks.length > 0 ? 'ok' : 'warn'}
              label={trucks.length > 0 ? 'Active' : 'No vehicles'}
            />
          </article>

          <article className="fleet-kpi-card">
            <p>Driver Licensing</p>
            <strong>{drivers.length}</strong>
            <ComplianceStatusPill
              status={expiredDrivers.length === 0 ? 'ok' : 'risk'}
              label={expiredDrivers.length === 0 ? 'Valid' : `${expiredDrivers.length} expired`}
            />
          </article>

          <article className="fleet-kpi-card">
            <p>IFTA Record Coverage</p>
            <strong>{iftaCoverage}%</strong>
            <ComplianceStatusPill
              status={iftaCoverage >= 80 ? 'ok' : 'warn'}
              label={iftaCoverage >= 80 ? 'Healthy' : 'Needs attention'}
            />
          </article>

          <article className="fleet-kpi-card">
            <p>Open Risks</p>
            <strong>{totalRiskItems}</strong>
            <ComplianceStatusPill
              status={totalRiskItems === 0 ? 'ok' : 'risk'}
              label={totalRiskItems === 0 ? 'No blockers' : 'Action required'}
            />
          </article>
        </section>

        <section className="fleet-content-grid">
          <article className="compliance-list-card">
            <div className="fleet-card-head">
              <h3>Driver License Watchlist</h3>
              <button className="fleet-link-btn" onClick={() => navigate('/portal')}>Open Drivers</button>
            </div>
            <div className="fleet-list-wrap">
              {drivers.length === 0 && <p className="fleet-empty">No driver records yet.</p>}

              {expiredDrivers.map((driver) => (
                <div className="fleet-list-row" key={`expired-${driver.id}`}>
                  <div>
                    <strong>{driver.full_name ?? 'Unknown Driver'}</strong>
                    <p>{driver.license_number ?? 'No license number'}</p>
                  </div>
                  <ComplianceStatusPill status="risk" label="Expired" />
                </div>
              ))}

              {expiringDrivers.map((driver) => (
                <div className="fleet-list-row" key={`expiring-${driver.id}`}>
                  <div>
                    <strong>{driver.full_name ?? 'Unknown Driver'}</strong>
                    <p>Expires {driver.license_expiry}</p>
                  </div>
                  <ComplianceStatusPill status="warn" label="Expiring soon" />
                </div>
              ))}

              {expiredDrivers.length === 0 && expiringDrivers.length === 0 && drivers.length > 0 && (
                <p className="fleet-ok-line">All tracked licenses are currently in good standing.</p>
              )}
            </div>
          </article>

          <article className="compliance-list-card">
            <div className="fleet-card-head">
              <h3>Maintenance + IFTA Health</h3>
              <button className="fleet-link-btn" onClick={() => navigate('/portal')}>Open Records</button>
            </div>
            <div className="fleet-list-wrap">
              <div className="fleet-check-row">
                <span>Overdue maintenance items</span>
                <ComplianceStatusPill
                  status={overdueMaintenance.length === 0 ? 'ok' : 'risk'}
                  label={`${overdueMaintenance.length} open`}
                />
              </div>
              <div className="fleet-check-row">
                <span>IFTA records logged</span>
                <ComplianceStatusPill
                  status={ifta.length >= trucks.length && trucks.length > 0 ? 'ok' : 'warn'}
                  label={`${ifta.length} entries`}
                />
              </div>
              <div className="fleet-check-row">
                <span>Total maintenance logs</span>
                <ComplianceStatusPill status={maintenance.length > 0 ? 'ok' : 'warn'} label={`${maintenance.length} logs`} />
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

// ─── Vehicles Page ───────────────────────────────────────────────────────────
function VehiclesPage({ token, resources, refreshAllResources, handleLogout, fetchResource }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [queryFleet, setQueryFleet] = useState('')
  const [queryVin, setQueryVin] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assetType, setAssetType] = useState('vehicles')
  const [truckSaving, setTruckSaving] = useState(false)
  const [truckMessage, setTruckMessage] = useState('')
  const [truckForm, setTruckForm] = useState({
    license_plate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    capacity_tons: 20,
    height_m: '',
    length_m: '',
    latitude: '',
    longitude: '',
  })

  const truckResource = RESOURCE_CONFIG.find((r) => r.key === 'trucks')
  const driverResource = RESOURCE_CONFIG.find((r) => r.key === 'drivers')
  const trucks = resources.trucks?.items ?? []
  const drivers = resources.drivers?.items ?? []

  const driversByTruckId = useMemo(() => {
    const map = new Map()
    drivers.forEach((driver) => {
      if (driver.assigned_truck_id !== null && driver.assigned_truck_id !== undefined && !map.has(driver.assigned_truck_id)) {
        map.set(driver.assigned_truck_id, driver)
      }
    })
    return map
  }, [drivers])

  const railItems = STANDARD_RAIL_ITEMS

  useEffect(() => {
    if (!token || !truckResource || !driverResource) return
    fetchResource(truckResource)
    fetchResource(driverResource)
  }, [token, truckResource, driverResource, fetchResource])

  const vehicleRows = useMemo(() => {
    return trucks.map((truck, index) => {
      const seed = Number(truck.id ?? index + 1)
      const truckCode = String(truck.license_plate ?? `TRK-${seed}`).replace(/\s+/g, '').toUpperCase()
      const locationPoint = buildTruckLocation(truck, index, 0)
      const driver = driversByTruckId.get(truck.id)?.full_name ?? 'Unassigned'
      const status = truck.status === 'on_trip' || truck.status === 'active' ? 'active' : 'idle'

      return {
        id: seed,
        vehicleId: truckCode,
        driver,
        location: `${locationPoint.lat.toFixed(2)}, ${locationPoint.lng.toFixed(2)}`,
        vin: `VIN${String(seed).padStart(6, '0')}${truckCode.slice(0, 5)}`,
        eldSn: `87A${String(seed * 113).padStart(8, '0')}`,
        gpsSn: `GPS${String(seed * 89).padStart(9, '0')}`,
        tabletSn: `TAB${String(seed * 57).padStart(8, '0')}`,
        cameraSn: `CAM${String(seed * 41).padStart(8, '0')}`,
        engineHours: 17000 + seed * 17,
        odometer: 640000 + seed * 321,
        status,
      }
    })
  }, [trucks, driversByTruckId])

  const filteredRows = useMemo(() => {
    const fleetQuery = queryFleet.trim().toLowerCase()
    const vinQuery = queryVin.trim().toLowerCase()

    return vehicleRows.filter((row) => {
      const fleetMatch = !fleetQuery
        || `${row.vehicleId} ${row.driver} ${row.gpsSn} ${row.eldSn}`.toLowerCase().includes(fleetQuery)
      const vinMatch = !vinQuery || row.vin.toLowerCase().includes(vinQuery)
      const statusMatch = statusFilter === 'all' || row.status === statusFilter
      return fleetMatch && vinMatch && statusMatch
    })
  }, [vehicleRows, queryFleet, queryVin, statusFilter])

  const visibleRows = assetType === 'vehicles' ? filteredRows : []

  function exportRows() {
    const header = [
      'Vehicle ID', 'Driver', 'Location', 'VIN', 'ELD S/N', 'GPS S/N',
      'Tablet S/N', 'Camera S/N', 'Engine Hours', 'Odometer (mi)', 'Status',
    ]
    const lines = filteredRows.map((row) => [
      row.vehicleId,
      row.driver,
      row.location,
      row.vin,
      row.eldSn,
      row.gpsSn,
      row.tabletSn,
      row.cameraSn,
      row.engineHours,
      row.odometer,
      row.status,
    ].join(','))

    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'vehicles-export.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleRegisterTruck(e) {
    e.preventDefault()
    if (!token || !truckResource) return
    setTruckSaving(true)
    setTruckMessage('')
    try {
      const payload = {
        license_plate: truckForm.license_plate.trim(),
        make: truckForm.make.trim(),
        model: truckForm.model.trim(),
        year: Number(truckForm.year),
        capacity_tons: Number(truckForm.capacity_tons),
        height_m: truckForm.height_m === '' ? null : Number(truckForm.height_m),
        length_m: truckForm.length_m === '' ? null : Number(truckForm.length_m),
        latitude: truckForm.latitude === '' ? null : Number(truckForm.latitude),
        longitude: truckForm.longitude === '' ? null : Number(truckForm.longitude),
      }
      await apiRequest('/trucks/', { method: 'POST', token, body: payload })
      await fetchResource(truckResource)
      if (driverResource) await fetchResource(driverResource)
      setTruckMessage('Truck registered successfully.')
      setTruckForm({
        license_plate: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        capacity_tons: 20,
        height_m: '',
        length_m: '',
        latitude: '',
        longitude: '',
      })
    } catch (err) {
      setTruckMessage(err.message)
    } finally {
      setTruckSaving(false)
    }
  }

  return (
    <div className={`live-portal-wrap fleet-monitor-shell vehicles-shell ${railCollapsed ? 'rail-collapsed' : ''}`}>
      <aside className={`fleet-icon-rail ${railCollapsed ? 'collapsed' : ''}`}>
        <button type="button" className="fleet-rail-brand" aria-label="Home" onClick={() => navigate('/')}>
          <LogoIcon />
        </button>
        <button className="fleet-rail-toggle" onClick={() => setRailCollapsed((v) => !v)}>
          {railCollapsed ? '>' : '<'}
        </button>
        <div className="fleet-rail-items">
          {railItems.map((item) => {
            const isActive = Boolean(item.to) && isRailRouteActive(location.pathname, item.to)
            return (
              <button
                type="button"
                key={item.key}
                className={`fleet-rail-item ${isActive ? 'active' : ''}`}
                title={item.title}
                onClick={() => item.to && navigate(item.to)}
              >
                <span className="fleet-rail-icon">{item.icon}</span>
                {!railCollapsed && <span className="fleet-rail-label">{item.title}</span>}
              </button>
            )
          })}
        </div>
        <div className="fleet-rail-footer-actions">
          <button type="button" className="fleet-rail-ghost" onClick={() => navigate('/fleet')}>Compliance</button>
          <button className="fleet-rail-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <section className="vehicles-main-panel">
        <header className="vehicles-header">
          <div className="vehicles-title-wrap">
            <h1>{assetType === 'vehicles' ? `Vehicles (${visibleRows.length})` : 'Trailers (0)'}</h1>
          </div>
          <div className="vehicles-tenant-row">
            <button className="vehicles-chip">Liberte Trucking</button>
            <button className="vehicles-chip">All Groups</button>
            <button className="vehicles-icon-btn" aria-label="Add">+</button>
            <button className="vehicles-icon-btn" aria-label="Notifications">o</button>
            <span className="vehicles-user">Bourlaye Coulibaly</span>
          </div>
        </header>

        <div className="vehicles-filter-row">
          <input
            className="vehicles-search"
            placeholder="Search by Vehicle ID, ELD S/N or GPS S/N"
            value={queryFleet}
            onChange={(e) => setQueryFleet(e.target.value)}
          />
          <input
            className="vehicles-search"
            placeholder="Search by VIN"
            value={queryVin}
            onChange={(e) => setQueryVin(e.target.value)}
          />
          <select
            className="vehicles-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
          </select>

          <div className="vehicles-filter-actions">
            <button className="vehicles-action-btn" onClick={exportRows}>Export</button>
            <button className="vehicles-action-btn" onClick={() => truckResource && fetchResource(truckResource)} disabled={!token || !truckResource}>Refresh</button>
            <button className="vehicles-action-btn primary" onClick={refreshAllResources} disabled={!token}>Sync</button>
          </div>
        </div>

        <form className="drivers-form-card" onSubmit={handleRegisterTruck}>
          <h3>Register Truck</h3>
          <div className="drivers-form-grid">
            <input required placeholder="License plate" value={truckForm.license_plate} onChange={(e) => setTruckForm((f) => ({ ...f, license_plate: e.target.value }))} />
            <input required placeholder="Make" value={truckForm.make} onChange={(e) => setTruckForm((f) => ({ ...f, make: e.target.value }))} />
            <input required placeholder="Model" value={truckForm.model} onChange={(e) => setTruckForm((f) => ({ ...f, model: e.target.value }))} />
            <input required type="number" min="1980" max="2100" placeholder="Year" value={truckForm.year} onChange={(e) => setTruckForm((f) => ({ ...f, year: e.target.value }))} />
            <input required type="number" min="0" step="0.1" placeholder="Capacity tons" value={truckForm.capacity_tons} onChange={(e) => setTruckForm((f) => ({ ...f, capacity_tons: e.target.value }))} />
            <input type="number" min="0" step="0.01" placeholder="Height (m) optional" value={truckForm.height_m} onChange={(e) => setTruckForm((f) => ({ ...f, height_m: e.target.value }))} />
            <input type="number" min="0" step="0.01" placeholder="Length (m) optional" value={truckForm.length_m} onChange={(e) => setTruckForm((f) => ({ ...f, length_m: e.target.value }))} />
            <input type="number" step="0.000001" placeholder="Latitude optional" value={truckForm.latitude} onChange={(e) => setTruckForm((f) => ({ ...f, latitude: e.target.value }))} />
            <input type="number" step="0.000001" placeholder="Longitude optional" value={truckForm.longitude} onChange={(e) => setTruckForm((f) => ({ ...f, longitude: e.target.value }))} />
          </div>
          <div className="drivers-form-actions">
            <button type="submit" className="vehicles-action-btn primary" disabled={truckSaving}>{truckSaving ? 'Registering...' : 'Register Truck'}</button>
            {truckMessage && <p className="drivers-message">{truckMessage}</p>}
          </div>
        </form>

        <div className="vehicles-grid-wrap">
          <aside className="vehicles-type-card">
            <button type="button" className={assetType === 'vehicles' ? 'active' : ''} onClick={() => setAssetType('vehicles')}>Vehicles</button>
            <button type="button" className={assetType === 'trailers' ? 'active' : ''} onClick={() => setAssetType('trailers')}>Trailers</button>
          </aside>

          <div className="vehicles-table-wrap">
            <table className="vehicles-table">
              <thead>
                <tr>
                  <th>Vehicle ID</th>
                  <th>Drivers</th>
                  <th>Location</th>
                  <th>VIN</th>
                  <th>ELD S/N</th>
                  <th>GPS S/N</th>
                  <th>Tablet S/N</th>
                  <th>Camera S/N</th>
                  <th>Engine Hours</th>
                  <th>Odometer</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="vehicles-empty">
                      {assetType === 'vehicles' ? 'No vehicles match current filters.' : 'Trailer view is ready. Connect trailer data to display records.'}
                    </td>
                  </tr>
                )}
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.vehicleId}</td>
                    <td>{row.driver}</td>
                    <td>{row.location}</td>
                    <td>{row.vin}</td>
                    <td>{row.eldSn}</td>
                    <td>{row.gpsSn}</td>
                    <td>{row.tabletSn}</td>
                    <td>{row.cameraSn}</td>
                    <td>{row.engineHours.toLocaleString()} hrs</td>
                    <td>{row.odometer.toLocaleString()} mi</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── History Page ───────────────────────────────────────────────────────────
function HistoryPage({ token, resources, refreshAllResources, handleLogout, fetchResource }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [queryText, setQueryText] = useState('')
  const [eventType, setEventType] = useState('all')

  const truckResource = RESOURCE_CONFIG.find((r) => r.key === 'trucks')
  const tripResource = RESOURCE_CONFIG.find((r) => r.key === 'trips')
  const maintenanceResource = RESOURCE_CONFIG.find((r) => r.key === 'maintenance')
  const iftaResource = RESOURCE_CONFIG.find((r) => r.key === 'ifta')

  const trucks = resources.trucks?.items ?? []
  const trips = resources.trips?.items ?? []
  const maintenance = resources.maintenance?.items ?? []
  const ifta = resources.ifta?.items ?? []

  const railItems = STANDARD_RAIL_ITEMS

  useEffect(() => {
    if (!token) return
    if (truckResource) fetchResource(truckResource)
    if (tripResource) fetchResource(tripResource)
    if (maintenanceResource) fetchResource(maintenanceResource)
    if (iftaResource) fetchResource(iftaResource)
  }, [token, fetchResource, truckResource, tripResource, maintenanceResource, iftaResource])

  const truckById = useMemo(() => {
    const map = new Map()
    trucks.forEach((truck) => {
      map.set(Number(truck.id), truck)
    })
    return map
  }, [trucks])

  const historyRows = useMemo(() => {
    const tripRows = trips.map((trip, index) => {
      const truck = truckById.get(Number(trip.truck_id))
      const plate = truck?.license_plate ?? `TRIP-${trip.id ?? index + 1}`
      const when = trip.actual_departure ?? trip.scheduled_departure ?? trip.created_at ?? ''
      return {
        id: `trip-${trip.id ?? index}`,
        at: when,
        event: 'Trip',
        vehicle: plate,
        details: `${trip.origin ?? 'Unknown'} -> ${trip.destination ?? 'Unknown'}`,
        status: trip.status ?? 'scheduled',
        reference: `TRP-${trip.id ?? index + 1}`,
      }
    })

    const maintenanceRows = maintenance.map((entry, index) => {
      const truck = truckById.get(Number(entry.truck_id))
      const plate = truck?.license_plate ?? `MNT-${entry.id ?? index + 1}`
      return {
        id: `maintenance-${entry.id ?? index}`,
        at: entry.service_date ?? entry.created_at ?? '',
        event: 'Maintenance',
        vehicle: plate,
        details: `${entry.service_type ?? 'Service'} at ${entry.vendor ?? 'Vendor N/A'}`,
        status: 'completed',
        reference: `MNT-${entry.id ?? index + 1}`,
      }
    })

    const iftaRows = ifta.map((report, index) => {
      const truck = truckById.get(Number(report.truck_id))
      const plate = truck?.license_plate ?? `IFTA-${report.id ?? index + 1}`
      return {
        id: `ifta-${report.id ?? index}`,
        at: report.period_end ?? report.created_at ?? '',
        event: 'IFTA',
        vehicle: plate,
        details: `${report.jurisdiction ?? 'N/A'} | ${Number(report.miles_driven ?? 0).toLocaleString()} mi`,
        status: 'filed',
        reference: `IFT-${report.id ?? index + 1}`,
      }
    })

    return [...tripRows, ...maintenanceRows, ...iftaRows]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  }, [trips, maintenance, ifta, truckById])

  const filteredRows = useMemo(() => {
    const q = queryText.trim().toLowerCase()
    return historyRows.filter((row) => {
      const matchesQuery = !q
        || `${row.vehicle} ${row.event} ${row.details} ${row.reference}`.toLowerCase().includes(q)
      const matchesType = eventType === 'all' || row.event.toLowerCase() === eventType
      return matchesQuery && matchesType
    })
  }, [historyRows, queryText, eventType])

  function formatAt(value) {
    if (!value) return 'N/A'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString()
  }

  function exportRows() {
    const header = ['Date / Time', 'Event', 'Vehicle', 'Details', 'Status', 'Reference']
    const lines = filteredRows.map((row) => [
      formatAt(row.at), row.event, row.vehicle, row.details, row.status, row.reference,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))

    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'history-export.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`live-portal-wrap fleet-monitor-shell vehicles-shell ${railCollapsed ? 'rail-collapsed' : ''}`}>
      <aside className={`fleet-icon-rail ${railCollapsed ? 'collapsed' : ''}`}>
        <button type="button" className="fleet-rail-brand" aria-label="Home" onClick={() => navigate('/')}>
          <LogoIcon />
        </button>
        <button className="fleet-rail-toggle" onClick={() => setRailCollapsed((v) => !v)}>
          {railCollapsed ? '>' : '<'}
        </button>
        <div className="fleet-rail-items">
          {railItems.map((item) => {
            const isActive = Boolean(item.to) && isRailRouteActive(location.pathname, item.to)
            return (
              <button
                type="button"
                key={item.key}
                className={`fleet-rail-item ${isActive ? 'active' : ''}`}
                title={item.title}
                onClick={() => item.to && navigate(item.to)}
              >
                <span className="fleet-rail-icon">{item.icon}</span>
                {!railCollapsed && <span className="fleet-rail-label">{item.title}</span>}
              </button>
            )
          })}
        </div>
        <div className="fleet-rail-footer-actions">
          <button type="button" className="fleet-rail-ghost" onClick={() => navigate('/fleet')}>Compliance</button>
          <button className="fleet-rail-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <section className="vehicles-main-panel">
        <header className="vehicles-header">
          <div className="vehicles-title-wrap">
            <h1>History ({filteredRows.length})</h1>
          </div>
          <div className="vehicles-tenant-row">
            <button type="button" className="vehicles-chip" onClick={() => navigate('/portal')}>Liberte Trucking</button>
            <button type="button" className="vehicles-chip" onClick={() => setEventType('all')}>All Groups</button>
            <button type="button" className="vehicles-icon-btn" aria-label="Add" onClick={() => navigate('/portal')}>+</button>
            <button type="button" className="vehicles-icon-btn" aria-label="Notifications" onClick={() => setEventType('maintenance')}>o</button>
            <span className="vehicles-user">Bourlaye Coulibaly</span>
          </div>
        </header>

        <div className="vehicles-filter-row history-filter-row">
          <input
            className="vehicles-search"
            placeholder="Search by vehicle, event, details, or reference"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
          />
          <select
            className="vehicles-status"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            <option value="all">All Events</option>
            <option value="trip">Trips</option>
            <option value="maintenance">Maintenance</option>
            <option value="ifta">IFTA</option>
          </select>
          <div className="vehicles-filter-actions">
            <button className="vehicles-action-btn" onClick={exportRows}>Export</button>
            <button className="vehicles-action-btn" onClick={refreshAllResources} disabled={!token}>Sync</button>
          </div>
        </div>

        <div className="vehicles-grid-wrap history-grid-wrap">
          <aside className="vehicles-type-card">
            <button className={eventType === 'all' ? 'active' : ''} onClick={() => setEventType('all')}>All</button>
            <button className={eventType === 'trip' ? 'active' : ''} onClick={() => setEventType('trip')}>Trips</button>
            <button className={eventType === 'maintenance' ? 'active' : ''} onClick={() => setEventType('maintenance')}>Maintenance</button>
            <button className={eventType === 'ifta' ? 'active' : ''} onClick={() => setEventType('ifta')}>IFTA</button>
          </aside>

          <div className="vehicles-table-wrap">
            <table className="vehicles-table history-table">
              <thead>
                <tr>
                  <th>Date / Time</th>
                  <th>Event</th>
                  <th>Vehicle</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="vehicles-empty">No history records match current filters.</td>
                  </tr>
                )}
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatAt(row.at)}</td>
                    <td>{row.event}</td>
                    <td>{row.vehicle}</td>
                    <td>{row.details}</td>
                    <td className="history-status-cell">
                      <span className={`history-badge ${String(row.status).toLowerCase().replace(/\s+/g, '-')}`}>{row.status}</span>
                    </td>
                    <td>{row.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Drivers Page ────────────────────────────────────────────────────────────
function DriversPage({ token, resources, refreshAllResources, handleLogout, fetchResource }) {
  const emptyDriverForm = {
    full_name: '',
    email: '',
    phone: '',
    license_number: '',
    license_class: 'C',
    license_state: 'NJ',
    license_issue_date: '',
    license_expiry: '',
    date_of_birth: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
    assigned_truck_id: '',
  }

  const location = useLocation()
  const navigate = useNavigate()
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [queryText, setQueryText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [toolbarBusy, setToolbarBusy] = useState(false)
  const [assignmentSavingId, setAssignmentSavingId] = useState(null)
  const [assignmentMessage, setAssignmentMessage] = useState('')
  const [driverForm, setDriverForm] = useState(emptyDriverForm)

  const truckResource = RESOURCE_CONFIG.find((r) => r.key === 'trucks')
  const driverResource = RESOURCE_CONFIG.find((r) => r.key === 'drivers')
  const trucks = resources.trucks?.items ?? []
  const drivers = resources.drivers?.items ?? []

  const railItems = STANDARD_RAIL_ITEMS

  useEffect(() => {
    if (!token || !truckResource || !driverResource) return
    fetchResource(truckResource)
    fetchResource(driverResource)
  }, [token, truckResource, driverResource, fetchResource])

  async function handleCreateDriver(e) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setMessage('')
    try {
      const selectedTruckId = driverForm.assigned_truck_id ? Number(driverForm.assigned_truck_id) : null
      if (selectedTruckId !== null && occupiedTruckIds.has(selectedTruckId)) {
        throw new Error('Selected truck is already occupied. Choose an unoccupied truck.')
      }

      const payload = {
        ...driverForm,
        assigned_truck_id: selectedTruckId,
        license_issue_date: driverForm.license_issue_date || null,
        date_of_birth: driverForm.date_of_birth || null,
        notes: driverForm.notes || null,
        address: driverForm.address || null,
        emergency_contact_name: driverForm.emergency_contact_name || null,
        emergency_contact_phone: driverForm.emergency_contact_phone || null,
      }
      await apiRequest('/drivers/', { method: 'POST', token, body: payload })

      if (selectedTruckId !== null) {
        await apiRequest(`/trucks/${selectedTruckId}`, {
          method: 'PATCH',
          token,
          body: { status: 'on_trip' },
        })
      }

      setMessage('Driver saved successfully.')
      setDriverForm(emptyDriverForm)
      if (driverResource) await fetchResource(driverResource)
      if (truckResource) await fetchResource(truckResource)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function assignDriverToTruck(driverId, truckId) {
    if (!token || !driverResource) return
    const normalizedTruckId = truckId ? Number(truckId) : null
    if (normalizedTruckId !== null && !trucks.some((truck) => truck.id === normalizedTruckId)) {
      setAssignmentMessage('Selected truck is unavailable in your account. Refresh trucks and try again.')
      return
    }

    setAssignmentSavingId(driverId)
    setMessage('')
    setAssignmentMessage('')
    try {
      const targetDriver = drivers.find((driver) => Number(driver.id) === Number(driverId))
      const previousTruckId = targetDriver?.assigned_truck_id ?? null

      if (normalizedTruckId !== null) {
        const occupiedByOthers = drivers.some((driver) => Number(driver.id) !== Number(driverId) && Number(driver.assigned_truck_id) === normalizedTruckId)
        if (occupiedByOthers) {
          throw new Error('Selected truck is already occupied by another driver.')
        }
      }

      await apiRequest(`/drivers/${driverId}`, {
        method: 'PATCH',
        token,
        body: {
          assigned_truck_id: normalizedTruckId,
        },
      })

      if (normalizedTruckId !== null) {
        await apiRequest(`/trucks/${normalizedTruckId}`, {
          method: 'PATCH',
          token,
          body: { status: 'on_trip' },
        })
      }

      if (previousTruckId !== null && Number(previousTruckId) !== normalizedTruckId) {
        const previousStillOccupied = drivers.some((driver) => Number(driver.id) !== Number(driverId) && Number(driver.assigned_truck_id) === Number(previousTruckId))
        if (!previousStillOccupied) {
          await apiRequest(`/trucks/${previousTruckId}`, {
            method: 'PATCH',
            token,
            body: { status: 'available' },
          })
        }
      }

      await fetchResource(driverResource)
      if (truckResource) {
        await fetchResource(truckResource)
      }
      setAssignmentMessage('Driver assignment updated.')
    } catch (err) {
      setAssignmentMessage(err.message)
    } finally {
      setAssignmentSavingId(null)
    }
  }

  async function runToolbarAction(action) {
    if (toolbarBusy) return
    setToolbarBusy(true)
    setMessage('')
    try {
      await action()
    } finally {
      setToolbarBusy(false)
    }
  }


  const expiredCount = drivers.filter((d) => d.license_status === 'expired').length
  const expiringSoonCount = drivers.filter((d) => d.license_status === 'expiring_soon').length

  const criticalLicenseAlerts = useMemo(() => {
    return drivers
      .filter((driver) => Number.isFinite(driver.license_days_until_expiry) && driver.license_days_until_expiry <= 30)
      .sort((a, b) => a.license_days_until_expiry - b.license_days_until_expiry)
  }, [drivers])

  const filteredDrivers = useMemo(() => {
    const q = queryText.trim().toLowerCase()
    return drivers.filter((driver) => {
      const statusMatch = statusFilter === 'all' || driver.license_status === statusFilter
      const textMatch = !q
        || `${driver.full_name} ${driver.email} ${driver.phone} ${driver.license_number} ${driver.assigned_truck_label ?? ''}`.toLowerCase().includes(q)
      return statusMatch && textMatch
    })
  }, [drivers, queryText, statusFilter])

  const occupiedTruckIds = useMemo(() => {
    const ids = new Set()
    drivers.forEach((driver) => {
      if (driver.assigned_truck_id !== null && driver.assigned_truck_id !== undefined) {
        ids.add(Number(driver.assigned_truck_id))
      }
    })
    return ids
  }, [drivers])

  const unoccupiedTrucks = useMemo(() => {
    return trucks.filter((truck) => !occupiedTruckIds.has(Number(truck.id)))
  }, [trucks, occupiedTruckIds])

  return (
    <div className={`live-portal-wrap fleet-monitor-shell vehicles-shell drivers-shell ${railCollapsed ? 'rail-collapsed' : ''}`}>
      <aside className={`fleet-icon-rail ${railCollapsed ? 'collapsed' : ''}`}>
        <button type="button" className="fleet-rail-brand" aria-label="Home" onClick={() => navigate('/')}>
          <LogoIcon />
        </button>
        <button type="button" className="fleet-rail-toggle" onClick={() => setRailCollapsed((v) => !v)}>
          {railCollapsed ? '>' : '<'}
        </button>
        <div className="fleet-rail-items">
          {railItems.map((item) => {
            const isActive = Boolean(item.to) && isRailRouteActive(location.pathname, item.to)
            return (
              <button
                type="button"
                key={item.key}
                className={`fleet-rail-item ${isActive ? 'active' : ''}`}
                title={item.title}
                onClick={() => item.to && navigate(item.to)}
              >
                <span className="fleet-rail-icon">{item.icon}</span>
                {!railCollapsed && <span className="fleet-rail-label">{item.title}</span>}
              </button>
            )
          })}
        </div>
        <div className="fleet-rail-footer-actions">
          <button type="button" className="fleet-rail-ghost" onClick={() => navigate('/fleet')}>Compliance</button>
          <button type="button" className="fleet-rail-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <section className="vehicles-main-panel drivers-main-panel">
        <header className="vehicles-header">
          <div className="vehicles-title-wrap">
            <h1>Drivers ({filteredDrivers.length})</h1>
            <p className="drivers-subtitle">Create driver profiles, link each driver to a truck, and monitor expiry status.</p>
          </div>
          <div className="vehicles-tenant-row">
            <button type="button" className="vehicles-chip">Driver Center</button>
            <button type="button" className="vehicles-chip">Compliance Focus</button>
            <button type="button" className="vehicles-icon-btn" aria-label="Drivers">DR</button>
            <span className="vehicles-user">Fleet Team</span>
          </div>
        </header>

        <div className="vehicles-filter-row drivers-filter-row">
          <input
            className="vehicles-search"
            placeholder="Search by name, email, phone, license, or assigned truck"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
          />
          <select
            className="vehicles-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All License Status</option>
            <option value="valid">Valid</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
          <div className="vehicles-filter-actions">
            <button
              type="button"
              className="vehicles-action-btn"
              onClick={() => runToolbarAction(async () => {
                if (driverResource) await fetchResource(driverResource)
              })}
              disabled={!token || !driverResource || toolbarBusy}
            >
              {toolbarBusy ? 'Working...' : 'Refresh Drivers'}
            </button>
            <button
              type="button"
              className="vehicles-action-btn"
              onClick={() => runToolbarAction(async () => {
                if (truckResource) await fetchResource(truckResource)
              })}
              disabled={!token || !truckResource || toolbarBusy}
            >
              {toolbarBusy ? 'Working...' : 'Refresh Trucks'}
            </button>
            <button
              type="button"
              className="vehicles-action-btn primary"
              onClick={() => runToolbarAction(refreshAllResources)}
              disabled={!token || toolbarBusy}
            >
              {toolbarBusy ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </div>

        <div className="drivers-kpi-row">
          <div className="drivers-kpi-card">
            <small>Total Drivers</small>
            <strong>{drivers.length}</strong>
          </div>
          <div className="drivers-kpi-card warn">
            <small>Expiring Soon</small>
            <strong>{expiringSoonCount}</strong>
          </div>
          <div className="drivers-kpi-card risk">
            <small>Expired</small>
            <strong>{expiredCount}</strong>
          </div>
        </div>

        <section className="drivers-alert-panel" aria-live="polite">
          <div className="drivers-alert-head">
            <h3>Important Expiry Notifications</h3>
            <span>{criticalLicenseAlerts.length} alerts</span>
          </div>
          {criticalLicenseAlerts.length === 0 && (
            <p className="drivers-alert-ok">No urgent license expiry risks in the next 30 days.</p>
          )}
          {criticalLicenseAlerts.length > 0 && (
            <div className="drivers-alert-list">
              {criticalLicenseAlerts.slice(0, 8).map((driver) => {
                const days = driver.license_days_until_expiry
                const level = days < 0 ? 'expired' : days <= 7 ? 'urgent' : 'warning'
                const label = days < 0
                  ? `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
                  : days === 0
                    ? 'Expires today'
                    : `Expires in ${days} day${days === 1 ? '' : 's'}`

                return (
                  <div className={`drivers-alert-item ${level}`} key={`alert-${driver.id}`}>
                    <div>
                      <strong>{driver.full_name}</strong>
                      <p>{driver.license_number} · {driver.license_state ?? 'State N/A'} · {driver.license_expiry}</p>
                    </div>
                    <span className="drivers-alert-badge">{label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <div className="vehicles-grid-wrap drivers-grid-wrap">
          <aside className="vehicles-type-card drivers-type-card">
            <button type="button" className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>All Drivers</button>
            <button type="button" className={statusFilter === 'valid' ? 'active' : ''} onClick={() => setStatusFilter('valid')}>Valid</button>
            <button type="button" className={statusFilter === 'expiring_soon' ? 'active' : ''} onClick={() => setStatusFilter('expiring_soon')}>Expiring</button>
            <button type="button" className={statusFilter === 'expired' ? 'active' : ''} onClick={() => setStatusFilter('expired')}>Expired</button>
          </aside>

          <div className="drivers-content-stack">
            <form className="drivers-form-card" onSubmit={handleCreateDriver}>
            <h3>Add Driver</h3>
            <div className="drivers-form-grid">
              <input required placeholder="Full name" value={driverForm.full_name} onChange={(e) => setDriverForm((f) => ({ ...f, full_name: e.target.value }))} />
              <input required type="email" placeholder="Email" value={driverForm.email} onChange={(e) => setDriverForm((f) => ({ ...f, email: e.target.value }))} />
              <input required placeholder="Phone" value={driverForm.phone} onChange={(e) => setDriverForm((f) => ({ ...f, phone: e.target.value }))} />
              <input required placeholder="License number" value={driverForm.license_number} onChange={(e) => setDriverForm((f) => ({ ...f, license_number: e.target.value }))} />
              <select value={driverForm.license_class} onChange={(e) => setDriverForm((f) => ({ ...f, license_class: e.target.value }))}>
                <option value="C">CDL Class C (Commercial)</option>
                <option value="B">CDL Class B</option>
                <option value="A">CDL Class A</option>
              </select>
              <input placeholder="License state (e.g. NJ)" value={driverForm.license_state} onChange={(e) => setDriverForm((f) => ({ ...f, license_state: e.target.value }))} />
              <label>
                License issue date
                <input type="date" value={driverForm.license_issue_date} onChange={(e) => setDriverForm((f) => ({ ...f, license_issue_date: e.target.value }))} />
              </label>
              <label>
                License expiry
                <input required type="date" value={driverForm.license_expiry} onChange={(e) => setDriverForm((f) => ({ ...f, license_expiry: e.target.value }))} />
              </label>
              <label>
                Date of birth
                <input type="date" value={driverForm.date_of_birth} onChange={(e) => setDriverForm((f) => ({ ...f, date_of_birth: e.target.value }))} />
              </label>
              <input placeholder="Address" value={driverForm.address} onChange={(e) => setDriverForm((f) => ({ ...f, address: e.target.value }))} />
              <input placeholder="Emergency contact name" value={driverForm.emergency_contact_name} onChange={(e) => setDriverForm((f) => ({ ...f, emergency_contact_name: e.target.value }))} />
              <input placeholder="Emergency contact phone" value={driverForm.emergency_contact_phone} onChange={(e) => setDriverForm((f) => ({ ...f, emergency_contact_phone: e.target.value }))} />
              <select value={driverForm.assigned_truck_id} onChange={(e) => setDriverForm((f) => ({ ...f, assigned_truck_id: e.target.value }))}>
                <option value="">Unassigned truck</option>
                {unoccupiedTrucks.map((truck) => (
                  <option key={truck.id} value={String(truck.id)}>{truck.license_plate} · {truck.make} {truck.model}</option>
                ))}
              </select>
            </div>
            <textarea placeholder="Notes" rows={3} value={driverForm.notes} onChange={(e) => setDriverForm((f) => ({ ...f, notes: e.target.value }))} />
            <div className="drivers-form-actions">
              <button type="submit" className="vehicles-action-btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save Driver'}</button>
              {message && <p className="drivers-message">{message}</p>}
            </div>
            </form>

            <div className="drivers-table-card vehicles-table-wrap">
              {trucks.length === 0 && (
                <p className="drivers-message">No trucks found in your account yet. Create a truck in Vehicles first, then assign drivers.</p>
              )}
              {assignmentMessage && (
                <p className="drivers-message">{assignmentMessage}</p>
              )}
              <table className="vehicles-table drivers-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>License</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Assigned Truck</th>
                    <th>Update Assignment</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="vehicles-empty">No drivers match current filters.</td>
                    </tr>
                  )}
                  {filteredDrivers.map((driver) => (
                    <tr
                      key={driver.id}
                      className={driver.license_status === 'expired' ? 'driver-row-expired' : driver.license_status === 'expiring_soon' ? 'driver-row-expiring' : ''}
                    >
                      <td>
                        <strong>{driver.full_name}</strong>
                        <div>{driver.email}</div>
                      </td>
                      <td>{driver.license_number} · Class {driver.license_class}</td>
                      <td>
                        <div>{driver.license_expiry}</div>
                        <small>{formatDaysUntilExpiry(driver.license_days_until_expiry)}</small>
                      </td>
                      <td>
                        <span className={`driver-status-pill ${driver.license_status}`}>{humanizeLicenseStatus(driver.license_status)}</span>
                      </td>
                      <td>{driver.assigned_truck_label ?? 'Unassigned'}</td>
                      <td>
                        <select
                          value={driver.assigned_truck_id ?? ''}
                          onChange={(e) => assignDriverToTruck(driver.id, e.target.value)}
                          disabled={assignmentSavingId === driver.id || trucks.length === 0}
                        >
                          <option value="">Unassigned</option>
                          {trucks
                            .filter((truck) => {
                              if (Number(driver.assigned_truck_id) === Number(truck.id)) return true
                              return !occupiedTruckIds.has(Number(truck.id))
                            })
                            .map((truck) => (
                              <option key={truck.id} value={String(truck.id)}>{truck.license_plate}</option>
                            ))}
                        </select>
                      </td>
                      <td>
                        <button type="button" className="vehicles-action-btn" onClick={() => navigate(`/drivers/${driver.id}`)}>
                          View / Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function DriverDetailsPage({ token, resources, refreshAllResources, handleLogout, fetchResource }) {
  const { driverId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toolbarBusy, setToolbarBusy] = useState(false)
  const [message, setMessage] = useState('')

  const emptyDriverEditForm = {
    full_name: '',
    email: '',
    phone: '',
    license_number: '',
    license_class: 'C',
    license_state: 'NJ',
    license_issue_date: '',
    license_expiry: '',
    date_of_birth: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
    assigned_truck_id: '',
    is_active: true,
  }

  const [driverEditForm, setDriverEditForm] = useState(emptyDriverEditForm)

  const truckResource = RESOURCE_CONFIG.find((r) => r.key === 'trucks')
  const driverResource = RESOURCE_CONFIG.find((r) => r.key === 'drivers')
  const trucks = resources.trucks?.items ?? []
  const drivers = resources.drivers?.items ?? []
  const parsedDriverId = Number(driverId)
  const selectedDriver = drivers.find((driver) => driver.id === parsedDriverId) ?? null

  const occupiedTruckIds = useMemo(() => {
    const ids = new Set()
    drivers.forEach((driver) => {
      if (driver.assigned_truck_id !== null && driver.assigned_truck_id !== undefined) {
        ids.add(Number(driver.assigned_truck_id))
      }
    })
    return ids
  }, [drivers])

  const availableTrucksForSelectedDriver = useMemo(() => {
    const selectedAssignedId = selectedDriver?.assigned_truck_id ?? null
    return trucks.filter((truck) => {
      if (selectedAssignedId !== null && Number(truck.id) === Number(selectedAssignedId)) return true
      return !occupiedTruckIds.has(Number(truck.id))
    })
  }, [trucks, occupiedTruckIds, selectedDriver])

  const railItems = STANDARD_RAIL_ITEMS

  useEffect(() => {
    if (!token || !truckResource || !driverResource) return
    fetchResource(truckResource)
    fetchResource(driverResource)
  }, [token, truckResource, driverResource, fetchResource])

  useEffect(() => {
    if (!selectedDriver) {
      setDriverEditForm(emptyDriverEditForm)
      return
    }
    setDriverEditForm({
      full_name: selectedDriver.full_name ?? '',
      email: selectedDriver.email ?? '',
      phone: selectedDriver.phone ?? '',
      license_number: selectedDriver.license_number ?? '',
      license_class: selectedDriver.license_class ?? 'C',
      license_state: selectedDriver.license_state ?? '',
      license_issue_date: selectedDriver.license_issue_date ?? '',
      license_expiry: selectedDriver.license_expiry ?? '',
      date_of_birth: selectedDriver.date_of_birth ?? '',
      address: selectedDriver.address ?? '',
      emergency_contact_name: selectedDriver.emergency_contact_name ?? '',
      emergency_contact_phone: selectedDriver.emergency_contact_phone ?? '',
      notes: selectedDriver.notes ?? '',
      assigned_truck_id: selectedDriver.assigned_truck_id ? String(selectedDriver.assigned_truck_id) : '',
      is_active: selectedDriver.is_active ?? true,
    })
  }, [selectedDriver])

  async function handleUpdateDriver(e) {
    e.preventDefault()
    if (!token || !driverResource || !selectedDriver) return
    setSaving(true)
    setMessage('')
    try {
      const nextAssignedTruckId = driverEditForm.assigned_truck_id ? Number(driverEditForm.assigned_truck_id) : null
      if (nextAssignedTruckId !== null) {
        const occupiedByOthers = drivers.some((driver) => Number(driver.id) !== Number(selectedDriver.id) && Number(driver.assigned_truck_id) === nextAssignedTruckId)
        if (occupiedByOthers) {
          throw new Error('Selected truck is already occupied by another driver.')
        }
      }

      const previousAssignedTruckId = selectedDriver.assigned_truck_id ?? null
      const payload = {
        ...driverEditForm,
        assigned_truck_id: nextAssignedTruckId,
        license_issue_date: driverEditForm.license_issue_date || null,
        date_of_birth: driverEditForm.date_of_birth || null,
        address: driverEditForm.address || null,
        emergency_contact_name: driverEditForm.emergency_contact_name || null,
        emergency_contact_phone: driverEditForm.emergency_contact_phone || null,
        notes: driverEditForm.notes || null,
      }
      await apiRequest(`/drivers/${selectedDriver.id}`, { method: 'PATCH', token, body: payload })

      if (nextAssignedTruckId !== null) {
        await apiRequest(`/trucks/${nextAssignedTruckId}`, {
          method: 'PATCH',
          token,
          body: { status: 'on_trip' },
        })
      }

      if (previousAssignedTruckId !== null && Number(previousAssignedTruckId) !== nextAssignedTruckId) {
        const previousStillOccupied = drivers.some((driver) => Number(driver.id) !== Number(selectedDriver.id) && Number(driver.assigned_truck_id) === Number(previousAssignedTruckId))
        if (!previousStillOccupied) {
          await apiRequest(`/trucks/${previousAssignedTruckId}`, {
            method: 'PATCH',
            token,
            body: { status: 'available' },
          })
        }
      }

      await fetchResource(driverResource)
      if (truckResource) await fetchResource(truckResource)
      setMessage('Driver details updated successfully.')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function runToolbarAction(action) {
    if (toolbarBusy) return
    setToolbarBusy(true)
    setMessage('')
    try {
      await action()
    } finally {
      setToolbarBusy(false)
    }
  }

  return (
    <div className={`live-portal-wrap fleet-monitor-shell vehicles-shell drivers-shell ${railCollapsed ? 'rail-collapsed' : ''}`}>
      <aside className={`fleet-icon-rail ${railCollapsed ? 'collapsed' : ''}`}>
        <button type="button" className="fleet-rail-brand" aria-label="Home" onClick={() => navigate('/')}>
          <LogoIcon />
        </button>
        <button type="button" className="fleet-rail-toggle" onClick={() => setRailCollapsed((v) => !v)}>
          {railCollapsed ? '>' : '<'}
        </button>
        <div className="fleet-rail-items">
          {railItems.map((item) => {
            const isActive = Boolean(item.to) && isRailRouteActive(location.pathname, item.to)
            return (
              <button
                type="button"
                key={item.key}
                className={`fleet-rail-item ${isActive ? 'active' : ''}`}
                title={item.title}
                onClick={() => item.to && navigate(item.to)}
              >
                <span className="fleet-rail-icon">{item.icon}</span>
                {!railCollapsed && <span className="fleet-rail-label">{item.title}</span>}
              </button>
            )
          })}
        </div>
        <div className="fleet-rail-footer-actions">
          <button type="button" className="fleet-rail-ghost" onClick={() => navigate('/fleet')}>Compliance</button>
          <button type="button" className="fleet-rail-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <section className="vehicles-main-panel drivers-main-panel">
        <header className="vehicles-header">
          <div className="vehicles-title-wrap">
            <h1>Driver Details</h1>
            <p className="drivers-subtitle">View and edit complete information for one driver profile.</p>
          </div>
          <div className="vehicles-tenant-row">
            <button type="button" className="vehicles-chip">Driver Center</button>
            <button type="button" className="vehicles-chip">Profile Editor</button>
            <button type="button" className="vehicles-icon-btn" aria-label="Drivers">DR</button>
            <span className="vehicles-user">Fleet Team</span>
          </div>
        </header>

        <div className="vehicles-filter-row drivers-filter-row">
          <button type="button" className="vehicles-action-btn" onClick={() => navigate('/drivers')}>Back to Drivers</button>
          <div className="driver-detail-meta">
            {selectedDriver ? (
              <span>{selectedDriver.full_name} · {selectedDriver.license_number}</span>
            ) : (
              <span>Driver not found</span>
            )}
          </div>
          <div className="vehicles-filter-actions">
            <button
              type="button"
              className="vehicles-action-btn"
              onClick={() => runToolbarAction(async () => {
                if (driverResource) await fetchResource(driverResource)
              })}
              disabled={!token || !driverResource || toolbarBusy}
            >
              {toolbarBusy ? 'Working...' : 'Refresh Drivers'}
            </button>
            <button
              type="button"
              className="vehicles-action-btn"
              onClick={() => runToolbarAction(async () => {
                if (truckResource) await fetchResource(truckResource)
              })}
              disabled={!token || !truckResource || toolbarBusy}
            >
              {toolbarBusy ? 'Working...' : 'Refresh Trucks'}
            </button>
            <button
              type="button"
              className="vehicles-action-btn primary"
              onClick={() => runToolbarAction(refreshAllResources)}
              disabled={!token || toolbarBusy}
            >
              {toolbarBusy ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </div>

        {!selectedDriver && (
          <div className="drivers-form-card">
            <h3>Driver Not Available</h3>
            <p className="drivers-message">This driver record could not be found. Try returning to Drivers and opening the record again.</p>
          </div>
        )}

        {selectedDriver && (
          <div className="driver-profile-layout">
            <aside className="driver-profile-summary drivers-form-card">
              <h3>{selectedDriver.full_name}</h3>
              <p className="driver-profile-line">Email: {selectedDriver.email}</p>
              <p className="driver-profile-line">Phone: {selectedDriver.phone}</p>
              <p className="driver-profile-line">License: {selectedDriver.license_number} · Class {selectedDriver.license_class}</p>
              <p className="driver-profile-line">Status: {humanizeLicenseStatus(selectedDriver.license_status)} ({formatDaysUntilExpiry(selectedDriver.license_days_until_expiry)})</p>
              <p className="driver-profile-line">Assigned Truck: {selectedDriver.assigned_truck_label ?? 'Unassigned'}</p>
              <p className="driver-profile-line">Record ID: {selectedDriver.id}</p>
            </aside>

            <form className="drivers-form-card" onSubmit={handleUpdateDriver}>
              <h3>Edit Driver</h3>
              <div className="drivers-form-grid">
                <input required placeholder="Full name" value={driverEditForm.full_name} onChange={(e) => setDriverEditForm((f) => ({ ...f, full_name: e.target.value }))} />
                <input required type="email" placeholder="Email" value={driverEditForm.email} onChange={(e) => setDriverEditForm((f) => ({ ...f, email: e.target.value }))} />
                <input required placeholder="Phone" value={driverEditForm.phone} onChange={(e) => setDriverEditForm((f) => ({ ...f, phone: e.target.value }))} />
                <input required placeholder="License number" value={driverEditForm.license_number} onChange={(e) => setDriverEditForm((f) => ({ ...f, license_number: e.target.value }))} />
                <select value={driverEditForm.license_class} onChange={(e) => setDriverEditForm((f) => ({ ...f, license_class: e.target.value }))}>
                  <option value="C">CDL Class C (Commercial)</option>
                  <option value="B">CDL Class B</option>
                  <option value="A">CDL Class A</option>
                </select>
                <input placeholder="License state (e.g. NJ)" value={driverEditForm.license_state} onChange={(e) => setDriverEditForm((f) => ({ ...f, license_state: e.target.value }))} />
                <label>
                  License issue date
                  <input type="date" value={driverEditForm.license_issue_date} onChange={(e) => setDriverEditForm((f) => ({ ...f, license_issue_date: e.target.value }))} />
                </label>
                <label>
                  License expiry
                  <input required type="date" value={driverEditForm.license_expiry} onChange={(e) => setDriverEditForm((f) => ({ ...f, license_expiry: e.target.value }))} />
                </label>
                <label>
                  Date of birth
                  <input type="date" value={driverEditForm.date_of_birth} onChange={(e) => setDriverEditForm((f) => ({ ...f, date_of_birth: e.target.value }))} />
                </label>
                <input placeholder="Address" value={driverEditForm.address} onChange={(e) => setDriverEditForm((f) => ({ ...f, address: e.target.value }))} />
                <input placeholder="Emergency contact name" value={driverEditForm.emergency_contact_name} onChange={(e) => setDriverEditForm((f) => ({ ...f, emergency_contact_name: e.target.value }))} />
                <input placeholder="Emergency contact phone" value={driverEditForm.emergency_contact_phone} onChange={(e) => setDriverEditForm((f) => ({ ...f, emergency_contact_phone: e.target.value }))} />
                <select value={driverEditForm.assigned_truck_id} onChange={(e) => setDriverEditForm((f) => ({ ...f, assigned_truck_id: e.target.value }))}>
                  <option value="">Unassigned truck</option>
                  {availableTrucksForSelectedDriver.map((truck) => (
                    <option key={truck.id} value={String(truck.id)}>{truck.license_plate} · {truck.make} {truck.model}</option>
                  ))}
                </select>
                <label className="drivers-active-toggle">
                  Active driver
                  <input type="checkbox" checked={driverEditForm.is_active} onChange={(e) => setDriverEditForm((f) => ({ ...f, is_active: e.target.checked }))} />
                </label>
              </div>
              <textarea placeholder="Notes" rows={3} value={driverEditForm.notes} onChange={(e) => setDriverEditForm((f) => ({ ...f, notes: e.target.value }))} />
              <div className="drivers-form-actions">
                <button type="submit" className="vehicles-action-btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save Driver Changes'}</button>
                {message && <p className="drivers-message">{message}</p>}
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Portal ───────────────────────────────────────────────────────────────────
function RoutesPage({ handleLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')

  const railItems = STANDARD_RAIL_ITEMS

  const filteredRoutes = DEMO_ROUTES.filter((route) => {
    const statusMatch = statusFilter === 'all' || route.status === statusFilter
    const queryMatch = !query.trim() || `${route.reference} ${route.origin} ${route.destination} ${route.truck} ${route.driver} ${route.cargo}`.toLowerCase().includes(query.trim().toLowerCase())
    return statusMatch && queryMatch
  })

  return (
    <div className={`live-portal-wrap fleet-monitor-shell vehicles-shell routes-shell ${railCollapsed ? 'rail-collapsed' : ''}`}>
      <aside className={`fleet-icon-rail ${railCollapsed ? 'collapsed' : ''}`}>
        <button type="button" className="fleet-rail-brand" aria-label="Home" onClick={() => navigate('/')}><LogoIcon /></button>
        <button type="button" className="fleet-rail-toggle" onClick={() => setRailCollapsed((value) => !value)}>{railCollapsed ? '>' : '<'}</button>
        <div className="fleet-rail-items">
          {railItems.map((item) => (
            <button type="button" key={item.key} className={`fleet-rail-item ${isRailRouteActive(location.pathname, item.to) ? 'active' : ''}`} title={item.title} onClick={() => navigate(item.to)}>
              <span className="fleet-rail-icon">{item.icon}</span>
              {!railCollapsed && <span className="fleet-rail-label">{item.title}</span>}
            </button>
          ))}
        </div>
        <div className="fleet-rail-footer-actions">
          <button type="button" className="fleet-rail-ghost" onClick={() => navigate('/fleet')}>Compliance</button>
          <button type="button" className="fleet-rail-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <section className="vehicles-main-panel routes-main-panel">
        <header className="vehicles-header">
          <div className="vehicles-title-wrap">
            <h1>Routes ({filteredRoutes.length})</h1>
            <p className="drivers-subtitle">Plan, monitor, and review active fleet routes.</p>
          </div>
          <div className="vehicles-tenant-row">
            <button type="button" className="vehicles-chip">Route Center</button>
            <button type="button" className="vehicles-icon-btn" aria-label="Routes">RT</button>
            <span className="vehicles-user">Fleet Team</span>
          </div>
        </header>

        <div className="routes-toolbar">
          <input className="vehicles-search" placeholder="Search route, location, truck, driver, or cargo" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="vehicles-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Route Statuses</option>
            <option value="In Transit">In Transit</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Delayed">Delayed</option>
            <option value="Completed">Completed</option>
          </select>
          <button type="button" className="vehicles-action-btn primary" onClick={() => setQuery('')}>Reset View</button>
        </div>

        <div className="drivers-kpi-row routes-kpi-row">
          <div className="drivers-kpi-card"><small>Total Routes</small><strong>{DEMO_ROUTES.length}</strong></div>
          <div className="drivers-kpi-card warn"><small>In Transit</small><strong>{DEMO_ROUTES.filter((route) => route.status === 'In Transit').length}</strong></div>
          <div className="drivers-kpi-card risk"><small>Needs Attention</small><strong>{DEMO_ROUTES.filter((route) => route.status === 'Delayed').length}</strong></div>
        </div>

        <div className="routes-data-panel">
          <div className="fleet-status-head">
            <h3>Route Schedule</h3>
            <span>Demo data</span>
          </div>
          <div className="routes-table-wrap">
            <table className="vehicles-table routes-table">
              <thead><tr><th>Route</th><th>Status</th><th>From / To</th><th>Schedule</th><th>Truck / Driver</th><th>Cargo</th></tr></thead>
              <tbody>
                {filteredRoutes.length === 0 && <tr><td colSpan={6} className="vehicles-empty">No routes match the current filters.</td></tr>}
                {filteredRoutes.map((route) => (
                  <tr key={route.id}>
                    <td><strong>{route.reference}</strong><small>{route.distance}</small></td>
                    <td><span className={`route-status route-status-${route.status.toLowerCase().replace(' ', '-')}`}>{route.status}</span></td>
                    <td><strong>{route.origin}</strong><small>to {route.destination}</small></td>
                    <td><strong>{route.departure}</strong><small>ETA {route.eta}</small></td>
                    <td><strong>{route.truck}</strong><small>{route.driver}</small></td>
                    <td>{route.cargo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeaturePlaceholderPage({ handleLogout, title, subtitle }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [railCollapsed, setRailCollapsed] = useState(false)
  const railItems = STANDARD_RAIL_ITEMS

  return (
    <div className={`live-portal-wrap fleet-monitor-shell vehicles-shell ${railCollapsed ? 'rail-collapsed' : ''}`}>
      <aside className={`fleet-icon-rail ${railCollapsed ? 'collapsed' : ''}`}>
        <button type="button" className="fleet-rail-brand" aria-label="Home" onClick={() => navigate('/')}><LogoIcon /></button>
        <button type="button" className="fleet-rail-toggle" onClick={() => setRailCollapsed((value) => !value)}>{railCollapsed ? '>' : '<'}</button>
        <div className="fleet-rail-items">
          {railItems.map((item) => (
            <button
              type="button"
              key={item.key}
              className={`fleet-rail-item ${isRailRouteActive(location.pathname, item.to) ? 'active' : ''}`}
              title={item.title}
              onClick={() => navigate(item.to)}
            >
              <span className="fleet-rail-icon">{item.icon}</span>
              {!railCollapsed && <span className="fleet-rail-label">{item.title}</span>}
            </button>
          ))}
        </div>
        <div className="fleet-rail-footer-actions">
          <button type="button" className="fleet-rail-ghost" onClick={() => navigate('/fleet')}>Compliance</button>
          <button type="button" className="fleet-rail-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <section className="vehicles-main-panel routes-main-panel">
        <header className="vehicles-header">
          <div className="vehicles-title-wrap">
            <h1>{title}</h1>
            <p className="drivers-subtitle">{subtitle}</p>
          </div>
          <div className="vehicles-tenant-row">
            <button type="button" className="vehicles-chip">{title} Center</button>
            <span className="vehicles-user">Fleet Team</span>
          </div>
        </header>

        <div className="routes-data-panel">
          <div className="fleet-status-head">
            <h3>{title} Dashboard</h3>
            <span>Standalone page</span>
          </div>
          <p className="drivers-message">This is the dedicated {title.toLowerCase()} page. You are no longer redirected to a different section.</p>
        </div>
      </section>
    </div>
  )
}

function Portal({
  token, resources, fleetCount,
  refreshAllResources, handleLogout, fetchResource, managerMode = false,
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [mapError, setMapError] = useState('')
  const [search, setSearch] = useState('')
  const [tick, setTick] = useState(0)
  const [selectedTruckId, setSelectedTruckId] = useState(null)
  const [geofenceEnabled, setGeofenceEnabled] = useState(true)
  const [geofenceRadiusKm, setGeofenceRadiusKm] = useState(25)

  const [weatherDetails, setWeatherDetails] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState('')
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [truckTimezone, setTruckTimezone] = useState('UTC')

  const mapElRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const geofenceRef = useRef(null)
  const mapViewportInitializedRef = useRef(false)
  const lastMapSelectionRef = useRef(null)
  const fetchResourceRef = useRef(fetchResource)

  const truckResource = RESOURCE_CONFIG.find((r) => r.key === 'trucks')
  const driverResource = RESOURCE_CONFIG.find((r) => r.key === 'drivers')
  const liveRefreshMs = 10000
  const trucks = resources.trucks?.items ?? []
  const drivers = resources.drivers?.items ?? []
  const useDemoFleetView = true
  const [localTrucks, setLocalTrucks] = useState(() => (
    useDemoFleetView
      ? FLEET_VIEW_DEMO_SEEDS.map((seed) => ({
        ...seed,
        license_plate: seed.plate,
        latitude: seed.baseLat,
        longitude: seed.baseLng,
        height_m: seed.heightM,
        length_m: seed.lengthM,
        is_demo: true,
      }))
      : trucks
  ))
  const [localDrivers, setLocalDrivers] = useState(() => (useDemoFleetView ? FLEET_VIEW_DEMO_DRIVERS : drivers))

  const driverByTruckId = useMemo(() => {
    const map = new Map()
    localDrivers.forEach((driver) => {
      if (driver.assigned_truck_id !== null && driver.assigned_truck_id !== undefined && !map.has(driver.assigned_truck_id)) {
        map.set(driver.assigned_truck_id, driver)
      }
    })
    return map
  }, [localDrivers])


  useEffect(() => {
    // keep local lists in sync when real resources load
    if (!useDemoFleetView) {
      setLocalTrucks(trucks)
      setLocalDrivers(drivers)
    }
  }, [useDemoFleetView, trucks, drivers])
  const railItems = STANDARD_RAIL_ITEMS

  useEffect(() => {
    fetchResourceRef.current = fetchResource
  }, [fetchResource])

  useEffect(() => {
    if (!token || !truckResource || !driverResource) return
    fetchResource(truckResource)
    fetchResource(driverResource)
  }, [token, truckResource, driverResource, fetchResource])

  useEffect(() => {
    if (!token || !truckResource) return undefined
    const timerId = window.setInterval(() => {
      fetchResourceRef.current(truckResource)
    }, liveRefreshMs)
    return () => window.clearInterval(timerId)
  }, [token, truckResource, liveRefreshMs])

  useEffect(() => {
    if (!token) return undefined
    const id = window.setInterval(() => setTick((v) => v + 1), 6000)
    return () => window.clearInterval(id)
  }, [token])

  useEffect(() => {
    const id = window.setInterval(() => setCurrentTime(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let active = true
    async function resolveTruckTimezone() {
      if (!selectedTruck?.location) {
        setTruckTimezone('UTC')
        return
      }
      try {
        const lat = selectedTruck.location.lat
        const lon = selectedTruck.location.lng
        const resp = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m&timezone=auto`,
        )
        const payload = await resp.json().catch(() => null)
        const zone = payload?.timezone
        if (active && typeof zone === 'string' && zone.length > 0) {
          setTruckTimezone(zone)
        }
      } catch {
        // keep last known timezone if lookup fails
      }
    }
    resolveTruckTimezone()
    return () => { active = false }
  }, [selectedTruckId])

  const liveTrucks = useMemo(() => {
    return localTrucks.map((truck, index) => {
      if (truck.is_demo) {
        const phase = tick + index * 2.7
        const stopped = Boolean(truck.stopped)
        return {
          ...truck,
          location: {
            lat: stopped ? truck.baseLat : truck.baseLat + Math.sin(phase / 4) * 0.018,
            lng: stopped ? truck.baseLng : truck.baseLng + Math.cos(phase / 4) * 0.018,
            simulated: true,
          },
          speedKph: stopped ? 0 : Math.max(25, Math.round(truck.baseSpeed + Math.sin(phase / 3) * truck.variance)),
          statusLabel: stopped ? `Stopped · ${truck.stopReason}` : 'On route',
        }
      }

      const location = buildTruckLocation(truck, index, tick)
      const speedKph = 62 + ((Number(truck.id ?? index) * 7 + tick * 3) % 26)
      return {
        ...truck,
        location,
        speedKph,
        statusLabel: truck.status === 'on_trip' ? 'On route' : truck.status,
      }
    })
  }, [localTrucks, tick])

  const filteredTrucks = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return liveTrucks
    return liveTrucks.filter((truck) => {
      const text = `${truck.license_plate} ${truck.make} ${truck.model} ${truck.statusLabel}`.toLowerCase()
      return text.includes(q)
    })
  }, [liveTrucks, search])

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return

    try {
      const map = L.map(mapElRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([NEW_JERSEY_CENTER.lat, NEW_JERSEY_CENTER.lng], NEW_JERSEY_DEFAULT_ZOOM)

      const layerCandidates = [
        {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          options: { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' },
        },
        {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          options: { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors &copy; CARTO' },
        },
      ]

      let activeLayer = null
      let fallbackIndex = 0
      let tileErrors = 0
      let tileLoaded = false

      const attachLayer = (index) => {
        const source = layerCandidates[index]
        if (!source) {
          setMapError('Map tiles failed to load from all providers')
          return
        }

        if (activeLayer) {
          map.removeLayer(activeLayer)
        }

        tileErrors = 0
        tileLoaded = false
        activeLayer = L.tileLayer(source.url, source.options)
        activeLayer.on('tileload', () => {
          tileLoaded = true
          setMapError('')
        })
        activeLayer.on('tileerror', () => {
          tileErrors += 1
          if (!tileLoaded && tileErrors >= 2) {
            fallbackIndex += 1
            attachLayer(fallbackIndex)
          }
        })
        activeLayer.addTo(map)
      }

      attachLayer(fallbackIndex)
      window.setTimeout(() => map.invalidateSize(), 0)

      mapRef.current = map
      setMapError('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize map'
      setMapError(msg)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      mapViewportInitializedRef.current = false
      lastMapSelectionRef.current = null
    }
  }, [token])

  const selectedTruck = filteredTrucks.find((truck) => truck.id === selectedTruckId) ?? filteredTrucks[0]
  const mapTrucks = managerMode
    ? (selectedTruck ? [selectedTruck] : [])
    : filteredTrucks
  const selectedGeofenceCenter = selectedTruck
    ? selectedTruck.is_demo
      ? { lat: selectedTruck.baseLat, lng: selectedTruck.baseLng }
      : selectedTruck.location
    : null
  const selectedGeofenceDistance = selectedTruck && selectedGeofenceCenter
    ? distanceInKm(selectedGeofenceCenter, selectedTruck.location)
    : 0
  const selectedGeofenceInside = selectedGeofenceDistance <= geofenceRadiusKm
  const selectedTruckHeightM = Number(selectedTruck?.heightM ?? selectedTruck?.height_m ?? 4.2)
  const selectedTruckLengthM = Number(selectedTruck?.lengthM ?? selectedTruck?.length_m ?? 20)
  const routeRecommendations = useMemo(() => {
    return ROUTE_SUGGESTIONS.map((route) => ({
      ...route,
      safe: route.clearanceM >= selectedTruckHeightM && route.maxLengthM >= selectedTruckLengthM,
    })).sort((a, b) => Number(b.safe) - Number(a.safe) || a.distanceKm - b.distanceKm)
  }, [selectedTruckHeightM, selectedTruckLengthM])

  useEffect(() => {
    if (!mapRef.current) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []
    if (geofenceRef.current) {
      geofenceRef.current.remove()
      geofenceRef.current = null
    }

    if (mapTrucks.length === 0) {
      mapRef.current.setView([NEW_JERSEY_CENTER.lat, NEW_JERSEY_CENTER.lng], NEW_JERSEY_DEFAULT_ZOOM)
      return
    }

    const bounds = []
    if (geofenceEnabled && selectedTruck && selectedGeofenceCenter) {
      geofenceRef.current = L.circle(
        [selectedGeofenceCenter.lat, selectedGeofenceCenter.lng],
        {
          radius: geofenceRadiusKm * 1000,
          color: selectedGeofenceInside ? '#22a06b' : '#d04437',
          weight: 2,
          dashArray: '7 6',
          fillColor: selectedGeofenceInside ? '#62c59a' : '#ef8f84',
          fillOpacity: 0.12,
        },
      ).addTo(mapRef.current)
    }

    mapTrucks.forEach((truck) => {
      const isSelected = selectedTruckId === truck.id
      const marker = L.circleMarker([truck.location.lat, truck.location.lng], {
        radius: isSelected ? 9 : 7,
        color: '#0f1628',
        weight: 2,
        fillColor: isSelected ? '#f7dc04' : '#2e74ff',
        fillOpacity: 1,
      })

      marker.addTo(mapRef.current)
      marker.bindTooltip(`${truck.license_plate} · ${truck.make} ${truck.model}`, {
        direction: 'top',
        offset: [0, -8],
      })
      marker.on('click', () => setSelectedTruckId(truck.id))

      markersRef.current.push(marker)
      bounds.push([truck.location.lat, truck.location.lng])
    })

    const selectionChanged = lastMapSelectionRef.current !== selectedTruckId
    const shouldSetViewport = !mapViewportInitializedRef.current || selectionChanged

    if (shouldSetViewport) {
      if (mapTrucks.length === 1) {
        mapRef.current.setView([mapTrucks[0].location.lat, mapTrucks[0].location.lng], 10)
      } else {
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 })
      }
      mapViewportInitializedRef.current = true
    }
    lastMapSelectionRef.current = selectedTruckId
  }, [geofenceEnabled, geofenceRadiusKm, mapTrucks, selectedGeofenceCenter, selectedGeofenceInside, selectedTruck, selectedTruckId])

  useEffect(() => {
    let mounted = true
    async function loadWeather() {
      if (!selectedTruck || !selectedTruck.location) {
        setWeatherDetails(null)
        setWeatherError('')
        return
      }
      setWeatherLoading(true)
      setWeatherError('')
      try {
        const lat = selectedTruck.location.lat
        const lon = selectedTruck.location.lng
        const res = await apiRequest(`/hazards/at?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`)
        if (!mounted) return
        const pd = res?.provider_details ?? {}
        // pick the first provider with temperature info
        let picked = null
        for (const key of Object.keys(pd)) {
          const d = pd[key]
          if (d && (d.temp_c !== undefined || d.temperature_2m !== undefined || d.temp !== undefined)) {
            picked = { provider: key, data: d }
            break
          }
        }
        if (!picked) {
          // fallback to any provider
          const first = Object.keys(pd)[0]
          picked = first ? { provider: first, data: pd[first] } : null
        }
        if (picked) {
          const d = picked.data || {}
          const normalized = {
            provider: picked.provider,
            temp_c: d.temp_c ?? d.temperature_2m ?? d.temp,
            feels_like_c: d.feels_like_c ?? d.apparent_temperature,
            humidity_pct: d.humidity_pct ?? d.relative_humidity_2m,
            precip_mm: d.precip_mm ?? d.precipitation,
            cloud_cover_pct: d.cloud_cover_pct ?? d.cloud_cover,
            wind_m_s: d.wind_m_s ?? d.wind_speed_10m,
          }
          setWeatherDetails(normalized)
        } else {
          setWeatherError('Weather service returned no details')
        }
      } catch (err) {
        if (mounted) {
          setWeatherError('Weather refresh failed; showing last update')
        }
      } finally {
        if (mounted) setWeatherLoading(false)
      }
    }
    loadWeather()
    return () => { mounted = false }
  }, [selectedTruckId, selectedTruck?.location?.lat, selectedTruck?.location?.lng])

  function focusTruck(truckId) {
    setSelectedTruckId(truckId)
    const target = filteredTrucks.find((t) => t.id === truckId)
    if (!target || !mapRef.current) return
    mapRef.current.setView([target.location.lat, target.location.lng], 10, { animate: true })
  }


  useEffect(() => {
    if (filteredTrucks.length === 0) {
      setSelectedTruckId(null)
      return
    }
    if (!filteredTrucks.some((truck) => truck.id === selectedTruckId)) {
      setSelectedTruckId(filteredTrucks[0].id)
    }
  }, [filteredTrucks, selectedTruckId])

  const selectedIndex = filteredTrucks.findIndex((truck) => truck.id === selectedTruck?.id)
  const currentDriver = selectedTruck
    ? driverByTruckId.get(selectedTruck.id) ?? null
    : null
  const speedMph = selectedTruck ? Math.round(selectedTruck.speedKph * 0.621371) : 0
  const movingMinutes = selectedTruck ? 8 + ((Number(selectedTruck.id ?? 1) * 3 + tick) % 68) : 0
  const fuelPct = selectedTruck ? 48 + ((Number(selectedTruck.id ?? 1) * 7 + tick * 2) % 43) : 0
  const engineLoad = selectedTruck ? 15 + ((Number(selectedTruck.id ?? 1) * 5 + tick) % 65) : 0
  const batteryV = selectedTruck ? (12 + ((Number(selectedTruck.id ?? 1) * 11 + tick) % 21) / 10).toFixed(1) : '12.0'
  const avgSpeedKph = filteredTrucks.length > 0
    ? Math.round(filteredTrucks.reduce((sum, truck) => sum + truck.speedKph, 0) / filteredTrucks.length)
    : 0
  const inMotionCount = filteredTrucks.filter((truck) => truck.speedKph > 0).length
  const topMovers = [...filteredTrucks]
    .sort((a, b) => b.speedKph - a.speedKph)
    .slice(0, 5)
  const attentionUnits = filteredTrucks
    .map((truck) => {
      const seed = Number(truck.id ?? 1)
      const unitFuel = 48 + ((seed * 7 + tick * 2) % 43)
      const unitEngine = 15 + ((seed * 5 + tick) % 65)
      return { ...truck, unitFuel, unitEngine }
    })
    .filter((truck) => truck.unitFuel < 60 || truck.unitEngine > 70)
    .slice(0, 5)
  const streetViewPoint = selectedTruck
    ? `${selectedTruck.location.lat},${selectedTruck.location.lng}`
    : ''
  const streetViewEmbedUrl = selectedTruck && GOOGLE_MAPS_EMBED_API_KEY
    ? `https://www.google.com/maps/embed/v1/streetview?key=${GOOGLE_MAPS_EMBED_API_KEY}&location=${encodeURIComponent(streetViewPoint)}&heading=${(tick * 18) % 360}&pitch=0&fov=80`
    : ''
  const streetViewMapsUrl = selectedTruck
    ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(streetViewPoint)}`
    : ''
  const cameraFeeds = selectedTruck
    ? [
      { id: 'driver', label: 'Driver Cam', detail: currentDriver?.full_name ?? 'Unassigned driver', image: 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?auto=format&fit=crop&w=900&q=60' },
      { id: 'cargo', label: 'Cargo Cam', detail: `${selectedTruck.make} ${selectedTruck.model}`, image: 'https://images.unsplash.com/photo-1556122071-e404cb6f31d3?auto=format&fit=crop&w=900&q=60' },
    ]
    : []

  function handleShareLocation() {
    if (!selectedTruck) return
    if (streetViewMapsUrl) {
      window.open(streetViewMapsUrl, '_blank', 'noopener,noreferrer')
      return
    }
    const fallbackUrl = `https://maps.google.com/?q=${selectedTruck.location.lat},${selectedTruck.location.lng}`
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
  }

  const truckLocalTime = useMemo(() => {
    try {
      return new Intl.DateTimeFormat([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: truckTimezone,
        hour12: false,
      }).format(currentTime)
    } catch {
      return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    }
  }, [currentTime, truckTimezone])

  return (
    <div className={`live-portal-wrap fleet-monitor-shell ${railCollapsed ? 'rail-collapsed' : ''}`}>
      <aside className={`fleet-icon-rail ${railCollapsed ? 'collapsed' : ''}`}>
        <button type="button" className="fleet-rail-brand" aria-label="Home" onClick={() => navigate('/')}>
          <LogoIcon />
        </button>
        <button className="fleet-rail-toggle" onClick={() => setRailCollapsed((v) => !v)}>
          {railCollapsed ? '>' : '<'}
        </button>
        <div className="fleet-rail-items">
          {railItems.map((item) => {
            const isActive = Boolean(item.to) && isRailRouteActive(location.pathname, item.to)
            return (
              <button
                type="button"
                key={item.key}
                className={`fleet-rail-item ${isActive ? 'active' : ''}`}
                title={item.title}
                onClick={() => item.to && navigate(item.to)}
              >
                <span className="fleet-rail-icon">{item.icon}</span>
                {!railCollapsed && <span className="fleet-rail-label">{item.title}</span>}
              </button>
            )
          })}
        </div>
        <div className="fleet-rail-footer-actions">
          <button type="button" className="fleet-rail-ghost" onClick={() => navigate('/fleet')}>Compliance</button>
          <button className="fleet-rail-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <section className="fleet-details-panel">
        <div className="fleet-panel-topline">
          <p>{managerMode ? 'Fleet Manager' : 'Fleet View'}</p>
          <p>{managerMode ? 'Focused Unit Monitoring' : 'Company Operations Monitoring'}</p>
          <strong>{managerMode ? (selectedTruck ? selectedTruck.license_plate : 'No truck selected') : 'Company Live'}</strong>
        </div>

        {managerMode && filteredTrucks.length > 0 && (
          <div className="fleet-manager-picker">
            <label htmlFor="fleet-manager-unit">Managed fleet unit</label>
            <select
              id="fleet-manager-unit"
              value={selectedTruck ? String(selectedTruck.id) : ''}
              onChange={(e) => {
                const target = filteredTrucks.find((truck) => String(truck.id) === e.target.value)
                if (target) focusTruck(target.id)
              }}
            >
              {filteredTrucks.map((truck) => (
                <option key={truck.id} value={String(truck.id)}>{truck.license_plate} · {truck.make} {truck.model}</option>
              ))}
            </select>
          </div>
        )}

        {managerMode && (
          <div className="fleet-panel-tabs">
            <button type="button" className="active" onClick={() => navigate('/fleet-manager')}>Live</button>
            <button type="button" onClick={() => navigate('/history')}>History</button>
            <button type="button" onClick={() => navigate('/drivers')}>Profile</button>
          </div>
        )}

        {managerMode && selectedTruck ? (
          <>
            <article className="fleet-status-card">
              <div className="fleet-status-head">
                <h3>Status</h3>
                <span>Now</span>
              </div>
              <p className="fleet-speed-line">{speedMph} mph in motion for {movingMinutes}m</p>
              <p className="fleet-address-line">{selectedTruck.location.lat.toFixed(4)}, {selectedTruck.location.lng.toFixed(4)} · New Jersey</p>
              <p className="fleet-dimensions-line">Height {metersToFeet(selectedTruckHeightM).toFixed(1)} ft · Length {metersToFeet(selectedTruckLengthM).toFixed(1)} ft</p>
              <div className="fleet-driver-block">
                <small>Current Driver</small>
                <strong>{currentDriver?.full_name ?? 'Unassigned'}</strong>
              </div>
              <div className="fleet-geofence-block">
                <div className="fleet-geofence-head">
                  <strong>Geofence</strong>
                  <span className={selectedGeofenceInside ? 'geofence-inside' : 'geofence-outside'}>
                    {selectedGeofenceInside ? 'Inside zone' : 'Outside zone'}
                  </span>
                </div>
                <div className="fleet-geofence-controls">
                  <label>
                    Radius (km)
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={geofenceRadiusKm}
                      onChange={(e) => setGeofenceRadiusKm(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </label>
                  <button type="button" onClick={() => setGeofenceEnabled((enabled) => !enabled)}>
                    {geofenceEnabled ? 'Hide Fence' : 'Show Fence'}
                  </button>
                </div>
                <small>{selectedGeofenceDistance.toFixed(1)} km from zone center</small>
              </div>
            </article>

            <article className="fleet-routes-card">
              <div className="fleet-status-head">
                <h3>Suggested Routes</h3>
                <span>Clearance checked</span>
              </div>
              <div className="fleet-route-list">
                {routeRecommendations.map((route) => (
                  <div className={`fleet-route-row ${route.safe ? 'route-safe' : 'route-blocked'}`} key={route.name}>
                    <div>
                      <strong>{route.name}</strong>
                      <p>{route.detail}</p>
                      <small>Bridge {metersToFeet(route.clearanceM).toFixed(1)} ft · Max length {metersToFeet(route.maxLengthM).toFixed(1)} ft · {route.distanceKm} km</small>
                    </div>
                    <span>{route.safe ? 'Recommended' : 'Avoid'}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="fleet-telematics-card">
              <div className="fleet-status-head">
                <h3>Telematics</h3>
                <span>updated now</span>
              </div>
              <div className="fleet-telemetry-grid">
                <div>
                  <small>Fuel</small>
                  <strong>{fuelPct}%</strong>
                </div>
                <div>
                  <small>Engine Load</small>
                  <strong>{engineLoad}%</strong>
                </div>
                <div>
                  <small>Battery</small>
                  <strong>{batteryV}V</strong>
                </div>
              </div>
            </article>

            <article className="fleet-cameras-card">
              <div className="fleet-status-head">
                <h3>Cameras</h3>
                <button onClick={() => truckResource && fetchResource(truckResource)} disabled={!token || !truckResource}>Refresh</button>
              </div>
              <div className="fleet-streetview-panel">
                <div className="fleet-streetview-head">
                  <strong>Google Street View</strong>
                  <a href={streetViewMapsUrl} target="_blank" rel="noreferrer">Open full view</a>
                </div>
                {streetViewEmbedUrl ? (
                  <iframe
                    className="fleet-streetview-frame"
                    title="Fleet live street view"
                    src={streetViewEmbedUrl}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="fleet-streetview-fallback">
                    <p>Add VITE_GOOGLE_MAPS_EMBED_API_KEY in frontend/.env to embed Street View here.</p>
                    <a href={streetViewMapsUrl} target="_blank" rel="noreferrer">Open Street View in Google Maps</a>
                  </div>
                )}
              </div>
              <div className="fleet-camera-grid">
                {cameraFeeds.map((feed) => (
                  <div key={feed.id} className="fleet-camera-tile" style={{ backgroundImage: `linear-gradient(180deg, rgba(20, 36, 59, .24) 0%, rgba(20, 36, 59, .72) 100%), url('${feed.image}')` }}>
                    <span className="fleet-camera-live">LIVE</span>
                    <div className="fleet-camera-meta">
                      <strong>{feed.label}</strong>
                      <small>{feed.detail}</small>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </>
        ) : managerMode ? (
          <p className="fleet-empty">No trucks yet. Create one and refresh trucks.</p>
        ) : (
          <article className="fleet-status-card fleet-view-summary-card">
            <div className="fleet-status-head">
              <h3>Company Live Overview</h3>
              <span>Company wide</span>
            </div>
            <div className="fleet-company-kpis">
              <div>
                <small>Fleets on map</small>
                <strong>{filteredTrucks.length}</strong>
              </div>
              <div>
                <small>In motion</small>
                <strong>{inMotionCount}</strong>
              </div>
              <div>
                <small>Average speed</small>
                <strong>{avgSpeedKph} km/h</strong>
              </div>
            </div>
          </article>
        )}

        {!managerMode && (
          <article className="fleet-list-card fleet-ops-board">
            <div className="fleet-status-head">
              <h3>Dispatch Board</h3>
              <span>Company-level signals</span>
            </div>
            <div className="fleet-ops-columns">
              <div>
                <h4>Top Movers</h4>
                {topMovers.length === 0 && <p className="fleet-empty">No units found.</p>}
                {topMovers.map((truck) => (
                  <div className="fleet-ops-row" key={`mover-${truck.id}`}>
                    <div>
                      <strong>{truck.license_plate}</strong>
                      <p>{truck.make} {truck.model}</p>
                    </div>
                    <span>{truck.speedKph} km/h</span>
                  </div>
                ))}
              </div>
              <div>
                <h4>Needs Attention</h4>
                {attentionUnits.length === 0 && <p className="fleet-ok-line">No critical engine/fuel alerts right now.</p>}
                {attentionUnits.map((truck) => (
                  <div className="fleet-ops-row" key={`attention-${truck.id}`}>
                    <div>
                      <strong>{truck.license_plate}</strong>
                      <p>Fuel {truck.unitFuel}% · Engine {truck.unitEngine}%</p>
                    </div>
                    <button className="fleet-jump-btn" onClick={() => focusTruck(truck.id)}>Track</button>
                  </div>
                ))}
              </div>
            </div>
          </article>
        )}

        <article className="fleet-list-card">
          <div className="fleet-status-head">
            <h3>{managerMode ? 'Fleet Units' : 'Company Fleet Roster'}</h3>
            <span>{filteredTrucks.length} active</span>
          </div>
          <input
            className="live-search"
            placeholder={managerMode ? 'Search selected fleet unit' : 'Search company fleet'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="fleet-live-list">
            {filteredTrucks.map((truck, index) => (
              <button
                key={truck.id}
                className={`fleet-live-row ${selectedTruckId === truck.id ? 'selected' : ''}`}
                onClick={() => focusTruck(truck.id)}
              >
                <div>
                  <strong>{truck.license_plate}</strong>
                  <p>{truck.make} {truck.model}</p>
                </div>
                <div>
                  <span>{truck.speedKph} km/h</span>
                  <small>#{selectedIndex === index ? 'tracking' : index + 1}</small>
                </div>
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="fleet-map-area">
        <div className="fleet-map-header">
          {!managerMode && <span className="fleet-live-badge">LIVE TRACKING · {Math.round(liveRefreshMs / 1000)}s refresh</span>}
          <button className="fleet-header-btn" onClick={() => truckResource && fetchResource(truckResource)} disabled={!token || !truckResource}>Refresh Vehicles</button>
          <button className="fleet-header-btn" onClick={refreshAllResources} disabled={!token}>Sync All</button>
          <button className="fleet-header-btn primary" onClick={handleShareLocation} disabled={!selectedTruck}>Share Location</button>
        </div>

        <div className="fleet-map-shell">
          {mapError && (
            <div className="live-map-dummy" aria-label="Dummy map">
              <div className="live-map-grid" />
              <div className="live-map-road road-a" />
              <div className="live-map-road road-b" />
              <div className="live-map-road road-c" />
              <div className="live-map-pin pin-a" />
              <div className="live-map-pin pin-b" />
              <div className="live-map-pin pin-c" />
              <div className="live-map-label">New Jersey Demo Map</div>
            </div>
          )}
          <div ref={mapElRef} className="fleet-map-canvas" />
          {selectedTruck && (
            <div className="fleet-weather-window" aria-live="polite">
              <div>
                <div className="fleet-weather-head">
                  <div>
                    <strong>Weather</strong>
                    <small>{weatherDetails?.provider ?? 'provider unavailable'}</small>
                  </div>
                  <div className="fleet-weather-meta">
                    <small>{selectedTruck.license_plate}</small>
                    <span>{truckLocalTime}</span>
                    <span>{truckTimezone}</span>
                  </div>
                </div>

                <div className="fleet-weather-body">
                  <div className="fleet-weather-temp">{weatherDetails?.temp_c !== undefined ? `${Math.round(weatherDetails.temp_c)}°C` : 'N/A'}</div>
                  <div className="fleet-weather-grid">
                    <div><strong>Feels</strong><div>{weatherDetails?.feels_like_c !== undefined ? `${Math.round(weatherDetails.feels_like_c)}°C` : 'N/A'}</div></div>
                    <div><strong>Humidity</strong><div>{weatherDetails?.humidity_pct ?? 'N/A'}%</div></div>
                    <div><strong>Precip</strong><div>{weatherDetails?.precip_mm ?? 'N/A'} mm</div></div>
                    <div><strong>Clouds</strong><div>{weatherDetails?.cloud_cover_pct ?? 'N/A'}%</div></div>
                  </div>
                </div>

                {weatherLoading && <div className="fleet-weather-loading">Refreshing weather…</div>}
                {!!weatherError && <div className="fleet-weather-error">{weatherError}</div>}
              </div>
            </div>
          )}
          {mapError && (
            <div className="live-map-note">
              <strong>Fallback map active</strong>
              <p>{mapError}. Showing built-in dummy map until map tiles are reachable.</p>
            </div>
          )}
          <div className="fleet-map-count-pill">
            {managerMode ? `${mapTrucks.length} selected unit live` : `${filteredTrucks.length} company units live`} · {localTrucks.length} company trucks
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Auth wrapper ─────────────────────────────────────────────────────────────
function AuthPage({ title, subtitle, children, message }) {
  return (
    <div className="auth-page">
      <a href="/" className="auth-logo-link"><LogoIcon /><span>ATONDA</span></a>
      <div className="auth-card">
        <h2>{title}</h2>
        <p className="auth-sub">{subtitle}</p>
        {children}
        {message && <p className="auth-msg">{message}</p>}
      </div>
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  const navigate = useNavigate()
  const [token, setToken] = useState(() => localStorage.getItem('truckAppToken') ?? '')
  const authResetRef = useRef(false)
  const [registerForm, setRegisterForm] = useState(DEFAULT_REGISTER)
  const [loginForm, setLoginForm] = useState(DEFAULT_LOGIN)
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [resources, setResources] = useState(() =>
    RESOURCE_CONFIG.reduce((a, r) => { a[r.key] = DEFAULT_RESOURCE_STATE; return a }, {}),
  )
  const [createPayloads, setCreatePayloads] = useState(() =>
    RESOURCE_CONFIG.reduce((a, r) => { a[r.key] = JSON.stringify(r.template, null, 2); return a }, {}),
  )
  const [spendingSummary, setSpendingSummary] = useState([])
  const [summaryError, setSummaryError] = useState('')

  const fleetCount = useMemo(
    () => RESOURCE_CONFIG.reduce((n, r) => n + (resources[r.key]?.items?.length ?? 0), 0),
    [resources],
  )

  const saveToken = useCallback((t) => {
    if (!t) { localStorage.removeItem('truckAppToken'); setToken(''); return }
    localStorage.setItem('truckAppToken', t); setToken(t)
  }, [])

  const updRes = useCallback((key, partial) => {
    setResources((c) => ({ ...c, [key]: { ...c[key], ...partial } }))
  }, [])

  const fetchResource = useCallback(async (r) => {
    updRes(r.key, { loading: true, error: '' })
    try {
      updRes(r.key, { items: (await apiRequest(r.path, { token })) ?? [], loading: false, error: '' })
    } catch (err) {
      updRes(r.key, { loading: false, error: err.message })
      if (err.status === 401 && !authResetRef.current) {
        authResetRef.current = true
        saveToken('')
        setAuthMessage('Your session expired. Please sign in again.')
        navigate('/login', { replace: true })
        window.setTimeout(() => { authResetRef.current = false }, 0)
      }
    }
  }, [navigate, token, updRes])

  const fetchSpendingSummary = useCallback(async () => {
    setSummaryError('')
    try { setSpendingSummary((await apiRequest('/trucks/spending/summary', { token })) ?? []) }
    catch (err) { setSummaryError(err.message) }
  }, [token])

  const refreshAllResources = useCallback(async () => {
    if (!token) return
    await Promise.all(RESOURCE_CONFIG.map(fetchResource))
    await fetchSpendingSummary()
    setAuthMessage('Data synced.')
  }, [fetchResource, fetchSpendingSummary, token])

  async function handleRegister(e) {
    e.preventDefault(); setAuthLoading(true); setAuthMessage('')
    try {
      await apiRequest('/auth/register', { method: 'POST', body: registerForm })
      setAuthMessage('Registered! You can now log in.')
      setRegisterForm(DEFAULT_REGISTER); navigate('/login')
    } catch (err) { setAuthMessage(err.message) }
    finally { setAuthLoading(false) }
  }

  async function handleLogin(e) {
    e.preventDefault(); setAuthLoading(true); setAuthMessage('')
    try {
      const data = await apiRequest('/auth/login', { method: 'POST', body: loginForm })
      saveToken(data.access_token); setAuthMessage('Login successful.')
      navigate('/portal'); await refreshAllResources()
    } catch (err) { setAuthMessage(err.message) }
    finally { setAuthLoading(false) }
  }

  async function handleCreateResource(r) {
    try {
      await apiRequest(r.path, { method: 'POST', token, body: JSON.parse(createPayloads[r.key]) })
      setAuthMessage(`${r.label} record created.`); await fetchResource(r)
      if (r.key === 'maintenance' || r.key === 'ifta') await fetchSpendingSummary()
    } catch (err) { setAuthMessage(err.message) }
  }

  const handleLogout = useCallback(() => {
    saveToken(''); setAuthMessage(''); setSpendingSummary([])
    setResources(RESOURCE_CONFIG.reduce((a, r) => { a[r.key] = DEFAULT_RESOURCE_STATE; return a }, {}))
  }, [saveToken])

  const portalProps = {
    token, resources, createPayloads, setCreatePayloads,
    spendingSummary, summaryError, fleetCount,
    refreshAllResources, handleLogout, fetchResource, handleCreateResource, authMessage,
  }

  return (
    <Routes>
      <Route path="/" element={<Landing token={token} />} />

      <Route
        path="/login"
        element={
          <AuthPage title="Sign in" subtitle="Access your existing fleet portal account." message={authMessage}>
            <form className="auth-form" onSubmit={handleLogin}>
              <p className="auth-footer-text">Quick test login: demo@truckappdemo.com / Demo123!</p>
              <button
                type="button"
                className="p-btn p-btn-sec"
                onClick={() => setLoginForm(DUMMY_LOGIN)}
              >
                Use dummy login
              </button>
              <input required type="email" placeholder="Email" value={loginForm.email}
                onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))} />
              <input required type="password" placeholder="Password" value={loginForm.password}
                onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))} />
              <button type="submit" className="btn-yellow" disabled={authLoading}>{authLoading ? 'Signing in...' : 'Login'}</button>
              <p className="auth-footer-text">No account? <Link to="/signup">Sign up</Link> &middot; <Link to="/">Home</Link></p>
            </form>
          </AuthPage>
        }
      />

      <Route
        path="/signup"
        element={
          <AuthPage title="Create account" subtitle="Register a new account for the fleet portal." message={authMessage}>
            <form className="auth-form" onSubmit={handleRegister}>
              <input required type="email" placeholder="Email" value={registerForm.email}
                onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))} />
              <input required placeholder="Full name" value={registerForm.full_name}
                onChange={(e) => setRegisterForm((f) => ({ ...f, full_name: e.target.value }))} />
              <input required type="password" placeholder="Password" value={registerForm.password}
                onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))} />
              <select value={registerForm.account_type}
                onChange={(e) => setRegisterForm((f) => ({ ...f, account_type: e.target.value }))}>
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
              <input placeholder="Company name (required for company)" value={registerForm.company_name}
                onChange={(e) => setRegisterForm((f) => ({ ...f, company_name: e.target.value }))} />
              <button type="submit" className="btn-yellow" disabled={authLoading}>{authLoading ? 'Registering...' : 'Register'}</button>
              <p className="auth-footer-text">Have an account? <Link to="/login">Login</Link> &middot; <Link to="/">Home</Link></p>
            </form>
          </AuthPage>
        }
      />

      <Route path="/portal" element={token ? <Portal {...portalProps} managerMode={false} /> : <Navigate to="/login" replace />} />
      <Route path="/fleet-manager" element={token ? <Portal {...portalProps} managerMode /> : <Navigate to="/login" replace />} />
      <Route path="/routes" element={token ? <RoutesPage handleLogout={handleLogout} /> : <Navigate to="/login" replace />} />
      <Route path="/safety" element={token ? <FeaturePlaceholderPage handleLogout={handleLogout} title="Safety" subtitle="Safety events, incidents, and compliance follow-up." /> : <Navigate to="/login" replace />} />
      <Route path="/alerts" element={token ? <FeaturePlaceholderPage handleLogout={handleLogout} title="Alerts" subtitle="Operational alerts and notifications in one place." /> : <Navigate to="/login" replace />} />
      <Route path="/cameras" element={token ? <FeaturePlaceholderPage handleLogout={handleLogout} title="Cameras" subtitle="Camera status and video feed management." /> : <Navigate to="/login" replace />} />
      <Route path="/vehicles" element={token ? <VehiclesPage token={token} resources={resources} refreshAllResources={refreshAllResources} handleLogout={handleLogout} fetchResource={fetchResource} /> : <Navigate to="/login" replace />} />
      <Route path="/drivers" element={token ? <DriversPage token={token} resources={resources} refreshAllResources={refreshAllResources} handleLogout={handleLogout} fetchResource={fetchResource} /> : <Navigate to="/login" replace />} />
      <Route path="/drivers/:driverId" element={token ? <DriverDetailsPage token={token} resources={resources} refreshAllResources={refreshAllResources} handleLogout={handleLogout} fetchResource={fetchResource} /> : <Navigate to="/login" replace />} />
      <Route path="/history" element={token ? <HistoryPage token={token} resources={resources} refreshAllResources={refreshAllResources} handleLogout={handleLogout} fetchResource={fetchResource} /> : <Navigate to="/login" replace />} />
      <Route path="/fleet" element={token ? <FleetCompliance token={token} resources={resources} refreshAllResources={refreshAllResources} /> : <Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
