import { memo, useCallback, useMemo } from 'react'
import * as THREE from 'three'

function PoiLayer({ data, geoTransform, onSelectPoi }) {
  const { poiMeshGeometry, poiItems } = useMemo(() => {
    if (!data?.features?.length || !geoTransform) {
      return { poiMeshGeometry: null, poiItems: [] }
    }

    const items = []
    const positions = []

    for (let i = 0; i < data.features.length; i++) {
      const feature = data.features[i]
      const coords = feature.geometry?.coordinates
      if (!Array.isArray(coords) || coords.length < 2) continue

      const [x, z] = geoTransform.lonLatToWorld(coords[0], coords[1])
      const y = 3.0

      positions.push(x, y, z)

      items.push({
        index: i,
        name: feature.properties?.name || 'Local Point of Interest',
        category:
          feature.properties?.amenity ||
          feature.properties?.shop ||
          feature.properties?.tourism ||
          'Community POI',
        center: [x, z],
        feature,
      })
    }

    if (positions.length === 0) {
      return { poiMeshGeometry: null, poiItems: [] }
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

    return { poiMeshGeometry: geom, poiItems: items }
  }, [data, geoTransform])

  const handleClick = useCallback(
    (event) => {
      event.stopPropagation()
      if (!onSelectPoi || poiItems.length === 0) return

      const hitX = event.point.x
      const hitZ = event.point.z

      let closest = null
      let minDistSq = Infinity

      for (const item of poiItems) {
        const dSq = (item.center[0] - hitX) ** 2 + (item.center[1] - hitZ) ** 2
        if (dSq < minDistSq) {
          minDistSq = dSq
          closest = item
        }
      }

      if (closest && minDistSq < 600) {
        onSelectPoi({
          id: `poi_${closest.feature.properties?.id || closest.index}`,
          type: 'poi',
          name: closest.name,
          category: closest.category,
          properties: closest.feature.properties || {},
          feature: closest.feature,
          center: closest.center,
        })
      }
    },
    [poiItems, onSelectPoi],
  )

  if (!poiMeshGeometry) return null

  return (
    <points
      geometry={poiMeshGeometry}
      onClick={handleClick}
      cursor="pointer"
    >
      <pointsMaterial
        color="#38bdf8"
        size={6}
        sizeAttenuation={false}
        transparent
        opacity={0.75}
      />
    </points>
  )
}

export default memo(PoiLayer)
