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

  // Generate deterministic tree positions based on green spaces polygons
  const treeList = useMemo(() => {
    if (!greenSpacesData?.features?.length || !geoTransform) return []

    const trees = []
    let idCounter = 0

    for (const feature of greenSpacesData.features) {
      const ring = getPolygonRing(feature.geometry?.coordinates)
      if (!ring || ring.length < 3) continue

      // Calculate centroid and boundary samples
      let cx = 0
      let cz = 0
      for (const [lon, lat] of ring) {
        const [x, z] = geoTransform.lonLatToWorld(lon, lat)
        cx += x
        cz += z
      }
      cx /= ring.length
      cz /= ring.length

      // Place centroid tree
      trees.push({
        id: `tree_${idCounter++}`,
        name: `Urban Tree #${idCounter}`,
        baseX: cx,
        baseZ: cz,
        baseScale: 1.0,
      })

      // Sample boundary points along perimeter for lush park perimeter trees
      for (let j = 0; j < ring.length - 1; j += 2) {
        const [x, z] = geoTransform.lonLatToWorld(ring[j][0], ring[j][1])
        const innerX = x * 0.85 + cx * 0.15
        const innerZ = z * 0.85 + cz * 0.15

        trees.push({
          id: `tree_${idCounter++}`,
          name: `Park Tree #${idCounter}`,
          baseX: innerX,
          baseZ: innerZ,
          baseScale: 0.85 + ((idCounter % 5) * 0.1),
        })
      }
    }

    return trees
  }, [greenSpacesData, geoTransform])

  // Combined low-poly tree geometry (Trunk + Foliage cone)
  const treeGeometry = useMemo(() => {
    const trunk = new THREE.CylinderGeometry(0.35, 0.55, 3.5, 6)
    trunk.translate(0, 1.75, 0)

    const foliage = new THREE.ConeGeometry(2.4, 6.0, 7)
    foliage.translate(0, 5.8, 0)

    const foliage2 = new THREE.ConeGeometry(1.8, 4.5, 7)
    foliage2.translate(0, 8.2, 0)

    // Merge geometries
    const trunkPos = trunk.attributes.position
    const foliagePos = foliage.attributes.position
    const foliage2Pos = foliage2.attributes.position

    const totalCount = trunkPos.count + foliagePos.count + foliage2Pos.count
    const posArray = new Float32Array(totalCount * 3)
    const colorArray = new Float32Array(totalCount * 3)

    let offset = 0

    // Trunk vertices (Wood brown: 0.42, 0.28, 0.16)
    for (let i = 0; i < trunkPos.count; i++) {
      posArray[offset * 3] = trunkPos.getX(i)
      posArray[offset * 3 + 1] = trunkPos.getY(i)
      posArray[offset * 3 + 2] = trunkPos.getZ(i)
      colorArray[offset * 3] = 0.42
      colorArray[offset * 3 + 1] = 0.28
      colorArray[offset * 3 + 2] = 0.16
      offset++
    }

    // Foliage vertices (Lush canopy green: 0.24, 0.62, 0.32)
    for (let i = 0; i < foliagePos.count; i++) {
      posArray[offset * 3] = foliagePos.getX(i)
      posArray[offset * 3 + 1] = foliagePos.getY(i)
      posArray[offset * 3 + 2] = foliagePos.getZ(i)
      colorArray[offset * 3] = 0.22
      colorArray[offset * 3 + 1] = 0.58
      colorArray[offset * 3 + 2] = 0.29
      offset++
    }

    // Upper foliage vertices (Lighter green: 0.32, 0.72, 0.38)
    for (let i = 0; i < foliage2Pos.count; i++) {
      posArray[offset * 3] = foliage2Pos.getX(i)
      posArray[offset * 3 + 1] = foliage2Pos.getY(i)
      posArray[offset * 3 + 2] = foliage2Pos.getZ(i)
      colorArray[offset * 3] = 0.3
      colorArray[offset * 3 + 1] = 0.68
      colorArray[offset * 3 + 2] = 0.36
      offset++
    }

    const mergedGeom = new THREE.BufferGeometry()
    mergedGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    mergedGeom.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))
    mergedGeom.computeVertexNormals()

    trunk.dispose()
    foliage.dispose()
    foliage2.dispose()

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
