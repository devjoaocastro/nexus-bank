import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import {
  Environment,
  Float,
  Html,
  Lightformer,
  Line,
  RoundedBox,
  Sparkles,
  useCursor,
  useScroll,
} from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { easing } from '../lib/easing'
import { PAGES, setScrollEl } from '../scrollBus'

const EMERALD = '#10b981'
const PLATINUM = '#e6e9e6'

/* ------------------------------------------------------------------ */
/* Section wrapper — fades/scales/rotates its content as it enters     */
/* and leaves the viewport while we scroll through the 3D world.       */
/* ------------------------------------------------------------------ */

function Section({
  index,
  z = 0,
  floor = true,
  children,
}: {
  index: number
  z?: number
  floor?: boolean
  children: ReactNode
}) {
  const inner = useRef<THREE.Group>(null!)
  const scroll = useScroll()
  const vh = useThree((s) => s.viewport.height)

  useFrame((_, delta) => {
    const progress = scroll.offset * (PAGES - 1) - index // 0 when section centered
    const visibility = Math.max(0, 1 - Math.abs(progress)) // 1 visible → 0 offscreen
    easing.damp3(inner.current.scale, 0.78 + visibility * 0.22, 0.2, delta)
    inner.current.rotation.y = progress * 0.25
    inner.current.position.z = z - (1 - visibility) * 1.6
  })

  return (
    <group position={[0, -index * vh, 0]}>
      {floor && (
        <gridHelper args={[44, 44, '#1a8f6c', '#0b3526']} position={[0, -3.4, -3]} />
      )}
      <group ref={inner}>{children}</group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Hero — fan of floating glass cards that spreads open as you scroll. */
/* Hover a card and it lifts towards you.                              */
/* ------------------------------------------------------------------ */

function GlassCard({ k, total }: { k: number; total: number }) {
  const group = useRef<THREE.Group>(null!)
  const stripe = useRef<THREE.MeshStandardMaterial>(null!)
  const scroll = useScroll()
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  const c = k - (total - 1) / 2

  useFrame((_, delta) => {
    // rest pose is already a visible fan; scroll opens it the rest of the way
    const spread = 0.34 + scroll.range(0, 1 / (PAGES - 1)) * 0.66
    const tx = c * (0.34 + spread * 1.2)
    const ty = -Math.abs(c) * spread * 0.22 + (hovered ? 0.22 : 0)
    const tz = -k * 0.08 + spread * 0.25 + (hovered ? 0.55 : 0)
    easing.damp3(group.current.position, [tx, ty, tz], 0.22, delta)
    easing.dampE(
      group.current.rotation,
      [-spread * 0.12, c * spread * 0.14, -c * (0.05 + spread * 0.15)],
      0.22,
      delta,
    )
    easing.damp(stripe.current, 'emissiveIntensity', hovered ? 2.2 : 1.1, 0.2, delta)
  })

  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <RoundedBox args={[2.5, 1.55, 0.07]} radius={0.1} smoothness={4}>
        <meshPhysicalMaterial
          color="#a7c2b4"
          metalness={0.3}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.08}
          transmission={0.4}
          thickness={0.5}
          ior={1.4}
          envMapIntensity={1.6}
        />
      </RoundedBox>
      {/* emerald signature stripe */}
      <mesh position={[0, -0.52, 0.045]}>
        <boxGeometry args={[2.18, 0.07, 0.012]} />
        <meshStandardMaterial
          ref={stripe}
          color={EMERALD}
          emissive={EMERALD}
          emissiveIntensity={0.7}
        />
      </mesh>
      {/* chip */}
      <mesh position={[-0.85, 0.3, 0.045]}>
        <boxGeometry args={[0.34, 0.26, 0.02]} />
        <meshStandardMaterial color={PLATINUM} metalness={0.9} roughness={0.25} />
      </mesh>
      {/* brand mark */}
      <mesh position={[0.95, 0.5, 0.05]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive={EMERALD} emissiveIntensity={1.6} />
      </mesh>
    </group>
  )
}

function CardFan() {
  const TOTAL = 5
  return (
    <group>
      {/* soft emerald halo so the fan reads against the dark backdrop */}
      <mesh position={[0, -0.15, -2.4]}>
        <circleGeometry args={[3.4, 64]} />
        <meshBasicMaterial
          color={EMERALD}
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* dedicated key + rim lights for the hero composition */}
      <pointLight position={[0, 2.6, 4.5]} intensity={55} distance={14} color="#dff5ea" />
      <pointLight position={[0, -2.2, 2.5]} intensity={28} distance={10} color={EMERALD} />
      <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.5}>
        <group position={[0, -0.2, 0.4]} scale={1.12}>
          {Array.from({ length: TOTAL }, (_, k) => (
            <GlassCard key={k} k={k} total={TOTAL} />
          ))}
        </group>
      </Float>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Thesis — a single ledger monolith: glass slab with a slow pulse of  */
/* emerald light running through it.                                   */
/* ------------------------------------------------------------------ */

function LedgerMonolith() {
  const core = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.MeshStandardMaterial>(null!)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  useFrame((state, delta) => {
    core.current.rotation.y += delta * (hovered ? 0.9 : 0.25)
    const pulse = 0.6 + Math.sin(state.clock.elapsedTime * 1.6) * 0.35
    easing.damp(mat.current, 'emissiveIntensity', hovered ? 2.4 : pulse, 0.2, delta)
  })

  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <RoundedBox args={[1.6, 2.6, 1.6]} radius={0.08} smoothness={4}>
        <meshPhysicalMaterial
          color="#74907f"
          metalness={0.1}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.06}
          transmission={0.75}
          thickness={1.2}
          ior={1.45}
        />
      </RoundedBox>
      <mesh ref={core}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          ref={mat}
          color={PLATINUM}
          emissive={EMERALD}
          emissiveIntensity={0.8}
          metalness={0.5}
          roughness={0.15}
          flatShading
        />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Product — emerald data streams: a network of nodes connected by     */
/* lines, with light pulses travelling along every link. The three     */
/* feature nodes carry <Html> labels that fade with the scroll         */
/* (HTML ignores fog/depth, so we drive opacity manually).             */
/* ------------------------------------------------------------------ */

const NODES: [number, number, number][] = [
  [-2.7, 1.3, -0.4],
  [0, 2.0, -0.8],
  [2.7, 1.2, -0.3],
  [-1.7, -0.9, 0.1],
  [1.8, -1.1, -0.2],
  [0.1, 0.3, 0.4],
]

const LINKS: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 3],
  [3, 5],
  [5, 4],
  [2, 4],
  [1, 5],
  [0, 5],
]

