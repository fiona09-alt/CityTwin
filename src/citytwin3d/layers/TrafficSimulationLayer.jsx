import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ── Materials ───────────────────────────────────────────────────────────────
const CAR_MATS = [
  new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.35, metalness: 0.3 }),
  new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.35, metalness: 0.3 }),
  new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.35, metalness: 0.3 }),
  new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.35, metalness: 0.3 }),
  new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.35, metalness: 0.3 }),
  new THREE.MeshStandardMaterial({ color: '#7c3aed', roughness: 0.35, metalness: 0.3 }),
]

const BUS_MAT = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.4, metalness: 0.2 })
const AMBULANCE_MAT = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.2, metalness: 0.4 })

// ── Real 3D Path Waypoint Generators Across Sitabuldi Study Area ──────────

// 1. Main East-West Corridor (Shri Bejonji Mehta Road)
function getEWMainCorridorPath(laneOffset = 0) {
  return [
    { x: -650, z: 20 + laneOffset, y: 0.4 },
    { x: -380, z: 20 + laneOffset, y: 0.4 },
    { x: -140, z: 20 + laneOffset, y: 0.4 }, // Surface Junction
    { x: 100,  z: 20 + laneOffset, y: 0.4 },
    { x: 350,  z: 20 + laneOffset, y: 0.4 },
  ]
}

// 2. Kingsway / RBI NW-SE Primary Corridor
function getKingswayPrimaryCorridorPath(laneOffset = 0) {
  return [
    { x: -350, z: -320 + laneOffset, y: 0.4 },
    { x: -250, z: -180 + laneOffset, y: 0.4 },
    { x: -140, z: 20 + laneOffset,   y: 0.4 }, // Northern Node
    { x: 50,   z: 140 + laneOffset,  y: 0.4 },
    { x: 250,  z: 280 + laneOffset,  y: 0.4 },
  ]
}

// 3. Trunk Highway (Ram Jhula Bridge Corridor)
function getRamJhulaTrunkCorridorPath(laneOffset = 0) {
  return [
    { x: -520, z: -450 + laneOffset, y: 0.4 },
    { x: -320, z: -450 + laneOffset, y: 0.4 },
    { x: -120, z: -450 + laneOffset, y: 0.4 },
    { x: 120,  z: -450 + laneOffset, y: 0.4 },
    { x: 350,  z: -450 + laneOffset, y: 0.4 },
  ]
}

// 4. Ghat Road Secondary Corridor
function getGhatRoadCorridorPath(laneOffset = 0) {
  return [
    { x: -280, z: 180 + laneOffset, y: 0.4 },
    { x: -140, z: 180 + laneOffset, y: 0.4 },
    { x: 100,  z: 180 + laneOffset, y: 0.4 },
    { x: 380,  z: 180 + laneOffset, y: 0.4 },
  ]
}

// 5. North Ambazari Secondary Corridor
function getAmbazariCorridorPath(laneOffset = 0) {
  return [
    { x: -750, z: 320 + laneOffset, y: 0.4 },
    { x: -550, z: 320 + laneOffset, y: 0.4 },
    { x: -350, z: 320 + laneOffset, y: 0.4 },
  ]
}

// 6. Railway Station Approach Corridor
function getStationApproachPath(laneOffset = 0) {
  return [
    { x: -180 + laneOffset, z: -420, y: 0.4 },
    { x: -180 + laneOffset, z: -250, y: 0.4 },
    { x: -180 + laneOffset, z: -80,  y: 0.4 },
  ]
}

// ── Intervention Scenario Routes ───────────────────────────────────────────

function getAlt1FlyoverPath() {
  return [
    { x: -380, z: 20, y: 0.4 },
    { x: -280, z: 20, y: 0.4 },
    { x: -210, z: 20, y: 8.7 },  // Ramp Ingress
    { x: -140, z: 20, y: 8.7 },  // Deck Crossing
    { x: -70,  z: 20, y: 8.7 },
    { x: 0,    z: 20, y: 0.4 },   // Ramp Egress
    { x: 100,  z: 20, y: 0.4 },
  ]
}

