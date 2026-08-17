import { memo, useMemo } from 'react'
import * as THREE from 'three'
import { getPolygonRing } from '../geoutil'

function StudyBoundaryLayer({ data, geoTransform }) {
  const boundaryLine = useMemo(() => {
    if (!data?.features?.length || !geoTransform) return null

    const feature = data.features[0]
    const ring = getPolygonRing(feature?.geometry?.coordinates)
    if (!ring || ring.length < 3) return null

    const points = []
    for (const [lon, lat] of ring) {
      const [x, z] = geoTransform.lonLatToWorld(lon, lat)
      points.push(new THREE.Vector3(x, 0.1, z))
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points)
    return geom
  }, [data, geoTransform])

  if (!boundaryLine) return null

  return (
    <line geometry={boundaryLine}>
      <lineDashedMaterial
        color="#38bdf8"
        dashSize={30}
        gapSize={15}
        linewidth={2}
        transparent
        opacity={0.6}
      />
    </line>
  )
}

export default memo(StudyBoundaryLayer)