function StreamPulse({
  from,
  to,
  offset,
  speed,
}: {
  from: [number, number, number]
  to: [number, number, number]
  offset: number
  speed: number
}) {
  const mesh = useRef<THREE.Mesh>(null!)
  const a = useMemo(() => new THREE.Vector3(...from), [from])
  const b = useMemo(() => new THREE.Vector3(...to), [to])

  useFrame((state) => {
    const t = (state.clock.elapsedTime * speed + offset) % 1
    mesh.current.position.lerpVectors(a, b, t)
    mesh.current.scale.setScalar(0.6 + Math.sin(t * Math.PI) * 0.9)
  })

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.045, 12, 12]} />
      <meshBasicMaterial color="#5cf2c0" toneMapped={false} />
    </mesh>
  )
}

function StreamNode({
  position,
  label,
  sub,
  sectionIndex,
}: {
  position: [number, number, number]
  label?: string
  sub?: string
  sectionIndex: number
}) {
  const group = useRef<THREE.Group>(null!)
  const labelEl = useRef<HTMLDivElement>(null)
  const scroll = useScroll()
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  const major = !!label

  useFrame((_, delta) => {
    easing.damp3(group.current.scale, hovered ? 1.5 : 1, 0.18, delta)

    // HTML labels ignore fog/depth — only show them while the Product
    // section is on screen, fading in/out with the scroll.
    if (labelEl.current) {
      const sec = scroll.offset * (PAGES - 1)
      const visibility = Math.max(0, 1 - Math.abs(sec - sectionIndex) * 1.6)
      labelEl.current.style.opacity = visibility.toFixed(3)
      labelEl.current.style.display = visibility < 0.04 ? 'none' : ''
    }
  })

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh>
        <sphereGeometry args={[major ? 0.16 : 0.09, 24, 24]} />
        <meshStandardMaterial
          color={hovered ? '#5cf2c0' : EMERALD}
          emissive={EMERALD}
          emissiveIntensity={hovered ? 3 : major ? 1.4 : 0.8}
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>
      {major && <pointLight intensity={hovered ? 8 : 3} distance={5} color={EMERALD} />}
      {label && (
        // portal into scroll.fixed: the default target is the scrolled element,
        // which shifts the projected label offscreen by scrollTop on pages > 0
        <Html center position={[0, 0.55, 0]} className="node-html" zIndexRange={[20, 0]} portal={{ current: scroll.fixed }}>
          <div ref={labelEl} className={`node-label ${hovered ? 'node-label--hot' : ''}`}>
            <strong>{label}</strong>
            <span>{sub}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

function DataStreams({ sectionIndex }: { sectionIndex: number }) {
  return (
    <group>
      {LINKS.map(([f, t], i) => (
        <group key={i}>
          <Line
            points={[NODES[f], NODES[t]]}
            color={EMERALD}
            transparent
            opacity={0.22}
            lineWidth={1}
          />
          <StreamPulse from={NODES[f]} to={NODES[t]} offset={i * 0.17} speed={0.16 + (i % 3) * 0.05} />
          <StreamPulse from={NODES[f]} to={NODES[t]} offset={i * 0.17 + 0.5} speed={0.22 + (i % 2) * 0.06} />
        </group>
      ))}
      <StreamNode position={NODES[0]} label="SEPA & SWIFT" sub="instant rails" sectionIndex={sectionIndex} />
      <StreamNode position={NODES[1]} sectionIndex={sectionIndex} />
      <StreamNode position={NODES[2]} label="Sub-accounts" sub="as code" sectionIndex={sectionIndex} />
      <StreamNode position={NODES[3]} sectionIndex={sectionIndex} />
      <StreamNode position={NODES[4]} label="4.2% APY" sub="on idle cash" sectionIndex={sectionIndex} />
      <StreamNode position={NODES[5]} sectionIndex={sectionIndex} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Security — a vault door. The wheel spins as you scroll through the  */
/* section, then the whole door swings open on its hinge to reveal an  */
/* emerald-lit interior. Click the door to give the wheel a spin.      */
/* ------------------------------------------------------------------ */

function VaultDoor() {
  const scroll = useScroll()
  const wheel = useRef<THREE.Group>(null!)
  const door = useRef<THREE.Group>(null!)
  const glow = useRef<THREE.MeshBasicMaterial>(null!)
  const impulse = useRef(0)
  const extraSpin = useRef(0)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  const boltAngles = useMemo(
    () => Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2),
    [],
  )

  useFrame((_, delta) => {
    impulse.current = THREE.MathUtils.damp(impulse.current, 0, 1.5, delta)
    extraSpin.current += delta * impulse.current

    const r = scroll.range(2.45 / (PAGES - 1), 1.15 / (PAGES - 1))
    wheel.current.rotation.z = r * Math.PI * 2.5 + extraSpin.current

    const open = Math.max(0, (r - 0.5) / 0.5)
    const eased = 1 - Math.pow(1 - open, 2)
    easing.damp(door.current.rotation, 'y', -eased * 1.45, 0.16, delta)
    if (glow.current) glow.current.opacity = 0.15 + eased * 0.85
  })

  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
      onClick={() => (impulse.current += 6)}
    >
      {/* static vault frame */}
      <mesh>
        <torusGeometry args={[1.95, 0.14, 24, 96]} />
        <meshStandardMaterial color="#3a463f" metalness={0.95} roughness={0.3} />
      </mesh>

      {/* emerald-lit interior, revealed as the door opens */}
      <mesh position={[0, 0, -0.45]}>
        <circleGeometry args={[1.7, 64]} />
        <meshBasicMaterial ref={glow} color={EMERALD} transparent opacity={0.15} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, -0.2]} intensity={10} distance={8} color={EMERALD} />
      <Sparkles count={40} scale={[2.6, 2.6, 1]} position={[0, 0, -0.3]} size={2.4} speed={0.4} color="#5cf2c0" opacity={0.8} />

      {/* hinged door */}
      <group position={[-1.8, 0, 0.1]}>
        <group ref={door}>
          <group position={[1.8, 0, 0]}>
            {/* door slab */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[1.7, 1.7, 0.22, 64]} />
              <meshStandardMaterial color="#4d5a52" metalness={0.92} roughness={0.24} />
            </mesh>
            {/* rim */}
            <mesh position={[0, 0, 0.11]}>
              <torusGeometry args={[1.55, 0.05, 16, 96]} />
              <meshStandardMaterial
                color={PLATINUM}
                metalness={0.95}
                roughness={0.15}
                emissive={EMERALD}
                emissiveIntensity={hovered ? 0.6 : 0.12}
              />
            </mesh>
            {/* radial bolts */}
            {boltAngles.map((a, i) => (
              <mesh
                key={i}
                position={[Math.cos(a) * 1.32, Math.sin(a) * 1.32, 0.15]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.07, 0.07, 0.1, 16]} />
                <meshStandardMaterial
                  color={PLATINUM}
                  metalness={0.95}
                  roughness={0.2}
                  emissive={EMERALD}
                  emissiveIntensity={hovered ? 0.8 : 0.15}
                />
              </mesh>
            ))}
            {/* locking wheel: spokes + hub */}
            <group ref={wheel} position={[0, 0, 0.24]}>
              {[0, 1, 2].map((i) => (
                <mesh key={i} rotation={[0, 0, (i / 3) * Math.PI]}>
                  <boxGeometry args={[1.7, 0.08, 0.08]} />
                  <meshStandardMaterial color={PLATINUM} metalness={0.9} roughness={0.2} />
                </mesh>
              ))}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.18, 24]} />
                <meshStandardMaterial
                  color={PLATINUM}
                  metalness={0.9}
                  roughness={0.15}
                  emissive={EMERALD}
                  emissiveIntensity={hovered ? 1.4 : 0.35}
                />
              </mesh>
              <mesh>
                <torusGeometry args={[0.85, 0.035, 12, 64]} />
                <meshStandardMaterial color={PLATINUM} metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Growth — instanced bar-chart skyline that rises out of the floor    */
