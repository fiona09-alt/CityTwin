import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const CAR_MATS = [
  new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.4 }),
  new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4 }),
  new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.4 }),
  new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.4 }),
  new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.4 }),
]

const BUS_MAT = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.5 })
const AMBULANCE_MAT = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 })

// Sample 3D traffic paths for Sitabuldi corridors
function getVehiclesForIntervention(activeIntervention) {
  const count = 18
  const list = []

  for (let i = 0; i < count; i++) {
    const isBus = i % 5 === 0
    const isEmergency = i === 12
    const speed = 0.08 + (i % 3) * 0.04
    const progress = (i * 0.055) % 1.0
    const type = isEmergency ? 'ambulance' : isBus ? 'bus' : 'car'

    // Compute route path points based on active intervention
    let startX = -420 + i * 45
    let endX = startX + 380
    let startZ = 185
    let endZ = 185
    let y = 0.4

    if (activeIntervention === 'flyover' && i % 2 === 0) {
      // Vehicle taking the elevated flyover
      startX = -330
      endX = 50
      startZ = 20
      endZ = 20
      y = 8.8
    } else if (activeIntervention === 'underpass' && i % 2 === 0) {
      // Vehicle taking the depressed underpass
      startX = -380
      endX = 180
      startZ = 185
      endZ = 185
      y = -5.6
    }

    list.push({
      id: i,
      type,
      startX,
      endX,
      startZ,
      endZ,
      y,
      speed,
      progress,
      matIdx: i % CAR_MATS.length,
    })
  }
  return list
}

function TrafficSimulationLayer({ activeIntervention = 'flyover' }) {
  const groupRef = useRef(null)

  const vehicleDefs = useMemo(() => {
    return getVehiclesForIntervention(activeIntervention)
  }, [activeIntervention])

  const vehiclesRef = useRef(vehicleDefs)
  vehiclesRef.current = vehicleDefs

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const group = groupRef.current

    group.children.forEach((mesh, idx) => {
      const v = vehiclesRef.current[idx]
      if (!v) return

      v.progress = (v.progress + delta * v.speed) % 1.0
      const currentX = v.startX + (v.endX - v.startX) * v.progress
      const currentZ = v.startZ + (v.endZ - v.startZ) * v.progress

      mesh.position.set(currentX, v.y, currentZ)
    })
  })

  return (
    <group ref={groupRef} name="traffic-simulation-layer">
      {vehicleDefs.map((v) => {
        const mat =
          v.type === 'ambulance'
            ? AMBULANCE_MAT
            : v.type === 'bus'
              ? BUS_MAT
              : CAR_MATS[v.matIdx]

        const size =
          v.type === 'bus'
            ? [8, 2.6, 2.8]
            : v.type === 'ambulance'
              ? [4.5, 2.1, 2.0]
              : [3.8, 1.5, 1.8]

        return (
          <mesh
            key={v.id}
            position={[v.startX, v.y, v.startZ]}
            castShadow
          >
            <boxGeometry args={size} />
            <primitive object={mat} attach="material" />
          </mesh>
        )
      })}

      {/* Congestion Heat Strip Indicators */}
      <mesh position={[-148, 0.08, 185]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[300, 10]} />
        <meshBasicMaterial
          color={activeIntervention === 'existing' ? '#ef4444' : '#22c55e'}
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  )
}

export default memo(TrafficSimulationLayer)
