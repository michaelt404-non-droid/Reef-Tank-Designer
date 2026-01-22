import { useState } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'
import { useTankStore } from '../../stores/tankStore'

export function FeedingControls() {
  const [feedAmount, setFeedAmount] = useState(5)
  const feedManually = useSimulationStore((state) => state.feedManually)
  const foodParticles = useSimulationStore((state) => state.foodParticles)
  const autoFeeder = useSimulationStore((state) => state.autoFeeder)
  const tankDimensions = useTankStore((state) => state.dimensions)

  const TANK_SCALE = 0.1

  const handleFeed = () => {
    // Feed at water surface, center of tank
    const waterLevel = tankDimensions.height * TANK_SCALE - 0.1
    feedManually([0, waterLevel, 0], feedAmount)
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-300">Feeding</h4>

      {/* Manual feeding */}
      <div className="bg-gray-700/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Manual Feed</span>
          <span className="text-xs text-gray-500">
            {foodParticles.length} particles active
          </span>
        </div>

        {/* Amount slider */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Amount</span>
            <span className="text-xs text-gray-400">{feedAmount}</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={feedAmount}
            onChange={(e) => setFeedAmount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
            <span>Light</span>
            <span>Heavy</span>
          </div>
        </div>

        <button
          onClick={handleFeed}
          className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>Feed Now</span>
        </button>

        <p className="text-xs text-gray-500 mt-2 text-center">
          Tip: Click on the water surface in the tank to feed at a specific location
        </p>
      </div>

      {/* Auto-feeder status */}
      <div className="bg-gray-700/50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Auto-Feeder</span>
          <span className={`text-xs px-2 py-0.5 rounded ${
            autoFeeder.enabled
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-600 text-gray-400'
          }`}>
            {autoFeeder.enabled ? 'Active' : 'Disabled'}
          </span>
        </div>
        {autoFeeder.enabled && (
          <p className="text-xs text-gray-500 mt-1">
            Feeds at {autoFeeder.schedule.map(h => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`).join(' & ')}
          </p>
        )}
      </div>
    </div>
  )
}