/* as the section scrolls in.                                          */
/* ------------------------------------------------------------------ */

function BarSkyline() {
  const COUNT = 36
  const inst = useRef<THREE.InstancedMesh>(null!)
  const scroll = useScroll()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const bars = useMemo(() => {
    const arr: { x: number; z: number; h: number }[] = []
    for (let i = 0; i < COUNT; i++) {
      const row = i % 2
      const col = Math.floor(i / 2)
      arr.push({
        x: (col - 8.5) * 0.44,
        z: row * -0.75 - 0.5,
        h: 0.5 + (col / 17) * 2.4 + Math.random() * 0.7,
      })
    }
    return arr
  }, [])

  useFrame(() => {
    const g = scroll.range(3.55 / (PAGES - 1), 1.1 / (PAGES - 1))
    for (let i = 0; i < COUNT; i++) {
      const b = bars[i]
      const local = THREE.MathUtils.clamp(g * 1.6 - (i / COUNT) * 0.6, 0, 1)
      const eased = 1 - Math.pow(1 - local, 3)
      const h = Math.max(0.02, b.h * eased)
      dummy.position.set(b.x, h / 2 - 1.9, b.z)
      dummy.scale.set(0.3, h, 0.3)
      dummy.updateMatrix()
      inst.current.setMatrixAt(i, dummy.matrix)
    }
    inst.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={inst} args={[undefined, undefined, COUNT]}>
      <boxGeometry />
      <meshStandardMaterial
        color="#0fa37a"
        emissive={EMERALD}
        emissiveIntensity={0.4}
        metalness={0.6}
        roughness={0.3}
      />
    </instancedMesh>
  )
}

/* ------------------------------------------------------------------ */
/* Pricing — three orbiting tier coins; hover to charge them.          */
/* ------------------------------------------------------------------ */

function TierCoin({ position, scale }: { position: [number, number, number]; scale: number }) {
  const mesh = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.MeshStandardMaterial>(null!)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  useFrame((_, delta) => {
    mesh.current.rotation.y += delta * (hovered ? 2.4 : 0.5)
    easing.damp3(mesh.current.scale, hovered ? scale * 1.25 : scale, 0.18, delta)
    easing.damp(mat.current, 'emissiveIntensity', hovered ? 1.6 : 0.3, 0.2, delta)
  })

  return (
    <Float speed={1.5} rotationIntensity={0.25} floatIntensity={0.6}>
      <mesh
        ref={mesh}
        position={position}
        scale={scale}
        rotation={[Math.PI / 2, 0, 0]}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.65, 0.65, 0.12, 48]} />
        <meshStandardMaterial
          ref={mat}
          color={PLATINUM}
          emissive={EMERALD}
          emissiveIntensity={0.3}
          metalness={0.95}
          roughness={0.18}
        />
      </mesh>
    </Float>
  )
}

