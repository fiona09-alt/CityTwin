import { memo, useEffect, useMemo, useRef } from 'react'
import { TransformControls } from '@react-three/drei'
import * as THREE from 'three'
import { getPolygonRing } from '../geoutil'

function BuildingOverlayItem({
  buildingId,
  feature,
  baseHeight,
  geoTransform,
  edits,
  isSelected,
  appMode,
  gizmoMode,
  onTransformChange,
  controlsRef,
}) {
  const meshRef = useRef(null)
  const transformRef = useRef(null)

  const ring = useMemo(
    () => getPolygonRing(feature?.geometry?.coordinates),
    [feature],
  )

  // Compute local origin centered at footprint centroid
  const { shape, centroidX, centroidZ } = useMemo(() => {
    if (!ring || ring.length < 3 || !geoTransform) {
      return { shape: null, centroidX: 0, centroidZ: 0 }
    }

    let sumX = 0
    let sumZ = 0
    const pts = []

    for (const [lon, lat] of ring) {
      const [x, z] = geoTransform.lonLatToWorld(lon, lat)
      sumX += x
      sumZ += z
      pts.push([x, z])
    }

    const cx = sumX / ring.length
    const cz = sumZ / ring.length

    const s = new THREE.Shape()
    s.moveTo(pts[0][0] - cx, -(pts[0][1] - cz))

    for (let j = 1; j < pts.length; j++) {
      s.lineTo(pts[j][0] - cx, -(pts[j][1] - cz))
    }

    return { shape: s, centroidX: cx, centroidZ: cz }
  }, [ring, geoTransform])

  const height = edits?.height ?? baseHeight ?? 8

  const geometry = useMemo(() => {
    if (!shape) return null
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
    })
    g.rotateX(-Math.PI / 2)
    return g
  }, [shape, height])

  // Sync TransformControls dragging with OrbitControls
  useEffect(() => {
    const transform = transformRef.current
    if (!transform) return

    const handleDraggingChange = (event) => {
      if (controlsRef?.current) {
        controlsRef.current.enabled = !event.value
      }
    }

    const handleChange = () => {
      if (!meshRef.current) return
      const mesh = meshRef.current
      const currentOffsetX = mesh.position.x - centroidX
      const currentOffsetZ = mesh.position.z - centroidZ
      const currentRotY = mesh.rotation.y

      onTransformChange?.(buildingId, 'building', {
        offsetX: parseFloat(currentOffsetX.toFixed(2)),
        offsetZ: parseFloat(currentOffsetZ.toFixed(2)),
        rotationY: parseFloat(currentRotY.toFixed(3)),
      })
    }

    transform.addEventListener('dragging-changed', handleDraggingChange)
    transform.addEventListener('change', handleChange)

    return () => {
      transform.removeEventListener('dragging-changed', handleDraggingChange)
      transform.removeEventListener('change', handleChange)
    }
  }, [buildingId, centroidX, centroidZ, controlsRef, onTransformChange])

  if (!geometry) return null

  const posX = centroidX + (edits?.offsetX || 0)
  const posZ = centroidZ + (edits?.offsetZ || 0)
  const rotY = edits?.rotationY || 0

  const isHidden = Boolean(edits?.hidden)
  if (isHidden) return null

  return (
    <>
      <mesh
        ref={meshRef}
        geometry={geometry}
        position={[posX, 0.05, posZ]}
        rotation={[0, rotY, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={isSelected ? '#f59e0b' : '#38bdf8'}
          emissive={isSelected ? '#d97706' : '#0284c7'}
          emissiveIntensity={0.35}
          roughness={0.45}
          metalness={0.2}
          transparent
          opacity={0.92}
        />
      </mesh>

      {isSelected && appMode === 'edit' && gizmoMode !== 'none' && meshRef.current && (
        <TransformControls
          ref={transformRef}
          object={meshRef.current}
          mode={gizmoMode}
          showY={gizmoMode === 'rotate'}
          translationSnap={1}
          rotationSnap={Math.PI / 16}
        />
      )}
    </>
  )
}

function GenericOverlayItem({
  object,
  edits,
  isSelected,
  appMode,
  gizmoMode,
  onTransformChange,
  controlsRef,
}) {
  const meshRef = useRef(null)
  const transformRef = useRef(null)

  const [baseX, baseZ] = object.center || [0, 0]

  useEffect(() => {
    const transform = transformRef.current
    if (!transform) return

    const handleDraggingChange = (event) => {
      if (controlsRef?.current) {
        controlsRef.current.enabled = !event.value
      }
    }

    const handleChange = () => {
      if (!meshRef.current) return
      const mesh = meshRef.current
      const currentOffsetX = mesh.position.x - baseX
      const currentOffsetZ = mesh.position.z - baseZ
      const currentRotY = mesh.rotation.y

      onTransformChange?.(object.id, object.type, {
        offsetX: parseFloat(currentOffsetX.toFixed(2)),
        offsetZ: parseFloat(currentOffsetZ.toFixed(2)),
        rotationY: parseFloat(currentRotY.toFixed(3)),
      })
    }

    transform.addEventListener('dragging-changed', handleDraggingChange)
    transform.addEventListener('change', handleChange)

    return () => {
      transform.removeEventListener('dragging-changed', handleDraggingChange)
      transform.removeEventListener('change', handleChange)
    }
  }, [object.id, object.type, baseX, baseZ, controlsRef, onTransformChange])

  const posX = baseX + (edits?.offsetX || 0)
  const posZ = baseZ + (edits?.offsetZ || 0)
  const rotY = edits?.rotationY || 0

  if (edits?.hidden) return null

  return (
    <>
      <mesh
        ref={meshRef}
        position={[posX, 0.2, posZ]}
        rotation={[0, rotY, 0]}
      >
        <cylinderGeometry args={[2, 2, 1, 16]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.7}
        />
      </mesh>

      {isSelected && appMode === 'edit' && gizmoMode !== 'none' && meshRef.current && (
        <TransformControls
          ref={transformRef}
          object={meshRef.current}
          mode={gizmoMode}
          showY={gizmoMode === 'rotate'}
          translationSnap={1}
          rotationSnap={Math.PI / 16}
        />
      )}
    </>
  )
}

function EditableObjectOverlay({
  selectedObject,
  appMode,
  gizmoMode,
  cityEdits,
  geoTransform,
  controlsRef,
  onTransformChange,
}) {
  const buildingEdits = cityEdits?.buildings

  // List of all buildings that have active edits
  const editedBuildingsList = useMemo(() => {
    if (!buildingEdits) return []
    return Object.entries(buildingEdits).map(([id, edits]) => ({
      id,
      edits,
    }))
  }, [buildingEdits])

  return (
    <group name="editable-object-overlay">
      {/* 1. If currently selected object is a building */}
      {selectedObject?.type === 'building' && (
        <BuildingOverlayItem
          key={selectedObject.id}
          buildingId={selectedObject.id}
          feature={selectedObject.feature}
          baseHeight={selectedObject.height}
          geoTransform={geoTransform}
          edits={cityEdits?.buildings?.[selectedObject.id]}
          isSelected
          appMode={appMode}
          gizmoMode={gizmoMode}
          onTransformChange={onTransformChange}
          controlsRef={controlsRef}
        />
      )}

      {/* 2. Any other buildings with active edits that are NOT currently selected */}
      {editedBuildingsList.map(({ id, edits }) => {
        if (selectedObject?.id === id) return null
        return (
          <BuildingOverlayItem
            key={id}
            buildingId={id}
            feature={edits.feature}
            baseHeight={edits.baseHeight}
            geoTransform={geoTransform}
            edits={edits}
            isSelected={false}
            appMode={appMode}
            gizmoMode={gizmoMode}
            onTransformChange={onTransformChange}
            controlsRef={controlsRef}
          />
        )
      })}

      {/* 3. Non-building selected object (Tree, POI, Landmark) */}
      {selectedObject &&
        selectedObject.type !== 'building' &&
        selectedObject.center && (
          <GenericOverlayItem
            key={selectedObject.id}
            object={selectedObject}
            edits={cityEdits?.[`${selectedObject.type}s`]?.[selectedObject.id]}
            isSelected
            appMode={appMode}
            gizmoMode={gizmoMode}
            onTransformChange={onTransformChange}
            controlsRef={controlsRef}
          />
        )}
    </group>
  )
}

export default memo(EditableObjectOverlay)
