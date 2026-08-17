import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  calculateBuildingHeight,
  getBuildingColors,
  getFootprintArea,
  getPolygonRing,
} from '../geoutil'

function BuildingsLayer({
  data,
  geoTransform,
  onSelectBuilding,
  onMetadataReady,
}) {
  const meshRef = useRef(null)

  const { mergedGeometry, metadata } = useMemo(() => {
    if (!data?.features?.length || !geoTransform) {
      return { mergedGeometry: null, metadata: [] }
    }

    const geometries = []
    const buildingIndex = []
    let totalVertexCount = 0

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

        const height = calculateBuildingHeight(
          feature,
          geoTransform.metersPerDegreeLon,
        )
        const { wallColor, roofColor } = getBuildingColors(feature, height)

        const geom = new THREE.ExtrudeGeometry(shape, {
          depth: height,
          bevelEnabled: false,
        })
        geom.rotateX(-Math.PI / 2)

        const count = geom.attributes.position.count
        const colors = new Float32Array(count * 3)
        const pos = geom.attributes.position

        for (let v = 0; v < count; v++) {
          const y = pos.getY(v)
          const isRoof = y >= height - 0.05
          const color = isRoof ? roofColor : wallColor
          colors[v * 3] = color[0]
          colors[v * 3 + 1] = color[1]
          colors[v * 3 + 2] = color[2]
        }

        geom.setAttribute(
          'color',
          new THREE.BufferAttribute(colors, 3),
        )

        geometries.push(geom)

        const area = getFootprintArea(
          ring,
          geoTransform.metersPerDegreeLon,
        )

        buildingIndex.push({
          index: i,
          osmId: feature.properties?.osm_id,
          name: feature.properties?.name || 'Unnamed Building',
          buildingType: feature.properties?.building || 'yes',
          height,
          levels: feature.properties?.['building:levels'] || Math.max(1, Math.round(height / 3.3)),
          footprintArea: Math.round(area),
          center: [sumX / ring.length, sumZ / ring.length],
          vertexStart: totalVertexCount,
          vertexEnd: totalVertexCount + count,
          vertexCount: count,
          feature,
        })

        totalVertexCount += count
      } catch {
        // Skip malformed geometry safely
      }
    }

    if (geometries.length === 0) {
      return { mergedGeometry: null, metadata: [] }
    }

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false)
    geometries.forEach((g) => g.dispose())

    return { mergedGeometry: merged, metadata: buildingIndex }
  }, [data, geoTransform])

  useEffect(() => {
    if (onMetadataReady && metadata.length > 0) {
      onMetadataReady(metadata)
    }
  }, [onMetadataReady, metadata])

  // Binary search to find clicked building by vertex/face index in O(log N)
  const handleClick = useCallback(
    (event) => {
      event.stopPropagation()
      if (!onSelectBuilding || metadata.length === 0) return

      // faceIndex gives triangle index; each triangle has 3 vertices
      const faceIdx = event.faceIndex
      if (typeof faceIdx !== 'number') return

      const vertexIdx = faceIdx * 3

      let low = 0
      let high = metadata.length - 1
      let found = null

      while (low <= high) {
        const mid = (low + high) >> 1
        const item = metadata[mid]
        if (vertexIdx >= item.vertexStart && vertexIdx < item.vertexEnd) {
          found = item
          break
        }
        if (vertexIdx < item.vertexStart) {
          high = mid - 1
        } else {
          low = mid + 1
        }
      }

      if (found) {
        onSelectBuilding({
          id: `building_${found.osmId || found.index}`,
          type: 'building',
          name: found.name !== 'Unnamed Building' ? found.name : `${found.buildingType.toUpperCase()} Building`,
          feature: found.feature,
          properties: found.feature.properties || {},
          height: found.height,
          levels: found.levels,
          footprintArea: found.footprintArea,
          buildingType: found.buildingType,
          center: found.center,
        })
      }
    },
    [metadata, onSelectBuilding],
  )

  if (!mergedGeometry) return null

  return (
    <mesh
      ref={meshRef}
      geometry={mergedGeometry}
      castShadow
      receiveShadow
      onClick={handleClick}
      cursor="pointer"
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.65}
        metalness={0.08}
      />
    </mesh>
  )
}

export default memo(BuildingsLayer)
