import { memo, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getPolygonRing } from '../geoutil'

function WaterLayer({ data, geoTransform, onSelectWater }) {
  const { mergedGeometry, waterIndex } = useMemo(() => {
    if (!data?.features?.length || !geoTransform) {
      return { mergedGeometry: null, waterIndex: [] }
    }

    const geometries = []
    const index = []

    for (let i = 0; i < data.features.length; i++) {
      const feature = data.features[i]
      const geomType = feature.geometry?.type
      const name = feature.properties?.name || 'Sitabuldi Waterway / Lake'

      if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
        const ring = getPolygonRing(feature.geometry.coordinates)
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
          geom.translate(0, 0.02, 0)
          geometries.push(geom)

          index.push({
            featureIndex: i,
            feature,
            name,
            type: 'Lake / Reservoir',
            center: [sumX / ring.length, sumZ / ring.length],
          })
        } catch {
          // Skip invalid polygon
        }
      } else if (geomType === 'LineString' || geomType === 'MultiLineString') {
        // Waterway line (e.g. Naag River channel)
        const coordsList =
          geomType === 'MultiLineString'
            ? feature.geometry.coordinates
            : [feature.geometry.coordinates]

        for (const coords of coordsList) {
          if (!Array.isArray(coords) || coords.length < 2) continue
          const halfWidth = 3.5

          for (let j = 0; j < coords.length - 1; j++) {
            const p1 = coords[j]
            const p2 = coords[j + 1]
            if (!Array.isArray(p1) || !Array.isArray(p2)) continue

            const [x1, z1] = geoTransform.lonLatToWorld(p1[0], p1[1])
            const [x2, z2] = geoTransform.lonLatToWorld(p2[0], p2[1])

            const dx = x2 - x1
            const dz = z2 - z1
            const len = Math.hypot(dx, dz)
            if (len < 0.001) continue

            const nx = (-dz / len) * halfWidth
            const nz = (dx / len) * halfWidth
            const y = 0.025

            const geom = new THREE.BufferGeometry()
            const positions = [
              x1 - nx, y, z1 - nz,
              x1 + nx, y, z1 + nz,
              x2 + nx, y, z2 + nz,
              x2 - nx, y, z2 - nz,
            ]
            const normals = [
              0, 1, 0,
              0, 1, 0,
              0, 1, 0,
              0, 1, 0,
            ]
            const uvs = [
              0, 0,
              1, 0,
              1, 1,
              0, 1,
            ]
            const indices = [0, 1, 2, 0, 2, 3]

            geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
            geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
            geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
            geom.setIndex(indices)
            geometries.push(geom)
          }

          const midCoord = coords[Math.floor(coords.length / 2)]
          if (midCoord) {
            const [mx, mz] = geoTransform.lonLatToWorld(midCoord[0], midCoord[1])
            index.push({
              featureIndex: i,
              feature,
              name,
              type: 'Natural Watercourse / Canal',
              center: [mx, mz],
            })
          }
        }
      }
    }

    if (geometries.length === 0) {
      return { mergedGeometry: null, waterIndex: [] }
    }

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false)
    geometries.forEach((g) => g.dispose())

    return { mergedGeometry: merged, waterIndex: index }
  }, [data, geoTransform])

  const handleClick = useCallback(
    (event) => {
      event.stopPropagation()
      if (!onSelectWater || waterIndex.length === 0) return

      const hitX = event.point.x
      const hitZ = event.point.z

      let closest = null
      let minDistSq = Infinity

      for (const item of waterIndex) {
        const dSq = (item.center[0] - hitX) ** 2 + (item.center[1] - hitZ) ** 2
        if (dSq < minDistSq) {
          minDistSq = dSq
          closest = item
        }
      }

      if (closest && minDistSq < 50000) {
        onSelectWater({
          id: `water_${closest.featureIndex}`,
          type: 'water',
          name: closest.name,
          feature: closest.feature,
          properties: closest.feature.properties || {},
          waterType: closest.type,
          center: closest.center,
        })
      }
    },
    [waterIndex, onSelectWater],
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
        color="#38bdf8"
        roughness={0.15}
        metalness={0.25}
        transparent
        opacity={0.88}
      />
    </mesh>
  )
}

export default memo(WaterLayer)
