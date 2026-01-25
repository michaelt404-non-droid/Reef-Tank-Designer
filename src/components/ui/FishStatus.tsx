import { useFishStore } from '../../stores/fishStore'
import { FISH_INFO } from '../../data/fish'

export function FishStatus() {
  const fish = useFishStore((state) => state.fish)

  if (fish.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-2">
        No fish in tank
      </div>
    )
  }

  // Calculate overall stats
  const avgHunger = fish.reduce((sum, f) => sum + f.hunger, 0) / fish.length
  const avgHealth = fish.reduce((sum, f) => sum + f.health, 0) / fish.length
  const avgStress = fish.reduce((sum, f) => sum + f.stressLevel, 0) / fish.length

  // Count fish by status
  const hungryCount = fish.filter(f => f.hunger > 0.6).length
  const unhealthyCount = fish.filter(f => f.health < 0.5).length
  const stressedCount = fish.filter(f => f.stressLevel > 0.5).length

  const getStatusColor = (value: number, isInverse = false) => {
    const v = isInverse ? 1 - value : value
    if (v >= 0.7) return 'text-green-400'
    if (v >= 0.4) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getBarColor = (value: number, isInverse = false) => {
    const v = isInverse ? 1 - value : value
    if (v >= 0.7) return 'bg-green-500'
    if (v >= 0.4) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-300">Fish Status</h4>

      {/* Overview stats */}
      <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Total Fish</span>
          <span className="text-white font-medium">{fish.length}</span>
        </div>

        {/* Average Health */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Avg Health</span>
            <span className={getStatusColor(avgHealth)}>{Math.round(avgHealth * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getBarColor(avgHealth)}`}
              style={{ width: `${avgHealth * 100}%` }}
            />
          </div>
        </div>

        {/* Average Hunger (inverse - full is good) */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Avg Fullness</span>
            <span className={getStatusColor(avgHunger, true)}>{Math.round((1 - avgHunger) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getBarColor(avgHunger, true)}`}
              style={{ width: `${(1 - avgHunger) * 100}%` }}
            />
          </div>
        </div>

        {/* Average Stress (inverse - calm is good) */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Avg Calmness</span>
            <span className={getStatusColor(avgStress, true)}>{Math.round((1 - avgStress) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getBarColor(avgStress, true)}`}
              style={{ width: `${(1 - avgStress) * 100}%` }}
            />
          </div>
        </div>

        {/* Alerts */}
        {(hungryCount > 0 || unhealthyCount > 0 || stressedCount > 0) && (
          <div className="pt-2 border-t border-gray-600 space-y-1">
            {hungryCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                {hungryCount} fish hungry
              </div>
            )}
            {unhealthyCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                {unhealthyCount} fish unhealthy
              </div>
            )}
            {stressedCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-yellow-400">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                {stressedCount} fish stressed
              </div>
            )}
          </div>
        )}
      </div>

      {/* Individual fish list (collapsed by default) */}
      <details className="group">
        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
          View individual fish
        </summary>
        <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
          {fish.map((f) => {
            const fishInfo = FISH_INFO.find(info => info.id === f.fishType)
            return (
              <div
                key={f.id}
                className="flex items-center gap-2 p-1.5 bg-gray-700/30 rounded text-xs"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: f.color }}
                />
                <span className="text-gray-300 flex-1 truncate">
                  {fishInfo?.name || f.fishType}
                </span>
                <div className="flex gap-1">
                  {f.hunger > 0.6 && (
                    <span title="Hungry" className="text-orange-400">H</span>
                  )}
                  {f.health < 0.5 && (
                    <span title="Unhealthy" className="text-red-400">!</span>
                  )}
                  {f.stressLevel > 0.5 && (
                    <span title="Stressed" className="text-yellow-400">S</span>
                  )}
                  {f.hunger <= 0.6 && f.health >= 0.5 && f.stressLevel <= 0.5 && (
                    <span title="Healthy" className="text-green-400">OK</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </details>
    </div>
  )
}
