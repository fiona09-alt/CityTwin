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
 * ALT 1 — DIRECT STRAIGHT FLYOVER MESH BUILDER
 */
function buildStraightFlyoverGroup(params) {
  const { length, width, height, pillarCount, lanes } = params
  const group = new THREE.Group()

  const deckThickness = 1.4
  const deckBottomY = height - deckThickness
  const surfaceY = height
  const barrierH = 0.95
  const barrierW = 0.3
  const rampLen = Math.min(length * 0.25, 110)
  const mainDeckLen = length - rampLen * 2

  // 1. Main Deck Beam
  const deckGeo = new THREE.BoxGeometry(mainDeckLen, deckThickness, width)
  const deck = new THREE.Mesh(deckGeo, DECK_GIRDER_MAT)
  deck.position.set(0, deckBottomY + deckThickness / 2, 0)
  deck.castShadow = true
  deck.receiveShadow = true
  group.add(deck)

  // 2. Asphalt Surface
  const surfGeo = new THREE.BoxGeometry(mainDeckLen, 0.14, width - 0.4)
  const surf = new THREE.Mesh(surfGeo, ASPHALT_SURFACE_MAT)
  surf.position.set(0, surfaceY + 0.07, 0)
  surf.receiveShadow = true
  group.add(surf)

  // 3. Concrete Barriers
  const barrierGeo = new THREE.BoxGeometry(length, barrierH, barrierW)
  const lBarrier = new THREE.Mesh(barrierGeo, BARRIER_MAT)
  lBarrier.position.set(0, surfaceY + barrierH / 2, -(width / 2 - barrierW / 2))
  lBarrier.castShadow = true
  group.add(lBarrier)

  const rBarrier = lBarrier.clone()
  rBarrier.position.z = width / 2 - barrierW / 2
  group.add(rBarrier)

  // 4. Lane Markings
  const laneW = (width - 0.4) / lanes
  for (let l = 1; l < lanes; l++) {
    const z = -(width - 0.4) / 2 + l * laneW
    const markGeo = new THREE.BoxGeometry(length * 0.9, 0.04, 0.18)
    const mark = new THREE.Mesh(markGeo, LANE_MARKING_MAT)
    mark.position.set(0, surfaceY + 0.15, z)
    group.add(mark)
  }

  // 5. West Ramp
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

  // 6. East Ramp
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

  // 7. Support Piers
  const numPillars = Math.max(3, Math.min(pillarCount, Math.floor(mainDeckLen / 45)))
  const step = mainDeckLen / (numPillars + 1)
  const pillarRadius = Math.max(0.75, width * 0.055)
  const shaftHeight = Math.max(1, deckBottomY)

  for (let p = 0; p < numPillars; p++) {
    const px = -mainDeckLen / 2 + step * (p + 1)
    const shaftGeo = new THREE.CylinderGeometry(pillarRadius, pillarRadius * 1.15, shaftHeight, 16)
    const shaft = new THREE.Mesh(shaftGeo, PILLAR_MAT)
    shaft.position.set(px, shaftHeight / 2, 0)
    shaft.castShadow = true
    group.add(shaft)

    const capGeo = new THREE.BoxGeometry(2.4, 0.7, width + 1.2)
    const cap = new THREE.Mesh(capGeo, CROSSHEAD_MAT)
    cap.position.set(px, deckBottomY - 0.35, 0)
    cap.castShadow = true
    group.add(cap)
  }

  return group
}

/**
 * ALT 2 — SPLIT / BRANCH FLYOVER MESH BUILDER (Y-Shaped Branching Alignment)
 */