function getAlt2BranchPathNorth() {
  return [
    { x: -360, z: 20, y: 0.4 },
    { x: -260, z: 20, y: 0.4 },
    { x: -200, z: 20, y: 10.2 },
    { x: -140, z: 20, y: 10.2 },  // Junction Bifurcation
    { x: -70,  z: -35, y: 10.2 }, // North Branch Deck
    { x: 0,    z: -90, y: 0.4 },  // Ramp Down
    { x: 60,   z: -140, y: 0.4 },
  ]
}

function getAlt2BranchPathEast() {
  return [
    { x: -360, z: 20, y: 0.4 },
    { x: -260, z: 20, y: 0.4 },
    { x: -200, z: 20, y: 10.2 },
    { x: -140, z: 20, y: 10.2 },  // Junction Bifurcation
    { x: -70,  z: 45, y: 10.2 },  // East Branch Deck
    { x: 10,   z: 80, y: 0.4 },   // Ramp Down
    { x: 90,   z: 110, y: 0.4 },
  ]
}

function getAlt3Tier2UpperPath() {
  return [
    { x: -240, z: 180, y: 0.4 },
    { x: -190, z: 120, y: 0.4 },
    { x: -140, z: 20, y: 13.8 }, // Tier 2 Crossing OVER Tier 1 at 13.8m
    { x: -90,  z: -80, y: 13.8 },
    { x: -40,  z: -140, y: 0.4 },
    { x: 20,   z: -200, y: 0.4 },
  ]
}

function getUnderpassPath() {
  return [
    { x: -380, z: 20, y: 0.4 },
    { x: -280, z: 20, y: 0.4 },
    { x: -210, z: 20, y: -5.5 }, // Depressed Carriageway
    { x: -140, z: 20, y: -5.5 },
    { x: -70,  z: 20, y: -5.5 },
    { x: 0,    z: 20, y: 0.4 },  // Exit Ramp
    { x: 100,  z: 20, y: 0.4 },
  ]
}

function getJunctionRedesignPath() {
  return [
    { x: -320, z: 20, y: 0.4 },
    { x: -200, z: 20, y: 0.4 },
    { x: -170, z: -10, y: 0.4 }, // Roundabout Turning Arc
    { x: -140, z: -35, y: 0.4 },
    { x: -110, z: -10, y: 0.4 },
    { x: -80,  z: 20, y: 0.4 },
    { x: 80,   z: 20, y: 0.4 },
  ]
}

/**
 * Path Spline Interpolation Engine
 */
function samplePath(waypoints, t) {
  const n = waypoints.length - 1
  if (n <= 0) return { position: new THREE.Vector3(0, 0.4, 0), heading: 0, pitch: 0 }

  const scaled = t * n
  const idx = Math.min(Math.floor(scaled), n - 1)
  const frac = scaled - idx

  const p1 = waypoints[idx]
  const p2 = waypoints[idx + 1]

  const x = p1.x + (p2.x - p1.x) * frac
  const y = p1.y + (p2.y - p1.y) * frac
  const z = p1.z + (p2.z - p1.z) * frac

  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const dz = p2.z - p1.z

  const heading = Math.atan2(dx, dz)
  const pitch = Math.atan2(dy, Math.hypot(dx, dz))

  return {
    position: new THREE.Vector3(x, y, z),
    heading,
    pitch,
  }
}

/**
 * Generates whole-map city-wide vehicles
 */
