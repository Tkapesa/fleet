import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

gsap.registerPlugin(ScrollTrigger)

const FLEET_MARKERS = [
  ['ATD-217', 'moving', 34.05, -118.24],
  ['ATD-1048', 'focus', 31.55, -96.35],
  ['ATD-402', 'moving', 40.71, -74.01],
  ['ATD-083', 'idle', 41.88, -87.63],
  ['ATD-612', 'moving', 39.74, -104.99],
]

export default function CinematicFleetJourney() {
  const sceneRef = useRef(null)
  const mapRef = useRef(null)

  useLayoutEffect(() => {
    const scene = sceneRef.current
    const mapElement = mapRef.current
    if (!scene || !mapElement || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const map = L.map(mapElement, { attributionControl: true, zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, keyboard: false, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false }).setView([39.4, -98.8], 4)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri', maxZoom: 16 }).addTo(map)
    const route = L.polyline([[32.7767, -96.797], [31.6, -96.4], [30.65, -96], [29.7604, -95.3698]], { color: '#ff6b32', weight: 5, opacity: 0, lineCap: 'round' }).addTo(map)
    const truck = L.circleMarker([31.55, -96.35], { radius: 9, color: '#fff', weight: 2, fillColor: '#ff5a1f', fillOpacity: 1 }).addTo(map)
    const geofence = L.circle([29.7604, -95.3698], { radius: 16000, color: '#f6d43a', weight: 2, fillColor: '#f6d43a', fillOpacity: 0, opacity: 0 }).addTo(map)
    const fleetMarkers = FLEET_MARKERS.map(([, status, latitude, longitude]) => L.circleMarker([latitude, longitude], { radius: status === 'focus' ? 8 : 6, color: '#fff', weight: 1, fillColor: status === 'idle' ? '#9ca6b2' : '#52d087', fillOpacity: 0, opacity: 0 }).addTo(map))
      const camera = { longitude: -98.8, latitude: 39.4, zoom: 3.65 }
      const updateCamera = () => map.setView([camera.latitude, camera.longitude], camera.zoom, { animate: false })
      const updateFleet = (opacity) => fleetMarkers.forEach((marker) => marker.setStyle({ fillOpacity: opacity, opacity }))
      const updateRoute = (opacity) => route.setStyle({ opacity })
      const updateGeofence = (opacity) => geofence.setStyle({ opacity, fillOpacity: opacity * 0.16 })

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: scene,
          start: 'top top',
          end: '+=4200',
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
        },
      })

      timeline
        .to('.journey-intro', { opacity: 0, yPercent: -18, scale: 1.05, filter: 'blur(6px)', duration: 0.42 }, 0)
        .to('.journey-camera', { rotateZ: -0.35, duration: 0.72 }, 0)
        .to({ opacity: 0 }, { opacity: 1, duration: 0.5, onUpdate() { updateRoute(this.targets()[0].opacity) } }, 0.26)
        .to(camera, { longitude: -96.3, latitude: 32.4, zoom: 6.1, duration: 0.92, ease: 'power2.inOut', onUpdate: updateCamera }, 0.36)
        .to(truck, { longitude: -95.85, latitude: 30.9, duration: 0.7, onUpdate() { truck.setLatLng([this.targets()[0].latitude, this.targets()[0].longitude]) } }, 0.52)
        .to('.journey-tracking', { opacity: 1, y: 0, duration: 0.32 }, 0.58)
        .to(camera, { longitude: -95.65, latitude: 30.35, zoom: 8.15, duration: 1.06, ease: 'power2.inOut', onUpdate: updateCamera }, 0.88)
        .to({ opacity: 0 }, { opacity: 1, duration: 0.36, onUpdate() { updateGeofence(this.targets()[0].opacity) } }, 1.34)
        .to('.journey-notification', { opacity: 1, y: 0, duration: 0.28 }, 1.56)
        .to(camera, { longitude: -98.2, latitude: 38.5, zoom: 4.1, duration: 1.08, ease: 'power3.inOut', onUpdate: updateCamera }, 1.94)
        .to('.journey-camera', { rotateZ: 0, duration: 0.9 }, 1.94)
        .to({}, { duration: 0.62, onUpdate() { updateFleet(this.progress()) } }, 2.16)
        .to('.journey-tracking, .journey-notification', { opacity: 0, duration: 0.42 }, 2.1)
        .to('.journey-dashboard', { opacity: 1, y: 0, scale: 1, duration: 0.64 }, 2.72)
        .to('.journey-map', { opacity: 0.18, scale: 0.94, duration: 0.54 }, 2.78)
    }, scene)

    return () => {
      context.revert()
      map.remove()
    }
  }, [])

  return (
    <section className="cinematic-journey" ref={sceneRef} aria-label="Atonda fleet monitoring journey">
      <div className="journey-intro">
        <span>01 / LIVE INTELLIGENCE</span>
        <h2>See the road before it becomes a report.</h2>
        <p>Scroll to trace one delivery from a live route to fleet-wide command.</p>
      </div>

      <div className="journey-camera">
        <div className="journey-grid" aria-hidden="true" />
        <div className="journey-map" aria-label="United States fleet map">
          <div className="journey-satellite-map" ref={mapRef} />
        </div>

        <div className="journey-tracking">
          <span className="journey-label">LIVE GPS</span>
          <strong>Truck #1048</strong>
          <p>Dallas, TX <b>to</b> Houston, TX</p>
          <dl><div><dt>ETA</dt><dd>2h 34m</dd></div><div><dt>SPEED</dt><dd>64 mph</dd></div></dl>
        </div>
        <div className="journey-notification"><i />Geofence entered: Houston DC</div>

        <div className="journey-dashboard" aria-label="Atonda operations dashboard preview">
          <div className="journey-dashboard-bar"><span>ATONDA / COMMAND</span><i>LIVE</i></div>
          <div className="journey-dashboard-main">
            <div className="journey-dashboard-kpis"><div><small>ACTIVE</small><strong>128</strong></div><div><small>IN TRANSIT</small><strong>86</strong></div><div><small>ALERTS</small><strong>03</strong></div></div>
            <div className="journey-dashboard-chart"><span>Fleet velocity</span><svg viewBox="0 0 330 100" aria-hidden="true"><path d="M0 82 C38 75 46 43 85 55 S136 20 170 45 S234 76 264 30 S303 31 330 12" /></svg></div>
            <div className="journey-dashboard-list"><span>ATD-1048 <b>In transit</b></span><span>ATD-217 <b>On time</b></span><span>ATD-083 <b>Idle</b></span></div>
          </div>
        </div>
      </div>
      <p className="journey-scroll-cue" aria-hidden="true">SCROLL TO NAVIGATE</p>
    </section>
  )
}