import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
const NEW_JERSEY_CENTER = { lat: 40.0583, lng: -74.4057 }
const NEW_JERSEY_DEFAULT_ZOOM = 8
const HERO_TRUCK_TOP_IMAGE = 'https://rockeld.us/wp-content/uploads/2024/12/Truck-PNG.png'
const HERO_TRUCK_VERTICAL_IMAGE = 'https://rockeld.us/wp-content/uploads/2024/12/img-01-01.png'

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
    template: { full_name: 'Alex Driver', email: 'alex.driver@example.com', phone: '+1-555-0100', license_number: 'D1234567', license_class: 'class_a', license_expiry: '2030-12-31' },
  },
  {
    key: 'trips',
    label: 'Trips',
    path: '/trips/',
    template: { truck_id: 1, driver_id: 1, origin: 'Dallas, TX', destination: 'Phoenix, AZ', cargo_description: 'Construction materials', cargo_weight_tons: 8, scheduled_departure: '2026-07-20T09:00:00', notes: 'Deliver before noon if possible' },
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
  if (!res.ok) throw new Error(payload?.detail ?? `Request failed ${res.status}`)
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
    <div className={`orbit-item ${align}`}>
      <div className={`orbit-num-row ${align}`}>
        <span className="orbit-num">{number}</span>
        <span className="orbit-num-line" />
      </div>
      <div className="orbit-icon-box">{icon}</div>
      <h4 className="orbit-title">{title}</h4>
      <p className="orbit-desc">{desc}</p>
    </div>
  )
}

