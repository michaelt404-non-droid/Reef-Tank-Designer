import { useMemo, useCallback } from 'react'
import { useTankStore } from '../../stores/tankStore'
import { useSimulationStore } from '../../stores/simulationStore'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'

// Convert inches to 3D units (1 inch = 0.1 units for nice scale)
const SCALE = 0.1

export function Tank() {
  const { dimensions } = useTankStore()
  const mode = useSimulationStore((state) => state.mode)
  const feedManually = useSimulationStore((state) => state.feedManually)

  // Convert dimensions to 3D scale
  const size = useMemo(() => ({
    x: dimensions.length * SCALE,
    y: dimensions.height * SCALE,
    z: dimensions.width * SCALE,
  }), [dimensions])

  // Click-to-feed handler for water surface
  const handleWaterSurfaceClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    if (mode !== 'simulation') return
    event.stopPropagation()

    // Get click position on water surface
    const point = event.point
    // Feed at the clicked position
    feedManually([point.x, point.y, point.z], 5)
  }, [mode, feedManually])

  // Glass thickness
  const glassThickness = 0.05

  // Create glass material
  const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.3,
    roughness: 0.05,
    metalness: 0,
    side: THREE.DoubleSide,
  }), [])

  // Water material
  const waterMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x006994,
    transparent: true,
    opacity: 0.6,
    roughness: 0.1,
    metalness: 0,
  }), [])

  // Sand material
  const sandMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xf4e4bc,
    roughness: 0.9,
  }), [])

  return (
    <group position={[0, size.y / 2, 0]}>
      {/* Back panel */}
      <mesh position={[0, 0, -size.z / 2]} material={glassMaterial}>
        <boxGeometry args={[size.x, size.y, glassThickness]} />
      </mesh>

      {/* Front panel */}
      <mesh position={[0, 0, size.z / 2]} material={glassMaterial}>
        <boxGeometry args={[size.x, size.y, glassThickness]} />
      </mesh>

      {/* Left panel */}
      <mesh position={[-size.x / 2, 0, 0]} material={glassMaterial}>
        <boxGeometry args={[glassThickness, size.y, size.z]} />
      </mesh>

      {/* Right panel */}
      <mesh position={[size.x / 2, 0, 0]} material={glassMaterial}>
        <boxGeometry args={[glassThickness, size.y, size.z]} />
      </mesh>

      {/* Bottom panel */}
      <mesh position={[0, -size.y / 2, 0]} material={glassMaterial}>
        <boxGeometry args={[size.x, glassThickness, size.z]} />
      </mesh>

      {/* Water (slightly smaller than tank interior) */}
      <mesh position={[0, -0.05, 0]} material={waterMaterial}>
        <boxGeometry args={[size.x - 0.1, size.y - 0.2, size.z - 0.1]} />
      </mesh>

      {/* Sand bed */}
      <mesh position={[0, -size.y / 2 + 0.1, 0]} material={sandMaterial}>
        <boxGeometry args={[size.x - 0.1, 0.15, size.z - 0.1]} />
      </mesh>

      {/* Clickable water surface for feeding (only active in simulation mode) */}
      {mode === 'simulation' && (
        <mesh
          position={[0, size.y / 2 - 0.15, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={handleWaterSurfaceClick}
        >
          <planeGeometry args={[size.x - 0.1, size.z - 0.1]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
    </group>
  )
}
