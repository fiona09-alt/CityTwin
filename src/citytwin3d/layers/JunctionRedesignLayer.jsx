import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { TransformControls } from '@react-three/drei'
import * as THREE from 'three'

// ── Materials ───────────────────────────────────────────────────────────────
const ASPHALT_MAT = new THREE.MeshStandardMaterial({
  color: '#334155',
  roughness: 0.9,
  metalness: 0.05,
})
const GREEN_MAT = new THREE.MeshStandardMaterial({
  color: '#10b981',
  roughness: 0.8,
  metalness: 0.02,
})
const CURB_MAT = new THREE.MeshStandardMaterial({
  color: '#e2e8f0',
  roughness: 0.6,
  metalness: 0.1,
})
const LINE_MAT = new THREE.MeshBasicMaterial({ color: '#ffffff' })
const REFUGE_MAT = new THREE.MeshStandardMaterial({
  color: '#cbd5e1',
  roughness: 0.7,
  metalness: 0.1,
})

const BASE_JUNCTION = {
  id: 'sitabuldi_junction_redesign',
  name: 'Sitabuldi Smart Roundabout Redesign',
  position: [-148, 0, 185],
  rotationY: 0.08,
  radius: 35,
  width: 14,
  length: 120,
  lanes: 3,
  connectedRoads: [
    'Shri Bejonji Mehta Road',
    'New Loha Underpass Axis',
    'Station Road Approach',
    'Kingsway Corridor',
  ],
  status: 'Proposed Surface Infrastructure Redesign',
  metrics: {
    islandRadiusM: 35,
    lanes: 3,
    pedestrianCrossings: 4,
    estimatedCapacityVPH: 3800,
    affectedAreaHa: 1.4,
    trafficImpact: 'Moderate–High — smooth continuous flow without signal delays',
    safetyImpact: 'High — eliminates high-speed head-on and T-bone conflict points',
    environmentalImpact: 'Positive — central green island & reduced idle emissions',
    estimatedCostCr: '₹ 25–38 Cr (Prototype Estimate)',
    constructionMonths: 10,
    note: 'All metrics are estimated prototype/scenario data only.',
  },
}

function buildJunctionGroup(params, isSelected) {
  const { radius, width } = params
  const outerRadius = radius + width
  const innerRadius = radius

  const group = new THREE.Group()

  // 1. Outer Circular Ring Road Asphalt
  const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 32)
  ringGeo.rotateX(-Math.PI / 2)
  const ring = new THREE.Mesh(ringGeo, ASPHALT_MAT)
  ring.position.set(0, 0.06, 0)
  ring.receiveShadow = true
  group.add(ring)

  // 2. Central Green Island Landscaping
  const islandGeo = new THREE.CylinderGeometry(innerRadius, innerRadius, 0.35, 32)
  const island = new THREE.Mesh(islandGeo, GREEN_MAT)
  island.position.set(0, 0.18, 0)
  island.receiveShadow = true
  group.add(island)

  // 3. Central Island Concrete Curb
  const curbGeo = new THREE.RingGeometry(innerRadius - 0.4, innerRadius + 0.2, 32)
  curbGeo.rotateX(-Math.PI / 2)
  const curb = new THREE.Mesh(curbGeo, CURB_MAT)
  curb.position.set(0, 0.36, 0)
  group.add(curb)

  // 4. Four Approach Corridors (N, S, E, W)
  const approachLen = 70
  const approachW = width
  const directions = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]

  directions.forEach((dirAngle) => {
    const approachGeo = new THREE.BoxGeometry(approachLen, 0.08, approachW)
    const approach = new THREE.Mesh(approachGeo, ASPHALT_MAT)
    const dist = outerRadius + approachLen / 2 - 2
    approach.position.set(Math.cos(dirAngle) * dist, 0.05, Math.sin(dirAngle) * dist)
    approach.rotation.y = -dirAngle
    approach.receiveShadow = true
    group.add(approach)

    // Pedestrian Refuge Island on each approach
    const refugeGeo = new THREE.BoxGeometry(10, 0.25, 3)
    const refuge = new THREE.Mesh(refugeGeo, REFUGE_MAT)
    refuge.position.set(Math.cos(dirAngle) * (dist - 10), 0.15, Math.sin(dirAngle) * (dist - 10))
    refuge.rotation.y = -dirAngle
    group.add(refuge)

    // Zebra Crossings
    for (let stripe = -approachW / 2 + 1; stripe <= approachW / 2 - 1; stripe += 1.5) {
      const zebraGeo = new THREE.BoxGeometry(4, 0.04, 0.8)
      const zebra = new THREE.Mesh(zebraGeo, LINE_MAT)
      zebra.position.set(
        Math.cos(dirAngle) * (dist - 20) - Math.sin(dirAngle) * stripe,
        0.09,
        Math.sin(dirAngle) * (dist - 20) + Math.cos(dirAngle) * stripe,
      )
      zebra.rotation.y = -dirAngle
      group.add(zebra)
    }
  })

  // 5. Selection Wireframe
  if (isSelected) {
    const glowGeo = new THREE.RingGeometry(innerRadius - 2, outerRadius + 2, 32)
    glowGeo.rotateX(-Math.PI / 2)
    const glowMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      wireframe: true,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.position.set(0, 0.4, 0)
    group.add(glow)
  }

  return group
}