function buildBranchFlyoverGroup(params) {
  const { length, width, height } = params
  const group = new THREE.Group()

  const deckThickness = 1.4
  const deckBottomY = height - deckThickness
  const surfaceY = height
  const barrierH = 0.95
  const barrierW = 0.3

  const trunkLen = Math.max(120, length * 0.45)
  const branchLen = Math.max(140, length * 0.45)

  // 1. Main Trunk Approach Deck (West to Junction)
  const trunkDeckGeo = new THREE.BoxGeometry(trunkLen, deckThickness, width)
  const trunkDeck = new THREE.Mesh(trunkDeckGeo, DECK_GIRDER_MAT)
  trunkDeck.position.set(-trunkLen / 2, deckBottomY + deckThickness / 2, 0)
  trunkDeck.castShadow = true
  trunkDeck.receiveShadow = true
  group.add(trunkDeck)

  const trunkSurfGeo = new THREE.BoxGeometry(trunkLen, 0.14, width - 0.4)
  const trunkSurf = new THREE.Mesh(trunkSurfGeo, ASPHALT_SURFACE_MAT)
  trunkSurf.position.set(-trunkLen / 2, surfaceY + 0.07, 0)
  trunkSurf.receiveShadow = true
  group.add(trunkSurf)

  // 2. Trunk Approach Ramp (West Incline)
  const rampLen = Math.min(80, trunkLen * 0.6)
  const rampAngle = Math.atan2(height - 0.2, rampLen)
  const rampBeamGeo = new THREE.BoxGeometry(rampLen, deckThickness, width)
  const wRampBeam = new THREE.Mesh(rampBeamGeo, DECK_GIRDER_MAT)
  wRampBeam.rotation.z = rampAngle
  wRampBeam.position.set(-trunkLen - rampLen / 2, height / 2 + 0.1, 0)
  wRampBeam.castShadow = true
  group.add(wRampBeam)

  // 3. Y-Bifurcation Junction Node Platform
  const junctionPlatformGeo = new THREE.CylinderGeometry(width * 0.8, width * 0.85, deckThickness, 12)
  const junctionPlatform = new THREE.Mesh(junctionPlatformGeo, DECK_GIRDER_MAT)
  junctionPlatform.position.set(0, deckBottomY + deckThickness / 2, 0)
  group.add(junctionPlatform)

  // Central Bifurcation Split Pier
  const splitPierGeo = new THREE.CylinderGeometry(width * 0.3, width * 0.35, deckBottomY, 16)
  const splitPier = new THREE.Mesh(splitPierGeo, PILLAR_MAT)
  splitPier.position.set(0, deckBottomY / 2, 0)
  splitPier.castShadow = true
  group.add(splitPier)

  // 4. Branch Decks (North Branch & East Branch)
  const branchConfigs = [
    { name: 'NorthBranch', angle: -0.45, zOffset: -width * 0.3, color: '#f59e0b' },
    { name: 'EastBranch', angle: 0.32, zOffset: width * 0.3, color: '#f59e0b' },
  ]

  branchConfigs.forEach((br) => {
    const branchGroup = new THREE.Group()
    branchGroup.position.set(0, 0, 0)
    branchGroup.rotation.y = br.angle

    const bWidth = width * 0.65
    const bDeckGeo = new THREE.BoxGeometry(branchLen, deckThickness, bWidth)
    const bDeck = new THREE.Mesh(bDeckGeo, DECK_GIRDER_MAT)
    bDeck.position.set(branchLen / 2, deckBottomY + deckThickness / 2, br.zOffset)
    bDeck.castShadow = true
    bDeck.receiveShadow = true
    branchGroup.add(bDeck)

    const bSurfGeo = new THREE.BoxGeometry(branchLen, 0.14, bWidth - 0.4)
    const bSurf = new THREE.Mesh(bSurfGeo, ASPHALT_SURFACE_MAT)
    bSurf.position.set(branchLen / 2, surfaceY + 0.07, br.zOffset)
    bSurf.receiveShadow = true
    branchGroup.add(bSurf)

    // Branch Barriers
    const bBarrierGeo = new THREE.BoxGeometry(branchLen, barrierH, barrierW)
    const bBarrierL = new THREE.Mesh(bBarrierGeo, BARRIER_MAT)
    bBarrierL.position.set(branchLen / 2, surfaceY + barrierH / 2, br.zOffset - bWidth / 2 + barrierW / 2)
    branchGroup.add(bBarrierL)

    const bBarrierR = bBarrierL.clone()
    bBarrierR.position.z = br.zOffset + bWidth / 2 - barrierW / 2
    branchGroup.add(bBarrierR)

    // Branch Exit Ramp
    const bRampBeam = new THREE.Mesh(new THREE.BoxGeometry(rampLen, deckThickness, bWidth), DECK_GIRDER_MAT)
    bRampBeam.rotation.z = -rampAngle
    bRampBeam.position.set(branchLen + rampLen / 2, height / 2 + 0.1, br.zOffset)
    branchGroup.add(bRampBeam)

    // Branch Pillars
    for (let p = 1; p <= 2; p++) {
      const px = (branchLen / 3) * p
      const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, deckBottomY, 12), PILLAR_MAT)
      pier.position.set(px, deckBottomY / 2, br.zOffset)
      branchGroup.add(pier)
    }

    group.add(branchGroup)
  })

  // Trunk Pillars
  for (let p = 1; p <= 2; p++) {
    const px = -(trunkLen / 3) * p
    const pier = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, deckBottomY, 12), PILLAR_MAT)
    pier.position.set(px, deckBottomY / 2, 0)
    group.add(pier)
  }

  return group
}

