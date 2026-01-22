import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '../../stores/simulationStore'
import type { SimulationState } from '../../stores/simulationStore'
import { useFishStore } from '../../stores/fishStore'
import type { PlacedFish } from '../../stores/fishStore'

// Food particle colors by type
const FOOD_COLORS = {
  pellet: '#8B4513',  // Brown
  flake: '#FFD700',   // Gold
  frozen: '#FF6B6B',  // Reddish (like brine shrimp)
}

// Food particle sizes by type
const FOOD_SIZES = {
  pellet: 0.03,
  flake: 0.025,
  frozen: 0.035,
}

interface FoodParticleMeshProps {
  particle: {
    id: string
    position: [number, number, number]
    type: 'pellet' | 'flake' | 'frozen'
    nutrition: number
  }
}

function FoodParticleMesh({ particle }: FoodParticleMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const removeFoodParticle = useSimulationStore((state: SimulationState) => state.removeFoodParticle)
  const feedFish = useFishStore((state: { feedFish: (id: string, nutrition: number, time: number) => void }) => state.feedFish)
  const findHungriestFishNear = useFishStore((state: { findHungriestFishNear: (pos: [number, number, number], dist: number) => PlacedFish | null }) => state.findHungriestFishNear)
  const simulationTime = useSimulationStore((state: SimulationState) => state.simulationTime)
  const isRunning = useSimulationStore((state: SimulationState) => state.isRunning)
  const mode = useSimulationStore((state: SimulationState) => state.mode)

  const size = FOOD_SIZES[particle.type]
  const color = FOOD_COLORS[particle.type]

  // Create geometry based on food type
  const geometry = useMemo(() => {
    switch (particle.type) {
      case 'pellet':
        return new THREE.SphereGeometry(size, 8, 8)
      case 'flake':
        // Flat irregular shape for flakes
        const flakeGeo = new THREE.CircleGeometry(size, 6)
        flakeGeo.rotateX(-Math.PI / 4) // Tilt slightly
        return flakeGeo
      case 'frozen':
        // Slightly larger, irregular blob
        return new THREE.IcosahedronGeometry(size, 0)
      default:
        return new THREE.SphereGeometry(size, 8, 8)
    }
  }, [particle.type, size])

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    metalness: 0,
  }), [color])

  // Check for nearby hungry fish
  useFrame(() => {
    if (!meshRef.current || !isRunning || mode !== 'simulation') return

    // Check if a hungry fish is close enough to eat this particle
    const hungryFish = findHungriestFishNear(particle.position, 0.3) // 0.3 units detection radius

    if (hungryFish) {
      // Fish eats the food!
      feedFish(hungryFish.id, particle.nutrition, simulationTime)
      removeFoodParticle(particle.id)
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={particle.position}
      geometry={geometry}
      material={material}
    />
  )
}

export function FoodParticles() {
  const foodParticles = useSimulationStore((state: SimulationState) => state.foodParticles)
  const mode = useSimulationStore((state: SimulationState) => state.mode)

  // Only render in simulation mode
  if (mode !== 'simulation') return null

  return (
    <group>
      {foodParticles.map((particle) => (
        <FoodParticleMesh key={particle.id} particle={particle} />
      ))}
    </group>
  )
}
