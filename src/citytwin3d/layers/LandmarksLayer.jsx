import { memo, useMemo } from 'react'
import { Html } from '@react-three/drei'

function LandmarkItem({
  landmark,
  geoTransform,
  isSelected,
  onSelectLandmark,
}) {
  const [worldX, worldZ] = useMemo(() => {
    const coords = landmark.geometry?.coordinates || [79.0899, 21.1475]
    return geoTransform.lonLatToWorld(coords[0], coords[1])
  }, [landmark, geoTransform])

  const name = landmark.properties?.name || 'Landmark'
  const category = landmark.properties?.category || 'Point of Interest'

  const handleClick = (e) => {
    e.stopPropagation?.()
    onSelectLandmark?.({
      id: landmark.properties?.id || `landmark_${landmark.properties?.osm_id}`,
      type: 'landmark',
      name,
      category,
      description: landmark.properties?.description || '',
      elevation: landmark.properties?.elevation || '312 m ASL',
      status: landmark.properties?.status || 'Active Landmark',
      center: [worldX, worldZ],
      properties: landmark.properties || {},
      feature: landmark,
    })
  }

  return (
    <group position={[worldX, 0, worldZ]}>
      {/* 3D Pin Stem & Indicator */}
      <mesh position={[0, 6, 0]} onClick={handleClick}>
        <cylinderGeometry args={[0.8, 0.2, 12, 12]} />
        <meshStandardMaterial
          color={isSelected ? '#f59e0b' : '#0284c7'}
          emissive={isSelected ? '#f59e0b' : '#0369a1'}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      <mesh position={[0, 13, 0]} onClick={handleClick}>
        <sphereGeometry args={[2.2, 12, 12]} />
        <meshStandardMaterial
          color={isSelected ? '#fbbf24' : '#38bdf8'}
          emissive={isSelected ? '#f59e0b' : '#0284c7'}
          emissiveIntensity={0.7}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {/* Compact Floating HTML Annotation Badge */}
      <Html
        position={[0, 18, 0]}
        center
        distanceFactor={380}
        zIndexRange={[100, 0]}
      >
        <div
          onClick={handleClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: isSelected
              ? 'rgba(245, 158, 11, 0.95)'
              : 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            color: isSelected ? '#000000' : '#ffffff',
            border: isSelected
              ? '1.5px solid #fbbf24'
              : '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '12px',
            padding: '3px 8px',
            fontSize: '9px',
            fontWeight: 800,
            fontFamily: "'Manrope', sans-serif",
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer',
            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.15s ease',
            userSelect: 'none',
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: isSelected ? '#000000' : '#38bdf8',
              display: 'inline-block',
            }}
          />
          {name}
        </div>
      </Html>
    </group>
  )
}

/**
 * Main Sitabuldi Junction Core Label Badge
 */
function JunctionAnchorLabel() {
  return (
    <group position={[-140, 0, 20]}>
      <Html position={[0, 24, 0]} center distanceFactor={350} zIndexRange={[100, 0]}>
        <div
          style={{
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            color: '#ffffff',
            border: '2px solid #38bdf8',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '10px',
            fontWeight: 900,
            fontFamily: "'DM Mono', monospace",
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
            letterSpacing: '0.08em',
          }}
        >
          ★ SITABULDI JUNCTION ANCHOR
        </div>
      </Html>
    </group>
  )
}

function LandmarksLayer({
  data,
  geoTransform,
  selectedObject,
  onSelectLandmark,
}) {
  const landmarks = useMemo(() => {
    return data?.features || []
  }, [data])

  if (!geoTransform) return null

  return (
    <group name="landmarks-layer">
      <JunctionAnchorLabel />

      {landmarks.map((lm, idx) => {
        const isSelected =
          selectedObject?.id ===
          (lm.properties?.id || `landmark_${lm.properties?.osm_id}`)
        return (
          <LandmarkItem
            key={lm.properties?.id || idx}
            landmark={lm}
            geoTransform={geoTransform}
            isSelected={isSelected}
            onSelectLandmark={onSelectLandmark}
          />
        )
      })}
    </group>
  )
}

export default memo(LandmarksLayer)
