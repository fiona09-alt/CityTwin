import { memo, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getFootprintArea, getPolygonRing } from '../geoutil'

function GreenSpacesLayer({ data, geoTransform, onSelectGreenSpace }) {
  const { mergedGeometry, greenIndex } = useMemo(() => {
    if (!data?.features?.length || !geoTransform) {
      return { mergedGeometry: null, greenIndex: [] }
    }

    const geometries = []
    const index = []

    for (let i = 0; i < data.features.length; i++) {
      const feature = data.features[i]
      const ring = getPolygonRing(feature.geometry?.coordinates)
      if (!ring || ring.length < 3) continue

      try {
        const shape = new THREE.Shape()
        const [firstX, firstZ] = geoTransform.lonLatToWorld(
          ring[0][0],
          ring[0][1],
        )
        shape.moveTo(firstX, -firstZ)

        let sumX = firstX
        let sumZ = firstZ

        for (let j = 1; j < ring.length; j++) {
          const [x, z] = geoTransform.lonLatToWorld(
            ring[j][0],
            ring[j][1],
          )
          shape.lineTo(x, -z)
          sumX += x
          sumZ += z
        }

        const geom = new THREE.ShapeGeometry(shape)
        geom.rotateX(-Math.PI / 2)
        geom.translate(0, 0.03, 0)
        geometries.push(geom)

        const area = getFootprintArea(
          ring,
          geoTransform.metersPerDegreeLon,
        )

        index.push({
          featureIndex: i,
          feature,
          center: [sumX / ring.length, sumZ / ring.length],
          areaM2: Math.round(area),
          areaHa: parseFloat((area / 10000).toFixed(2)),
          name: feature.properties?.name || 'Public Green Space / Garden',
          type: feature.properties?.leisure || feature.properties?.landuse || 'park',
        })
      } catch {
        // Skip invalid polygon gracefully
      }
    }

    if (geometries.length === 0) {
      return { mergedGeometry: null, greenIndex: [] }
    }

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false)
    geometries.forEach((g) => g.dispose())

    return { mergedGeometry: merged, greenIndex: index }
  }, [data, geoTransform])

  const handleClick = useCallback(
    (event) => {
      event.stopPropagation()
      if (!onSelectGreenSpace || greenIndex.length === 0) return

      const hitX = event.point.x
      const hitZ = event.point.z

      let closest = null
      let minDistSq = Infinity

      for (const item of greenIndex) {
        const dSq = (item.center[0] - hitX) ** 2 + (item.center[1] - hitZ) ** 2
        if (dSq < minDistSq) {
          minDistSq = dSq
          closest = item
        }
      }

      if (closest && minDistSq < 40000) {
        onSelectGreenSpace({
          id: `green_${closest.feature.properties?.osm_id || closest.featureIndex}`,
          type: 'green_space',
          name: closest.name,
          feature: closest.feature,
          properties: closest.feature.properties || {},
          greenType: closest.type,
          areaM2: closest.areaM2,
          areaHa: closest.areaHa,
          center: closest.center,
        })
      }
    },
    [greenIndex, onSelectGreenSpace],
  )

  if (!mergedGeometry) return null

  return (
    <mesh
      geometry={mergedGeometry}
      receiveShadow
      onClick={handleClick}
      cursor="pointer"
    >
      <meshStandardMaterial
        color="#70b382"
        roughness={0.85}
        metalness={0.05}
      />
    </mesh>
  )
}

export default memo(GreenSpacesLayer)