function BenefitCard({ title, desc }) {
  return (
    <div className="benefit-card">
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

// ─── Landing Page ─────────────────────────────────────────────────────────────
function Landing({ token }) {
  const [menuOpen, setMenuOpen] = useState(false)
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
            <a href="#testimonials" onClick={closeMenu}>Testimonials</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
            <span className="nav-sep" />
            <Link to={token ? '/portal' : '/login'} className="nav-login-btn" onClick={closeMenu}>
              {token ? 'Portal' : 'Login'}
            </Link>
            <span className="nav-sep" />
            <div className="header-languages" aria-label="Language selector">
              <a href="#" lang="en">EN</a>
              <a href="#" lang="ru">RU</a>
              <a href="#" lang="uk">UA</a>
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
            <div className="hero-content-card">
              <EyebrowRow />
              <h2 className="hero-h2">Keep your fleet on solid ground</h2>
              <h5 className="hero-h5">Your partner in compliance, safety, and efficiency.</h5>
              <div className="hero-actions">
                <a href="#contact" className="btn-yellow">Request a demo</a>
              </div>
            </div>
            <div className="hero-call-card">
              <p>Call and book an appointment</p>
              <a href="tel:7083232997">(708) 323-2997</a>
            </div>
          </div>
          <div className="hero-truck-strip">
            <img className="hero-truck-top-image" src={HERO_TRUCK_TOP_IMAGE} alt="Truck side view" loading="eager" />
          </div>
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
              <div className="orbit-diamond orbit-diamond-a" />
              <div className="orbit-diamond orbit-diamond-b" />
              <img className="orbit-truck" src={HERO_TRUCK_VERTICAL_IMAGE} alt="Truck top view" loading="lazy" />
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
            <div className="about-cta-left">
              <EyebrowRow />
              <h2>Built for drivers, designed for success</h2>
              <p className="sect-sub">Our platform provides a powerful, easy-to-use solution to simplify fleet operations and ensure compliance.</p>
              <a href="#contact" className="btn-yellow">Request a demo</a>
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
        <div className="sect-inner footer-cta-inner">
          <h3 className="footer-cta-h3">
            Ready to build a <em>rock-solid foundation</em> for your fleet? Reach out to us today!
          </h3>
          <a href="#contact" className="btn-yellow">Request a demo</a>
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

// ─── Portal ───────────────────────────────────────────────────────────────────
function Portal({
  token, resources, fleetCount,
  refreshAllResources, handleLogout, fetchResource,
}) {
  const [railCollapsed, setRailCollapsed] = useState(true)
  const [mapError, setMapError] = useState('')
  const [search, setSearch] = useState('')
  const [tick, setTick] = useState(0)
  const [selectedTruckId, setSelectedTruckId] = useState(null)

  const mapElRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  const truckResource = RESOURCE_CONFIG.find((r) => r.key === 'trucks')
  const trucks = resources.trucks?.items ?? []
  const railItems = [
    { key: 'dash', icon: '[]', title: 'Dashboard' },
    { key: 'fleet', icon: 'F', title: 'Fleet' },
    { key: 'camera', icon: 'C', title: 'Cameras' },
    { key: 'map', icon: 'M', title: 'Map' },
    { key: 'route', icon: 'R', title: 'Routing' },
    { key: 'service', icon: 'S', title: 'Service' },
    { key: 'jobs', icon: 'J', title: 'Jobs' },
    { key: 'alerts', icon: 'A', title: 'Alerts' },
    { key: 'support', icon: '?', title: 'Support' },
    { key: 'settings', icon: '*', title: 'Settings' },
  ]

  useEffect(() => {
    if (!token || !truckResource) return
    fetchResource(truckResource)
  }, [token])

  useEffect(() => {
    if (!token) return undefined
    const id = window.setInterval(() => setTick((v) => v + 1), 6000)
    return () => window.clearInterval(id)
  }, [token])

  const liveTrucks = useMemo(() => {
    return trucks.map((truck, index) => {
      const location = buildTruckLocation(truck, index, tick)
      const speedKph = 62 + ((Number(truck.id ?? index) * 7 + tick * 3) % 26)
      return {
        ...truck,
        location,
        speedKph,
        statusLabel: truck.status === 'on_trip' ? 'On route' : truck.status,
      }
    })
  }, [trucks, tick])

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
    }
  }, [token])

  useEffect(() => {
    if (!mapRef.current) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    if (filteredTrucks.length === 0) {
      mapRef.current.setView([NEW_JERSEY_CENTER.lat, NEW_JERSEY_CENTER.lng], NEW_JERSEY_DEFAULT_ZOOM)
      return
    }

    const bounds = []
    filteredTrucks.forEach((truck) => {
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

    if (filteredTrucks.length === 1) {
      mapRef.current.setView([filteredTrucks[0].location.lat, filteredTrucks[0].location.lng], 10)
    } else {
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 })
    }
  }, [filteredTrucks, selectedTruckId])

  function focusTruck(truckId) {
    setSelectedTruckId(truckId)
    const target = filteredTrucks.find((t) => t.id === truckId)
    if (!target || !mapRef.current) return
    mapRef.current.setView([target.location.lat, target.location.lng], 10, { animate: true })
  }

  const selectedTruck = filteredTrucks.find((truck) => truck.id === selectedTruckId) ?? filteredTrucks[0]

  return (
    <div className="live-portal-wrap">
      <header className="live-topbar">
        <div className="live-top-left">
          <a href="/" className="portal-logo-link"><LogoIcon /><span>ATONDA</span></a>
          <button className="live-square-btn" onClick={() => setRailCollapsed((v) => !v)}>
            {railCollapsed ? '>' : '<'}
          </button>
        </div>
        <div className="live-top-actions">
          <button className="live-pill-btn" onClick={() => truckResource && fetchResource(truckResource)} disabled={!token || !truckResource}>Refresh Trucks</button>
          <button className="live-pill-btn" onClick={refreshAllResources} disabled={!token}>Sync All</button>
          <button className="live-pill-btn ghost" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="live-main">
        <aside className={`live-rail ${railCollapsed ? 'collapsed' : ''}`}>
          {railItems.map((item, idx) => (
            <button key={item.key} className={`live-rail-item ${idx === 0 ? 'active' : ''}`} title={item.title}>
              <span>{item.icon}</span><em>{item.title}</em>
            </button>
          ))}
          <button className="live-rail-collapse-tip" onClick={() => setRailCollapsed((v) => !v)}>
            {railCollapsed ? '>>' : '<<'}
          </button>
        </aside>

        <section className="live-map-section">
          <div className="live-map-shell">
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

            <div ref={mapElRef} className="live-map-canvas" />

            <div className="live-map-top-controls">
              <div className="live-map-control-group">
                <button className="live-map-chip">Refresh</button>
                <button className="live-map-chip">Fleet</button>
                <button className="live-map-chip">Traffic</button>
                <button className="live-map-chip">Fullscreen</button>
              </div>
              <div className="live-map-control-group right">
                <button className="live-map-chip primary">Live Share</button>
              </div>
            </div>

            <div className="live-fleet-panel">
              <div className="live-fleet-tabs">
                <button className="active">Vehicles</button>
                <button>Drivers</button>
                <button>Signals</button>
              </div>
              <input
                className="live-search"
                placeholder="Search by Driver, Vehicle ID or Trailer"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="live-panel-summary">
                <span>{filteredTrucks.length} active</span>
                <span>{fleetCount} records</span>
                <span>{selectedTruck ? `${selectedTruck.speedKph} km/h` : '--'}</span>
              </div>
              <div className="live-truck-list">
                {filteredTrucks.length === 0 && <p className="live-empty">No trucks yet. Create one and click Refresh Trucks.</p>}
                {filteredTrucks.map((truck) => (
                  <button
                    key={truck.id}
                    className={`live-truck-card ${selectedTruckId === truck.id ? 'selected' : ''}`}
                    onClick={() => focusTruck(truck.id)}
                  >
                    <div className="live-card-top">
                      <strong>{truck.license_plate}</strong>
                      <span>{truck.speedKph} km/h</span>
                    </div>
                    <p>{truck.make} {truck.model} • {String(truck.statusLabel).replace('_', ' ')}</p>
                    <small>
                      {truck.location.lat.toFixed(4)}, {truck.location.lng.toFixed(4)}
                      {truck.location.simulated ? ' (simulated)' : ''}
                    </small>
                  </button>
                ))}
              </div>
            </div>

            {mapError && (
              <div className="live-map-note">
                <strong>Fallback map active</strong>
                <p>{mapError}. Showing built-in dummy map until map tiles are reachable.</p>
              </div>
            )}
          </div>
        </section>
      </div>
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

  function saveToken(t) {
    if (!t) { localStorage.removeItem('truckAppToken'); setToken(''); return }
    localStorage.setItem('truckAppToken', t); setToken(t)
  }

  function updRes(key, partial) {
    setResources((c) => ({ ...c, [key]: { ...c[key], ...partial } }))
  }

  async function fetchResource(r) {
    updRes(r.key, { loading: true, error: '' })
    try {
      updRes(r.key, { items: (await apiRequest(r.path, { token })) ?? [], loading: false, error: '' })
    } catch (err) { updRes(r.key, { loading: false, error: err.message }) }
  }

  async function fetchSpendingSummary() {
    setSummaryError('')
    try { setSpendingSummary((await apiRequest('/trucks/spending/summary', { token })) ?? []) }
    catch (err) { setSummaryError(err.message) }
  }

  async function refreshAllResources() {
    if (!token) return
    await Promise.all(RESOURCE_CONFIG.map(fetchResource))
    await fetchSpendingSummary()
    setAuthMessage('Data synced.')
  }

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

  function handleLogout() {
    saveToken(''); setAuthMessage(''); setSpendingSummary([])
    setResources(RESOURCE_CONFIG.reduce((a, r) => { a[r.key] = DEFAULT_RESOURCE_STATE; return a }, {}))
  }

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

      <Route path="/portal" element={<Portal {...portalProps} />} />
    </Routes>
  )
}

export default App
