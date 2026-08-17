import { memo, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { getRoadWidth } from '../geoutil'

function RoadsLayer({ data, geoTransform, onSelectRoad }) {
  const { roadGeometry, roadSegments } = useMemo(() => {
    if (!data?.features?.length || !geoTransform) {
      return { roadGeometry: null, roadSegments: [] }
    }

    const positions = []
    const indices = []
    const segments = []
    let vertexOffset = 0

    for (let fIdx = 0; fIdx < data.features.length; fIdx++) {
      const feature = data.features[fIdx]
      const coords = feature.geometry?.coordinates
      if (!Array.isArray(coords) || coords.length < 2) continue

      const width = getRoadWidth(feature.properties?.highway)
      const halfWidth = width / 2

      for (let i = 0; i < coords.length - 1; i++) {
        const p1 = coords[i]
        const p2 = coords[i + 1]
        if (!Array.isArray(p1) || !Array.isArray(p2)) continue

        const [x1, z1] = geoTransform.lonLatToWorld(p1[0], p1[1])
        const [x2, z2] = geoTransform.lonLatToWorld(p2[0], p2[1])

        const dx = x2 - x1
        const dz = z2 - z1
        const len = Math.hypot(dx, dz)
        if (len < 0.001) continue

        const nx = (-dz / len) * halfWidth
        const nz = (dx / len) * halfWidth
        const y = 0.06

        positions.push(
          x1 - nx, y, z1 - nz, // 0
          x1 + nx, y, z1 + nz, // 1
          x2 + nx, y, z2 + nz, // 2
          x2 - nx, y, z2 - nz, // 3
        )

        indices.push(
          vertexOffset,
          vertexOffset + 1,
          vertexOffset + 2,
          vertexOffset,
          vertexOffset + 2,
          vertexOffset + 3,
        )

        segments.push({
          featureIndex: fIdx,
          feature,
          x1,
          z1,
          x2,
          z2,
          midX: (x1 + x2) / 2,
          midZ: (z1 + z2) / 2,
          width,
        })

        vertexOffset += 4
      }
    }

    if (positions.length === 0) {
      return { roadGeometry: null, roadSegments: [] }
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    )
    geom.setIndex(indices)
    geom.computeVertexNormals()

    return { roadGeometry: geom, roadSegments: segments }
  }, [data, geoTransform])

  const handleClick = useCallback(
    (event) => {
      event.stopPropagation()
      if (!onSelectRoad || roadSegments.length === 0) return

      const hitX = event.point.x
      const hitZ = event.point.z

      // Find closest road segment to hit point
      let closestSeg = null
      let minDistSq = Infinity

      for (const seg of roadSegments) {
        const dSq = (seg.midX - hitX) ** 2 + (seg.midZ - hitZ) ** 2
        if (dSq < minDistSq) {
          minDistSq = dSq
          closestSeg = seg
        }
      }

      if (closestSeg && minDistSq < 600) {
        const feat = closestSeg.feature
        onSelectRoad({
          id: `road_${feat.properties?.osm_id || closestSeg.featureIndex}`,
          type: 'road',
          name: feat.properties?.name || `${(feat.properties?.highway || 'road').toUpperCase()} Corridor`,
          feature: feat,
          properties: feat.properties || {},
          highway: feat.properties?.highway || 'road',
          lanes: feat.properties?.lanes || (closestSeg.width >= 10 ? '4 Lanes' : '2 Lanes'),
          width: closestSeg.width,
          center: [closestSeg.midX, closestSeg.midZ],
        })
      }
    },
    [roadSegments, onSelectRoad],
  )

  if (!roadGeometry) return null

  return (
    <mesh
      geometry={roadGeometry}
      receiveShadow
      onClick={handleClick}
      cursor="pointer"
    >
      <meshStandardMaterial
        color="#3d4952"
        roughness={0.78}
        metalness={0.12}
      />
    </mesh>
  )
}

export default memo(RoadsLayer)
