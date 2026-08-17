import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { TransformControls } from '@react-three/drei'
import * as THREE from 'three'

// ── Materials ───────────────────────────────────────────────────────────────
const TRENCH_MAT = new THREE.MeshStandardMaterial({
  color: '#1e293b',
  roughness: 0.95,
  metalness: 0.05,
})
const WALL_MAT = new THREE.MeshStandardMaterial({
  color: '#94a3b8',
  roughness: 0.7,
  metalness: 0.15,
})
const BRIDGE_MAT = new THREE.MeshStandardMaterial({
  color: '#cbd5e1',
  roughness: 0.6,
  metalness: 0.2,
})
const LANE_MARKING_MAT = new THREE.MeshBasicMaterial({ color: '#f59e0b' })
const BARRIER_MAT = new THREE.MeshStandardMaterial({
  color: '#e2e8f0',
  roughness: 0.5,
  metalness: 0.3,
})
const SELECTED_GLOW_MAT = new THREE.MeshBasicMaterial({
  color: '#10b981',
  wireframe: true,
})

const BASE_UNDERPASS = {
  id: 'sitabuldi_underpass',
  name: 'Sitabuldi Subterranean Underpass Corridor',
  position: [-148, 0, 185],
  rotationY: 0.08,
  depth: 6,
  width: 14,
  length: 560,
  lanes: 4,
  connectedRoads: [
    'Shri Bejonji Mehta Road',
    'New Loha Underpass Axis',
    'Station Road Approach',
  ],
  status: 'Proposed Subterranean Infrastructure',
  metrics: {
    lengthKm: 0.56,
    depthM: 6,
    lanes: 4,
    estimatedCapacityVPH: 4400,
    affectedAreaHa: 1.2,
    trafficImpact: 'High — eliminates central Sitabuldi surface conflict by taking arterial traffic underground',
    safetyImpact: 'High — 100% grade separation for cross-junction traffic',
    environmentalImpact: 'Positive — reduces surface vehicle noise and idle emissions by ~35%',
    estimatedCostCr: '₹ 75–105 Cr (Prototype Estimate)',
    constructionMonths: 24,
    note: 'All metrics are estimated prototype/scenario data only.',
  },
}

/**
 * Build 3D Underpass Geometry:
 *  1. Depressed central carriageway channel (Y = -depth)
 *  2. Sloped West entry ramp (Y = 0.2m -> -depth)
 *  3. Sloped East exit ramp (Y = -depth -> 0.2m)
 *  4. Concrete side retaining walls (Left & Right)
 *  5. Surface-level ground overpass cross-bridge (Y = 0.4m) for cross-traffic
 *  6. Lane division markings
 */
