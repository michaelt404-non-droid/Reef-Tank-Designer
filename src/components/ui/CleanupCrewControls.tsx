import { useSimulationStore } from '../../stores/simulationStore'
import { CLEANUP_CREW_INFO } from '../../data/cleanupCrew'

type CleanupCrewType = 'snail' | 'hermitCrab' | 'emeraldCrab' | 'cleaner_shrimp' | 'sea_urchin'

interface CleanupCrewMember {
  id: string
  type: CleanupCrewType
}

export function CleanupCrewControls() {
  const cleanupCrew = useSimulationStore((state: { cleanupCrew: CleanupCrewMember[] }) => state.cleanupCrew)
  const addCleanupCrew = useSimulationStore((state: { addCleanupCrew: (type: CleanupCrewType) => void }) => state.addCleanupCrew)
  const removeCleanupCrew = useSimulationStore((state: { removeCleanupCrew: (id: string) => void }) => state.removeCleanupCrew)
  const timeOfDay = useSimulationStore((state) => state.timeOfDay)

  // Count by type
  const countByType = (type: CleanupCrewType) => cleanupCrew.filter(c => c.type === type).length

  // Calculate current cleanup rate
  const calculateRate = () => {
    let rate = 0
    const isNight = timeOfDay === 'night'
    for (const member of cleanupCrew) {
      const info = CLEANUP_CREW_INFO.find(c => c.id === member.type)
      if (info) {
        const mult = info.nocturnal ? (isNight ? 1.5 : 0.5) : 1
        rate += info.algaeReduction * mult
      }
    }
    return rate
  }

  const currentRate = calculateRate()

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-300">Cleanup Crew</h4>

      {/* Current crew stats */}
      <div className="bg-gray-700/50 rounded-lg p-3">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Total Members</span>
          <span className="text-white font-medium">{cleanupCrew.length}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Algae Cleanup Rate</span>
          <span className={currentRate > 0 ? 'text-green-400' : 'text-gray-500'}>
            {currentRate > 0 ? `-${(currentRate * 100).toFixed(1)}%/hr` : 'None'}
          </span>
        </div>
        {timeOfDay === 'night' && cleanupCrew.some(c => {
          const info = CLEANUP_CREW_INFO.find(i => i.id === c.type)
          return info?.nocturnal
        }) && (
          <div className="text-xs text-blue-400 mt-1">
            Nocturnal crew active
          </div>
        )}
      </div>

      {/* Add crew members */}
      <div className="space-y-2">
        {CLEANUP_CREW_INFO.map((info) => {
          const count = countByType(info.id)
          const atMax = count >= info.maxPerTank

          return (
            <div
              key={info.id}
              className="flex items-center gap-2 p-2 bg-gray-700/30 rounded"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: info.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white truncate">{info.name}</div>
                <div className="text-[10px] text-gray-500">
                  {info.nocturnal ? 'Nocturnal' : 'Daytime'} | -{(info.algaeReduction * 100).toFixed(1)}%/hr
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const member = cleanupCrew.find(c => c.type === info.id)
                    if (member) removeCleanupCrew(member.id)
                  }}
                  disabled={count === 0}
                  className="w-6 h-6 flex items-center justify-center rounded bg-gray-600 hover:bg-gray-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs"
                >
                  -
                </button>
                <span className="w-4 text-center text-xs text-white">{count}</span>
                <button
                  onClick={() => addCleanupCrew(info.id)}
                  disabled={atMax}
                  className="w-6 h-6 flex items-center justify-center rounded bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs"
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Help text */}
      <p className="text-[10px] text-gray-500 text-center">
        Cleanup crew helps control algae growth naturally
      </p>
    </div>
  )
}
