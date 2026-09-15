import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { geoNaturalEarth1, geoPath, geoGraticule10 } from 'd3-geo'
import L from 'leaflet'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { feature } from 'topojson-client'
import worldLand from 'world-atlas/land-110m.json'
import heroVideo from './assets/Hailuo_Video_A cinematic realistic fleet of_554063152114913281.mp4'
import dashboardImage from './assets/dashboardimage.png'
import { FleetMotionBoard, GpsTrackingPanel, LiveStatsStrip } from './FleetMotion'
import { useLandingMotion } from './useLandingMotion'
import TerminalStyleHeader from './TerminalStyleHeader'
import TerminalStyleFooter from './TerminalStyleFooter'
import TerminalStyleFAQ from './TerminalStyleFAQ'
import TerminalStyleContact from './TerminalStyleContact'
import TerminalStyleQuote from './TerminalStyleQuote'
import TerminalStyleLogoGrid from './TerminalStyleLogoGrid'

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://fleet-api-tkapesa.onrender.com'
const GOOGLE_MAPS_EMBED_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY ?? ''
const NEW_JERSEY_CENTER = { lat: 40.0583, lng: -74.4057 }
const NEW_JERSEY_DEFAULT_ZOOM = 8
const HERO_VIDEO_URL = heroVideo
const WHATSAPP_CONTACT_URL = 'https://wa.me/19177536653?text=Hi%20ATONDA%20team%2C%20I%20need%20help%20with%20fleet%20management.'

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
const SITE_COPY = {
  en: {
    features: 'Features', compliance: 'Fleet Compliance', contact: 'Contact', login: 'Login', portal: 'Portal', language: 'Language',
    contactTeam: 'Contact our team', dispatchSupport: '24/7 dispatch support', eyebrow: 'ATONDA FLEET OS',
    heroTitle: 'Fleet management.', heroAccent: 'Freight delivered.', heroCopy: "Real-time GPS, compliance, and dispatch for fleets that can't afford downtime. Every fleet, every load, every mile, visible in one command center.",
    demo: 'Request a demo', openingDemo: 'Opening demo...', seeFleet: 'See the fleet in motion', appointment: 'Call and book an appointment',
    whatWeDo: 'WHAT WE DO', engine: 'The engine of every fleet.', engineCopy: "We don't just show fleet management activity on a map. We connect GPS tracking, driver compliance, and dispatch into one live view, so you always know where every load stands, from pickup to delivery.",
    authWorkspace: 'Fleet operations workspace', signIn: 'Sign in', signInSub: 'Access your existing fleet portal account.', createAccount: 'Create account', createAccountSub: 'Set up a secure workspace for your fleet.', control: 'ATONDA CONTROL', everyMile: 'Every mile.', inView: 'In view.', authContext: 'A clearer operating picture for dispatch, compliance, and the people moving freight.',
    workEmail: 'Work email', password: 'Password', fullName: 'Full name', createPassword: 'Create password', workspaceType: 'Workspace type', companyName: 'Company name', optional: '(optional)', emailPlaceholder: 'name@company.com', passwordPlaceholder: 'Enter your password', newPasswordPlaceholder: 'Create a secure password', namePlaceholder: 'Your full name', companyPlaceholder: 'Your business name', enterPortal: 'Enter fleet portal', testAccount: 'Fill test account', createWorkspace: 'Create workspace', newToAtonda: 'New to ATONDA?', createAnAccount: 'Create an account', alreadyHaveAccess: 'Already have access?', independentOperator: 'Independent operator', fleetCompany: 'Fleet company', home: 'Home', fleetVisibility: 'Fleet visibility', operationalSignals: 'Operational signals',
  },
  fr: {
    features: 'Fonctionnalites', compliance: 'Conformite flotte', contact: 'Contact', login: 'Connexion', portal: 'Portail', language: 'Langue',
    contactTeam: 'Contacter notre equipe', dispatchSupport: 'Assistance repartition 24 h/24, 7 j/7', eyebrow: 'ATONDA FLEET OS',
    heroTitle: 'Gestion de flotte.', heroAccent: 'Fret livre.', heroCopy: "GPS en temps reel, conformite et repartition pour les flottes qui ne peuvent pas se permettre d'arret. Chaque flotte, chaque chargement, chaque kilometre, visible dans un seul centre de controle.",
    demo: 'Demander une demo', openingDemo: 'Ouverture de la demo...', seeFleet: 'Voir la flotte en mouvement', appointment: 'Appelez pour prendre rendez-vous',
    whatWeDo: 'NOS SERVICES', engine: 'Le moteur de chaque flotte.', engineCopy: "Nous ne montrons pas seulement l'activite de votre flotte sur une carte. Nous relions le suivi GPS, la conformite des conducteurs et la repartition dans une vue en direct.",
    authWorkspace: "Espace d'exploitation de flotte", signIn: 'Connexion', signInSub: 'Accedez a votre espace flotte existant.', createAccount: 'Creer un compte', createAccountSub: 'Creez un espace securise pour votre flotte.', control: 'ATONDA CONTROL', everyMile: 'Chaque kilometre.', inView: 'En vue.', authContext: "Une vision plus claire pour la repartition, la conformite et les personnes qui transportent votre fret.",
    workEmail: 'E-mail professionnel', password: 'Mot de passe', fullName: 'Nom complet', createPassword: 'Creer un mot de passe', workspaceType: "Type d'espace", companyName: "Nom de l'entreprise", optional: '(facultatif)', emailPlaceholder: 'nom@entreprise.com', passwordPlaceholder: 'Saisissez votre mot de passe', newPasswordPlaceholder: 'Creez un mot de passe securise', namePlaceholder: 'Votre nom complet', companyPlaceholder: 'Le nom de votre entreprise', enterPortal: 'Acceder au portail', testAccount: 'Remplir le compte test', createWorkspace: "Creer l'espace", newToAtonda: 'Nouveau sur ATONDA ?', createAnAccount: 'Creer un compte', alreadyHaveAccess: 'Vous avez deja un acces ?', independentOperator: 'Operateur independant', fleetCompany: 'Entreprise de flotte', home: 'Accueil', fleetVisibility: 'Visibilite de flotte', operationalSignals: "Signaux d'exploitation",
  },
}

function getSiteCopy(language) {
  return SITE_COPY[language] ?? SITE_COPY.en
}
const PLANNER_DEMO_VEHICLES = [
  { id: 'ATD-101', make: 'Volvo', model: 'FH16', driver: 'Jordan Lee', route: 'Prague to Leipzig', status: 'On route', speed: 71, fuel: 78, lat: 50.12, lng: 13.42, phase: 0.4 },
  { id: 'ATD-102', make: 'Freightliner', model: 'Cascadia', driver: 'Morgan Diaz', route: 'Nuremberg to Dresden', status: 'On route', speed: 64, fuel: 61, lat: 49.72, lng: 11.35, phase: 2.1 },
  { id: 'ATD-104', make: 'Kenworth', model: 'T680', driver: 'Casey Brooks', route: 'Berlin to Prague', status: 'Traffic delay', speed: 42, fuel: 53, lat: 51.12, lng: 12.88, phase: 3.8 },
  { id: 'ATD-107', make: 'Volvo', model: 'VNL', driver: 'Riley Morgan', route: 'Munich to Chemnitz', status: 'Stopped', speed: 0, fuel: 85, lat: 48.96, lng: 12.18, phase: 0 },
]

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
  { key: 'fleet-view', title: 'Fleet View', to: '/portal' },
  { key: 'fleet-manager', title: 'Fleet Manager', to: '/fleet-manager' },
  { key: 'drivers', title: 'Drivers', to: '/drivers' },
  { key: 'vehicles', title: 'Vehicles', to: '/vehicles' },
  { key: 'history', title: 'History', to: '/history' },
  { key: 'safety', title: 'Safety', to: '/safety' },
  { key: 'alerts', title: 'Alerts', to: '/alerts' },
  { key: 'cameras', title: 'Cameras', to: '/cameras' },
  { key: 'routes', title: 'Routes', to: '/routes' },
  { key: 'support', title: 'Support', to: '/compliance' },
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

function RailChevronIcon({ collapsed }) {
  return (
    <svg
      className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function PlannerPanelIcon({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M14 4v16" />
      <path d={open ? 'm11 9-3 3 3 3' : 'm8 9 3 3-3 3'} />
    </svg>
  )
}

function PlannerThemeIcon({ light }) {
  return light ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  ) : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M20 15.4A8.5 8.5 0 0 1 8.6 4 8.5 8.5 0 1 0 20 15.4Z" /></svg>
}

function RailItemIcon({ itemKey }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.9',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  }

  switch (itemKey) {
    case 'fleet-view':
      return <svg {...common}><path d="M3 9.5 12 4l9 5.5v10A1.5 1.5 0 0 1 19.5 21h-15A1.5 1.5 0 0 1 3 19.5z" /><path d="M7.5 14h9" /></svg>
    case 'fleet-manager':
      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M3 10h18" /><path d="M8 4v16" /></svg>
    case 'drivers':
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 18a5.5 5.5 0 0 1 11 0" /><circle cx="17" cy="9" r="2.3" /><path d="M15 18a4 4 0 0 1 6 0" /></svg>
    case 'vehicles':
      return <svg {...common}><rect x="3" y="8" width="18" height="8" rx="2" /><path d="M7 8V6.5A1.5 1.5 0 0 1 8.5 5h7A1.5 1.5 0 0 1 17 6.5V8" /><circle cx="8" cy="17.5" r="1.5" /><circle cx="16" cy="17.5" r="1.5" /></svg>
    case 'history':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
    case 'safety':
      return <svg {...common}><path d="M12 3 5 6v6.6c0 4.4 2.9 6.8 7 8.4 4.1-1.6 7-4 7-8.4V6z" /><path d="m9.5 12.2 1.8 1.8 3.7-3.7" /></svg>
    case 'alerts':
      return <svg {...common}><path d="M12 3a6 6 0 0 0-6 6v3.5L4 15h16l-2-2.5V9a6 6 0 0 0-6-6Z" /><path d="M9.5 18a2.5 2.5 0 0 0 5 0" /></svg>
    case 'cameras':
      return <svg {...common}><rect x="3" y="7" width="12" height="10" rx="2" /><path d="m15 10 6-2v8l-6-2" /><circle cx="9" cy="12" r="2" /></svg>
    case 'routes':
      return <svg {...common}><circle cx="6" cy="7" r="2" /><circle cx="18" cy="17" r="2" /><path d="M8 7h5a3 3 0 0 1 3 3v2" /><path d="M16 15H11a3 3 0 0 1-3-3v-2" /></svg>
    case 'support':
      return <svg {...common}><path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 2.8-2 5-4.5 5H12" /><path d="M12 15v2" /><rect x="4" y="14.5" width="3" height="5" rx="1" /><rect x="17" y="14.5" width="3" height="5" rx="1" /></svg>
    case 'logout':
      return <svg {...common}><path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" /><path d="m14 16 4-4-4-4" /><path d="M18 12H9" /></svg>
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>
  }
}

function FleetPortalRail({ railCollapsed, setRailCollapsed, railItems, currentPath, navigate, handleLogout }) {
  return (
    <aside className={`sticky top-0 flex h-svh flex-col gap-3 overflow-y-auto border-r border-border bg-[linear-gradient(180deg,#0f1727_0%,#0a101b_100%)] py-3 ${railCollapsed ? 'px-1.5' : 'px-2.5'}`}>
      <button type="button" className="mx-auto grid h-[50px] w-[50px] place-items-center rounded-xl border border-border bg-white/5 transition hover:border-border-strong" aria-label="Home" onClick={() => navigate('/')}>
        <LogoIcon />
      </button>
      <button
        type="button"
        className="mx-auto grid h-[34px] w-[34px] place-items-center rounded-full border border-border bg-white/10 text-ink transition hover:bg-white/15"
        aria-label={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={() => setRailCollapsed((value) => !value)}
      >
        <RailChevronIcon collapsed={railCollapsed} />
      </button>
      <div className="flex flex-1 flex-col gap-1">
        {railItems.map((item) => {
          const isActive = Boolean(item.to) && isRailRouteActive(currentPath, item.to)
          return (
            <button
              type="button"
              key={item.key}
              className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-white/5 ${railCollapsed ? 'justify-center' : ''} ${isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:text-ink'}`}
              title={item.title}
              aria-label={item.title}
              onClick={() => item.to && navigate(item.to)}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center"><RailItemIcon itemKey={item.key} /></span>
              {!railCollapsed && <span className="truncate font-head text-[12px] font-semibold">{item.title}</span>}
            </button>
          )
        })}
      </div>
      <div className="mt-auto flex flex-col gap-1 border-t border-border pt-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-muted transition hover:bg-white/5 hover:text-ink"
          title="Compliance"
          aria-label="Compliance"
          onClick={() => navigate('/compliance')}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center"><RailItemIcon itemKey="support" /></span>
          {!railCollapsed && <span className="truncate font-head text-[12px] font-semibold">Compliance</span>}
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-muted transition hover:bg-white/5 hover:text-ink"
          title="Logout"
          aria-label="Logout"
          onClick={handleLogout}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center"><RailItemIcon itemKey="logout" /></span>
          {!railCollapsed && <span className="truncate font-head text-[12px] font-semibold">Logout</span>}
        </button>
      </div>
    </aside>
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

function WeatherSunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
    </svg>
  )
}

function WeatherRainIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 18a4 4 0 1 1 .9-7.9A5 5 0 1 1 18 12h-1" />
      <path d="m8 18 1 2m4-2 1 2m4-2 1 2" />
    </svg>
  )
}

function WeatherCloudIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 18a4 4 0 1 1 .9-7.9A5 5 0 1 1 18 12h-1" />
    </svg>
  )
}

function ThermometerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z" />
    </svg>
  )
}

function DropletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3s6 6.4 6 10a6 6 0 0 1-12 0c0-3.6 6-10 6-10Z" />
    </svg>
  )
}

function RainDropIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4c3 3.4 4.8 5.9 4.8 8.3a4.8 4.8 0 1 1-9.6 0C7.2 9.9 9 7.4 12 4Z" />
      <path d="M9.5 13.3c.5 1 1.5 1.7 2.7 1.9" />
    </svg>
  )
}

function CloudsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 18A3.5 3.5 0 1 1 7 11.1 4.5 4.5 0 0 1 16.2 12H17a3 3 0 1 1 0 6Z" />
    </svg>
  )
}

function EyebrowRow({ label = 'ATONDA' }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-8 bg-accent" />
      <span className="font-head text-[11px] font-bold uppercase tracking-[0.14em] text-accent">{label}</span>
    </div>
  )
}

function WeatherConditionIcon({ weatherDetails }) {
  const precip = Number(weatherDetails?.precip_mm ?? 0)
  const clouds = Number(weatherDetails?.cloud_cover_pct ?? 0)

  if (Number.isFinite(precip) && precip > 1) return <WeatherRainIcon />
  if (Number.isFinite(clouds) && clouds >= 65) return <WeatherCloudIcon />
  return <WeatherSunIcon />
}

function FeatureOrbitItem({ number, icon, title, desc, align = 'left' }) {
  return (
    <div className={`rounded-2xl border border-border bg-gradient-to-br from-card/70 to-dark/60 p-5 shadow-card backdrop-blur-sm ${align === 'right' ? 'text-right' : ''}`}>
      <div className={`mb-3 flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <span className="font-head text-xs font-bold tracking-wider text-accent">{number}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className={`mb-3 grid h-12 w-12 place-items-center rounded-lg border border-accent/30 bg-accent-soft text-accent ${align === 'right' ? 'ml-auto' : ''}`}>{icon}</div>
      <h4 className="font-head text-lg font-semibold text-ink">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
    </div>
  )
}

function AiCapabilityIcon({ type }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (type === 'fuel') return <svg {...common}><path d="M7 21h10V4H7z" /><path d="M10 8h4M17 8h2l1 2v7a2 2 0 0 1-2 2h-1" /><path d="M10 15c1.3-1.4 2-2.5 2-3.4A2 2 0 0 0 8 11.6c0 .9.7 2 2 3.4Z" /></svg>
  if (type === 'route') return <svg {...common}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h3a3 3 0 0 1 3 3v3a3 3 0 0 0 3 3h1" /><path d="m14 5 2-2 2 2M10 19l-2 2-2-2" /></svg>
  return <svg {...common}><path d="M5 15v-4a7 7 0 0 1 14 0v4" /><path d="M5 15H3v3a2 2 0 0 0 2 2h2v-5ZM19 15h2v3a2 2 0 0 1-2 2h-2v-5Z" /><path d="M12 18h3" /></svg>
}

function AiAnalyticsVisual({ type }) {
  if (type === 'fuel') return (
    <div className="mt-5 rounded-md border border-border/80 bg-dark/50 p-3" aria-label="Fuel efficiency forecast visualization">
      <div className="mb-2 flex items-center justify-between gap-2 font-head text-[10px] font-bold uppercase tracking-wider text-muted [&_strong]:text-green [&_em]:not-italic [&_em]:text-muted"><span>FUEL EFFICIENCY FORECAST</span><strong>+8.4% <em>potential</em></strong></div>
      <svg viewBox="0 0 300 92" role="img" aria-label="Fuel efficiency trend over seven days">
        <defs><linearGradient id="fuelArea" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#57d994" stopOpacity=".32" /><stop offset="1" stopColor="#57d994" stopOpacity="0" /></linearGradient></defs>
        <path className="stroke-border stroke-[0.5]" d="M0 20H300M0 46H300M0 72H300" />
        <path className="fill-[url(#fuelArea)]" d="M0 72 C25 64 31 69 53 59 S88 65 110 48 S140 54 160 40 S194 47 217 26 S251 36 272 18 S290 21 300 12 V92H0Z" />
        <path className="fill-none stroke-green stroke-2" d="M0 72 C25 64 31 69 53 59 S88 65 110 48 S140 54 160 40 S194 47 217 26 S251 36 272 18 S290 21 300 12" />
        <circle cx="217" cy="26" r="4" className="fill-accent" /><circle cx="300" cy="12" r="4" className="fill-green" />
      </svg>
      <div className="mt-2 flex gap-4 text-[10px] text-muted [&_i]:mr-1.5 [&_i]:inline-block [&_i]:h-2 [&_i]:w-2 [&_i]:rounded-full"><span><i className="bg-green" />Projected MPG</span><span><i className="bg-accent" />Idle anomaly</span></div>
    </div>
  )
  if (type === 'route') return (
    <div className="mt-5 rounded-md border border-border/80 bg-dark/50 p-3" aria-label="Route savings comparison visualization">
      <div className="mb-2 flex items-center justify-between gap-2 font-head text-[10px] font-bold uppercase tracking-wider text-muted [&_strong]:text-green [&_em]:not-italic [&_em]:text-muted"><span>ROUTE OPTIMIZER</span><strong>$28 <em>saved</em></strong></div>
      <div className="mt-3 space-y-2 text-xs text-body [&_i]:mx-2 [&_i]:inline-flex [&_i]:h-2 [&_i]:w-28 [&_i]:overflow-hidden [&_i]:rounded-full [&_i]:bg-border [&_b]:block [&_b]:h-full [&_b]:rounded-full [&_b]:bg-accent [&_em]:not-italic [&_em]:text-ink"><span>Current <i><b style={{ width: '92%' }} /></i><em>$286</em></span><span>AI route <i><b style={{ width: '76%' }} /></i><em>$258</em></span></div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted [&_b]:text-ink"><span><b>14</b> min earlier</span><span><b>3.4%</b> less fuel</span><span><b>14</b> mi avoided</span></div>
    </div>
  )
  return (
    <div className="mt-5 rounded-md border border-border/80 bg-dark/50 p-3" aria-label="AI operations recommendation visualization">
      <div className="rounded bg-border/30 px-3 py-2 text-sm text-ink">Why is fuel spend up today?</div>
      <div className="mt-2 flex gap-2 text-sm text-body [&_i]:mt-1.5 [&_i]:h-2 [&_i]:w-2 [&_i]:shrink-0 [&_i]:rounded-full [&_i]:bg-accent"><i />3 vehicles exceeded idle baseline near Dallas. Prioritize ATD-217 before its next dispatch.</div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[10px] uppercase tracking-wider text-muted [&_strong]:font-head [&_strong]:text-sm [&_strong]:normal-case [&_strong]:tracking-normal [&_strong]:text-green"><span>RECOMMENDED ACTION</span><strong>Save est. $46 today</strong></div>
    </div>
  )
}

function BenefitCard({ title, desc }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-gradient-to-br from-card/70 to-dark/60 p-5 shadow-card backdrop-blur-sm">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-deep/30 text-green">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div>
        <h4 className="font-head text-base font-semibold text-ink">{title}</h4>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{desc}</p>
      </div>
    </div>
  )
}

function ComplianceStatusPill({ label, status }) {
  const tone = status === 'ok'
    ? 'bg-green/15 text-green'
    : status === 'warn'
      ? 'bg-accent-hot/15 text-accent-hot'
      : 'bg-red-500/15 text-red-400'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 font-head text-[10px] font-bold uppercase tracking-wide ${tone}`}>
      {label}
    </span>
  )
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
const FLEET_PILLARS = [
  {
    index: '1',
    title: 'Total visibility',
    desc: "Live GPS, geofencing, and telemetry mean you never have to guess where a truck is, or why it stopped moving.",
  },
  {
    index: '2',
    title: 'Safety-first standards',
    desc: 'Digital DVIRs, license and document expiry alerts, and maintenance tracking keep every truck road-ready.',
  },
  {
    index: '3',
    title: 'Proactive dispatch',
    desc: "Reroute around delays, reassign loads, and add stops in real time, before small problems become late deliveries.",
  },
]

const FLEET_STATS_BAND = [
  { num: '500+', label: 'Fleet units tracked live' },
  { num: '24/7', label: 'Dispatch & real-time tracking' },
  { num: '100%', label: 'Paperless compliance' },
  { num: '1,300+', label: 'Fleets trust ATONDA' },
]

const FLEET_USE_CASES = [
  { q: 'Driver calls in sick?', a: 'Reassign the route in seconds, not hours.' },
  { q: 'Truck breaks down mid-route?', a: 'Dispatch the nearest backup automatically.' },
  { q: 'Weather closes the interstate?', a: 'Reroute live, before it costs you a delivery window.' },
  { q: 'Compliance deadline approaching?', a: 'Alerts fire before it becomes a violation.' },
  { q: 'Load added last minute?', a: 'Add it to the manifest in one tap.' },
  { q: 'Fleet growing fast?', a: 'Scales with you, no extra headcount required.' },
]

const GLOBAL_HUBS = [
  { city: 'Newark', country: 'United States', language: 'English', x: 22, y: 22 },
  { city: 'London', country: 'United Kingdom', language: 'English', x: 47, y: 16 },
  { city: 'Dubai', country: 'United Arab Emirates', language: 'Arabic', x: 58, y: 23 },
  { city: 'Singapore', country: 'Singapore', language: 'English, Malay, Mandarin, Tamil', x: 70, y: 31 },
  { city: 'Sao Paulo', country: 'Brazil', language: 'Portuguese', x: 33, y: 39 },
  { city: 'Sydney', country: 'Australia', language: 'English', x: 82, y: 40 },
]

const GLOBAL_ROUTES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [0, 4],
  [3, 5],
]

function buildArcPath(start, end) {
  const cx = (start.x + end.x) / 2
  const cy = Math.min(start.y, end.y) - 8
  return `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`
}

function GlobalWorldMap() {
  const mapPaths = useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent([[3, 3], [97, 49]], { type: 'Sphere' })
    const pathBuilder = geoPath(projection)
    const landFeature = feature(worldLand, worldLand.objects.land)
    return {
      sphere: pathBuilder({ type: 'Sphere' }),
      graticule: pathBuilder(geoGraticule10()),
      land: pathBuilder(landFeature),
    }
  }, [])

  return (
    <svg className="block h-full w-full opacity-90 drop-shadow-lg" viewBox="0 0 100 52" preserveAspectRatio="none" aria-label="World map with continents">
      <path d={mapPaths.sphere} className="fill-white/[0.02] stroke-white/15 stroke-[0.16]" />
      <path d={mapPaths.graticule} className="fill-none stroke-white/10 stroke-[0.09]" />
      <path d={mapPaths.land} className="fill-ink/50 stroke-white/30 stroke-[0.08]" />
    </svg>
  )
}

function PillarCard({ index, title, desc }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card/70 to-dark/60 p-6 shadow-card backdrop-blur-sm">
      <span className="font-head text-xs font-semibold text-accent">( {index} )</span>
      <h4 className="mt-3 font-head text-xl font-semibold text-ink">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
    </div>
  )
}

function UseCaseCard({ q, a }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card/70 to-dark/60 p-5 shadow-card backdrop-blur-sm">
      <p className="font-head text-base font-semibold text-ink">{q}</p>
      <p className="mt-2 text-sm text-muted">{a}</p>
    </div>
  )
}

