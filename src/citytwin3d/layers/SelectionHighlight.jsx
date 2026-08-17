import { memo, useMemo } from 'react'
import * as THREE from 'three'
import { getPolygonRing } from '../geoutil'

function SelectionHighlight({ selectedObject, geoTransform }) {
  const highlightGeometry = useMemo(() => {
    if (!selectedObject || !geoTransform) return null

    const { type, feature, height = 8 } = selectedObject

    // 1. Building highlight
    if (type === 'building' && feature?.geometry?.coordinates) {
      const ring = getPolygonRing(feature.geometry.coordinates)
      if (!ring || ring.length < 3) return null

      try {
        const shape = new THREE.Shape()
        const [fx, fz] = geoTransform.lonLatToWorld(ring[0][0], ring[0][1])
        shape.moveTo(fx, -fz)

        for (let j = 1; j < ring.length; j++) {
          const [x, z] = geoTransform.lonLatToWorld(ring[j][0], ring[j][1])
          shape.lineTo(x, -z)
        }

        const geom = new THREE.ExtrudeGeometry(shape, {
          depth: height + 0.15,
          bevelEnabled: false,
        })
        geom.rotateX(-Math.PI / 2)
        return { geom, kind: 'solid' }
      } catch {
        return null
      }
    }

    // 2. Road highlight
    if (type === 'road' && feature?.geometry?.coordinates) {
      const coords = feature.geometry.coordinates
      if (!Array.isArray(coords) || coords.length < 2) return null

      const positions = []
      const indices = []
      let vertexOffset = 0
      const halfWidth = 5.0

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
        const y = 0.12

        positions.push(
          x1 - nx, y, z1 - nz,
          x1 + nx, y, z1 + nz,
          x2 + nx, y, z2 + nz,
          x2 - nx, y, z2 - nz,
        )

        indices.push(
          vertexOffset, vertexOffset + 1, vertexOffset + 2,
          vertexOffset, vertexOffset + 2, vertexOffset + 3,
        )
        vertexOffset += 4
      }

      if (positions.length === 0) return null

      const geom = new THREE.BufferGeometry()
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geom.setIndex(indices)
      geom.computeVertexNormals()
      return { geom, kind: 'road' }
    }

    // 3. Green space highlight
    if (type === 'green_space' && feature?.geometry?.coordinates) {
      const ring = getPolygonRing(feature.geometry.coordinates)
      if (!ring || ring.length < 3) return null

      try {
        const shape = new THREE.Shape()
        const [fx, fz] = geoTransform.lonLatToWorld(ring[0][0], ring[0][1])
        shape.moveTo(fx, -fz)

        for (let j = 1; j < ring.length; j++) {
          const [x, z] = geoTransform.lonLatToWorld(ring[j][0], ring[j][1])
          shape.lineTo(x, -z)
        }

        const geom = new THREE.ShapeGeometry(shape)
        geom.rotateX(-Math.PI / 2)
        geom.translate(0, 0.08, 0)
        return { geom, kind: 'green' }
      } catch {
        return null
      }
    }

    // 4. Landmark beacon ring
    if (type === 'landmark' && selectedObject.center) {
      const geom = new THREE.RingGeometry(8, 14, 32)
      geom.rotateX(-Math.PI / 2)
      geom.translate(selectedObject.center[0], 0.2, selectedObject.center[1])
      return { geom, kind: 'beacon' }
    }

    return null
  }, [selectedObject, geoTransform])

  if (!highlightGeometry) return null

  const { geom, kind } = highlightGeometry

  return (
    <group name="selection-highlight">
      {/* Translucent Glowing Shell */}
      <mesh geometry={geom}>
        <meshBasicMaterial
          color={kind === 'green' ? '#10b981' : kind === 'beacon' ? '#f59e0b' : '#38bdf8'}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Wireframe Outline Overlay */}
      {kind === 'solid' && (
        <mesh geometry={geom}>
          <meshBasicMaterial
            color="#0284c7"
            wireframe
            transparent
            opacity={0.8}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}

export default memo(SelectionHighlight)
