import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const MIN_DISTANCE = 35
const MAX_DISTANCE = 3500
const MIN_HEIGHT = 15
const MAX_HEIGHT = 2800

export default function CameraController({
  controlsRef,
  presetView,
  onPresetApplied,
  focusTarget,
  onFocusApplied,
}) {
  const { camera, gl } = useThree()

  // Target positions for smooth lerp transitions
  const targetCamPos = useRef(new THREE.Vector3().copy(camera.position))
  const targetLookAt = useRef(new THREE.Vector3(-140, 0, 20))
  const isAnimating = useRef(false)
  const isUserOrbiting = useRef(false)

  // Raycaster & helpers
  const raycaster = useRef(new THREE.Raycaster())
  const mouseNdc = useRef(new THREE.Vector2())
  const hitPoint = useRef(new THREE.Vector3())

  // Keep targetCamPos and targetLookAt in sync when user orbits or pans
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const handleStart = () => {
      isUserOrbiting.current = true
      isAnimating.current = false
    }

    const handleEnd = () => {
      isUserOrbiting.current = false
      if (controls) {
        targetCamPos.current.copy(camera.position)
        targetLookAt.current.copy(controls.target)
      }
    }

    controls.addEventListener('start', handleStart)
    controls.addEventListener('end', handleEnd)

    return () => {
      controls.removeEventListener('start', handleStart)
      controls.removeEventListener('end', handleEnd)
    }
  }, [camera, controlsRef])

  // Handle Preset Transitions (Reset, Isometric, Top-Down)
  useEffect(() => {
    if (!presetView) return

    targetCamPos.current.set(...presetView.position)
    targetLookAt.current.set(...(presetView.target || [0, 0, 0]))
    isAnimating.current = true
    onPresetApplied?.()
  }, [presetView, onPresetApplied])

  // Handle Double-Click Focus
  useEffect(() => {
    if (!focusTarget) return

    const [tx, tz] = focusTarget
    targetLookAt.current.set(tx, 0, tz)

    // Move camera closer maintaining direction
    const currentOffset = new THREE.Vector3().subVectors(camera.position, controlsRef.current?.target || new THREE.Vector3(0, 0, 0))
    const currentDist = currentOffset.length()
    const targetDist = Math.max(160, Math.min(currentDist * 0.45, 380))

    currentOffset.setLength(targetDist)
    currentOffset.y = Math.max(120, currentOffset.y) // Maintain comfortable oblique angle
    targetCamPos.current.set(tx + currentOffset.x, currentOffset.y, tz + currentOffset.z)

    isAnimating.current = true
    onFocusApplied?.()
  }, [focusTarget, camera, controlsRef, onFocusApplied])

  // Wheel Event: Zoom toward mouse cursor (Google Maps / GIS style)
  useEffect(() => {
    const domElement = gl.domElement

    const handleWheel = (e) => {
      e.preventDefault()
      e.stopPropagation()

      const rect = domElement.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      mouseNdc.current.set(x, y)

      raycaster.current.setFromCamera(mouseNdc.current, camera)

      const hasHit = raycaster.current.ray.intersectPlane(GROUND_PLANE, hitPoint.current)
      const controls = controlsRef.current
      if (!controls) return

      const currentTarget = isAnimating.current ? targetLookAt.current : controls.target
      const currentPos = isAnimating.current ? targetCamPos.current : camera.position

      // If cursor is off-ground or looking at horizon, fallback anchor is current target
      const anchor = hasHit ? hitPoint.current : currentTarget

      // Smooth zoom factor based on deltaY
      const delta = Math.max(-1, Math.min(1, e.deltaY))
      const zoomFactor = delta < 0 ? 0.82 : 1.22

      // Calculate candidate new positions
      const newPos = new THREE.Vector3()
        .copy(anchor)
        .addScaledVector(new THREE.Vector3().subVectors(currentPos, anchor), zoomFactor)

      const newTarget = new THREE.Vector3()
        .copy(anchor)
        .addScaledVector(new THREE.Vector3().subVectors(currentTarget, anchor), zoomFactor)

      const newDist = newPos.distanceTo(newTarget)
      if (newDist < MIN_DISTANCE || newDist > MAX_DISTANCE) return
      if (newPos.y < MIN_HEIGHT || newPos.y > MAX_HEIGHT) return

      targetCamPos.current.copy(newPos)
      targetLookAt.current.copy(newTarget)
      isAnimating.current = true
    }

    const handleDblClick = (e) => {
      const rect = domElement.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      mouseNdc.current.set(x, y)

      raycaster.current.setFromCamera(mouseNdc.current, camera)
      if (raycaster.current.ray.intersectPlane(GROUND_PLANE, hitPoint.current)) {
        const hit = hitPoint.current
        targetLookAt.current.set(hit.x, 0, hit.z)

        const currentOffset = new THREE.Vector3().subVectors(camera.position, controlsRef.current?.target || new THREE.Vector3(0, 0, 0))
        currentOffset.setLength(Math.max(160, currentOffset.length() * 0.5))
        currentOffset.y = Math.max(120, currentOffset.y)

        targetCamPos.current.set(hit.x + currentOffset.x, currentOffset.y, hit.z + currentOffset.z)
        isAnimating.current = true
      }
    }

    domElement.addEventListener('wheel', handleWheel, { passive: false })
    domElement.addEventListener('dblclick', handleDblClick)

    return () => {
      domElement.removeEventListener('wheel', handleWheel)
      domElement.removeEventListener('dblclick', handleDblClick)
    }
  }, [camera, gl, controlsRef])

  // Smooth lerp frame loop
  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!controls) return

    if (isAnimating.current && !isUserOrbiting.current) {
      // Exponential decay smoothing independent of frame-rate
      const lerpFactor = 1 - Math.exp(-12 * delta)

      camera.position.lerp(targetCamPos.current, lerpFactor)
      controls.target.lerp(targetLookAt.current, lerpFactor)
      controls.update()

      // Stop animating when close enough to target
      if (
        camera.position.distanceTo(targetCamPos.current) < 0.3 &&
        controls.target.distanceTo(targetLookAt.current) < 0.3
      ) {
        camera.position.copy(targetCamPos.current)
        controls.target.copy(targetLookAt.current)
        controls.update()
        isAnimating.current = false
      }
    } else if (controls.enableDamping) {
      controls.update()
    }
  })

  return null
}
