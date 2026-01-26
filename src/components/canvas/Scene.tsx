import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
// Post-processing disabled for stability
// import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Tank } from './Tank'
import { Rocks } from './Rocks'
import { Corals } from './Corals'
import { Fish } from './Fish'
import { Equipment } from './Equipment'
import { Lights } from './Lights'
import { PAROverlay } from './PAROverlay'
import { SimulationController } from './SimulationController'
import { FoodParticles } from './FoodParticles'
import { AlgaeOverlay } from './AlgaeOverlay'
import { DayNightLighting } from './DayNightLighting'
import { CleanupCrew } from './CleanupCrew'
import { useRockStore } from '../../stores/rockStore'
import { useCoralStore } from '../../stores/coralStore'
import { useFishStore } from '../../stores/fishStore'
import { useEquipmentStore } from '../../stores/equipmentStore'
import { useLightStore } from '../../stores/lightStore'
import { useUIStore } from '../../stores/uiStore'
import { useTankStore } from '../../stores/tankStore'
import { useMemo, useState, useEffect } from 'react'
import { ACESFilmicToneMapping } from 'three'

// Convert inches to 3D units (1 inch = 0.1 units for nice scale)
const SCALE = 0.1

function SceneContent() {
  const selectRock = useRockStore((state) => state.selectRock)
  const selectCoral = useCoralStore((state) => state.selectCoral)
  const selectFish = useFishStore((state) => state.selectFish)
  const selectEquipment = useEquipmentStore((state) => state.selectEquipment)
  const selectLight = useLightStore((state) => state.selectLight)
  const cameraLocked = useUIStore((state) => state.cameraLocked)

  // Get tank dimensions and calculate size
  const { dimensions } = useTankStore()
  const size = useMemo(() => ({
    x: dimensions.length * SCALE,
    y: dimensions.height * SCALE,
    z: dimensions.width * SCALE,
  }), [dimensions])

  // State for camera panning
  const [panTarget, setPanTarget] = useState<[number, number, number]>([0, size.y / 2, 0])

  // Update pan target's Y when tank height changes
  useEffect(() => {
    setPanTarget(prev => [prev[0], size.y / 2, prev[2]])
  }, [size.y])

  // Keyboard listener for panning
  useEffect(() => {
    console.log("Adding keydown listener for panning.");
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log(`Key pressed: ${event.key}, Shift: ${event.shiftKey}`);
      if (event.shiftKey) {
        const panSpeed = 0.1
        const maxPan = size.x / 2

        if (event.key === 'ArrowLeft') {
          console.log("Panning left");
          setPanTarget(prev => [Math.max(-maxPan, prev[0] - panSpeed), prev[1], prev[2]])
        } else if (event.key === 'ArrowRight') {
          console.log("Panning right");
          setPanTarget(prev => [Math.min(maxPan, prev[0] + panSpeed), prev[1], prev[2]])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [size.x])


  // Calculate initial camera position
  const maxDim = Math.max(size.x, size.y, size.z)

  const handleBackgroundClick = () => {
    selectRock(null)
    selectCoral(null)
    selectFish(null)
    selectEquipment(null)
    selectLight(null)
  }

  return (
    <>
      {/* Environment for reflections - using a neutral indoor preset */}
      <Environment preset="apartment" background={false} />


      {/* Contact shadows under the tank */}
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.5}
        scale={20}
        blur={2.5}
        far={4}
        resolution={512}
      />

      {/* Dynamic day/night lighting */}
      <DayNightLighting />

      {/* The tank */}
      <Tank />

      {/* Rocks */}
      <Rocks />

      {/* Corals */}
      <Corals />

      {/* Fish */}
      <Fish />

      {/* Equipment */}
      <Equipment />

      {/* Light fixtures */}
      <Lights />

      {/* Clean-up crew */}
      <CleanupCrew />

      {/* PAR heatmap overlay */}
      <PAROverlay />

      {/* Food particles */}
      <FoodParticles />

      {/* Algae overlay on tank glass */}
      <AlgaeOverlay />

      {/* Simulation tick controller (no visual) */}
      <SimulationController />


      {/* Click to deselect */}
      <mesh
        position={[0, 0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleBackgroundClick}
      >
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Subtle grid - less prominent */}
      <gridHelper args={[20, 20, '#3a4a5a', '#2a3a4a']} position={[0, 0, 0]} />

      {/* Orbit controls - disabled when camera is locked */}
      <OrbitControls
        enabled={!cameraLocked}
        minDistance={maxDim * 0.5}
        maxDistance={maxDim * 3.0}
        maxPolarAngle={Math.PI / 2 - 0.1}
        target={panTarget}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  )
}

export function Scene() {
  const { dimensions } = useTankStore()
  const size = useMemo(() => ({
    x: dimensions.length * SCALE,
    y: dimensions.height * SCALE,
    z: dimensions.width * SCALE,
  }), [dimensions])
  const maxDim = Math.max(size.x, size.y, size.z)
  const initialCameraPosition: [number, number, number] = [maxDim * 0.75, maxDim * 0.75, maxDim * 0.75]

  return (
    <Canvas
      shadows
      camera={{ position: initialCameraPosition, fov: 50 }}
      gl={{
        antialias: true,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
    >
      <SceneContent />
    </Canvas>
  )
}
