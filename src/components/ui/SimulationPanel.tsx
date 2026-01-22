import { useSimulationStore } from '../../stores/simulationStore'
import { TimeDisplay } from './TimeDisplay'
import { DifficultySelector } from './DifficultySelector'
import { WaterQualityDisplay } from './WaterQualityDisplay'
import { FeedingControls } from './FeedingControls'
import { FishStatus } from './FishStatus'
import { CoralStatus } from './CoralStatus'
import { CleanupCrewControls } from './CleanupCrewControls'

export function SimulationPanel() {
  const isRunning = useSimulationStore((state) => state.isRunning)
  const toggleSimulation = useSimulationStore((state) => state.toggleSimulation)
  const resetSimulation = useSimulationStore((state) => state.resetSimulation)
  const mode = useSimulationStore((state) => state.mode)
  const setMode = useSimulationStore((state) => state.setMode)
  const dayCount = useSimulationStore((state) => state.dayCount)
  const algaeLevel = useSimulationStore((state) => state.algaeLevel)
  const cleanGlass = useSimulationStore((state) => state.cleanGlass)
  const performWaterChange = useSimulationStore((state) => state.performWaterChange)

  if (mode !== 'simulation') {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Simulation Mode</h3>
        <button
          onClick={() => setMode('design')}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Back to Design
        </button>
      </div>

      {/* Time display */}
      <TimeDisplay />

      {/* Control buttons */}
      <div className="flex gap-2">
        <button
          onClick={toggleSimulation}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            isRunning
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isRunning ? '\u23F8 Pause' : '\u25B6 Start'}
        </button>
        <button
          onClick={resetSimulation}
          disabled={isRunning}
          className="py-2 px-4 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Difficulty selector */}
      <div className="pt-3 border-t border-gray-700">
        <DifficultySelector />
      </div>

      {/* Water Quality */}
      <div className="pt-3 border-t border-gray-700">
        <WaterQualityDisplay />
      </div>

      {/* Maintenance Actions */}
      <div className="pt-3 border-t border-gray-700">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Maintenance</h4>

        <div className="space-y-2">
          {/* Algae Level */}
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Algae Level</span>
              <span className={`text-sm font-medium ${
                algaeLevel < 0.3 ? 'text-green-400' :
                algaeLevel < 0.6 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {Math.round(algaeLevel * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  algaeLevel < 0.3 ? 'bg-green-500' :
                  algaeLevel < 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${algaeLevel * 100}%` }}
              />
            </div>
            <button
              onClick={cleanGlass}
              className="mt-2 w-full py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Clean Glass (-40%)
            </button>
          </div>

          {/* Water Change */}
          <div className="bg-gray-700/50 rounded-lg p-3">
            <span className="text-sm text-gray-300 block mb-2">Water Change</span>
            <div className="grid grid-cols-3 gap-2">
              {[10, 25, 50].map((percent) => (
                <button
                  key={percent}
                  onClick={() => performWaterChange(percent)}
                  className="py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feeding Controls */}
      <div className="pt-3 border-t border-gray-700">
        <FeedingControls />
      </div>

      {/* Fish Status */}
      <div className="pt-3 border-t border-gray-700">
        <FishStatus />
      </div>

      {/* Coral Status */}
      <div className="pt-3 border-t border-gray-700">
        <CoralStatus />
      </div>

      {/* Cleanup Crew */}
      <div className="pt-3 border-t border-gray-700">
        <CleanupCrewControls />
      </div>
    </div>
  )
}
