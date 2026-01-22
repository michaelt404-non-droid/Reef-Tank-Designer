import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useLightStore } from '../../stores/lightStore'

interface LightFixtureProps {
  light: {
    id: string
    fixture: {
      id: string
      model: string
      coverage: { length: number; width: number }
    }
    position: [number, number, number]
    intensity: number
    enabled: boolean
  }
}

export function LightFixtureMesh({ light }: LightFixtureProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const spotlightRef = useRef<THREE.SpotLight>(null)

  const selectedLightId = useLightStore((state) => state.selectedLightId)
  const selectLight = useLightStore((state) => state.selectLight)

  const isSelected = selectedLightId === light.id

  // Light housing dimensions (simplified box)
  const housingSize = useMemo(() => {
    const length = light.fixture.coverage.length * 0.1 * 0.3 // Fixture is smaller than coverage
    const width = light.fixture.coverage.width * 0.1 * 0.3
    return { x: Math.max(length, 0.3), y: 0.1, z: Math.max(width, 0.3) }
  }, [light.fixture.coverage])

  // Material for housing
  const housingMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: isSelected ? '#0ea5e9' : '#333333',
    metalness: 0.8,
    roughness: 0.2,
  }), [isSelected])

  // Glow material for LED panel
  const ledMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: light.enabled ? '#4da6ff' : '#222222',
    transparent: true,
    opacity: light.enabled ? 0.8 + (light.intensity / 100) * 0.2 : 0.3,
  }), [light.enabled, light.intensity])

  // Animate spotlight intensity
  useFrame(() => {
    if (spotlightRef.current) {
      spotlightRef.current.intensity = light.enabled ? (light.intensity / 100) * 2 : 0
    }
  })

  return (
    <group position={light.position}>
      {/* Light housing */}
      <mesh
        ref={meshRef}
        material={housingMaterial}
        onClick={(e) => {
          e.stopPropagation()
          selectLight(light.id)
        }}
      >
        <boxGeometry args={[housingSize.x, housingSize.y, housingSize.z]} />
      </mesh>

      {/* LED panel (bottom of housing) */}
      <mesh
        position={[0, -housingSize.y / 2 - 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={ledMaterial}
      >
        <planeGeometry args={[housingSize.x * 0.9, housingSize.z * 0.9]} />
      </mesh>

      {/* Spotlight for visual effect */}
      {light.enabled && (
        <spotLight
          ref={spotlightRef}
          position={[0, -0.1, 0]}
          angle={Math.PI / 4}
          penumbra={0.5}
          intensity={(light.intensity / 100) * 2}
          color="#4da6ff"
          castShadow={false}
          target-position={[light.position[0], 0, light.position[2]]}
        />
      )}

      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[0, housingSize.y / 2 + 0.05, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#0ea5e9" />
        </mesh>
      )}
    </group>
  )
}
