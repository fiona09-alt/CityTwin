import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { TransformControls } from '@react-three/drei'
import * as THREE from 'three'

// ── Materials ───────────────────────────────────────────────────────────────
const DECK_GIRDER_MAT = new THREE.MeshStandardMaterial({
  color: '#334155',
  roughness: 0.82,
  metalness: 0.18,
})
const ASPHALT_SURFACE_MAT = new THREE.MeshStandardMaterial({
  color: '#1e293b',
  roughness: 0.95,
  metalness: 0.05,
})
const BARRIER_MAT = new THREE.MeshStandardMaterial({
  color: '#e2e8f0',
  roughness: 0.55,
  metalness: 0.25,
})
const PILLAR_MAT = new THREE.MeshStandardMaterial({
  color: '#cbd5e1',
  roughness: 0.7,
  metalness: 0.1,
})
const CROSSHEAD_MAT = new THREE.MeshStandardMaterial({
  color: '#94a3b8',
  roughness: 0.75,
  metalness: 0.15,
})
const LANE_MARKING_MAT = new THREE.MeshBasicMaterial({ color: '#f59e0b' })
const SELECTED_GLOW_MAT = new THREE.MeshBasicMaterial({
  color: '#38bdf8',
  wireframe: true,
})

/**
 * Rebuild Flyover Infrastructure Geometry anchored to real Sitabuldi road paths.
 *
 * Structure:
 *  - Approach Road A (Ground level Y = 0.2m)
 *  - West Sloped Ramp (Gradual rise from Y = 0.2m to Y = height)
 *  - Main Elevated Deck Beam (Box Girder at Y = height, crossing surface junction)
 *  - Asphalt Roadway Surface & Yellow Lane Markings
 *  - Side Concrete Safety Barriers (L & R)
 *  - East Sloped Ramp (Gradual descent from Y = height to Y = 0.2m)
 *  - Approach Road B (Ground level Y = 0.2m)
 *  - Cylindrical Concrete Piers with Cross-Head Caps underneath
 */
function buildFlyoverGroup(params, isSelected) {
  const { length, width, height, pillarCount, lanes } = params

  const deckThickness = 1.4
  const deckBottomY = height - deckThickness
  const surfaceY = height
  const barrierH = 0.95
  const barrierW = 0.3
  const rampLen = Math.min(length * 0.25, 110)
  const mainDeckLen = length - rampLen * 2

  const group = new THREE.Group()

  // 1. Main Central Elevated Deck Beam (Crossing over junction)
  const deckGeo = new THREE.BoxGeometry(mainDeckLen, deckThickness, width)
  const deck = new THREE.Mesh(deckGeo, DECK_GIRDER_MAT)
  deck.position.set(0, deckBottomY + deckThickness / 2, 0)
  deck.castShadow = true
  deck.receiveShadow = true
  group.add(deck)

  // 2. Main Deck Asphalt Roadway Surface
  const surfGeo = new THREE.BoxGeometry(mainDeckLen, 0.14, width - 0.4)
  const surf = new THREE.Mesh(surfGeo, ASPHALT_SURFACE_MAT)
  surf.position.set(0, surfaceY + 0.07, 0)
  surf.receiveShadow = true
  group.add(surf)

  // 3. Side Guard Rail Barriers (Left & Right)
  const barrierGeo = new THREE.BoxGeometry(length, barrierH, barrierW)

  const lBarrier = new THREE.Mesh(barrierGeo, BARRIER_MAT)
  lBarrier.position.set(0, surfaceY + barrierH / 2, -(width / 2 - barrierW / 2))
  lBarrier.castShadow = true
  group.add(lBarrier)

  const rBarrier = lBarrier.clone()
  rBarrier.position.z = width / 2 - barrierW / 2
  group.add(rBarrier)

  // 4. Yellow Center Line & Lane Markings along Deck & Ramps
  const laneW = (width - 0.4) / lanes
  for (let l = 1; l < lanes; l++) {
    const z = -(width - 0.4) / 2 + l * laneW
    const markGeo = new THREE.BoxGeometry(length * 0.9, 0.04, 0.18)
    const mark = new THREE.Mesh(markGeo, LANE_MARKING_MAT)
    mark.position.set(0, surfaceY + 0.15, z)
    group.add(mark)
  }

  // 5. West Sloped Approach Ramp (Gradual multi-segment incline from ground Y = 0.2m to deck height)
  const rampAngle = Math.atan2(height - 0.2, rampLen)
  const rampBeamGeo = new THREE.BoxGeometry(rampLen, deckThickness, width)
  const rampSurfGeo = new THREE.BoxGeometry(rampLen, 0.14, width - 0.4)

  const wRampBeam = new THREE.Mesh(rampBeamGeo, DECK_GIRDER_MAT)
  wRampBeam.rotation.z = rampAngle
  wRampBeam.position.set(-mainDeckLen / 2 - rampLen / 2, height / 2 + 0.1, 0)
  wRampBeam.castShadow = true
  group.add(wRampBeam)

  const wRampSurf = new THREE.Mesh(rampSurfGeo, ASPHALT_SURFACE_MAT)
  wRampSurf.rotation.z = rampAngle
  wRampSurf.position.set(-mainDeckLen / 2 - rampLen / 2, height / 2 + 0.1 + deckThickness / 2, 0)
  wRampSurf.receiveShadow = true
  group.add(wRampSurf)

  // 6. East Sloped Approach Ramp (Gradual multi-segment descent from deck height to ground Y = 0.2m)
  const eRampBeam = new THREE.Mesh(rampBeamGeo, DECK_GIRDER_MAT)
  eRampBeam.rotation.z = -rampAngle
  eRampBeam.position.set(mainDeckLen / 2 + rampLen / 2, height / 2 + 0.1, 0)
  eRampBeam.castShadow = true
  group.add(eRampBeam)

  const eRampSurf = new THREE.Mesh(rampSurfGeo, ASPHALT_SURFACE_MAT)
  eRampSurf.rotation.z = -rampAngle
  eRampSurf.position.set(mainDeckLen / 2 + rampLen / 2, height / 2 + 0.1 + deckThickness / 2, 0)
  eRampSurf.receiveShadow = true
  group.add(eRampSurf)

  // 7. Support Piers & Cross-Head Caps (Spaced evenly under the elevated deck)
  const numPillars = Math.max(3, Math.min(pillarCount, Math.floor(mainDeckLen / 45)))
  const step = mainDeckLen / (numPillars + 1)
  const pillarRadius = Math.max(0.75, width * 0.055)
  const shaftHeight = Math.max(1, deckBottomY)

  for (let p = 0; p < numPillars; p++) {
    const px = -mainDeckLen / 2 + step * (p + 1)

    // Concrete Column Pier Shaft
    const shaftGeo = new THREE.CylinderGeometry(pillarRadius, pillarRadius * 1.15, shaftHeight, 16)
    const shaft = new THREE.Mesh(shaftGeo, PILLAR_MAT)
    shaft.position.set(px, shaftHeight / 2, 0)
    shaft.castShadow = true
    group.add(shaft)

    // Concrete Cross-Head Support Beam (Cap)
    const capGeo = new THREE.BoxGeometry(2.4, 0.7, width + 1.2)
    const cap = new THREE.Mesh(capGeo, CROSSHEAD_MAT)
    cap.position.set(px, deckBottomY - 0.35, 0)
    cap.castShadow = true
    group.add(cap)
  }

  // 8. Selection Glow Outline
  if (isSelected) {
    const glowGeo = new THREE.BoxGeometry(length + 4, height + 3, width + 2)
    const glow = new THREE.Mesh(glowGeo, SELECTED_GLOW_MAT)
    glow.position.set(0, height / 2, 0)
    group.add(glow)
  }

  return group
}