/* ------------------------------------------------------------------ */
/* Experience root — camera rig + sections + lights + post FX          */
/* ------------------------------------------------------------------ */

export default function Experience() {
  const scroll = useScroll()
  const vh = useThree((s) => s.viewport.height)
  const vw = useThree((s) => s.viewport.width)
  const lightRig = useRef<THREE.Group>(null!)

  useEffect(() => {
    setScrollEl(scroll.el)
  }, [scroll.el])

  useFrame((state, delta) => {
    const o = scroll.offset
    const y = -o * vh * (PAGES - 1)
    // travel down the world + mouse parallax
    easing.damp3(
      state.camera.position,
      [state.pointer.x * 0.6, y - state.pointer.y * 0.3, 10],
      0.28,
      delta,
    )
    state.camera.lookAt(0, y, 0)
    if (lightRig.current) lightRig.current.position.y = y
    // feed the DOM progress bar
    document.documentElement.style.setProperty('--scroll', o.toFixed(4))
  })

  const x = (f: number) => vw * f

  return (
    <>
      <ambientLight intensity={0.35} />
      <group ref={lightRig}>
        <pointLight position={[6, 2, 6]} intensity={50} color={EMERALD} />
        <pointLight position={[-6, -2, 4]} intensity={40} color="#cfe8dc" />
      </group>

      {/* studio-style reflections without any network fetch */}
      <Environment resolution={64}>
        <group rotation={[-Math.PI / 3, 0, 0]}>
          <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer color={EMERALD} intensity={2} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
          <Lightformer color="#9ec7b3" intensity={1.6} position={[10, 1, 0]} rotation-y={-Math.PI / 2} scale={[20, 1, 1]} />
        </group>
      </Environment>

      {/* ambient dust across the whole scroll length */}
      <Sparkles
        count={240}
        scale={[vw * 1.6, vh * PAGES, 10]}
        position={[0, (-vh * (PAGES - 1)) / 2, -2]}
        size={1.5}
        speed={0.22}
        color="#7fd9b8"
        opacity={0.45}
      />

      {/* 0 — Hero: the card fan */}
      <Section index={0}>
        <CardFan />
        <Sparkles count={80} scale={[8, 5, 6]} size={2.2} speed={0.3} color={EMERALD} opacity={0.6} />
      </Section>

      {/* 1 — Thesis */}
      <Section index={1}>
        <group position={[x(0.2), 0, 0]}>
          <Float speed={1.1} rotationIntensity={0.18} floatIntensity={0.4}>
            <LedgerMonolith />
          </Float>
        </group>
      </Section>

      {/* 2 — Product: data streams */}
      <Section index={2}>
        <group position={[x(0.16), 0, 0]}>
          <DataStreams sectionIndex={2} />
        </group>
      </Section>

      {/* 3 — Security: the vault */}
      <Section index={3}>
        <group position={[x(0.2), 0, 0]}>
          <VaultDoor />
        </group>
      </Section>

      {/* 4 — Growth: bar skyline */}
      <Section index={4}>
        <group position={[x(0.12), 0.4, 0]}>
          <BarSkyline />
        </group>
      </Section>

      {/* 5 — Pricing: tier coins */}
      <Section index={5}>
        <group position={[x(0.26), 0, 0]}>
          <TierCoin position={[-1.1, -1.1, 0]} scale={0.7} />
          <TierCoin position={[0.2, 0, 0.3]} scale={1} />
          <TierCoin position={[1.6, 1.2, -0.3]} scale={1.35} />
        </group>
      </Section>

      {/* 6 — Footer: calm constellation */}
      <Section index={6} floor={false}>
        <Sparkles count={120} scale={[10, 6, 6]} size={1.8} speed={0.2} color={EMERALD} opacity={0.5} />
        <Float speed={1} rotationIntensity={0.3} floatIntensity={0.5}>
          <mesh position={[0, 0.8, -2]}>
            <icosahedronGeometry args={[0.7, 1]} />
            <meshStandardMaterial
              color="#3a463f"
              emissive={EMERALD}
              emissiveIntensity={0.5}
              metalness={0.8}
              roughness={0.2}
              flatShading
            />
          </mesh>
        </Float>
      </Section>

      <EffectComposer>
        <Bloom intensity={0.55} luminanceThreshold={0.25} luminanceSmoothing={0.7} mipmapBlur />
        <Noise opacity={0.05} />
        <Vignette offset={0.15} darkness={0.85} />
      </EffectComposer>
    </>
  )
}
