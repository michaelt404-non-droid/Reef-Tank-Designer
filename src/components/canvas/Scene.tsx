import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
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
import { useRockStore } from '../../stores/rockStore'
import { useCoralStore } from '../../stores/coralStore'
import { useFishStore } from '../../stores/fishStore'
import { useEquipmentStore } from '../../stores/equipmentStore'
import { useLightStore } from '../../stores/lightStore'
import { useUIStore } from '../../stores/uiStore'

function SceneContent() {
  const selectRock = useRockStore((state) => state.selectRock)
  const selectCoral = useCoralStore((state) => state.selectCoral)
  const selectFish = useFishStore((state) => state.selectFish)
  const selectEquipment = useEquipmentStore((state) => state.selectEquipment)
  const selectLight = useLightStore((state) => state.selectLight)
  const cameraLocked = useUIStore((state) => state.cameraLocked)

  const handleBackgroundClick = () => {
    selectRock(null)
    selectCoral(null)
    selectFish(null)
    selectEquipment(null)
    selectLight(null)
  }

  return (
    <>
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

      {/* Simple grid */}
      <gridHelper args={[20, 20, '#4a5568', '#2d3748']} position={[0, 0, 0]} />

      {/* Orbit controls - disabled when camera is locked */}
      <OrbitControls
        enabled={!cameraLocked}
        minDistance={2}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    </>
  )
}

export function Scene() {
  return (
    <Canvas shadows camera={{ position: [5, 4, 5], fov: 50 }}>
      <SceneContent />
    </Canvas>
  )
}
