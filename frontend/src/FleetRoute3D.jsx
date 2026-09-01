import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Html, RoundedBox } from '@react-three/drei'
import { Canvas3DBoundary } from './Truck3D'

// ─── Small fleet, big story: trucks loop an origin → destination lane,        ──
// ─── picking up a crate at the hub and dropping it off at the far end.       ──
const FLEET = [
  { id: 'r1', lane: -0.9, speed: 0.052, offset: 0, crate: '#FF5A1F' },
  { id: 'r2', lane: 0, speed: 0.041, offset: 0.34, crate: '#2F6B4A' },
  { id: 'r3', lane: 0.9, speed: 0.063, offset: 0.66, crate: '#2563EB' },
]

function buildLaneCurve(laneOffset) {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-6.6, 0, laneOffset + 0.5),
    new THREE.Vector3(-3.2, 0, laneOffset - 0.35),
    new THREE.Vector3(0, 0, laneOffset + 0.3),
    new THREE.Vector3(3.2, 0, laneOffset - 0.4),
    new THREE.Vector3(6.6, 0, laneOffset + 0.5),
  ])
}

function RouteRibbon({ curve, color }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 100, 0.075, 10, false), [curve])
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} roughness={0.5} metalness={0.1} transparent opacity={0.8} />
    </mesh>
  )
}

function MiniTruck({ curve, speed, offset, crateColor }) {
  const group = useRef(null)
  const crateRef = useRef(null)
  const wheelsRef = useRef(null)
  const pos = useMemo(() => new THREE.Vector3(), [])
  const ahead = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const t = (offset + state.clock.elapsedTime * speed) % 1
    curve.getPointAt(t, pos)
    curve.getPointAt((t + 0.01) % 1, ahead)
    g.position.set(pos.x, 0.05, pos.z)
    g.lookAt(ahead.x, 0.05, ahead.z)

    if (wheelsRef.current) wheelsRef.current.rotation.x -= delta * 16

    if (crateRef.current) {
      let s = 1
      if (t < 0.09) s = t / 0.09
      else if (t > 0.9) s = Math.max(0, (1 - t) / 0.1)
      crateRef.current.scale.setScalar(Math.max(0.001, s))
    }
  })

  return (
    <group ref={group}>
      <RoundedBox args={[0.5, 0.3, 0.32]} radius={0.03} smoothness={2} position={[-0.06, 0.22, 0]} castShadow>
        <meshStandardMaterial color="#e9e9ee" metalness={0.2} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.26, 0.26, 0.3]} radius={0.03} smoothness={2} position={[0.3, 0.2, 0]} castShadow>
        <meshStandardMaterial color="#121216" metalness={0.4} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0.42, 0.24, 0]}>
        <boxGeometry args={[0.02, 0.13, 0.26]} />
        <meshPhysicalMaterial color="#0c1622" transparent opacity={0.85} />
      </mesh>
      <group ref={wheelsRef}>
        {[[-0.2, 0.09, 0.18], [-0.2, 0.09, -0.18], [0.05, 0.09, 0.18], [0.05, 0.09, -0.18], [0.32, 0.09, 0.18], [0.32, 0.09, -0.18]].map((p, i) => (
          <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.085, 0.085, 0.065, 14]} />
            <meshStandardMaterial color="#1b1b20" roughness={0.8} />
          </mesh>
        ))}
      </group>
      <mesh ref={crateRef} position={[-0.06, 0.42, 0]} castShadow>
        <boxGeometry args={[0.2, 0.18, 0.2]} />
        <meshStandardMaterial color={crateColor} roughness={0.6} />
      </mesh>
    </group>
  )
}

function HubMarker({ position, label, sub, color }) {
  const pulseRef = useRef(null)

  useFrame((state) => {
    const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.18
    if (pulseRef.current) {
      pulseRef.current.scale.set(s, s, s)
      pulseRef.current.material.opacity = 0.45 - (s - 1) * 0.6
    }
  })

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.4, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.24, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.1, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.5} />
      </mesh>
      <Html position={[0, 0.5, 0]} center distanceFactor={9} occlude>
        <div className="fleet3d-tag">
          <strong>{label}</strong>
          <span>{sub}</span>
        </div>
      </Html>
    </group>
  )
}

function FleetScene() {
  const lanes = useMemo(() => FLEET.map((t) => ({ ...t, curve: buildLaneCurve(t.lane) })), [])

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 9, 4]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-6, 3, -3]} intensity={12} color="#FF5A1F" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[18, 9]} />
        <meshStandardMaterial color="#eef1f5" roughness={1} />
      </mesh>
      {lanes.map((t) => (
        <RouteRibbon key={`road-${t.id}`} curve={t.curve} color={t.crate} />
      ))}
      <HubMarker position={[-6.9, 0, 0]} label="Newark, NJ" sub="Origin hub" color="#FF5A1F" />
      <HubMarker position={[6.9, 0, 0]} label="Boston, MA" sub="Delivery hub" color="#2F6B4A" />
      {lanes.map((t) => (
        <MiniTruck key={t.id} curve={t.curve} speed={t.speed} offset={t.offset} crateColor={t.crate} />
      ))}
      <ContactShadows position={[0, -0.01, 0]} opacity={0.35} scale={20} blur={2.4} far={4} />
    </>
  )
}

export default function FleetRouteScene({ className = '' }) {
  return (
    <div className={`fleet3d-mount ${className}`}>
      <Canvas3DBoundary fallback={<div className="fleet3d-fallback" />}>
        <Canvas
          shadows
          dpr={[1, 1.6]}
          gl={{ antialias: true, alpha: true }}
          camera={{ position: [0, 6.4, 9.6], fov: 32 }}
        >
          <Suspense fallback={null}>
            <FleetScene />
          </Suspense>
        </Canvas>
      </Canvas3DBoundary>
    </div>
  )
}