function FlyoverLayer({
  alternative,
  flyoverEdits,
  isSelected,
  appMode,
  gizmoMode,
  onSelect,
  onTransformChange,
  controlsRef,
}) {
  const groupRef = useRef(null)
  const transformRef = useRef(null)

  const flyoverGroup = useMemo(() => {
    if (!alternative) return null

    const activeHeight = flyoverEdits?.height ?? alternative.height
    const activeWidth = flyoverEdits?.width ?? alternative.width
    const activeLength = flyoverEdits?.length ?? alternative.length
    const activeLanes = flyoverEdits?.lanes ?? alternative.lanes

    return buildFlyoverGroup(
      {
        length: Math.max(100, Math.min(activeLength, 1500)),
        width: Math.max(8, Math.min(activeWidth, 24)),
        height: Math.max(5, Math.min(activeHeight, 25)),
        lanes: Math.max(2, Math.min(activeLanes, 8)),
        pillarCount: alternative.pillarCount,
      },
      isSelected,
    )
  }, [alternative, flyoverEdits, isSelected])

  useEffect(() => {
    if (!groupRef.current || !flyoverGroup) return
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0])
    }
    groupRef.current.add(flyoverGroup)
  }, [flyoverGroup])

  useEffect(() => {
    const tc = transformRef.current
    if (!tc) return

    const handleDragging = (e) => {
      if (controlsRef?.current) controlsRef.current.enabled = !e.value
    }

    const handleChange = () => {
      const g = groupRef.current
      if (!g || !alternative) return
      const [bx, , bz] = alternative.position
      onTransformChange?.(alternative.id, 'flyover', {
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
  }, [alternative, controlsRef, onTransformChange])

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation()
      if (!alternative) return
      const activeHeight = flyoverEdits?.height ?? alternative.height
      const activeWidth = flyoverEdits?.width ?? alternative.width
      const activeLength = flyoverEdits?.length ?? alternative.length
      const activeLanes = flyoverEdits?.lanes ?? alternative.lanes

      onSelect?.({
        id: alternative.id,
        type: 'flyover',
        name: alternative.name,
        center: [alternative.position[0], alternative.position[2]],
        height: activeHeight,
        width: activeWidth,
        length: activeLength,
        lanes: activeLanes,
        alternative,
        properties: {
          alignment: alternative.alignment,
          connectedRoads: alternative.connectedRoads.join(', '),
          status: alternative.status,
          ...alternative.metrics,
        },
      })
    },
    [alternative, flyoverEdits, onSelect],
  )

  if (!alternative) return null

  const [bx, , bz] = alternative.position
  const posX = bx + (flyoverEdits?.offsetX || 0)
  const posZ = bz + (flyoverEdits?.offsetZ || 0)
  const rotY = flyoverEdits?.rotationY ?? alternative.rotationY

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

export default memo(FlyoverLayer)
