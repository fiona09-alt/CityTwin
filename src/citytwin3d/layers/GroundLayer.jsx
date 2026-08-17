import { memo } from 'react'

function GroundLayer() {
  return (
    <group name="ground-layer">
      {/* Base study area ground plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        receiveShadow
      >
        <planeGeometry args={[4400, 3600]} />
        <meshStandardMaterial
          color="#edf2f4"
          roughness={0.92}
          metalness={0.05}
        />
      </mesh>

      {/* Subtle study area grid reference */}
      <gridHelper
        args={[4000, 50, '#cbd5e1', '#e2e8f0']}
        position={[0, 0.01, 0]}
      />
    </group>
  )
}

export default memo(GroundLayer)
