import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getPolygonRing } from '../geoutil'

function TreesLayer({
  greenSpacesData,
  geoTransform,
  cityEdits,
  onSelectTree,
}) {
  const meshRef = useRef(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Generate deterministic tree positions for parks + roadside verges with spatial exclusion rules
  const treeList = useMemo(() => {
    if (!geoTransform) return []

    const trees = []
    let idCounter = 0

    // 1. Generate trees inside green space polygons (parks & gardens)
    if (greenSpacesData?.features?.length) {
      for (const feature of greenSpacesData.features) {
        const ring = getPolygonRing(feature.geometry?.coordinates)
        if (!ring || ring.length < 3) continue

        let cx = 0
        let cz = 0
        for (const [lon, lat] of ring) {
          const [x, z] = geoTransform.lonLatToWorld(lon, lat)
          cx += x
          cz += z
        }
        cx /= ring.length
        cz /= ring.length

        // Centroid tree
        trees.push({
          id: `tree_${idCounter++}`,
          name: `Park Neem Tree #${idCounter}`,
          baseX: cx,
          baseZ: cz,
          baseScale: 1.1,
        })

        // Inner perimeter trees
        for (let j = 0; j < ring.length - 1; j += 1) {
          const [x, z] = geoTransform.lonLatToWorld(ring[j][0], ring[j][1])
          const innerX = x * 0.78 + cx * 0.22
          const innerZ = z * 0.78 + cz * 0.22

          trees.push({
            id: `tree_${idCounter++}`,
            name: `Park Canopy Tree #${idCounter}`,
            baseX: innerX,
            baseZ: innerZ,
            baseScale: 0.85 + ((idCounter % 5) * 0.08),
          })
        }
      }
    }

    // 2. Generate roadside verge & median trees along major corridors
    const corridorLength = 950
    const startX = -650
    for (let i = 0; i < corridorLength; i += 28) {
      const x = startX + i
      // Skip junction center box [-200..-40] to prevent intersection clutter
      if (x > -200 && x < -40) continue

      // North Verge (Z = -12m)
      trees.push({
        id: `tree_${idCounter++}`,
        name: `Roadside Median Tree #${idCounter}`,
        baseX: x,
        baseZ: -12,
        baseScale: 0.9,
      })

      // South Verge (Z = 48m)
      trees.push({
        id: `tree_${idCounter++}`,
        name: `Roadside Buffer Tree #${idCounter}`,
        baseX: x + 14,
        baseZ: 48,
        baseScale: 0.95,
      })
    }

    return trees
  }, [greenSpacesData, geoTransform])

  // Multi-layer low-poly tree geometry (Wood Trunk + 3 Staggered Foliage Tiers)
  const treeGeometry = useMemo(() => {
    const trunk = new THREE.CylinderGeometry(0.35, 0.65, 3.8, 8)
    trunk.translate(0, 1.9, 0)

    const baseFoliage = new THREE.ConeGeometry(2.8, 5.2, 8)
    baseFoliage.translate(0, 5.2, 0)

    const midFoliage = new THREE.ConeGeometry(2.2, 4.2, 8)
    midFoliage.translate(0, 7.5, 0)

    const topFoliage = new THREE.ConeGeometry(1.5, 3.2, 8)
    topFoliage.translate(0, 9.5, 0)

    const trunkPos = trunk.attributes.position
    const basePos = baseFoliage.attributes.position
    const midPos = midFoliage.attributes.position
    const topPos = topFoliage.attributes.position

    const totalCount = trunkPos.count + basePos.count + midPos.count + topPos.count
    const posArray = new Float32Array(totalCount * 3)
    const colorArray = new Float32Array(totalCount * 3)

    let offset = 0

    // Trunk (Wood brown: 0.42, 0.28, 0.16)
    for (let i = 0; i < trunkPos.count; i++) {
      posArray[offset * 3] = trunkPos.getX(i)
      posArray[offset * 3 + 1] = trunkPos.getY(i)
      posArray[offset * 3 + 2] = trunkPos.getZ(i)
      colorArray[offset * 3] = 0.42
      colorArray[offset * 3 + 1] = 0.28
      colorArray[offset * 3 + 2] = 0.16
      offset++
    }

    // Base Foliage (Lush deep green)
    for (let i = 0; i < basePos.count; i++) {
      posArray[offset * 3] = basePos.getX(i)
      posArray[offset * 3 + 1] = basePos.getY(i)
      posArray[offset * 3 + 2] = basePos.getZ(i)
      colorArray[offset * 3] = 0.18
      colorArray[offset * 3 + 1] = 0.52
      colorArray[offset * 3 + 2] = 0.24
      offset++
    }

    // Mid Foliage (Lighter canopy green)
    for (let i = 0; i < midPos.count; i++) {
      posArray[offset * 3] = midPos.getX(i)
      posArray[offset * 3 + 1] = midPos.getY(i)
      posArray[offset * 3 + 2] = midPos.getZ(i)
      colorArray[offset * 3] = 0.26
      colorArray[offset * 3 + 1] = 0.62
      colorArray[offset * 3 + 2] = 0.32
      offset++
    }

    // Top Foliage (Vibrant crown green)
    for (let i = 0; i < topPos.count; i++) {
      posArray[offset * 3] = topPos.getX(i)
      posArray[offset * 3 + 1] = topPos.getY(i)
      posArray[offset * 3 + 2] = topPos.getZ(i)
      colorArray[offset * 3] = 0.34
      colorArray[offset * 3 + 1] = 0.72
      colorArray[offset * 3 + 2] = 0.38
      offset++
    }

    const mergedGeom = new THREE.BufferGeometry()
    mergedGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    mergedGeom.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))
    mergedGeom.computeVertexNormals()

    trunk.dispose()
    baseFoliage.dispose()
    midFoliage.dispose()
    topFoliage.dispose()

    return mergedGeom
  }, [])

  // Update InstancedMesh matrices when tree positions or edits change
  useEffect(() => {
    if (!meshRef.current || treeList.length === 0) return

    const edits = cityEdits?.trees || {}

    for (let i = 0; i < treeList.length; i++) {
      const tree = treeList[i]
      const objEdit = edits[tree.id]

      if (objEdit?.hidden) {
        dummy.position.set(0, -9999, 0)
        dummy.scale.set(0.0001, 0.0001, 0.0001)
      } else {
        const x = tree.baseX + (objEdit?.offsetX || 0)
        const y = 0 + (objEdit?.offsetY || 0)
        const z = tree.baseZ + (objEdit?.offsetZ || 0)
        const rotY = objEdit?.rotationY || 0
        const scale = tree.baseScale * (objEdit?.scale || 1.0)

        dummy.position.set(x, y, z)
        dummy.rotation.set(0, rotY, 0)
        dummy.scale.set(scale, scale, scale)
      }

      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  }, [treeList, cityEdits, dummy])

  const handleClick = useCallback(
    (event) => {
      event.stopPropagation()
      if (!onSelectTree || typeof event.instanceId !== 'number') return

      const tree = treeList[event.instanceId]
      if (!tree) return

      const edits = cityEdits?.trees?.[tree.id] || {}

      onSelectTree({
        id: tree.id,
        type: 'tree',
        name: tree.name,
        center: [tree.baseX + (edits.offsetX || 0), tree.baseZ + (edits.offsetZ || 0)],
        scale: edits.scale || tree.baseScale,
        rotationY: edits.rotationY || 0,
        hidden: Boolean(edits.hidden),
        properties: {
          category: 'Urban Vegetation / Tree',
          species: 'Native Neem / Ashoka Tree',
        },
      })
    },
    [treeList, cityEdits, onSelectTree],
  )

  if (treeList.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[treeGeometry, null, treeList.length]}
      castShadow
      receiveShadow
      onClick={handleClick}
      cursor="pointer"
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.82}
        metalness={0.06}
      />
    </instancedMesh>
  )
}

export default memo(TreesLayer)
