import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useSimulationStore } from '../../stores/simulationStore'
import { useTankStore } from '../../stores/tankStore'

const TANK_SCALE = 0.1

// Stable seed for texture generation
const ALGAE_SEED = 12345

// Seeded random number generator for deterministic patches
function seededRandom(seed: number): () => number {
  let currentSeed = seed
  return () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    return currentSeed / 233280
  }
}

export function AlgaeOverlay() {
  const mode = useSimulationStore((state) => state.mode)
  const algaeLevel = useSimulationStore((state) => state.algaeLevel)
  const { dimensions } = useTankStore()

  // Calculate tank dimensions - always call hooks before any returns
  const size = useMemo(() => ({
    x: dimensions.length * TANK_SCALE,
    y: dimensions.height * TANK_SCALE,
    z: dimensions.width * TANK_SCALE,
  }), [dimensions])

  // Algae color and opacity based on level
  const algaeColor = useMemo(() => {
    // Start greenish-brown, get darker/greener as it grows
    const r = 0.2 - algaeLevel * 0.1
    const g = 0.4 + algaeLevel * 0.2
    const b = 0.1
    return new THREE.Color(r, g, b)
  }, [algaeLevel])

  // Opacity increases with algae level (max 0.6 for visibility)
  const opacity = useMemo(() => Math.min(0.6, algaeLevel * 0.8), [algaeLevel])

  // Create a patchy texture for organic look using seeded random
  const algaeTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Use seeded random for deterministic patches
    const random = seededRandom(ALGAE_SEED)

    // Base transparent
    ctx.fillStyle = 'rgba(0,0,0,0)'
    ctx.fillRect(0, 0, 128, 128)

    // Add random patches of algae
    const patchCount = Math.floor(20 + algaeLevel * 80)
    for (let i = 0; i < patchCount; i++) {
      const x = random() * 128
      const y = random() * 128
      const radius = 3 + random() * 15 * algaeLevel
      const alpha = 0.3 + random() * 0.5

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, `rgba(60, 120, 40, ${alpha})`)
      gradient.addColorStop(0.5, `rgba(40, 90, 30, ${alpha * 0.7})`)
      gradient.addColorStop(1, 'rgba(30, 70, 20, 0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)
    return texture
  }, [algaeLevel])

  // Create algae material
  const algaeMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: algaeColor,
    transparent: true,
    opacity: opacity,
    side: THREE.DoubleSide,
    map: algaeTexture,
    blending: THREE.NormalBlending,
    depthWrite: false,
  }), [algaeColor, opacity, algaeTexture])

  // Dispose texture and material on unmount or when they change
  useEffect(() => {
    return () => {
      algaeTexture?.dispose()
      algaeMaterial.dispose()
    }
  }, [algaeTexture, algaeMaterial])

  // Only render in simulation mode with algae present
  if (mode !== 'simulation' || algaeLevel < 0.05) return null

  // Small offset to prevent z-fighting with glass
  const offset = 0.01

  return (
    <group position={[0, size.y / 2, 0]}>
      {/* Front glass algae */}
      <mesh position={[0, 0, size.z / 2 - offset]} material={algaeMaterial}>
        <planeGeometry args={[size.x - 0.1, size.y - 0.1]} />
      </mesh>

      {/* Back glass algae */}
      <mesh position={[0, 0, -size.z / 2 + offset]} rotation={[0, Math.PI, 0]} material={algaeMaterial}>
        <planeGeometry args={[size.x - 0.1, size.y - 0.1]} />
      </mesh>

      {/* Left glass algae */}
      <mesh position={[-size.x / 2 + offset, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={algaeMaterial}>
        <planeGeometry args={[size.z - 0.1, size.y - 0.1]} />
      </mesh>

      {/* Right glass algae */}
      <mesh position={[size.x / 2 - offset, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={algaeMaterial}>
        <planeGeometry args={[size.z - 0.1, size.y - 0.1]} />
      </mesh>
    </group>
  )
}