function JunctionRedesignLayer({
  junctionEdits,
  isSelected,
  appMode,
  gizmoMode,
  onSelect,
  onTransformChange,
  controlsRef,
}) {
  const groupRef = useRef(null)
  const transformRef = useRef(null)

  const activeRadius = junctionEdits?.width ?? BASE_JUNCTION.radius
  const activeWidth = junctionEdits?.length ?? BASE_JUNCTION.width

  const junctionGroup = useMemo(() => {
    return buildJunctionGroup(
      {
        radius: Math.max(15, Math.min(activeRadius, 65)),
        width: Math.max(8, Math.min(activeWidth, 24)),
      },
      isSelected,
    )
  }, [activeRadius, activeWidth, isSelected])

  useEffect(() => {
    if (!groupRef.current || !junctionGroup) return
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0])
    }
    groupRef.current.add(junctionGroup)
  }, [junctionGroup])

  useEffect(() => {
    const tc = transformRef.current
    if (!tc) return

    const handleDragging = (e) => {
      if (controlsRef?.current) controlsRef.current.enabled = !e.value
    }

    const handleChange = () => {
      const g = groupRef.current
      if (!g) return
      const [bx, , bz] = BASE_JUNCTION.position
      onTransformChange?.(BASE_JUNCTION.id, 'junction', {
        offsetX: parseFloat((g.position.x - bx).toFixed(2)),
        offsetZ: parseFloat((g.position.z - bz).toFixed(2)),
        rotationY: parseFloat(g.rotation.y.toFixed(3)),
      })
    }

    tc.addEventListener('dragging-changed', handleDragging)
    tc.addEventListener('change', handleChange)
    return () => {
      tc.removeEventListener('dragging-changed', handleDragging)
      tc.removeEventListener('change', handleChange)
    }
  }, [controlsRef, onTransformChange])

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation()
      onSelect?.({
        id: BASE_JUNCTION.id,
        type: 'junction',
        name: BASE_JUNCTION.name,
        center: [BASE_JUNCTION.position[0], BASE_JUNCTION.position[2]],
        radius: activeRadius,
        width: activeWidth,
        properties: {
          connectedRoads: BASE_JUNCTION.connectedRoads.join(', '),
          status: BASE_JUNCTION.status,
          ...BASE_JUNCTION.metrics,
        },
      })
    },
    [activeRadius, activeWidth, onSelect],
  )

  const [bx, , bz] = BASE_JUNCTION.position
  const posX = bx + (junctionEdits?.offsetX || 0)
  const posZ = bz + (junctionEdits?.offsetZ || 0)
  const rotY = junctionEdits?.rotationY ?? BASE_JUNCTION.rotationY

  return (
    <>
      <group
        ref={groupRef}
        position={[posX, 0, posZ]}
        rotation={[0, rotY, 0]}
        onClick={handleClick}
        cursor="pointer"
      />

      {isSelected && appMode === 'edit' && gizmoMode !== 'none' && groupRef.current && (
        <TransformControls
          ref={transformRef}
          object={groupRef.current}
          mode={gizmoMode}
          showY={gizmoMode === 'rotate'}
          translationSnap={1}
          rotationSnap={Math.PI / 32}
        />
      )}
    </>
  )
}

export default memo(JunctionRedesignLayer)
