import { useCoralStore } from '../../stores/coralStore'
import { CORAL_INFO } from '../../data/corals'

// Inline types to avoid Safari import issues
type CoralType = 'mushrooms' | 'zoanthids' | 'softCorals' | 'lps' | 'sps' | 'acropora'

interface PlacedCoral {
  id: string
  coralType: CoralType
  health: number
  growthProgress: number
  colorIntensity: number
  color: string
}

export function CoralStatus() {
  const corals = useCoralStore((state: { corals: PlacedCoral[] }) => state.corals)

  if (corals.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-2">
        No corals in tank
      </div>
    )
  }

  // Calculate overall stats
  const avgHealth = corals.reduce((sum, c) => sum + (c.health ?? 1), 0) / corals.length
  const avgGrowth = corals.reduce((sum, c) => sum + (c.growthProgress ?? 0), 0) / corals.length
  const avgColor = corals.reduce((sum, c) => sum + (c.colorIntensity ?? 1), 0) / corals.length

  // Count corals by status
  const bleachingCount = corals.filter(c => (c.colorIntensity ?? 1) < 0.6).length
  const unhealthyCount = corals.filter(c => (c.health ?? 1) < 0.5).length
  const thrivingCount = corals.filter(c => (c.health ?? 1) > 0.8 && (c.colorIntensity ?? 1) > 0.8).length

  const getStatusColor = (value: number) => {
    if (value >= 0.7) return 'text-green-400'
    if (value >= 0.4) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getBarColor = (value: number) => {
    if (value >= 0.7) return 'bg-green-500'
    if (value >= 0.4) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-300">Coral Status</h4>

      {/* Overview stats */}
      <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Total Corals</span>
          <span className="text-white font-medium">{corals.length}</span>
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

        {/* Average Color Intensity */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Color Vibrancy</span>
            <span className={getStatusColor(avgColor)}>{Math.round(avgColor * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getBarColor(avgColor)}`}
              style={{ width: `${avgColor * 100}%` }}
            />
          </div>
        </div>

        {/* Average Growth */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Avg Growth</span>
            <span className="text-blue-400">{Math.round(avgGrowth * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all bg-blue-500"
              style={{ width: `${avgGrowth * 100}%` }}
            />
          </div>
        </div>

        {/* Status counts */}
        <div className="pt-2 border-t border-gray-600 space-y-1">
          {thrivingCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {thrivingCount} coral{thrivingCount > 1 ? 's' : ''} thriving
            </div>
          )}
          {bleachingCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-yellow-400">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              {bleachingCount} coral{bleachingCount > 1 ? 's' : ''} bleaching
            </div>
          )}
          {unhealthyCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              {unhealthyCount} coral{unhealthyCount > 1 ? 's' : ''} stressed
            </div>
          )}
        </div>
      </div>

      {/* Individual coral list (collapsed by default) */}
      <details className="group">
        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
          View individual corals
        </summary>
        <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
          {corals.map((c) => {
            const coralInfo = CORAL_INFO.find(info => info.id === c.coralType)
            const health = c.health ?? 1
            const colorInt = c.colorIntensity ?? 1
            const growth = c.growthProgress ?? 0
            return (
              <div
                key={c.id}
                className="flex items-center gap-2 p-1.5 bg-gray-700/30 rounded text-xs"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-gray-300 flex-1 truncate">
                  {coralInfo?.name || c.coralType}
                </span>
                <div className="flex gap-1 text-[10px]">
                  {growth > 0.5 && (
                    <span title="Growing well" className="text-blue-400">+{Math.round(growth * 50)}%</span>
                  )}
                  {colorInt < 0.6 && (
                    <span title="Bleaching" className="text-yellow-400">B</span>
                  )}
                  {health < 0.5 && (
                    <span title="Stressed" className="text-red-400">!</span>
                  )}
                  {health >= 0.7 && colorInt >= 0.7 && (
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