function getVehiclesForIntervention(activeIntervention, activeFlyoverAlternativeId = 'alternative1') {
  const vehicleCount = 48
  const list = []

  for (let i = 0; i < vehicleCount; i++) {
    const isBus = i % 6 === 0
    const isEmergency = i === 18
    const speed = 0.04 + (i % 5) * 0.015
    const progress = (i * 0.035 + (i * 0.17)) % 1.0
    const type = isEmergency ? 'ambulance' : isBus ? 'bus' : 'car'
    const laneOffset = (i % 2 === 0 ? 1.8 : -1.8)

    let waypoints = getEWMainCorridorPath(laneOffset)

    // Route Distribution Engine
    const routeType = i % 8
    switch (routeType) {
      case 0:
        waypoints = getEWMainCorridorPath(laneOffset)
        break
      case 1:
        waypoints = getKingswayPrimaryCorridorPath(laneOffset)
        break
      case 2:
        waypoints = getRamJhulaTrunkCorridorPath(laneOffset)
        break
      case 3:
        waypoints = getGhatRoadCorridorPath(laneOffset)
        break
      case 4:
        waypoints = getAmbazariCorridorPath(laneOffset)
        break
      case 5:
        waypoints = getStationApproachPath(laneOffset)
        break
      case 6:
      case 7:
        // Active Scenario Corridor Movement
        if (activeIntervention === 'flyover') {
          if (activeFlyoverAlternativeId === 'alternative2') {
            waypoints = i % 2 === 0 ? getAlt2BranchPathNorth() : getAlt2BranchPathEast()
          } else if (activeFlyoverAlternativeId === 'alternative3') {
            waypoints = i % 2 === 0 ? getAlt3Tier2UpperPath() : getAlt1FlyoverPath()
          } else {
            waypoints = getAlt1FlyoverPath()
          }
        } else if (activeIntervention === 'underpass') {
          waypoints = getUnderpassPath()
        } else if (activeIntervention === 'junction') {
          waypoints = getJunctionRedesignPath()
        }
        break
    }

    list.push({
      id: i,
      type,
      speed,
      progress,
      waypoints,
      matIdx: i % CAR_MATS.length,
    })
  }

  return list
}

function TrafficSimulationLayer({ activeIntervention = 'flyover', activeFlyoverAlternativeId = 'alternative1' }) {
  const groupRef = useRef(null)

  const vehicleDefs = useMemo(() => {
    return getVehiclesForIntervention(activeIntervention, activeFlyoverAlternativeId)
  }, [activeIntervention, activeFlyoverAlternativeId])

  const vehiclesRef = useRef(vehicleDefs)
  vehiclesRef.current = vehicleDefs

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const group = groupRef.current

    group.children.forEach((mesh, idx) => {
      const v = vehiclesRef.current[idx]
      if (!v || idx >= group.children.length - 4) return // Skip heat strip meshes

      v.progress = (v.progress + delta * v.speed) % 1.0
      const { position, heading, pitch } = samplePath(v.waypoints, v.progress)

      mesh.position.copy(position)
      mesh.rotation.set(pitch, heading, 0)
    })
  })

  return (
    <group ref={groupRef} name="traffic-simulation-layer">
      {/* 3D Vehicle Meshes */}
      {vehicleDefs.map((v) => {
        const mat =
          v.type === 'ambulance'
            ? AMBULANCE_MAT
            : v.type === 'bus'
              ? BUS_MAT
              : CAR_MATS[v.matIdx]

        const size =
          v.type === 'bus'
            ? [2.8, 2.6, 7.5]
            : v.type === 'ambulance'
              ? [2.0, 2.1, 4.5]
              : [1.8, 1.5, 3.8]

        return (
          <mesh key={v.id} castShadow>
            <boxGeometry args={size} />
            <primitive object={mat} attach="material" />
          </mesh>
        )
      })}

      {/* Whole-Map Corridor Congestion Heat Strip Indicators */}
      {/* 1. Main Junction Congestion Strip */}
      <mesh position={[-140, 0.08, 20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[180, 24]} />
        <meshBasicMaterial
          color={activeIntervention === 'existing' ? '#ef4444' : '#22c55e'}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* 2. Kingsway Primary Corridor Flow Strip */}
      <mesh position={[-50, 0.08, -70]} rotation={[-Math.PI / 2, 0, -0.92]}>
        <planeGeometry args={[260, 16]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.25} />
      </mesh>

      {/* 3. Ghat Road Secondary Flow Strip */}
      <mesh position={[60, 0.08, 180]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[320, 14]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.22} />
      </mesh>

      {/* 4. Trunk Highway Corridor Flow Strip */}
      <mesh position={[-80, 0.08, -450]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[420, 18]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.22} />
      </mesh>
    </group>
  )
}

export default memo(TrafficSimulationLayer)