/**
 * ALT 3 — CRISS-CROSS / MULTI-DIRECTION FLYOVER MESH BUILDER (Dual-Tier Interchange)
 */
function buildCrissCrossFlyoverGroup(params) {
  const { length, height } = params
  const group = new THREE.Group()

  const deckThickness = 1.4
  const tier1Height = 8.5
  const tier2Height = height // ~13.5m

  // Build Tier 1 (Lower E-W Flyover Deck at 8.5m)
  const tier1Group = buildStraightFlyoverGroup({
    length: length * 0.85,
    width: 11,
    height: tier1Height,
    pillarCount: 5,
    lanes: 2,
  })
  tier1Group.rotation.y = 0.08
  group.add(tier1Group)

  // Build Tier 2 (Upper NW-SE Crossing Deck at 13.5m passing directly OVER Tier 1)
  const tier2Group = new THREE.Group()
  tier2Group.rotation.y = -0.92 // Crossing diagonal orientation

  const tier2Len = Math.max(380, length * 0.9)
  const tier2Width = 13
  const deckBottomY2 = tier2Height - deckThickness

  const t2Deck = new THREE.Mesh(new THREE.BoxGeometry(tier2Len, deckThickness, tier2Width), DECK_GIRDER_MAT)
  t2Deck.position.set(0, deckBottomY2 + deckThickness / 2, 0)
  t2Deck.castShadow = true
  tier2Group.add(t2Deck)

  const t2Surf = new THREE.Mesh(new THREE.BoxGeometry(tier2Len, 0.14, tier2Width - 0.4), ASPHALT_SURFACE_MAT)
  t2Surf.position.set(0, tier2Height + 0.07, 0)
  tier2Group.add(t2Surf)

  // Tier 2 High Support Towers (Crossing above Tier 1)
  for (let px of [-110, 110]) {
    const towerGeo = new THREE.CylinderGeometry(1.3, 1.6, deckBottomY2, 16)
    const tower1 = new THREE.Mesh(towerGeo, PILLAR_MAT)
    tower1.position.set(px, deckBottomY2 / 2, -tier2Width / 2.2)
    tier2Group.add(tower1)

    const tower2 = tower1.clone()
    tower2.position.z = tier2Width / 2.2
    tier2Group.add(tower2)

    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, tier2Width + 3), CROSSHEAD_MAT)
    crossBeam.position.set(px, deckBottomY2 - 0.6, 0)
    tier2Group.add(crossBeam)
  }

  // Tier 2 Sloped Entry & Exit Ramps (Descending to ground from 13.5m)
  const rampLen2 = 130
  const rampAngle2 = Math.atan2(tier2Height - 0.2, rampLen2)

  const wRamp2 = new THREE.Mesh(new THREE.BoxGeometry(rampLen2, deckThickness, tier2Width), DECK_GIRDER_MAT)
  wRamp2.rotation.z = rampAngle2
  wRamp2.position.set(-tier2Len / 2 - rampLen2 / 2, tier2Height / 2 + 0.1, 0)
  tier2Group.add(wRamp2)

  const eRamp2 = new THREE.Mesh(new THREE.BoxGeometry(rampLen2, deckThickness, tier2Width), DECK_GIRDER_MAT)
  eRamp2.rotation.z = -rampAngle2
  eRamp2.position.set(tier2Len / 2 + rampLen2 / 2, tier2Height / 2 + 0.1, 0)
  tier2Group.add(eRamp2)

  group.add(tier2Group)

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

    const params = {
      length: Math.max(100, Math.min(activeLength, 1500)),
      width: Math.max(8, Math.min(activeWidth, 24)),
      height: Math.max(5, Math.min(activeHeight, 25)),
      lanes: Math.max(2, Math.min(activeLanes, 8)),
      pillarCount: alternative.pillarCount,
    }

    let groupMesh = null
    if (alternative.type === 'branch') {
      groupMesh = buildBranchFlyoverGroup(params)
    } else if (alternative.type === 'crisscross') {
      groupMesh = buildCrissCrossFlyoverGroup(params)
    } else {
      groupMesh = buildStraightFlyoverGroup(params)
    }

    if (isSelected && groupMesh) {
      const glowGeo = new THREE.BoxGeometry(params.length + 4, params.height + 3, params.width + 2)
      const glow = new THREE.Mesh(glowGeo, SELECTED_GLOW_MAT)
      glow.position.set(0, params.height / 2, 0)
      groupMesh.add(glow)
    }

    return groupMesh
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
