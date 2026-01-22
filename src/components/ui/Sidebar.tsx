import { TankControls } from './TankControls'
import { RockLibrary } from './RockLibrary'
import { RockControls } from './RockControls'
import { LightLibrary } from './LightLibrary'
import { LightsOverview } from './LightsOverview'
import { LightControls } from './LightControls'
import { CoralLibrary } from './CoralLibrary'
import { CoralsOverview } from './CoralsOverview'
import { CoralControls } from './CoralControls'
import { FishLibrary } from './FishLibrary'
import { FishControls } from './FishControls'
import { FishCompatibility } from './FishCompatibility'
import { EquipmentLibrary } from './EquipmentLibrary'
import { EquipmentControls } from './EquipmentControls'
import { AmbientSound } from './AmbientSound'
import { SaveLoadControls } from './SaveLoadControls'
import { SimulationPanel } from './SimulationPanel'
import { useSimulationStore } from '../../stores/simulationStore'

export function Sidebar() {
  const mode = useSimulationStore((state) => state.mode)
  const setMode = useSimulationStore((state) => state.setMode)

  return (
    <aside className="w-80 bg-gray-800/90 backdrop-blur border-r border-gray-700 p-4 overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">Reef Tank Designer</h1>
        <p className="text-sm text-gray-400">Plan your perfect reef</p>
      </div>

      {/* Mode Toggle */}
      <div className="mb-4 flex rounded-lg bg-gray-700/50 p-1">
        <button
          onClick={() => setMode('design')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            mode === 'design'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Design
        </button>
        <button
          onClick={() => setMode('simulation')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            mode === 'simulation'
              ? 'bg-green-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Simulate
        </button>
      </div>

      {/* Simulation Mode Panel */}
      {mode === 'simulation' && (
        <SimulationPanel />
      )}

      {/* Design Mode Panels */}
      {mode === 'design' && (
        <>
          <SaveLoadControls />

          <div className="mt-4">
            <AmbientSound />
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <TankControls />
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <RockLibrary />
          </div>

          <div className="mt-4">
            <RockControls />
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <LightLibrary />
          </div>

          <div className="mt-3">
            <LightsOverview />
          </div>

          <div className="mt-3">
            <LightControls />
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <CoralLibrary />
          </div>

          <div className="mt-3">
            <CoralsOverview />
          </div>

          <div className="mt-3">
            <CoralControls />
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <FishLibrary />
          </div>

          <div className="mt-3">
            <FishControls />
          </div>

          <div className="mt-3">
            <FishCompatibility />
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <EquipmentLibrary />
          </div>

          <div className="mt-3">
            <EquipmentControls />
          </div>
        </>
      )}
    </aside>
  )
}