function Landing({ token, isDemoSession, startDemo, demoLoading, language, setLanguage }) {
  const landingRef = useRef(null)
  const videoRef = useRef(null)
  const copy = getSiteCopy(language)
  useLandingMotion(landingRef)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined
    video.muted = true
    const play = video.play()
    if (play?.catch) play.catch(() => {})
    return undefined
  }, [])

  function openDemo() { startDemo() }

  return (
    <div ref={landingRef} className="relative isolate min-h-screen overflow-x-hidden text-body font-body">
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden" aria-hidden="true">
        <video
          ref={videoRef}
          className="h-full w-full object-cover brightness-[1.14] contrast-[1.08] saturate-[1.08]"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={dashboardImage}
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>
      </div>
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
        style={{
          background: 'linear-gradient(180deg, rgba(4,4,6,.42) 0%, rgba(4,4,6,.28) 38%, rgba(4,4,6,.55) 100%), radial-gradient(1000px 500px at 20% 8%, rgba(255,75,43,.1), transparent 62%)',
        }}
      />

      <a className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-border bg-card/95 py-2 pl-2 pr-4 shadow-float backdrop-blur-sm transition hover:border-accent" href={WHATSAPP_CONTACT_URL} target="_blank" rel="noreferrer" aria-label="Contact our team on WhatsApp">
        <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full animate-[agent-pulse_2.2s_ease-out_infinite]" aria-hidden="true">
          <svg viewBox="0 0 56 56" width="28" height="28" fill="none">
            <defs>
              <linearGradient id="agentSkin" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f6d3b1" />
                <stop offset="100%" stopColor="#e7b88d" />
              </linearGradient>
              <linearGradient id="agentShirt" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4463d3" />
                <stop offset="100%" stopColor="#2e47ab" />
              </linearGradient>
            </defs>
            <circle cx="28" cy="28" r="27" fill="#f4f7ff" />
            <ellipse cx="28" cy="23" rx="11.2" ry="11" fill="url(#agentSkin)" />
            <path d="M18 20.5c.8-7 5.4-11.2 10-11.2s9.2 4.2 10 11.2c-3-2.1-6.4-3.3-10-3.3s-7 1.2-10 3.3Z" fill="#1d2a4d" />
            <path d="M12.2 49.8c1.8-8.1 7.8-13.3 15.8-13.3s14 5.2 15.8 13.3" fill="url(#agentShirt)" />
            <circle cx="24.2" cy="22.8" r="1.2" fill="#25314f" />
            <circle cx="31.8" cy="22.8" r="1.2" fill="#25314f" />
            <path d="M24 27.2c1.3 1.4 2.7 2 4 2 1.4 0 2.8-.6 4-2" stroke="#b16948" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <span className="hidden flex-col sm:flex">
          <strong className="font-head text-xs font-bold text-ink">{copy.contactTeam}</strong>
          <small className="text-[10px] text-muted">{copy.dispatchSupport}</small>
        </span>
      </a>

      <TerminalStyleHeader />

      <section className="relative flex min-h-screen flex-col justify-end overflow-hidden pb-16 pt-[96px] sm:justify-center sm:pb-24">
        <div className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rotate-12 border border-accent/25" />
        <div className="pointer-events-none absolute -left-16 bottom-28 h-56 w-56 -rotate-12 border border-white/15" />
        <div className="relative z-10 mx-auto w-full max-w-[1160px] px-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="max-w-xl">
              <div data-hero-anim>
                <EyebrowRow label={copy.eyebrow} />
              </div>
              <h1 data-hero-anim className="mt-4 font-head text-[clamp(42px,7vw,72px)] font-bold leading-[0.95] tracking-tight text-ink [&_em]:not-italic [&_em]:text-accent">
                {copy.heroTitle}<br /><em>{copy.heroAccent}</em>
              </h1>
              <p data-hero-anim className="mt-5 max-w-[42ch] text-base leading-relaxed text-body">
                {copy.heroCopy}
              </p>
              <div data-hero-anim className="mt-8 flex flex-wrap items-center gap-5">
                <button type="button" className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-[17px] font-head text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(255,90,31,.35)] transition hover:opacity-95 disabled:cursor-default disabled:opacity-45" onClick={openDemo} disabled={demoLoading}>{demoLoading ? copy.openingDemo : copy.demo}</button>
                <a href="#live-network" className="font-head text-sm font-semibold text-ink underline decoration-accent/60 underline-offset-4 transition hover:text-accent">{copy.seeFleet} &#8595;</a>
              </div>
            </div>
            <div data-hero-anim className="rounded-xl border border-white/20 bg-[rgba(12,12,15,.55)] p-5 shadow-card backdrop-blur-md">
              <p className="text-sm text-muted">{copy.appointment}</p>
              <a href="tel:+19177536653" className="mt-2 inline-block font-head text-lg font-semibold text-ink underline decoration-accent/60 underline-offset-4 transition hover:text-accent">+1 (917) 753-6653</a>
            </div>
          </div>
        </div>
      </section>

      <TerminalStyleLogoGrid />

      {/* LIVE FLEET NETWORK */}
      <section id="live-network" className="relative py-20">
        <div className="mx-auto max-w-[1160px] px-8">
          <div data-animate className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center"><EyebrowRow label={copy.whatWeDo} /></div>
            <h2 className="mt-3.5 font-head text-[clamp(34px,4vw,52px)] font-semibold text-ink">{copy.engine}</h2>
            <p className="mx-auto mt-4 max-w-[54ch] text-body">
              {copy.engineCopy}
            </p>
          </div>
          <div data-animate="scale"><FleetMotionBoard /></div>
          <div data-animate className="mt-6"><GpsTrackingPanel /></div>
          <div data-animate className="mt-6"><LiveStatsStrip /></div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="relative py-20">
        <div className="mx-auto max-w-[1160px] px-8">
          <div data-animate className="mb-10">
            <span className="font-head text-xs font-semibold uppercase tracking-wider text-muted">( Three things we get right )</span>
            <h2 className="mt-3 font-head text-[clamp(34px,4vw,52px)] font-semibold text-ink">We move fleets forward.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {FLEET_PILLARS.map((p) => (
              <div key={p.index} data-animate>
                <PillarCard index={p.index} title={p.title} desc={p.desc} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative py-20">
        <div className="mx-auto max-w-[1160px] px-8">
          <div data-animate className="grid items-center gap-10 lg:grid-cols-[1fr_minmax(220px,0.9fr)_1fr]">
            <div className="flex flex-col gap-8">
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

            <div className="relative mx-auto flex max-w-sm items-center justify-center">
              <div className="absolute h-40 w-40 rotate-45 border border-white/20 animate-[float-y_6s_ease-in-out_infinite]" />
              <img
                className="relative z-10 w-full rounded-lg object-contain drop-shadow-2xl"
                src="https://trucknroll.com/uploads/uploads/_header/2320/SHOT01_251111_Truck_n_Roll_0090_shot01_v1.webp"
                alt="Fleet management route visual"
                loading="lazy"
              />
            </div>

            <div className="flex flex-col gap-8">
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

      {/* PLANNED AI CAPABILITIES */}
      <section className="relative py-24" id="ai-road-intelligence">
        <div className="mx-auto max-w-[1160px] px-8">
          <div data-animate className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <EyebrowRow label="PLANNED AI CAPABILITIES" />
              <h2 className="mt-3.5 max-w-[570px] font-head text-[clamp(34px,4vw,54px)] font-semibold leading-tight text-ink">Make every mile work harder.</h2>
            </div>
            <p className="max-w-[430px] text-base leading-relaxed text-muted">We are building decision support that turns your fleet data into clear actions for lower fuel use, smarter routes, and stronger day-to-day operations.</p>
          </div>
          <div className="grid gap-3.5 md:grid-cols-3">
            <article data-animate="left" className="relative min-h-[370px] overflow-hidden rounded-lg border border-border bg-card/90 p-7 backdrop-blur-sm">
              <span className="grid h-12 w-12 place-items-center border border-accent/30 bg-accent-soft text-accent"><AiCapabilityIcon type="fuel" /></span>
              <span className="mt-8 block font-head text-[10px] font-bold tracking-[0.12em] text-green">IN DEVELOPMENT</span>
              <h3 className="my-2.5 font-head text-[27px] font-semibold leading-tight text-ink">Fuel intelligence</h3>
              <p className="text-sm leading-relaxed text-muted">Forecast fuel consumption by vehicle, load, terrain, idle time, and driving patterns, then surface practical ways to reduce waste.</p>
              <AiAnalyticsVisual type="fuel" />
              <ul className="mt-5 grid gap-2 text-[13px] text-[#d8d9d4] [&_li]:before:mr-2 [&_li]:before:text-accent [&_li]:before:content-['→']"><li>Identify excessive idle time</li><li>Compare vehicle efficiency</li><li>Spot fuel-cost anomalies</li></ul>
            </article>
            <article data-animate="scale" className="relative min-h-[370px] overflow-hidden rounded-lg border border-accent/40 bg-[#1a1b1d]/90 p-7 shadow-[inset_0_3px_0_#ff4b2b] backdrop-blur-sm">
              <span className="grid h-12 w-12 place-items-center border border-accent/30 bg-accent-soft text-accent"><AiCapabilityIcon type="route" /></span>
              <span className="mt-8 block font-head text-[10px] font-bold tracking-[0.12em] text-green">IN DEVELOPMENT</span>
              <h3 className="my-2.5 font-head text-[27px] font-semibold leading-tight text-ink">Route savings engine</h3>
              <p className="text-sm leading-relaxed text-muted">Evaluate route alternatives against traffic, tolls, fuel burn, delivery windows, and vehicle restrictions to recommend the better run.</p>
              <AiAnalyticsVisual type="route" />
            </article>
            <article data-animate="right" className="relative min-h-[370px] overflow-hidden rounded-lg border border-border bg-card/90 p-7 backdrop-blur-sm">
              <span className="grid h-12 w-12 place-items-center border border-accent/30 bg-accent-soft text-accent"><AiCapabilityIcon type="assistant" /></span>
              <span className="mt-8 block font-head text-[10px] font-bold tracking-[0.12em] text-green">IN DEVELOPMENT</span>
              <h3 className="my-2.5 font-head text-[27px] font-semibold leading-tight text-ink">Operations assistant</h3>
              <p className="text-sm leading-relaxed text-muted">Ask focused questions about your fleet and get a plain-language answer with a next best action for dispatch, safety, and maintenance.</p>
              <AiAnalyticsVisual type="assistant" />
              <ul className="mt-5 grid gap-2 text-[13px] text-[#d8d9d4] [&_li]:before:mr-2 [&_li]:before:text-accent [&_li]:before:content-['→']"><li>What is driving fuel use today?</li><li>Which load is most at risk?</li><li>Where can we save time this week?</li></ul>
            </article>
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="relative py-16">
        <div className="mx-auto max-w-[1160px] px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FLEET_STATS_BAND.map((s) => (
              <div data-animate className="flex min-h-[122px] flex-col justify-center rounded-[18px] border border-border bg-gradient-to-br from-card/80 to-dark/70 p-[18px] shadow-card backdrop-blur-md" key={s.label}>
                <span className="font-head text-3xl font-bold text-ink">{s.num}</span>
                <span className="mt-1 text-sm text-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GLOBAL MAP */}
      <section className="relative py-20" id="global">
        <div className="mx-auto max-w-[1160px] px-8">
          <div data-animate className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center"><EyebrowRow label="GLOBAL COVERAGE" /></div>
            <h2 className="mt-3.5 font-head text-[clamp(34px,4vw,52px)] font-semibold text-ink">Fleet management at world scale.</h2>
            <p className="mx-auto mt-4 max-w-[54ch] text-body">
              As you scroll, this live map highlights our cross-region operations and connected hubs
              across North America, Europe, the Middle East, Asia-Pacific, and Latin America.
            </p>
          </div>

          <div data-animate="scale" className="relative mt-6 min-h-[430px] overflow-hidden rounded-3xl border border-border-strong bg-gradient-to-br from-card/80 to-dark/70 shadow-card backdrop-blur-md">
            <GlobalWorldMap />

            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 52" preserveAspectRatio="none" aria-hidden="true">
              {GLOBAL_ROUTES.map(([from, to], index) => {
                const start = GLOBAL_HUBS[from]
                const end = GLOBAL_HUBS[to]
                return (
                  <path
                    key={`${from}-${to}`}
                    d={buildArcPath(start, end)}
                    className="fill-none stroke-accent/75 stroke-[0.45] stroke-linecap-round [stroke-dasharray:2_1.2] opacity-0 animate-[route-draw_1.2s_ease_forwards]"
                    style={{ animationDelay: `${index * 0.18}s` }}
                  />
                )
              })}
            </svg>

            {GLOBAL_HUBS.map((hub) => (
              <div
                key={hub.city}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                style={{ left: `${hub.x}%`, top: `${hub.y}%` }}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-green shadow-[0_0_0_0_rgba(51,209,122,0.56)] animate-[hub-pulse_1.8s_ease-out_infinite]" />
                <small className="rounded-full border border-border-strong bg-dark/60 px-1.5 py-0.5 font-head text-[10px] uppercase tracking-wide text-ink/90">{hub.city}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="about" className="relative py-20">
        <div className="mx-auto max-w-[1160px] px-8">
          <div data-animate className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center"><EyebrowRow label="USE CASES" /></div>
            <h2 className="mt-3.5 font-head text-[clamp(34px,4vw,52px)] font-semibold text-ink">Whatever happens on the road, you're ready.</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FLEET_USE_CASES.map((u) => (
              <div key={u.q} data-animate>
                <UseCaseCard q={u.q} a={u.a} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="relative py-20">
        <div className="mx-auto max-w-[1160px] px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div data-animate><BenefitCard title="Paperless DVIRs" desc="Say goodbye to paperwork with our digital inspection reports." /></div>
              <div data-animate><BenefitCard title="Stress-Free Setup" desc="Get started quickly with our easy installation process." /></div>
              <div data-animate><BenefitCard title="24/7 Customer Support" desc="Count on expert assistance whenever you need it, day or night." /></div>
            </div>
            <div className="flex flex-col gap-4">
              <div data-animate><BenefitCard title="Accurate IFTA Reporting" desc="Simplify fuel tax reporting with precision and ease." /></div>
              <div data-animate><BenefitCard title="No Long-Term Contracts" desc="Enjoy flexibility and freedom with contract-free solutions." /></div>
              <div data-animate><BenefitCard title="User-Friendly App" desc="Manage your fleet effortlessly with our intuitive mobile app." /></div>
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE — Terminal big image */}
      <TerminalStyleQuote />

      {/* CONTACT → FAQs → FOOTER */}
      <div className="relative z-10">
        <TerminalStyleContact />
        <TerminalStyleFAQ />
        <TerminalStyleFooter />
      </div>
    </div>
  )
}

// ─── Fleet Compliance ────────────────────────────────────────────────────────
function FleetCompliance({ token, resources, refreshAllResources, handleLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [railCollapsed, setRailCollapsed] = useState(false)

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
    <div className={`min-h-svh overflow-hidden bg-portal-deep text-ink grid ${railCollapsed ? 'md:grid-cols-[56px_minmax(0,1fr)]' : 'md:grid-cols-[220px_minmax(0,1fr)]'}`}>
      <FleetPortalRail
        railCollapsed={railCollapsed}
        setRailCollapsed={setRailCollapsed}
        railItems={STANDARD_RAIL_ITEMS}
        currentPath={location.pathname}
        navigate={navigate}
        handleLogout={handleLogout}
      />
      <div className="flex min-h-0 flex-col overflow-auto">
      <header className="border-b border-border bg-portal">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <a href="/" className="flex items-center gap-2.5 font-head text-[15px] font-bold text-ink"><LogoIcon /><span>ATONDA</span></a>
          <div className="flex items-center gap-2.5">
            <button className="rounded-md bg-accent px-[18px] py-2 font-head text-[13px] font-semibold text-ink transition hover:-translate-y-px disabled:cursor-default disabled:opacity-45" onClick={refreshAllResources} disabled={!token}>Sync Compliance Data</button>
            <button className="rounded-md bg-accent px-[18px] py-2 font-head text-[13px] font-semibold text-ink transition hover:-translate-y-px disabled:cursor-default disabled:opacity-45 border border-border-strong bg-white/10 text-ink" onClick={() => navigate('/portal')}>Back to Portal</button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8">
        <section className="rounded-2xl border border-border bg-card/60 p-6 md:p-8">
          <EyebrowRow label="FLEET COMPLIANCE" />
          <h1>Stay audit-ready with a clear compliance command center</h1>
          <p>
            Track driver license status, maintenance risk, and IFTA record coverage in one place.
            Designed with the same visual language as the rest of your ATONDA experience.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-border bg-card p-5 [&_p]:text-xs [&_p]:uppercase [&_p]:tracking-wider [&_p]:text-muted [&_strong]:mt-2 [&_strong]:block [&_strong]:font-head [&_strong]:text-2xl [&_strong]:text-ink">
            <p>Fleet Units</p>
            <strong>{trucks.length}</strong>
            <ComplianceStatusPill
              status={trucks.length > 0 ? 'ok' : 'warn'}
              label={trucks.length > 0 ? 'Active' : 'No vehicles'}
            />
          </article>

          <article className="rounded-xl border border-border bg-card p-5 [&_p]:text-xs [&_p]:uppercase [&_p]:tracking-wider [&_p]:text-muted [&_strong]:mt-2 [&_strong]:block [&_strong]:font-head [&_strong]:text-2xl [&_strong]:text-ink">
            <p>Driver Licensing</p>
            <strong>{drivers.length}</strong>
            <ComplianceStatusPill
              status={expiredDrivers.length === 0 ? 'ok' : 'risk'}
              label={expiredDrivers.length === 0 ? 'Valid' : `${expiredDrivers.length} expired`}
            />
          </article>

          <article className="rounded-xl border border-border bg-card p-5 [&_p]:text-xs [&_p]:uppercase [&_p]:tracking-wider [&_p]:text-muted [&_strong]:mt-2 [&_strong]:block [&_strong]:font-head [&_strong]:text-2xl [&_strong]:text-ink">
            <p>IFTA Record Coverage</p>
            <strong>{iftaCoverage}%</strong>
            <ComplianceStatusPill
              status={iftaCoverage >= 80 ? 'ok' : 'warn'}
              label={iftaCoverage >= 80 ? 'Healthy' : 'Needs attention'}
            />
          </article>

          <article className="rounded-xl border border-border bg-card p-5 [&_p]:text-xs [&_p]:uppercase [&_p]:tracking-wider [&_p]:text-muted [&_strong]:mt-2 [&_strong]:block [&_strong]:font-head [&_strong]:text-2xl [&_strong]:text-ink">
            <p>Open Risks</p>
            <strong>{totalRiskItems}</strong>
            <ComplianceStatusPill
              status={totalRiskItems === 0 ? 'ok' : 'risk'}
              label={totalRiskItems === 0 ? 'No blockers' : 'Action required'}
            />
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3 [&_h3]:font-head [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink">
              <h3>Driver License Watchlist</h3>
              <button className="font-head text-xs font-semibold text-accent transition hover:text-accent-hot" onClick={() => navigate('/portal')}>Open Drivers</button>
            </div>
            <div className="space-y-3">
              {drivers.length === 0 && <p className="text-sm text-muted">No driver records yet.</p>}

              {expiredDrivers.map((driver) => (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-dark/40 px-3 py-3 [&_strong]:font-head [&_strong]:text-sm [&_strong]:text-ink [&_p]:text-xs [&_p]:text-muted" key={`expired-${driver.id}`}>
                  <div>
                    <strong>{driver.full_name ?? 'Unknown Driver'}</strong>
                    <p>{driver.license_number ?? 'No license number'}</p>
                  </div>
                  <ComplianceStatusPill status="risk" label="Expired" />
                </div>
              ))}

              {expiringDrivers.map((driver) => (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-dark/40 px-3 py-3 [&_strong]:font-head [&_strong]:text-sm [&_strong]:text-ink [&_p]:text-xs [&_p]:text-muted" key={`expiring-${driver.id}`}>
                  <div>
                    <strong>{driver.full_name ?? 'Unknown Driver'}</strong>
                    <p>Expires {driver.license_expiry}</p>
                  </div>
                  <ComplianceStatusPill status="warn" label="Expiring soon" />
                </div>
              ))}

              {expiredDrivers.length === 0 && expiringDrivers.length === 0 && drivers.length > 0 && (
                <p className="text-sm text-green">All tracked licenses are currently in good standing.</p>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3 [&_h3]:font-head [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink">
              <h3>Maintenance + IFTA Health</h3>
              <button className="font-head text-xs font-semibold text-accent transition hover:text-accent-hot" onClick={() => navigate('/portal')}>Open Records</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 border-b border-border/50 py-3 text-sm text-body last:border-0">
                <span>Overdue maintenance items</span>
                <ComplianceStatusPill
                  status={overdueMaintenance.length === 0 ? 'ok' : 'risk'}
                  label={`${overdueMaintenance.length} open`}
                />
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border/50 py-3 text-sm text-body last:border-0">
                <span>IFTA records logged</span>
                <ComplianceStatusPill
                  status={ifta.length >= trucks.length && trucks.length > 0 ? 'ok' : 'warn'}
                  label={`${ifta.length} entries`}
                />
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border/50 py-3 text-sm text-body last:border-0">
                <span>Total maintenance logs</span>
                <ComplianceStatusPill status={maintenance.length > 0 ? 'ok' : 'warn'} label={`${maintenance.length} logs`} />
              </div>
            </div>
          </article>
        </section>
      </main>
      </div>
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
    <div className={`min-h-svh overflow-hidden bg-portal-deep text-ink grid ${railCollapsed ? 'md:grid-cols-[56px_minmax(0,1fr)]' : 'md:grid-cols-[220px_minmax(0,1fr)]'}`}>
      <FleetPortalRail
        railCollapsed={railCollapsed}
        setRailCollapsed={setRailCollapsed}
        railItems={railItems}
        currentPath={location.pathname}
        navigate={navigate}
        handleLogout={handleLogout}
      />

      <section className="flex min-h-0 flex-col overflow-auto p-5 md:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="[&_h1]:font-head [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-ink">
            <h1>{assetType === 'vehicles' ? `Vehicles (${visibleRows.length})` : 'Trailers (0)'}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="rounded-full border border-border bg-card px-3 py-1.5 font-head text-xs font-semibold text-muted">Liberte Trucking</button>
            <button className="rounded-full border border-border bg-card px-3 py-1.5 font-head text-xs font-semibold text-muted">All Groups</button>
            <button className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card text-ink" aria-label="Add">+</button>
            <button className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card text-ink" aria-label="Notifications">o</button>
            <span className="ml-1 font-head text-xs font-semibold text-ink">Bourlaye Coulibaly</span>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            className="min-w-[200px] flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
            placeholder="Search by Vehicle ID, ELD S/N or GPS S/N"
            value={queryFleet}
            onChange={(e) => setQueryFleet(e.target.value)}
          />
          <input
            className="min-w-[200px] flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
            placeholder="Search by VIN"
            value={queryVin}
            onChange={(e) => setQueryVin(e.target.value)}
          />
          <select
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
          </select>

          <div className="flex flex-wrap gap-2">
            <button className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45" onClick={exportRows}>Export</button>
            <button className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45" onClick={() => truckResource && fetchResource(truckResource)} disabled={!token || !truckResource}>Refresh</button>
            <button className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45 border-transparent bg-accent text-ink hover:bg-accent-hot" onClick={refreshAllResources} disabled={!token}>Sync</button>
          </div>
        </div>

        <form className="mb-5 rounded-xl border border-border bg-card p-5 [&_h3]:mb-3 [&_h3]:font-head [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink" onSubmit={handleRegisterTruck}>
          <h3>Register Truck</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 [&_input]:rounded-md [&_input]:border [&_input]:border-border [&_input]:bg-dark/40 [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:text-ink [&_input]:outline-none focus:[&_input]:border-accent [&_select]:rounded-md [&_select]:border [&_select]:border-border [&_select]:bg-dark/40 [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm [&_select]:text-ink">
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
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45 border-transparent bg-accent text-ink hover:bg-accent-hot" disabled={truckSaving}>{truckSaving ? 'Registering...' : 'Register Truck'}</button>
            {truckMessage && <p className="text-sm text-green">{truckMessage}</p>}
          </div>
        </form>

        <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
          <aside className="flex flex-row gap-2 rounded-xl border border-border bg-card p-2 lg:flex-col">
            <button type="button" className={assetType === 'vehicles' ? 'rounded-md bg-accent/15 px-3 py-2 font-head text-xs font-semibold text-accent' : 'rounded-md px-3 py-2 font-head text-xs font-semibold text-muted'} onClick={() => setAssetType('vehicles')}>Vehicles</button>
            <button type="button" className={assetType === 'trailers' ? 'rounded-md bg-accent/15 px-3 py-2 font-head text-xs font-semibold text-accent' : 'rounded-md px-3 py-2 font-head text-xs font-semibold text-muted'} onClick={() => setAssetType('trailers')}>Trailers</button>
          </aside>

          <div className="overflow-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm [&_th]:border-b [&_th]:border-border [&_th]:bg-band/50 [&_th]:px-3 [&_th]:py-3 [&_th]:font-head [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted [&_td]:border-b [&_td]:border-border/50 [&_td]:px-3 [&_td]:py-3 [&_td]:text-body">
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
                    <td colSpan={10} className="py-10 text-center text-muted">
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
    <div className={`min-h-svh overflow-hidden bg-portal-deep text-ink grid ${railCollapsed ? 'md:grid-cols-[56px_minmax(0,1fr)]' : 'md:grid-cols-[220px_minmax(0,1fr)]'}`}>
      <FleetPortalRail
        railCollapsed={railCollapsed}
        setRailCollapsed={setRailCollapsed}
        railItems={railItems}
        currentPath={location.pathname}
        navigate={navigate}
        handleLogout={handleLogout}
      />

      <section className="flex min-h-0 flex-col overflow-auto p-5 md:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="[&_h1]:font-head [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-ink">
            <h1>History ({filteredRows.length})</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="rounded-full border border-border bg-card px-3 py-1.5 font-head text-xs font-semibold text-muted" onClick={() => navigate('/portal')}>Liberte Trucking</button>
            <button type="button" className="rounded-full border border-border bg-card px-3 py-1.5 font-head text-xs font-semibold text-muted" onClick={() => setEventType('all')}>All Groups</button>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card text-ink" aria-label="Add" onClick={() => navigate('/portal')}>+</button>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card text-ink" aria-label="Notifications" onClick={() => setEventType('maintenance')}>o</button>
            <span className="ml-1 font-head text-xs font-semibold text-ink">Bourlaye Coulibaly</span>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3 mb-4 flex flex-wrap gap-3">
          <input
            className="min-w-[200px] flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
            placeholder="Search by vehicle, event, details, or reference"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
          />
          <select
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            <option value="all">All Events</option>
            <option value="trip">Trips</option>
            <option value="maintenance">Maintenance</option>
            <option value="ifta">IFTA</option>
          </select>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45" onClick={exportRows}>Export</button>
            <button className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45" onClick={refreshAllResources} disabled={!token}>Sync</button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
          <aside className="flex flex-row gap-2 rounded-xl border border-border bg-card p-2 lg:flex-col">
            <button className={eventType === 'all' ? 'rounded-md bg-accent/15 px-3 py-2 font-head text-xs font-semibold text-accent' : 'rounded-md px-3 py-2 font-head text-xs font-semibold text-muted'} onClick={() => setEventType('all')}>All</button>
            <button className={eventType === 'trip' ? 'rounded-md bg-accent/15 px-3 py-2 font-head text-xs font-semibold text-accent' : 'rounded-md px-3 py-2 font-head text-xs font-semibold text-muted'} onClick={() => setEventType('trip')}>Trips</button>
            <button className={eventType === 'maintenance' ? 'rounded-md bg-accent/15 px-3 py-2 font-head text-xs font-semibold text-accent' : 'rounded-md px-3 py-2 font-head text-xs font-semibold text-muted'} onClick={() => setEventType('maintenance')}>Maintenance</button>
            <button className={eventType === 'ifta' ? 'rounded-md bg-accent/15 px-3 py-2 font-head text-xs font-semibold text-accent' : 'rounded-md px-3 py-2 font-head text-xs font-semibold text-muted'} onClick={() => setEventType('ifta')}>IFTA</button>
          </aside>

          <div className="overflow-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm [&_th]:border-b [&_th]:border-border [&_th]:bg-band/50 [&_th]:px-3 [&_th]:py-3 [&_th]:font-head [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted [&_td]:border-b [&_td]:border-border/50 [&_td]:px-3 [&_td]:py-3 [&_td]:text-body">
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
                    <td colSpan={6} className="py-10 text-center text-muted">No history records match current filters.</td>
                  </tr>
                )}
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatAt(row.at)}</td>
                    <td>{row.event}</td>
                    <td>{row.vehicle}</td>
                    <td>{row.details}</td>
                    <td className="font-head text-xs font-semibold">
                      <span className="inline-flex rounded-full bg-accent/15 px-2 py-0.5 font-head text-[10px] font-bold text-accent">{row.status}</span>
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
    <div className={`min-h-svh overflow-hidden bg-portal-deep text-ink grid ${railCollapsed ? 'md:grid-cols-[56px_minmax(0,1fr)]' : 'md:grid-cols-[220px_minmax(0,1fr)]'}`}>
      <FleetPortalRail
        railCollapsed={railCollapsed}
        setRailCollapsed={setRailCollapsed}
        railItems={railItems}
        currentPath={location.pathname}
        navigate={navigate}
        handleLogout={handleLogout}
      />

      <section className="flex min-h-0 flex-col overflow-auto p-5 md:p-6 flex min-h-0 flex-col overflow-auto p-5 md:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="[&_h1]:font-head [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-ink">
            <h1>Drivers ({filteredDrivers.length})</h1>
            <p className="text-sm text-muted">Create driver profiles, link each driver to a truck, and monitor expiry status.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="rounded-full border border-border bg-card px-3 py-1.5 font-head text-xs font-semibold text-muted">Driver Center</button>
            <button type="button" className="rounded-full border border-border bg-card px-3 py-1.5 font-head text-xs font-semibold text-muted">Compliance Focus</button>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card text-ink" aria-label="Drivers">DR</button>
            <span className="ml-1 font-head text-xs font-semibold text-ink">Fleet Team</span>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3 flex flex-wrap items-center gap-3">
          <input
            className="min-w-[200px] flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
            placeholder="Search by name, email, phone, license, or assigned truck"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
          />
          <select
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All License Status</option>
            <option value="valid">Valid</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45"
              onClick={() => runToolbarAction(async () => {
                if (driverResource) await fetchResource(driverResource)
              })}
              disabled={!token || !driverResource || toolbarBusy}
            >
              {toolbarBusy ? 'Working...' : 'Refresh Drivers'}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45"
              onClick={() => runToolbarAction(async () => {
                if (truckResource) await fetchResource(truckResource)
              })}
              disabled={!token || !truckResource || toolbarBusy}
            >
              {toolbarBusy ? 'Working...' : 'Refresh Trucks'}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45 border-transparent bg-accent text-ink hover:bg-accent-hot"
              onClick={() => runToolbarAction(refreshAllResources)}
              disabled={!token || toolbarBusy}
            >
              {toolbarBusy ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 [&_p]:text-xs [&_p]:uppercase [&_p]:tracking-wider [&_p]:text-muted [&_strong]:mt-1 [&_strong]:block [&_strong]:font-head [&_strong]:text-xl [&_strong]:text-ink">
            <small>Total Drivers</small>
            <strong>{drivers.length}</strong>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 [&_p]:text-xs [&_p]:uppercase [&_p]:tracking-wider [&_p]:text-muted [&_strong]:mt-1 [&_strong]:block [&_strong]:font-head [&_strong]:text-xl [&_strong]:text-ink bg-accent-hot/15 text-accent-hot">
            <small>Expiring Soon</small>
            <strong>{expiringSoonCount}</strong>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 [&_p]:text-xs [&_p]:uppercase [&_p]:tracking-wider [&_p]:text-muted [&_strong]:mt-1 [&_strong]:block [&_strong]:font-head [&_strong]:text-xl [&_strong]:text-ink bg-red-500/15 text-red-400">
            <small>Expired</small>
            <strong>{expiredCount}</strong>
          </div>
        </div>

        <section className="rounded-xl border border-border bg-card p-4" aria-live="polite">
          <div className="mb-3 flex items-center justify-between">
            <h3>Important Expiry Notifications</h3>
            <span>{criticalLicenseAlerts.length} alerts</span>
          </div>
          {criticalLicenseAlerts.length === 0 && (
            <p className="text-sm text-green">No urgent license expiry risks in the next 30 days.</p>
          )}
          {criticalLicenseAlerts.length > 0 && (
            <div className="space-y-2">
              {criticalLicenseAlerts.slice(0, 8).map((driver) => {
                const days = driver.license_days_until_expiry
                const level = days < 0 ? 'expired' : days <= 7 ? 'urgent' : 'warning'
                const label = days < 0
                  ? `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
                  : days === 0
                    ? 'Expires today'
                    : `Expires in ${days} day${days === 1 ? '' : 's'}`

                return (
                  <div className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${level === 'expired' ? 'border-red-400/40 bg-red-500/10' : level === 'urgent' ? 'border-accent/40 bg-accent/10' : 'border-accent-hot/40 bg-accent-hot/10'}`} key={`alert-${driver.id}`}>
                    <div>
                      <strong>{driver.full_name}</strong>
                      <p>{driver.license_number} · {driver.license_state ?? 'State N/A'} · {driver.license_expiry}</p>
                    </div>
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 font-head text-[10px] font-bold text-accent">{label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
          <aside className="flex flex-row gap-2 rounded-xl border border-border bg-card p-2 lg:flex-col">
            <button type="button" className={statusFilter === 'all' ? 'rounded-md bg-accent/15 px-3 py-2 font-head text-xs font-semibold text-accent' : 'rounded-md px-3 py-2 font-head text-xs font-semibold text-muted'} onClick={() => setStatusFilter('all')}>All Drivers</button>
            <button type="button" className={statusFilter === 'valid' ? 'rounded-md bg-accent/15 px-3 py-2 font-head text-xs font-semibold text-accent' : 'rounded-md px-3 py-2 font-head text-xs font-semibold text-muted'} onClick={() => setStatusFilter('valid')}>Valid</button>
            <button type="button" className={statusFilter === 'expiring_soon' ? 'rounded-md bg-accent/15 px-3 py-2 font-head text-xs font-semibold text-accent' : 'rounded-md px-3 py-2 font-head text-xs font-semibold text-muted'} onClick={() => setStatusFilter('expiring_soon')}>Expiring</button>
            <button type="button" className={statusFilter === 'expired' ? 'rounded-md bg-accent/15 px-3 py-2 font-head text-xs font-semibold text-accent' : 'rounded-md px-3 py-2 font-head text-xs font-semibold text-muted'} onClick={() => setStatusFilter('expired')}>Expired</button>
          </aside>

          <div className="space-y-5">
            <form className="mb-5 rounded-xl border border-border bg-card p-5 [&_h3]:mb-3 [&_h3]:font-head [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink" onSubmit={handleCreateDriver}>
            <h3>Add Driver</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 [&_input]:rounded-md [&_input]:border [&_input]:border-border [&_input]:bg-dark/40 [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:text-ink [&_input]:outline-none focus:[&_input]:border-accent [&_select]:rounded-md [&_select]:border [&_select]:border-border [&_select]:bg-dark/40 [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm [&_select]:text-ink">
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
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45 border-transparent bg-accent text-ink hover:bg-accent-hot" disabled={saving}>{saving ? 'Saving...' : 'Save Driver'}</button>
              {message && <p className="text-sm text-green">{message}</p>}
            </div>
            </form>

            <div className="overflow-auto rounded-xl border border-border bg-card overflow-auto rounded-xl border border-border bg-card">
              {trucks.length === 0 && (
                <p className="text-sm text-green">No trucks found in your account yet. Create a truck in Vehicles first, then assign drivers.</p>
              )}
              {assignmentMessage && (
                <p className="text-sm text-green">{assignmentMessage}</p>
              )}
              <table className="w-full min-w-[900px] border-collapse text-left text-sm [&_th]:border-b [&_th]:border-border [&_th]:bg-band/50 [&_th]:px-3 [&_th]:py-3 [&_th]:font-head [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted [&_td]:border-b [&_td]:border-border/50 [&_td]:px-3 [&_td]:py-3 [&_td]:text-body">
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
                      <td colSpan={7} className="py-10 text-center text-muted">No drivers match current filters.</td>
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
                        <span className={`inline-flex rounded-full px-2.5 py-1 font-head text-[10px] font-bold uppercase tracking-wide ${driver.license_status === 'expired' ? 'bg-red-500/15 text-red-400' : driver.license_status === 'expiring_soon' ? 'bg-accent-hot/15 text-accent-hot' : 'bg-green/15 text-green'}`}>{humanizeLicenseStatus(driver.license_status)}</span>
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
                        <button type="button" className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45" onClick={() => navigate(`/drivers/${driver.id}`)}>
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
    <div className={`min-h-svh overflow-hidden bg-portal-deep text-ink grid ${railCollapsed ? 'md:grid-cols-[56px_minmax(0,1fr)]' : 'md:grid-cols-[220px_minmax(0,1fr)]'}`}>
      <FleetPortalRail
        railCollapsed={railCollapsed}
        setRailCollapsed={setRailCollapsed}
        railItems={railItems}
        currentPath={location.pathname}
        navigate={navigate}
        handleLogout={handleLogout}
      />

      <section className="flex min-h-0 flex-col overflow-auto p-5 md:p-6 flex min-h-0 flex-col overflow-auto p-5 md:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="[&_h1]:font-head [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-ink">
            <h1>Driver Details</h1>
            <p className="text-sm text-muted">View and edit complete information for one driver profile.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="rounded-full border border-border bg-card px-3 py-1.5 font-head text-xs font-semibold text-muted">Driver Center</button>
            <button type="button" className="rounded-full border border-border bg-card px-3 py-1.5 font-head text-xs font-semibold text-muted">Profile Editor</button>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card text-ink" aria-label="Drivers">DR</button>
            <span className="ml-1 font-head text-xs font-semibold text-ink">Fleet Team</span>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3 flex flex-wrap items-center gap-3">
          <button type="button" className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45" onClick={() => navigate('/drivers')}>Back to Drivers</button>
          <div className="grid gap-3 sm:grid-cols-2">
            {selectedDriver ? (
              <span>{selectedDriver.full_name} · {selectedDriver.license_number}</span>
            ) : (
              <span>Driver not found</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45"
              onClick={() => runToolbarAction(async () => {
                if (driverResource) await fetchResource(driverResource)
              })}
              disabled={!token || !driverResource || toolbarBusy}
            >
              {toolbarBusy ? 'Working...' : 'Refresh Drivers'}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45"
              onClick={() => runToolbarAction(async () => {
                if (truckResource) await fetchResource(truckResource)
              })}
              disabled={!token || !truckResource || toolbarBusy}
            >
              {toolbarBusy ? 'Working...' : 'Refresh Trucks'}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45 border-transparent bg-accent text-ink hover:bg-accent-hot"
              onClick={() => runToolbarAction(refreshAllResources)}
              disabled={!token || toolbarBusy}
            >
              {toolbarBusy ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </div>

        {!selectedDriver && (
          <div className="mb-5 rounded-xl border border-border bg-card p-5 [&_h3]:mb-3 [&_h3]:font-head [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink">
            <h3>Driver Not Available</h3>
            <p className="text-sm text-green">This driver record could not be found. Try returning to Drivers and opening the record again.</p>
          </div>
        )}

        {selectedDriver && (
          <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
            <aside className="rounded-xl border border-border bg-card p-5 space-y-3 mb-5 rounded-xl border border-border bg-card p-5 [&_h3]:mb-3 [&_h3]:font-head [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink">
              <h3>{selectedDriver.full_name}</h3>
              <p className="flex justify-between gap-3 border-b border-border/40 py-2 text-sm last:border-0 [&_span]:text-muted [&_strong]:text-ink">Email: {selectedDriver.email}</p>
              <p className="flex justify-between gap-3 border-b border-border/40 py-2 text-sm last:border-0 [&_span]:text-muted [&_strong]:text-ink">Phone: {selectedDriver.phone}</p>
              <p className="flex justify-between gap-3 border-b border-border/40 py-2 text-sm last:border-0 [&_span]:text-muted [&_strong]:text-ink">License: {selectedDriver.license_number} · Class {selectedDriver.license_class}</p>
              <p className="flex justify-between gap-3 border-b border-border/40 py-2 text-sm last:border-0 [&_span]:text-muted [&_strong]:text-ink">Status: {humanizeLicenseStatus(selectedDriver.license_status)} ({formatDaysUntilExpiry(selectedDriver.license_days_until_expiry)})</p>
              <p className="flex justify-between gap-3 border-b border-border/40 py-2 text-sm last:border-0 [&_span]:text-muted [&_strong]:text-ink">Assigned Truck: {selectedDriver.assigned_truck_label ?? 'Unassigned'}</p>
              <p className="flex justify-between gap-3 border-b border-border/40 py-2 text-sm last:border-0 [&_span]:text-muted [&_strong]:text-ink">Record ID: {selectedDriver.id}</p>
            </aside>

            <form className="mb-5 rounded-xl border border-border bg-card p-5 [&_h3]:mb-3 [&_h3]:font-head [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink" onSubmit={handleUpdateDriver}>
              <h3>Edit Driver</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 [&_input]:rounded-md [&_input]:border [&_input]:border-border [&_input]:bg-dark/40 [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:text-ink [&_input]:outline-none focus:[&_input]:border-accent [&_select]:rounded-md [&_select]:border [&_select]:border-border [&_select]:bg-dark/40 [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm [&_select]:text-ink">
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
                <label className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-body">
                  Active driver
                  <input type="checkbox" checked={driverEditForm.is_active} onChange={(e) => setDriverEditForm((f) => ({ ...f, is_active: e.target.checked }))} />
                </label>
              </div>
              <textarea placeholder="Notes" rows={3} value={driverEditForm.notes} onChange={(e) => setDriverEditForm((f) => ({ ...f, notes: e.target.value }))} />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="submit" className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45 border-transparent bg-accent text-ink hover:bg-accent-hot" disabled={saving}>{saving ? 'Saving...' : 'Save Driver Changes'}</button>
                {message && <p className="text-sm text-green">{message}</p>}
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
    <div className={`min-h-svh overflow-hidden bg-portal-deep text-ink grid ${railCollapsed ? 'md:grid-cols-[56px_minmax(0,1fr)]' : 'md:grid-cols-[220px_minmax(0,1fr)]'}`}>
      <FleetPortalRail
        railCollapsed={railCollapsed}
        setRailCollapsed={setRailCollapsed}
        railItems={railItems}
        currentPath={location.pathname}
        navigate={navigate}
        handleLogout={handleLogout}
      />

      <section className="flex min-h-0 flex-col overflow-auto p-5 md:p-6 flex min-h-0 flex-col overflow-auto p-5 md:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="[&_h1]:font-head [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-ink">
            <h1>Routes ({filteredRoutes.length})</h1>
            <p className="text-sm text-muted">Plan, monitor, and review active fleet routes.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="rounded-full border border-border bg-card px-3 py-1.5 font-head text-xs font-semibold text-muted">Route Center</button>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card text-ink" aria-label="Routes">RT</button>
            <span className="ml-1 font-head text-xs font-semibold text-ink">Fleet Team</span>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input className="min-w-[200px] flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-accent" placeholder="Search route, location, truck, driver, or cargo" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="rounded-md border border-border bg-card px-3 py-2 text-sm text-ink outline-none focus:border-accent" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Route Statuses</option>
            <option value="In Transit">In Transit</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Delayed">Delayed</option>
            <option value="Completed">Completed</option>
          </select>
          <button type="button" className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent disabled:opacity-45 border-transparent bg-accent text-ink hover:bg-accent-hot" onClick={() => setQuery('')}>Reset View</button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 [&_p]:text-xs [&_p]:uppercase [&_p]:tracking-wider [&_p]:text-muted [&_strong]:mt-1 [&_strong]:block [&_strong]:font-head [&_strong]:text-xl [&_strong]:text-ink"><small>Total Routes</small><strong>{DEMO_ROUTES.length}</strong></div>
          <div className="rounded-xl border border-border bg-card p-4 [&_p]:text-xs [&_p]:uppercase [&_p]:tracking-wider [&_p]:text-muted [&_strong]:mt-1 [&_strong]:block [&_strong]:font-head [&_strong]:text-xl [&_strong]:text-ink bg-accent-hot/15 text-accent-hot"><small>In Transit</small><strong>{DEMO_ROUTES.filter((route) => route.status === 'In Transit').length}</strong></div>
          <div className="rounded-xl border border-border bg-card p-4 [&_p]:text-xs [&_p]:uppercase [&_p]:tracking-wider [&_p]:text-muted [&_strong]:mt-1 [&_strong]:block [&_strong]:font-head [&_strong]:text-xl [&_strong]:text-ink bg-red-500/15 text-red-400"><small>Needs Attention</small><strong>{DEMO_ROUTES.filter((route) => route.status === 'Delayed').length}</strong></div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between [&_h3]:font-head [&_h3]:text-sm [&_h3]:font-semibold">
            <h3>Route Schedule</h3>
            <span>Demo data</span>
          </div>
          <div className="overflow-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm [&_th]:border-b [&_th]:border-border [&_th]:bg-band/50 [&_th]:px-3 [&_th]:py-3 [&_th]:font-head [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted [&_td]:border-b [&_td]:border-border/50 [&_td]:px-3 [&_td]:py-3 [&_td]:text-body">
              <thead><tr><th>Route</th><th>Status</th><th>From / To</th><th>Schedule</th><th>Truck / Driver</th><th>Cargo</th></tr></thead>
              <tbody>
                {filteredRoutes.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted">No routes match the current filters.</td></tr>}
                {filteredRoutes.map((route) => (
                  <tr key={route.id}>
                    <td><strong>{route.reference}</strong><small>{route.distance}</small></td>
                    <td><span className={`rounded-full px-2 py-0.5 font-head text-[10px] font-bold uppercase ${route.status === 'Completed' ? 'bg-green/15 text-green' : route.status === 'Delayed' ? 'bg-accent/15 text-accent' : 'bg-white/10 text-muted'}`}>{route.status}</span></td>
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
    <div className={`min-h-svh overflow-hidden bg-portal-deep text-ink grid ${railCollapsed ? 'md:grid-cols-[56px_minmax(0,1fr)]' : 'md:grid-cols-[220px_minmax(0,1fr)]'}`}>
      <FleetPortalRail
        railCollapsed={railCollapsed}
        setRailCollapsed={setRailCollapsed}
        railItems={railItems}
        currentPath={location.pathname}
        navigate={navigate}
        handleLogout={handleLogout}
      />

      <section className="flex min-h-0 flex-col overflow-auto p-5 md:p-6 flex min-h-0 flex-col overflow-auto p-5 md:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="[&_h1]:font-head [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-ink">
            <h1>{title}</h1>
            <p className="text-sm text-muted">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="rounded-full border border-border bg-card px-3 py-1.5 font-head text-xs font-semibold text-muted">{title} Center</button>
            <span className="ml-1 font-head text-xs font-semibold text-ink">Fleet Team</span>
          </div>
        </header>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between [&_h3]:font-head [&_h3]:text-sm [&_h3]:font-semibold">
            <h3>{title} Dashboard</h3>
            <span>Standalone page</span>
          </div>
          <p className="text-sm text-green">This is the dedicated {title.toLowerCase()} page. You are no longer redirected to a different section.</p>
        </div>
      </section>
    </div>
  )
}

function RoutePlannerDashboard({ handleLogout, defaultPlannerOpen = true }) {
  const location = useLocation()
  const navigate = useNavigate()
  const plannerMapElRef = useRef(null)
  const plannerMapRef = useRef(null)
  const plannerMapLayerRef = useRef(null)
  const plannerMarkersRef = useRef([])
  const [plannerOpen, setPlannerOpen] = useState(defaultPlannerOpen)
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [departure, setDeparture] = useState(() => new Date().toISOString().slice(0, 16))
  const [moreOptions, setMoreOptions] = useState(false)
  const [routeProfile, setRouteProfile] = useState('Balanced')
  const [routeReady, setRouteReady] = useState(false)
  const [lightTheme, setLightTheme] = useState(false)
  const [plannerTick, setPlannerTick] = useState(0)
  const [selectedDemoVehicleId, setSelectedDemoVehicleId] = useState(null)
  const toggleTheme = () => setLightTheme((isLight) => !isLight)

  const plannerVehicles = useMemo(() => PLANNER_DEMO_VEHICLES.map((vehicle) => {
    if (vehicle.speed === 0) return { ...vehicle, heading: 0, lat: vehicle.lat, lng: vehicle.lng }
    const phase = plannerTick / 2.4 + vehicle.phase
    return {
      ...vehicle,
      lat: vehicle.lat + Math.sin(phase) * 0.105,
      lng: vehicle.lng + Math.cos(phase) * 0.16,
      heading: (Math.atan2(-Math.sin(phase), Math.cos(phase)) * 180 / Math.PI + 360) % 360,
      speed: vehicle.speed + Math.round(Math.sin(phase * 1.7) * 5),
    }
  }), [plannerTick])
  const selectedDemoVehicle = plannerVehicles.find((vehicle) => vehicle.id === selectedDemoVehicleId) ?? null

  function createPlannerMapLayer(isLight) {
    return isLight
      ? L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors', subdomains: 'abc' })
      : L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16, attribution: 'Tiles &copy; Esri' })
  }

  useEffect(() => {
    if (!plannerMapElRef.current || plannerMapRef.current) return undefined
    const map = L.map(plannerMapElRef.current, { zoomControl: false }).setView([50.65, 12.4], 5)
    plannerMapLayerRef.current = createPlannerMapLayer(lightTheme).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    plannerMapRef.current = map
    window.setTimeout(() => map.invalidateSize(), 0)
    return () => {
      map.remove()
      plannerMapRef.current = null
      plannerMapLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = plannerMapRef.current
    if (!map) return
    plannerMapLayerRef.current?.remove()
    plannerMapLayerRef.current = createPlannerMapLayer(lightTheme).addTo(map)
  }, [lightTheme])

  useEffect(() => {
    const timerId = window.setInterval(() => setPlannerTick((tick) => tick + 1), 1200)
    return () => window.clearInterval(timerId)
  }, [])

  useEffect(() => {
    const map = plannerMapRef.current
    if (!map) return undefined
    plannerMarkersRef.current.forEach((marker) => marker.remove())
    plannerMarkersRef.current = plannerVehicles.map((vehicle) => {
      const selected = vehicle.id === selectedDemoVehicleId
      const marker = L.marker([vehicle.lat, vehicle.lng], {
        icon: L.divIcon({
          className: 'planner-vehicle-marker-wrap',
          html: `<span class="planner-vehicle-marker${selected ? ' selected' : ''}${vehicle.speed === 0 ? ' stopped' : ''}" style="--vehicle-heading:${vehicle.heading}deg"><i></i></span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
        keyboard: true,
        title: `${vehicle.id} · ${vehicle.make} ${vehicle.model}`,
      }).addTo(map)
      marker.bindTooltip(`${vehicle.id} · ${vehicle.speed === 0 ? 'Stopped' : `${vehicle.speed} km/h`}`, { direction: 'top', offset: [0, -18] })
      marker.on('click', () => setSelectedDemoVehicleId(vehicle.id))
      return marker
    })
    return () => plannerMarkersRef.current.forEach((marker) => marker.remove())
  }, [plannerVehicles, selectedDemoVehicleId])

  useEffect(() => {
    const map = plannerMapRef.current
    if (!map) return undefined
    const resizeMap = window.setTimeout(() => map.invalidateSize({ pan: false }), 270)
    return () => window.clearTimeout(resizeMap)
  }, [plannerOpen])

  function optimizeRoute() {
    if (!origin.trim() || !destination.trim()) return
    setRouteReady(true)
  }

  return (
    <div className={`grid min-h-svh text-ink ${lightTheme ? 'bg-[#e8ecf1] text-[#111827]' : 'bg-portal-deep'} ${plannerOpen ? 'md:grid-cols-[64px_minmax(320px,400px)_minmax(0,1fr)]' : 'md:grid-cols-[64px_minmax(0,1fr)]'}`}>
      <aside className="flex flex-col items-center gap-3 border-r border-border bg-[#0a101b] py-4">
        <button className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-white/5" type="button" aria-label="Home" onClick={() => navigate('/')}><LogoIcon /></button>
        <div className="flex flex-1 flex-col gap-2">
          {STANDARD_RAIL_ITEMS.slice(0, 9).map((item) => (
            <button type="button" key={item.key} className={`grid h-10 w-10 place-items-center rounded-lg transition hover:bg-white/5 ${isRailRouteActive(location.pathname, item.to) ? 'bg-accent/15 text-accent' : 'text-muted hover:text-ink'}`} aria-label={item.title} title={item.title} onClick={() => item.to && navigate(item.to)}><RailItemIcon itemKey={item.key} /></button>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <button type="button" className="grid h-10 w-10 place-items-center rounded-lg text-muted transition hover:bg-white/5 hover:text-ink" aria-label={lightTheme ? 'Use dark mode' : 'Use light mode'} title={lightTheme ? 'Use dark mode' : 'Use light mode'} onClick={toggleTheme}><PlannerThemeIcon light={lightTheme} /></button>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-lg text-muted transition hover:bg-white/5 hover:text-ink" aria-label="Compliance" title="Compliance" onClick={() => navigate('/compliance')}><RailItemIcon itemKey="support" /></button>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-lg text-muted transition hover:bg-white/5 hover:text-ink" aria-label="Logout" title="Logout" onClick={handleLogout}><RailItemIcon itemKey="logout" /></button>
        </div>
      </aside>
      {plannerOpen && (
      <section className="flex min-h-0 flex-col overflow-hidden border-r border-border bg-portal" aria-label="Route planner">
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3"><LogoIcon /><strong className="font-head text-sm">Route Planner</strong><button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted" aria-label={lightTheme ? 'Use dark mode' : 'Use light mode'} title={lightTheme ? 'Use dark mode' : 'Use light mode'} onClick={toggleTheme}><PlannerThemeIcon light={lightTheme} /></button><button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted" aria-label="Collapse route planner" title="Collapse route planner" onClick={() => setPlannerOpen(false)}><PlannerPanelIcon open /></button></header>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:border-border [&_input]:bg-card [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:text-ink [&_input]:outline-none focus:[&_input]:border-accent [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:border-border [&_select]:bg-card [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm [&_select]:text-ink [&_button]:rounded-md [&_button]:border [&_button]:border-border [&_button]:bg-card [&_button]:px-3 [&_button]:py-2 [&_button]:text-xs [&_button]:text-ink">
          <article className="rounded-xl border border-border bg-card p-3">
            <img src={dashboardImage} alt="Electric delivery truck" className="mb-3 w-full rounded-lg object-cover" />
            <div className="font-head text-sm font-semibold text-ink"><strong>eActros 600</strong></div>
            <div className="mt-1 flex justify-between text-[10px] text-muted"><span>Starting Battery</span><strong>100%</strong></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"><span className="block h-full w-full bg-green" /></div>
          </article>
          <label className="font-head text-[11px] font-semibold uppercase tracking-wider text-muted" htmlFor="planner-origin">Origin</label>
          <div><input id="planner-origin" value={origin} onChange={(event) => { setOrigin(event.target.value); setRouteReady(false) }} placeholder="Search origin location..." /></div>
          <div className="flex items-center justify-between"><label className="font-head text-[11px] font-semibold uppercase tracking-wider text-muted" htmlFor="planner-destination">Destinations</label><button type="button" onClick={() => setDestination((value) => value ? `${value}; ` : value)}>+ Add Stop</button></div>
          <div><input id="planner-destination" value={destination} onChange={(event) => { setDestination(event.target.value); setRouteReady(false) }} placeholder="Search destination..." /></div>
          <label className="font-head text-[11px] font-semibold uppercase tracking-wider text-muted" htmlFor="planner-departure">Departure</label>
          <div className="flex gap-2"><input id="planner-departure" type="datetime-local" value={departure} onChange={(event) => setDeparture(event.target.value)} /><button type="button" onClick={() => setDeparture(new Date().toISOString().slice(0, 16))}>Now</button></div>
          <label className="font-head text-[11px] font-semibold uppercase tracking-wider text-muted" htmlFor="planner-profile">Optimization profile</label>
          <div><select id="planner-profile" value={routeProfile} onChange={(event) => setRouteProfile(event.target.value)}><option>Balanced</option><option>Lowest cost</option><option>Fastest arrival</option><option>Lowest emissions</option></select></div>
          <button type="button" onClick={() => setMoreOptions((visible) => !visible)}>⚙ {moreOptions ? 'Hide Options' : 'More Options'}</button>
          {moreOptions && <div className="space-y-2 rounded-lg border border-border/60 bg-dark/30 p-3 text-xs"><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Prefer commercial routes</label><label className="flex items-center gap-2"><input type="checkbox" /> Avoid tolls</label></div>}
          <div className="rounded-xl border border-border bg-card p-3 text-sm"><span className="text-muted">Estimated trip</span><strong className="mt-1 block font-head text-ink">{routeProfile === 'Fastest arrival' ? '6h 18m' : routeProfile === 'Lowest cost' ? '$184.60' : '482 mi'}</strong><small className="text-muted">{routeProfile} routing is ready when locations are added.</small></div>
          <button type="button" className="!border-0 !bg-accent !py-3 font-head text-sm font-bold uppercase tracking-wide text-ink transition hover:!bg-accent-hot" disabled={!origin.trim() || !destination.trim()} onClick={optimizeRoute}>Optimize Route</button>
        </div>
      </section>
      )}
      <main className="relative min-h-[50vh] md:min-h-0">
        <div ref={plannerMapElRef} className="absolute inset-0 h-full w-full" />
        {selectedDemoVehicle && (
          <article className="absolute left-4 top-4 z-10 w-64 space-y-1 rounded-xl border border-border bg-card/95 p-3 text-xs text-muted shadow-float" aria-live="polite">
            <button type="button" className="absolute right-2 top-2" aria-label="Close vehicle details" onClick={() => setSelectedDemoVehicleId(null)}>&times;</button>
            <div className="flex items-center justify-between"><span className={selectedDemoVehicle.speed === 0 ? 'text-accent-hot' : 'text-green'}>{selectedDemoVehicle.status}</span><strong className="text-ink">{selectedDemoVehicle.id}</strong></div>
            <p>{selectedDemoVehicle.make} {selectedDemoVehicle.model}</p>
            <dl className="grid grid-cols-2 gap-1">
              <div><dt className="text-[10px] uppercase">Driver</dt><dd className="text-ink">{selectedDemoVehicle.driver}</dd></div>
              <div><dt className="text-[10px] uppercase">Speed</dt><dd className="text-ink">{selectedDemoVehicle.speed} km/h</dd></div>
              <div><dt className="text-[10px] uppercase">Fuel</dt><dd className="text-ink">{selectedDemoVehicle.fuel}%</dd></div>
              <div><dt className="text-[10px] uppercase">Route</dt><dd className="text-ink">{selectedDemoVehicle.route}</dd></div>
            </dl>
          </article>
        )}
        {!routeReady && <button type="button" className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border bg-card/95 px-4 py-2 font-head text-xs font-semibold shadow-float" onClick={() => navigate('/signup')}>Sign up to start using now</button>}
        {routeReady && <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-green/30 bg-green/10 px-4 py-2 text-sm text-green">Route ready: {origin} to {destination}</div>}
        {!plannerOpen && (
          <button type="button" className="fixed bottom-6 left-6 z-20 flex items-center gap-2 rounded-full bg-accent px-4 py-3 font-head text-xs font-bold uppercase tracking-wide text-ink shadow-float" aria-label="Open route planner" onClick={() => setPlannerOpen(true)}>
            <PlannerPanelIcon open />
            <span>Open planner</span>
          </button>
        )}
      </main>
    </div>
  )
}

function Portal({
  token, resources, fleetCount,
  refreshAllResources, handleLogout, fetchResource, isDemoSession, managerMode = false,
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

  if (!managerMode) {
    return <RoutePlannerDashboard handleLogout={handleLogout} defaultPlannerOpen={!isDemoSession} />
  }

  return (
    <div className={`min-h-svh overflow-hidden bg-portal-deep text-ink grid ${railCollapsed ? 'md:grid-cols-[56px_360px_minmax(0,1fr)]' : 'md:grid-cols-[220px_360px_minmax(0,1fr)]'}`}>
      <FleetPortalRail
        railCollapsed={railCollapsed}
        setRailCollapsed={setRailCollapsed}
        railItems={railItems}
        currentPath={location.pathname}
        navigate={navigate}
        handleLogout={handleLogout}
      />

      <section className="flex min-h-0 flex-col gap-4 overflow-y-auto border-r border-border bg-portal p-4">
        <div className="space-y-1 [&_p]:text-[11px] [&_p]:uppercase [&_p]:tracking-wider [&_p]:text-muted [&_strong]:font-head [&_strong]:text-lg [&_strong]:text-ink">
          <p>{managerMode ? 'Fleet Manager' : 'Fleet View'}</p>
          <p>{managerMode ? 'Focused Unit Monitoring' : 'Company Operations Monitoring'}</p>
          <strong>{managerMode ? (selectedTruck ? selectedTruck.license_plate : 'No truck selected') : 'Company Live'}</strong>
        </div>

        {managerMode && filteredTrucks.length > 0 && (
          <div className="space-y-2 [&_label]:text-xs [&_label]:text-muted [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:border-border [&_select]:bg-card [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm [&_select]:text-ink">
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
          <div className="flex gap-2">
            <button type="button" className="bg-accent/15 text-accent" onClick={() => navigate('/fleet-manager')}>Live</button>
            <button type="button" onClick={() => navigate('/history')}>History</button>
            <button type="button" onClick={() => navigate('/drivers')}>Profile</button>
          </div>
        )}

        {managerMode && selectedTruck ? (
          <>
            <article className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between [&_h3]:font-head [&_h3]:text-sm [&_h3]:font-semibold">
                <h3>Status</h3>
                <span>Now</span>
              </div>
              <p className="text-sm text-body">{speedMph} mph in motion for {movingMinutes}m</p>
              <p className="text-xs text-muted">{selectedTruck.location.lat.toFixed(4)}, {selectedTruck.location.lng.toFixed(4)} · New Jersey</p>
              <p className="text-xs text-muted">Height {metersToFeet(selectedTruckHeightM).toFixed(1)} ft · Length {metersToFeet(selectedTruckLengthM).toFixed(1)} ft</p>
              <div className="mt-3 rounded-lg border border-border/60 bg-dark/30 p-3 text-sm">
                <small>Current Driver</small>
                <strong>{currentDriver?.full_name ?? 'Unassigned'}</strong>
              </div>
              <div className="mt-3 space-y-2 rounded-lg border border-border/60 bg-dark/30 p-3">
                <div className="flex items-center justify-between text-xs font-semibold text-ink">
                  <strong>Geofence</strong>
                  <span className={selectedGeofenceInside ? 'geofence-inside' : 'geofence-outside'}>
                    {selectedGeofenceInside ? 'Inside zone' : 'Outside zone'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted [&_input]:accent-accent">
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

            <article className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between [&_h3]:font-head [&_h3]:text-sm [&_h3]:font-semibold">
                <h3>Suggested Routes</h3>
                <span>Clearance checked</span>
              </div>
              <div className="mt-3 space-y-2">
                {routeRecommendations.map((route) => (
                  <div className={`flex items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2 text-sm ${route.safe ? 'route-safe' : 'route-blocked'}`} key={route.name}>
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

            <article className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between [&_h3]:font-head [&_h3]:text-sm [&_h3]:font-semibold">
                <h3>Telematics</h3>
                <span>updated now</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
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

            <article className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between [&_h3]:font-head [&_h3]:text-sm [&_h3]:font-semibold">
                <h3>Cameras</h3>
                <button onClick={() => truckResource && fetchResource(truckResource)} disabled={!token || !truckResource}>Refresh</button>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <strong>Google Street View</strong>
                  <a href={streetViewMapsUrl} target="_blank" rel="noreferrer">Open full view</a>
                </div>
                {streetViewEmbedUrl ? (
                  <iframe
                    className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-dark"
                    title="Fleet live street view"
                    src={streetViewEmbedUrl}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted">
                    <p>Add VITE_GOOGLE_MAPS_EMBED_API_KEY in frontend/.env to embed Street View here.</p>
                    <a href={streetViewMapsUrl} target="_blank" rel="noreferrer">Open Street View in Google Maps</a>
                  </div>
                )}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {cameraFeeds.map((feed) => (
                  <div key={feed.id} className="overflow-hidden rounded-lg border border-border" style={{ backgroundImage: `linear-gradient(180deg, rgba(20, 36, 59, .24) 0%, rgba(20, 36, 59, .72) 100%), url('${feed.image}')` }}>
                    <span className="relative aspect-video bg-dark [&_img]:h-full [&_img]:w-full [&_img]:object-cover">LIVE</span>
                    <div className="space-y-0.5 p-2 text-xs [&_strong]:text-ink [&_span]:text-muted">
                      <strong>{feed.label}</strong>
                      <small>{feed.detail}</small>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </>
        ) : managerMode ? (
          <p className="text-sm text-muted">No trucks yet. Create one and refresh trucks.</p>
        ) : (
          <article className="rounded-xl border border-border bg-card p-4 m-3 rounded-xl border border-border bg-card p-4 text-sm">
            <div className="mb-3 flex items-center justify-between [&_h3]:font-head [&_h3]:text-sm [&_h3]:font-semibold">
              <h3>Company Live Overview</h3>
              <span>Company wide</span>
            </div>
            <div className="grid grid-cols-2 gap-2 border-b border-border bg-portal/80 p-3 lg:grid-cols-4">
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
          <article className="rounded-xl border border-border bg-card p-5 grid gap-3 border-b border-border bg-portal/60 p-3 lg:grid-cols-2">
            <div className="mb-3 flex items-center justify-between [&_h3]:font-head [&_h3]:text-sm [&_h3]:font-semibold">
              <h3>Dispatch Board</h3>
              <span>Company-level signals</span>
            </div>
            <div className="space-y-2">
              <div>
                <h4>Top Movers</h4>
                {topMovers.length === 0 && <p className="text-sm text-muted">No units found.</p>}
                {topMovers.map((truck) => (
                  <div className="flex items-center justify-between gap-2 rounded-md border border-border/50 bg-card/40 px-3 py-2 text-xs" key={`mover-${truck.id}`}>
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
                {attentionUnits.length === 0 && <p className="text-sm text-green">No critical engine/fuel alerts right now.</p>}
                {attentionUnits.map((truck) => (
                  <div className="flex items-center justify-between gap-2 rounded-md border border-border/50 bg-card/40 px-3 py-2 text-xs" key={`attention-${truck.id}`}>
                    <div>
                      <strong>{truck.license_plate}</strong>
                      <p>Fuel {truck.unitFuel}% · Engine {truck.unitEngine}%</p>
                    </div>
                    <button className="rounded-md border border-border bg-dark/40 px-3 py-1.5 font-head text-xs font-semibold text-ink transition hover:border-accent" onClick={() => focusTruck(truck.id)}>Track</button>
                  </div>
                ))}
              </div>
            </div>
          </article>
        )}

        <article className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between [&_h3]:font-head [&_h3]:text-sm [&_h3]:font-semibold">
            <h3>{managerMode ? 'Fleet Units' : 'Company Fleet Roster'}</h3>
            <span>{filteredTrucks.length} active</span>
          </div>
          <input
            className="min-w-[180px] rounded-md border border-border bg-card px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
            placeholder={managerMode ? 'Search selected fleet unit' : 'Search company fleet'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-40 space-y-1 overflow-auto p-3">
            {filteredTrucks.map((truck, index) => (
              <button
                key={truck.id}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-xs transition hover:bg-white/5 ${selectedTruckId === truck.id ? 'bg-accent/15 text-accent' : ''}`}
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

      <section className="relative flex min-h-0 flex-col bg-[#0d1218]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-portal px-4 py-3">
          {!managerMode && <span className="rounded-full bg-green/15 px-2 py-0.5 font-head text-[10px] font-bold text-green">LIVE TRACKING · {Math.round(liveRefreshMs / 1000)}s refresh</span>}
          <button className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent" onClick={() => truckResource && fetchResource(truckResource)} disabled={!token || !truckResource}>Refresh Vehicles</button>
          <button className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent" onClick={refreshAllResources} disabled={!token}>Sync All</button>
          <button className="rounded-md border border-border bg-card px-3 py-2 font-head text-xs font-semibold text-ink transition hover:border-accent border-transparent bg-accent text-ink hover:bg-accent-hot" onClick={handleShareLocation} disabled={!selectedTruck}>Share Location</button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col">
          {mapError && (
            <div className="relative h-full min-h-[240px] overflow-hidden rounded-xl border border-border bg-[#101820]" aria-label="Dummy map">
              <div className="absolute inset-0 opacity-30" />
              <div className="absolute bg-border/40 left-[10%] top-1/2 h-0.5 w-[80%]" />
              <div className="absolute bg-border/40 left-1/3 top-[15%] h-[70%] w-0.5" />
              <div className="absolute bg-border/40 left-[55%] top-[20%] h-[55%] w-0.5" />
              <div className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink left-[28%] top-[42%] bg-accent" />
              <div className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink left-[48%] top-[58%] bg-green" />
              <div className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink left-[68%] top-[35%] bg-accent-hot" />
              <div className="absolute left-3 top-3 rounded bg-dark/80 px-2 py-1 font-head text-[10px] font-bold text-ink">New Jersey Demo Map</div>
            </div>
          )}
          <div ref={mapElRef} className="relative min-h-0 flex-1" />
          {selectedTruck && (
            <div className="rounded-xl border border-border bg-card p-4" aria-live="polite">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <strong className="flex items-center gap-2 font-head text-sm font-semibold text-ink"><span className="text-accent"><WeatherConditionIcon weatherDetails={weatherDetails} /></span>Weather</strong>
                    <small>{weatherDetails?.provider ?? 'provider unavailable'}</small>
                  </div>
                  <div className="text-[11px] text-muted">
                    <small>{selectedTruck.license_plate}</small>
                    <span>{truckLocalTime}</span>
                    <span>{truckTimezone}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="font-head text-3xl font-bold text-ink">{weatherDetails?.temp_c !== undefined ? `${Math.round(weatherDetails.temp_c)}°C` : 'N/A'}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <strong className="text-[10px] uppercase tracking-wider text-muted"><ThermometerIcon />Feels</strong>
                      <div>{weatherDetails?.feels_like_c !== undefined ? `${Math.round(weatherDetails.feels_like_c)}°C` : 'N/A'}</div>
                    </div>
                    <div>
                      <strong className="text-[10px] uppercase tracking-wider text-muted"><DropletIcon />Humidity</strong>
                      <div>{weatherDetails?.humidity_pct ?? 'N/A'}%</div>
                    </div>
                    <div>
                      <strong className="text-[10px] uppercase tracking-wider text-muted"><RainDropIcon />Precip</strong>
                      <div>{weatherDetails?.precip_mm ?? 'N/A'} mm</div>
                    </div>
                    <div>
                      <strong className="text-[10px] uppercase tracking-wider text-muted"><CloudsIcon />Clouds</strong>
                      <div>{weatherDetails?.cloud_cover_pct ?? 'N/A'}%</div>
                    </div>
                  </div>
                </div>

                {weatherLoading && <div className="text-sm text-muted">Refreshing weather…</div>}
                {!!weatherError && <div className="text-sm text-accent-hot">{weatherError}</div>}
              </div>
            </div>
          )}
          {mapError && (
            <div className="absolute bottom-3 left-3 text-[10px] text-muted">
              <strong>Fallback map active</strong>
              <p>{mapError}. Showing built-in dummy map until map tiles are reachable.</p>
            </div>
          )}
          <div className="rounded-full bg-accent/15 px-3 py-1 font-head text-xs font-bold text-accent">
            {managerMode ? `${mapTrucks.length} selected unit live` : `${filteredTrucks.length} company units live`} · {localTrucks.length} company trucks
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Auth wrapper ─────────────────────────────────────────────────────────────
function AuthPage({ title, subtitle, children, message, language = 'en' }) {
  const [showScrollCue, setShowScrollCue] = useState(false)
  const copy = getSiteCopy(language)

  useEffect(() => {
    function updateScrollCue() {
      const { scrollHeight, scrollTop, clientHeight } = document.documentElement
      setShowScrollCue(scrollHeight > clientHeight + 24 && scrollTop + clientHeight < scrollHeight - 24)
    }
    updateScrollCue()
    window.addEventListener('resize', updateScrollCue)
    window.addEventListener('scroll', updateScrollCue, { passive: true })
    return () => {
      window.removeEventListener('resize', updateScrollCue)
      window.removeEventListener('scroll', updateScrollCue)
    }
  }, [])

  function scrollToNextAuthSection() {
    window.scrollBy({ top: Math.round(window.innerHeight * 0.72), behavior: 'smooth' })
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[linear-gradient(120deg,rgba(8,12,18,.96),rgba(16,23,31,.9))] p-9">
      <div className="relative z-10 grid w-full max-w-[960px] min-h-[610px] grid-cols-1 overflow-hidden border border-border shadow-[0_28px_80px_rgba(0,0,0,.4)] md:grid-cols-[1.03fr_0.97fr]">
        <section className="flex flex-col justify-center bg-[rgba(12,17,23,.96)] px-7 py-11 md:px-12" aria-labelledby="auth-title">
          <a href="/" className="flex items-center gap-2.5 font-head text-base font-bold text-ink"><LogoIcon /><span>ATONDA</span></a>
          <div className="mt-14">
            <span className="font-head text-[10px] font-bold uppercase tracking-[0.14em] text-accent">{copy.authWorkspace}</span>
            <h2 id="auth-title" className="my-2.5 font-head text-[clamp(30px,3vw,40px)] font-bold leading-none text-ink">{title}</h2>
            <p className="mb-8 text-sm leading-relaxed text-body">{subtitle}</p>
          </div>
          {children}
          {message && <p className="mt-4 border-l-2 border-accent bg-accent-soft px-3 py-2.5 text-sm text-[#ffe5d8]">{message}</p>}
        </section>
        <aside className="relative hidden flex-col justify-end overflow-hidden bg-[linear-gradient(155deg,rgba(255,90,31,.16),rgba(19,32,42,.88)_43%,rgba(14,19,25,.96))] px-10 py-14 md:flex" aria-label="Platform overview">
          <div className="absolute right-12 top-12 text-ink/70"><LogoIcon /></div>
          <p className="font-head text-[10px] font-bold uppercase tracking-[0.14em] text-accent">{copy.control}</p>
          <h1 className="relative mt-3.5 font-head text-[clamp(38px,4.3vw,58px)] leading-[0.92] text-ink [&_em]:not-italic [&_em]:text-accent">{copy.everyMile}<br /><em>{copy.inView}</em></h1>
          <p className="relative mt-4 max-w-[28ch] text-sm leading-relaxed text-body">{copy.authContext}</p>
          <div className="relative mt-9 grid grid-cols-2 gap-5 border-t border-border pt-4">
            <div className="flex flex-col gap-1"><strong className="font-head text-lg tracking-wide text-ink">24/7</strong><span className="text-[11px] text-body/80">{copy.fleetVisibility}</span></div>
            <div className="flex flex-col gap-1"><strong className="font-head text-lg tracking-wide text-ink">LIVE</strong><span className="text-[11px] text-body/80">{copy.operationalSignals}</span></div>
          </div>
        </aside>
      </div>
      {showScrollCue && (
        <button type="button" className="fixed bottom-[max(18px,env(safe-area-inset-bottom))] right-[18px] z-20 grid h-[42px] w-[42px] place-items-center rounded-full border border-border-strong bg-[rgba(12,17,23,.9)] shadow-float md:hidden" onClick={scrollToNextAuthSection} aria-label="Scroll down to continue">
          <span aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  const navigate = useNavigate()
  const [token, setToken] = useState(() => localStorage.getItem('truckAppToken') ?? '')
  const [isDemoSession, setIsDemoSession] = useState(() => sessionStorage.getItem('truckAppDemoSession') === 'true')
  const [language, setLanguage] = useState(() => localStorage.getItem('truckAppLanguage') ?? 'en')
  const authResetRef = useRef(false)
  const [registerForm, setRegisterForm] = useState(DEFAULT_REGISTER)
  const [loginForm, setLoginForm] = useState(DEFAULT_LOGIN)
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
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

  useEffect(() => {
    document.documentElement.lang = language
    localStorage.setItem('truckAppLanguage', language)
  }, [language])

  const saveToken = useCallback((t) => {
    if (!t) {
      localStorage.removeItem('truckAppToken')
      sessionStorage.removeItem('truckAppDemoSession')
      setIsDemoSession(false)
      setToken('')
      return
    }
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

  const startDemo = useCallback(() => {
    if (token) { navigate('/portal'); return }
    sessionStorage.setItem('truckAppDemoSession', 'true')
    setIsDemoSession(true)
    navigate('/portal')
  }, [navigate, token])

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
      sessionStorage.removeItem('truckAppDemoSession'); setIsDemoSession(false)
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
    refreshAllResources, handleLogout, fetchResource, handleCreateResource, authMessage, isDemoSession,
  }
  const copy = getSiteCopy(language)

  return (
    <Routes>
      <Route path="/" element={<Landing token={token} isDemoSession={isDemoSession} startDemo={startDemo} demoLoading={demoLoading} language={language} setLanguage={setLanguage} />} />
      <Route path="/fleet" element={<Landing token={token} isDemoSession={isDemoSession} startDemo={startDemo} demoLoading={demoLoading} language={language} setLanguage={setLanguage} />} />

      <Route
        path="/login"
        element={
          <AuthPage title={getSiteCopy(language).signIn} subtitle={getSiteCopy(language).signInSub} message={authMessage} language={language}>
            <form className="flex flex-col gap-4" onSubmit={handleLogin}>
              <div className="flex flex-col gap-1.5 [&_label]:font-head [&_label]:text-[11px] [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wider [&_label]:text-muted [&_input]:min-h-[50px] [&_input]:rounded [&_input]:border [&_input]:border-border-strong [&_input]:bg-white/[0.045] [&_input]:px-3.5 [&_input]:py-3 [&_input]:text-ink [&_input]:outline-none focus:[&_input]:border-accent focus:[&_input]:bg-accent-soft [&_select]:min-h-[50px] [&_select]:rounded [&_select]:border [&_select]:border-border-strong [&_select]:bg-white/[0.045] [&_select]:px-3.5 [&_select]:text-ink">
                <label htmlFor="login-email">{copy.workEmail}</label>
                <input id="login-email" required type="email" autoComplete="email" placeholder={copy.emailPlaceholder} value={loginForm.email}
                  onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5 [&_label]:font-head [&_label]:text-[11px] [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wider [&_label]:text-muted [&_input]:min-h-[50px] [&_input]:rounded [&_input]:border [&_input]:border-border-strong [&_input]:bg-white/[0.045] [&_input]:px-3.5 [&_input]:py-3 [&_input]:text-ink [&_input]:outline-none focus:[&_input]:border-accent focus:[&_input]:bg-accent-soft [&_select]:min-h-[50px] [&_select]:rounded [&_select]:border [&_select]:border-border-strong [&_select]:bg-white/[0.045] [&_select]:px-3.5 [&_select]:text-ink">
                <label htmlFor="login-password">{copy.password}</label>
                <input id="login-password" required type="password" autoComplete="current-password" placeholder={copy.passwordPlaceholder} value={loginForm.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
              <button type="submit" className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-head text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-accent-hot disabled:cursor-default disabled:opacity-45 mt-1 w-full uppercase tracking-wide" disabled={authLoading}>{authLoading ? 'Signing in...' : copy.enterPortal}</button>
              <button type="button" className="self-center border-0 bg-transparent p-0.5 font-head text-xs font-semibold text-muted transition hover:text-accent" onClick={() => setLoginForm(DUMMY_LOGIN)}>{copy.testAccount}</button>
              <p className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-center text-xs text-muted [&_a]:font-semibold [&_a]:text-ink hover:[&_a]:text-accent [&_span]:text-accent">{copy.newToAtonda} <Link to="/signup">{copy.createAnAccount}</Link><span>•</span><Link to="/">{copy.home}</Link></p>
            </form>
          </AuthPage>
        }
      />

      <Route
        path="/signup"
        element={
          <AuthPage title={getSiteCopy(language).createAccount} subtitle={getSiteCopy(language).createAccountSub} message={authMessage} language={language}>
            <form className="flex flex-col gap-4" onSubmit={handleRegister}>
              <div className="flex flex-col gap-1.5 [&_label]:font-head [&_label]:text-[11px] [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wider [&_label]:text-muted [&_input]:min-h-[50px] [&_input]:rounded [&_input]:border [&_input]:border-border-strong [&_input]:bg-white/[0.045] [&_input]:px-3.5 [&_input]:py-3 [&_input]:text-ink [&_input]:outline-none focus:[&_input]:border-accent focus:[&_input]:bg-accent-soft [&_select]:min-h-[50px] [&_select]:rounded [&_select]:border [&_select]:border-border-strong [&_select]:bg-white/[0.045] [&_select]:px-3.5 [&_select]:text-ink">
                <label htmlFor="signup-email">{copy.workEmail}</label>
                <input id="signup-email" required type="email" autoComplete="email" placeholder={copy.emailPlaceholder} value={registerForm.email}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5 [&_label]:font-head [&_label]:text-[11px] [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wider [&_label]:text-muted [&_input]:min-h-[50px] [&_input]:rounded [&_input]:border [&_input]:border-border-strong [&_input]:bg-white/[0.045] [&_input]:px-3.5 [&_input]:py-3 [&_input]:text-ink [&_input]:outline-none focus:[&_input]:border-accent focus:[&_input]:bg-accent-soft [&_select]:min-h-[50px] [&_select]:rounded [&_select]:border [&_select]:border-border-strong [&_select]:bg-white/[0.045] [&_select]:px-3.5 [&_select]:text-ink">
                <label htmlFor="signup-name">{copy.fullName}</label>
                <input id="signup-name" required autoComplete="name" placeholder={copy.namePlaceholder} value={registerForm.full_name}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5 [&_label]:font-head [&_label]:text-[11px] [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wider [&_label]:text-muted [&_input]:min-h-[50px] [&_input]:rounded [&_input]:border [&_input]:border-border-strong [&_input]:bg-white/[0.045] [&_input]:px-3.5 [&_input]:py-3 [&_input]:text-ink [&_input]:outline-none focus:[&_input]:border-accent focus:[&_input]:bg-accent-soft [&_select]:min-h-[50px] [&_select]:rounded [&_select]:border [&_select]:border-border-strong [&_select]:bg-white/[0.045] [&_select]:px-3.5 [&_select]:text-ink">
                <label htmlFor="signup-password">{copy.createPassword}</label>
                <input id="signup-password" required type="password" autoComplete="new-password" placeholder={copy.newPasswordPlaceholder} value={registerForm.password}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5 [&_label]:font-head [&_label]:text-[11px] [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wider [&_label]:text-muted [&_input]:min-h-[50px] [&_input]:rounded [&_input]:border [&_input]:border-border-strong [&_input]:bg-white/[0.045] [&_input]:px-3.5 [&_input]:py-3 [&_input]:text-ink [&_input]:outline-none focus:[&_input]:border-accent focus:[&_input]:bg-accent-soft [&_select]:min-h-[50px] [&_select]:rounded [&_select]:border [&_select]:border-border-strong [&_select]:bg-white/[0.045] [&_select]:px-3.5 [&_select]:text-ink">
                <label htmlFor="account-type">{copy.workspaceType}</label>
                <select id="account-type" value={registerForm.account_type}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, account_type: e.target.value }))}>
                  <option value="individual">{copy.independentOperator}</option>
                  <option value="company">{copy.fleetCompany}</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 [&_label]:font-head [&_label]:text-[11px] [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wider [&_label]:text-muted [&_input]:min-h-[50px] [&_input]:rounded [&_input]:border [&_input]:border-border-strong [&_input]:bg-white/[0.045] [&_input]:px-3.5 [&_input]:py-3 [&_input]:text-ink [&_input]:outline-none focus:[&_input]:border-accent focus:[&_input]:bg-accent-soft [&_select]:min-h-[50px] [&_select]:rounded [&_select]:border [&_select]:border-border-strong [&_select]:bg-white/[0.045] [&_select]:px-3.5 [&_select]:text-ink">
                <label htmlFor="company-name">{copy.companyName} {registerForm.account_type === 'company' ? '' : copy.optional}</label>
                <input id="company-name" required={registerForm.account_type === 'company'} autoComplete="organization" placeholder={copy.companyPlaceholder} value={registerForm.company_name}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, company_name: e.target.value }))} />
              </div>
              <button type="submit" className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-head text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-accent-hot disabled:cursor-default disabled:opacity-45 mt-1 w-full uppercase tracking-wide" disabled={authLoading}>{authLoading ? 'Creating workspace...' : copy.createWorkspace}</button>
              <p className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-center text-xs text-muted [&_a]:font-semibold [&_a]:text-ink hover:[&_a]:text-accent [&_span]:text-accent">{copy.alreadyHaveAccess} <Link to="/login">{copy.signIn}</Link><span>•</span><Link to="/">{copy.home}</Link></p>
            </form>
          </AuthPage>
        }
      />

      <Route path="/portal" element={token || isDemoSession ? <Portal {...portalProps} managerMode={false} /> : <Navigate to="/login" replace />} />
      <Route path="/fleet-manager" element={token ? <Portal {...portalProps} managerMode /> : <Navigate to="/login" replace />} />
      <Route path="/routes" element={token ? <RoutesPage handleLogout={handleLogout} /> : <Navigate to="/login" replace />} />
      <Route path="/safety" element={token ? <FeaturePlaceholderPage handleLogout={handleLogout} title="Safety" subtitle="Safety events, incidents, and compliance follow-up." /> : <Navigate to="/login" replace />} />
      <Route path="/alerts" element={token ? <FeaturePlaceholderPage handleLogout={handleLogout} title="Alerts" subtitle="Operational alerts and notifications in one place." /> : <Navigate to="/login" replace />} />
      <Route path="/cameras" element={token ? <FeaturePlaceholderPage handleLogout={handleLogout} title="Cameras" subtitle="Camera status and video feed management." /> : <Navigate to="/login" replace />} />
      <Route path="/vehicles" element={token ? <VehiclesPage token={token} resources={resources} refreshAllResources={refreshAllResources} handleLogout={handleLogout} fetchResource={fetchResource} /> : <Navigate to="/login" replace />} />
      <Route path="/drivers" element={token ? <DriversPage token={token} resources={resources} refreshAllResources={refreshAllResources} handleLogout={handleLogout} fetchResource={fetchResource} /> : <Navigate to="/login" replace />} />
      <Route path="/drivers/:driverId" element={token ? <DriverDetailsPage token={token} resources={resources} refreshAllResources={refreshAllResources} handleLogout={handleLogout} fetchResource={fetchResource} /> : <Navigate to="/login" replace />} />
      <Route path="/history" element={token ? <HistoryPage token={token} resources={resources} refreshAllResources={refreshAllResources} handleLogout={handleLogout} fetchResource={fetchResource} /> : <Navigate to="/login" replace />} />
      <Route path="/compliance" element={token ? <FleetCompliance token={token} resources={resources} refreshAllResources={refreshAllResources} handleLogout={handleLogout} /> : <Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