function buildUnderpassGroup(params, isSelected) {
  const { length, width, depth, lanes } = params

  const rampLen = Math.min(length * 0.28, 140)
  const trenchLen = length - rampLen * 2
  const wallH = depth + 1.2
  const wallW = 0.6

  const group = new THREE.Group()

  // 1. Depressed Carriageway Channel (Bottom asphalt road surface at Y = -depth)
  const trenchGeo = new THREE.BoxGeometry(trenchLen, 0.2, width)
  const trench = new THREE.Mesh(trenchGeo, TRENCH_MAT)
  trench.position.set(0, -depth + 0.1, 0)
  trench.receiveShadow = true
  group.add(trench)

  // 2. Concrete Retaining Walls (Left & Right along trench)
  const wallGeo = new THREE.BoxGeometry(length, wallH, wallW)

  const lWall = new THREE.Mesh(wallGeo, WALL_MAT)
  lWall.position.set(0, -depth / 2 + 0.6, -(width / 2 + wallW / 2))
  lWall.castShadow = true
  group.add(lWall)

  const rWall = lWall.clone()
  rWall.position.z = width / 2 + wallW / 2
  group.add(rWall)

  // Top Guard Rail Barriers on Retaining Walls
  const barrierGeo = new THREE.BoxGeometry(length, 0.8, 0.2)
  const lBarrier = new THREE.Mesh(barrierGeo, BARRIER_MAT)
  lBarrier.position.set(0, 0.4, -(width / 2 + wallW / 2))
  group.add(lBarrier)

  const rBarrier = lBarrier.clone()
  rBarrier.position.z = width / 2 + wallW / 2
  group.add(rBarrier)

  // 3. West Sloped Entry Ramp (Sloping down from Y = 0.2m to Y = -depth)
  const rampAngle = Math.atan2(depth, rampLen)
  const rampGeo = new THREE.BoxGeometry(rampLen, 0.2, width)

  const wRamp = new THREE.Mesh(rampGeo, TRENCH_MAT)
  wRamp.rotation.z = -rampAngle
  wRamp.position.set(-trenchLen / 2 - rampLen / 2, -depth / 2 + 0.1, 0)
  wRamp.receiveShadow = true
  group.add(wRamp)

  // 4. East Sloped Exit Ramp (Sloping up from Y = -depth to Y = 0.2m)
  const eRamp = new THREE.Mesh(rampGeo, TRENCH_MAT)
  eRamp.rotation.z = rampAngle
  eRamp.position.set(trenchLen / 2 + rampLen / 2, -depth / 2 + 0.1, 0)
  eRamp.receiveShadow = true
  group.add(eRamp)

  // 5. Ground Overpass Cross-Bridge (Surface road crossing over the underpass at Y = 0.4m)
  const bridgeW = 28
  const bridgeGeo = new THREE.BoxGeometry(bridgeW, 0.5, width + wallW * 2 + 4)
  const bridge = new THREE.Mesh(bridgeGeo, BRIDGE_MAT)
  bridge.position.set(0, 0.25, 0)
  bridge.castShadow = true
  bridge.receiveShadow = true
  group.add(bridge)

  // 6. Yellow Lane Division Markings inside trench
  const laneW = width / lanes
  for (let l = 1; l < lanes; l++) {
    const z = -width / 2 + l * laneW
    const markGeo = new THREE.BoxGeometry(length * 0.85, 0.04, 0.18)
    const mark = new THREE.Mesh(markGeo, LANE_MARKING_MAT)
    mark.position.set(0, -depth + 0.22, z)
    group.add(mark)
  }

  // 7. Selection Glow Outline
  if (isSelected) {
    const glowGeo = new THREE.BoxGeometry(length + 4, depth + 3, width + 4)
    const glow = new THREE.Mesh(glowGeo, SELECTED_GLOW_MAT)
    glow.position.set(0, -depth / 2, 0)
    group.add(glow)
  }

  return group
}

function UnderpassLayer({
  underpassEdits,
  isSelected,
  appMode,
  gizmoMode,
  onSelect,
  onTransformChange,
  controlsRef,
}) {
  const groupRef = useRef(null)
  const transformRef = useRef(null)

  const activeDepth = underpassEdits?.height ?? BASE_UNDERPASS.depth
  const activeWidth = underpassEdits?.width ?? BASE_UNDERPASS.width
  const activeLength = underpassEdits?.length ?? BASE_UNDERPASS.length
  const activeLanes = underpassEdits?.lanes ?? BASE_UNDERPASS.lanes

  const underpassGroup = useMemo(() => {
    return buildUnderpassGroup(
      {
        length: Math.max(100, Math.min(activeLength, 1200)),
        width: Math.max(6, Math.min(activeWidth, 24)),
        depth: Math.max(3, Math.min(activeDepth, 14)),
        lanes: Math.max(2, Math.min(activeLanes, 8)),
      },
      isSelected,
    )
  }, [activeDepth, activeLength, activeLanes, activeWidth, isSelected])

  useEffect(() => {
    if (!groupRef.current || !underpassGroup) return
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0])
    }
    groupRef.current.add(underpassGroup)
  }, [underpassGroup])

  useEffect(() => {
    const tc = transformRef.current
    if (!tc) return

    const handleDragging = (e) => {
      if (controlsRef?.current) controlsRef.current.enabled = !e.value
    }

    const handleChange = () => {
      const g = groupRef.current
      if (!g) return
      const [bx, , bz] = BASE_UNDERPASS.position
      onTransformChange?.(BASE_UNDERPASS.id, 'underpass', {
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
        id: BASE_UNDERPASS.id,
        type: 'underpass',
        name: BASE_UNDERPASS.name,
        center: [BASE_UNDERPASS.position[0], BASE_UNDERPASS.position[2]],
        depth: activeDepth,
        width: activeWidth,
        length: activeLength,
        lanes: activeLanes,
        properties: {
          connectedRoads: BASE_UNDERPASS.connectedRoads.join(', '),
          status: BASE_UNDERPASS.status,
          ...BASE_UNDERPASS.metrics,
        },
      })
    },
    [activeDepth, activeLanes, activeLength, activeWidth, onSelect],
  )

  const [bx, , bz] = BASE_UNDERPASS.position
  const posX = bx + (underpassEdits?.offsetX || 0)
  const posZ = bz + (underpassEdits?.offsetZ || 0)
  const rotY = underpassEdits?.rotationY ?? BASE_UNDERPASS.rotationY

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

export default memo(UnderpassLayer)
