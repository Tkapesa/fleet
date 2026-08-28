import { Component, Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, RoundedBox } from '@react-three/drei'

// A wheel's axle must run along Z (the truck's width axis) so the round
// tire profile faces forward/back instead of showing as a flat disc.
function Wheel({ position }) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.32, 28]} />
        <meshStandardMaterial color="#1b1b20" roughness={0.8} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.162, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.02, 28]} />
        <meshStandardMaterial color="#cdd0d8" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.162, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.02, 28]} />
        <meshStandardMaterial color="#cdd0d8" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.173, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.01, 16]} />
        <meshStandardMaterial color="#6b6e78" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.173, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.01, 16]} />
        <meshStandardMaterial color="#6b6e78" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ─── Procedural low-poly semi-truck + trailer (no external model assets) ─────
function TruckMesh() {
  const body = '#121216'
  const accent = '#FF5A1F'
  const chrome = '#d9dbe0'
  const glass = '#0c1622'

  const wheelPositions = [
    [2.05, -0.55, 0.72], [2.05, -0.55, -0.72],
    [0.55, -0.55, 0.75], [0.55, -0.55, -0.75],
    [-1.0, -0.55, 0.75], [-1.0, -0.55, -0.75],
    [-2.6, -0.55, 0.75], [-2.6, -0.55, -0.75],
  ]

  return (
    <group position={[0, -0.35, 0]}>
      {/* Trailer */}
      <RoundedBox args={[3.6, 1.7, 1.5]} radius={0.06} smoothness={4} position={[-1.6, 0.55, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#e8e8ec" metalness={0.15} roughness={0.35} clearcoat={0.6} clearcoatRoughness={0.25} />
      </RoundedBox>
      <mesh position={[-1.6, 0.12, 0.751]}>
        <boxGeometry args={[3.6, 0.26, 0.01]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[-1.6, 0.12, -0.751]}>
        <boxGeometry args={[3.6, 0.26, 0.01]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} />
      </mesh>

      {/* Cab */}
      <RoundedBox args={[1.15, 1.3, 1.44]} radius={0.08} smoothness={4} position={[1.05, 0.62, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color={body} metalness={0.45} roughness={0.28} clearcoat={0.8} clearcoatRoughness={0.15} />
      </RoundedBox>
      <RoundedBox args={[0.9, 0.55, 1.3]} radius={0.07} smoothness={4} position={[1.85, 0.15, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color={body} metalness={0.45} roughness={0.28} clearcoat={0.8} clearcoatRoughness={0.15} />
      </RoundedBox>
      <mesh position={[1.35, 0.85, 0]} rotation={[0, 0, -0.28]}>
        <boxGeometry args={[0.08, 0.62, 1.28]} />
        <meshPhysicalMaterial color={glass} metalness={0.2} roughness={0.05} transparent opacity={0.88} />
      </mesh>
      <mesh position={[2.31, 0.1, 0]}>
        <boxGeometry args={[0.04, 0.42, 1.1]} />
        <meshStandardMaterial color={chrome} metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[2.31, -0.05, 0.55]}>
        <boxGeometry args={[0.04, 0.14, 0.22]} />
        <meshStandardMaterial color="#fff8e0" emissive="#fff2c0" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[2.31, -0.05, -0.55]}>
        <boxGeometry args={[0.04, 0.14, 0.22]} />
        <meshStandardMaterial color="#fff8e0" emissive="#fff2c0" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0.6, 0.75, 0.68]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1.1, 12]} />
        <meshStandardMaterial color={chrome} metalness={0.95} roughness={0.15} />
      </mesh>
      <mesh position={[1.6, 0.95, 0.78]}>
        <boxGeometry args={[0.05, 0.22, 0.14]} />
        <meshStandardMaterial color={chrome} metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[1.6, 0.95, -0.78]}>
        <boxGeometry args={[0.05, 0.22, 0.14]} />
        <meshStandardMaterial color={chrome} metalness={0.9} roughness={0.2} />
      </mesh>

      {wheelPositions.map((p, i) => (
        <Wheel key={i} position={p} />
      ))}
    </group>
  )
}

function TruckRig({ scale = 1 }) {
  const group = useRef(null)

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    g.rotation.y += delta * 0.16
    const { pointer } = state
    g.rotation.x += (pointer.y * -0.18 - g.rotation.x) * 0.05
    g.position.y += (pointer.y * 0.08 - g.position.y) * 0.05
  })

  return (
    <group ref={group} scale={scale}>
      <TruckMesh />
    </group>
  )
}

// Guards against WebGL-unavailable environments so the page never crashes.
class Canvas3DBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null
    return this.props.children
  }
}

export default function TruckScene({ variant = 'hero', className = '' }) {
  const hero = variant === 'hero'
  return (
    <div className={`truck3d-mount ${className}`}>
      <Canvas3DBoundary fallback={<div className="truck3d-fallback" />}>
        <Canvas
          shadows
          dpr={[1, 1.6]}
          gl={{ antialias: true, alpha: true }}
          camera={{ position: hero ? [6.4, 2.4, 6.6] : [4.6, 2, 5.2], fov: hero ? 30 : 34 }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[6, 8, 4]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} />
          <pointLight position={[-6, 3, -4]} intensity={18} color="#FF5A1F" />
          <Suspense fallback={null}>
            <Environment resolution={256}>
              <group>
                <Lightformer form="rect" intensity={3.5} color="#ffffff" position={[0, 5, -8]} scale={[10, 8, 1]} />
                <Lightformer form="rect" intensity={2.2} color="#FF5A1F" position={[-7, 2, 4]} rotation={[0, Math.PI / 3, 0]} scale={[6, 6, 1]} />
                <Lightformer form="ring" intensity={2} color="#ffffff" position={[6, 3, 5]} scale={4} />
              </group>
            </Environment>
            <TruckRig scale={hero ? 1 : 0.62} />
            <ContactShadows position={[0, -1.05, 0]} opacity={0.5} scale={13} blur={2.6} far={4} />
          </Suspense>
        </Canvas>
      </Canvas3DBoundary>
    </div>
  )
}
