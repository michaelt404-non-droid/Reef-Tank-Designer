import { useSimulationStore, TIME_CONFIG } from '../../stores/simulationStore'

export function TimeDisplay() {
  const dayProgress = useSimulationStore((state) => state.dayProgress)
  const timeOfDay = useSimulationStore((state) => state.timeOfDay)
  const dayCount = useSimulationStore((state) => state.dayCount)
  const difficulty = useSimulationStore((state) => state.difficulty)
  const isRunning = useSimulationStore((state) => state.isRunning)

  const timeConfig = TIME_CONFIG[difficulty]
  const totalCycle = timeConfig.dayDuration + timeConfig.nightDuration
  const dayRatio = timeConfig.dayDuration / totalCycle

  // Calculate current time display (like 8:00 AM)
  const simulatedHour = Math.floor(dayProgress * 24)
  const simulatedMinute = Math.floor((dayProgress * 24 - simulatedHour) * 60)
  const timeString = `${simulatedHour % 12 || 12}:${simulatedMinute.toString().padStart(2, '0')} ${simulatedHour < 12 ? 'AM' : 'PM'}`

  // Progress bar segments
  const dayWidth = dayRatio * 100
  const nightWidth = (1 - dayRatio) * 100
  const progressPosition = dayProgress * 100

  return (
    <div className="bg-gray-700/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {timeOfDay === 'day' ? '\u2600\ufe0f' : '\u{1F319}'}
          </span>
          <div>
            <div className="text-white font-medium">Day {dayCount}</div>
            <div className="text-gray-400 text-sm">{timeString}</div>
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          isRunning
            ? 'bg-green-500/20 text-green-400'
            : 'bg-gray-600 text-gray-400'
        }`}>
          {isRunning ? 'Running' : 'Paused'}
        </div>
      </div>

      {/* Day/Night progress bar */}
      <div className="relative h-3 rounded-full overflow-hidden bg-gray-800">
        {/* Day segment */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-yellow-300"
          style={{ width: `${dayWidth}%` }}
        />
        {/* Night segment */}
        <div
          className="absolute top-0 h-full bg-gradient-to-r from-indigo-700 to-purple-900"
          style={{ left: `${dayWidth}%`, width: `${nightWidth}%` }}
        />
        {/* Current position indicator */}
        <div
          className="absolute top-0 w-1 h-full bg-white shadow-lg transition-all duration-200"
          style={{ left: `${progressPosition}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>6 AM</span>
        <span>Noon</span>
        <span>6 PM</span>
        <span>Midnight</span>
      </div>
    </div>
  )
}
