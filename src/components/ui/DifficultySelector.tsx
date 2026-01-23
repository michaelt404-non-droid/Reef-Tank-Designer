import { useSimulationStore } from '../../stores/simulationStore'

// Inline type to avoid Safari issues
type Difficulty = 'beginner' | 'intermediate' | 'expert'

interface DifficultyOption {
  id: Difficulty
  name: string
  description: string
  paramCount: number
  dayLength: string
  features: string[]
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'Learn the basics with forgiving mechanics',
    paramCount: 4,
    dayLength: '6 min',
    features: [
      'Nothing can die (30% min health)',
      '50% slower algae growth',
      'Auto-suggested fixes',
      'Fast 6 min day cycles',
    ],
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Balanced gameplay with moderate challenge',
    paramCount: 8,
    dayLength: '18 min',
    features: [
      'Gradual decline possible (25% min health)',
      'Normal growth rates',
      'Color-coded gauges',
      'Moderate 18 min day cycles',
    ],
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'Realistic simulation for experienced reefers',
    paramCount: 12,
    dayLength: '35-40 min',
    features: [
      'Fish and coral can die',
      '120% faster decay rates',
      'Equipment can fail',
      'Slow 35-40 min day cycles',
    ],
  },
]

export function DifficultySelector() {
  const difficulty = useSimulationStore((state) => state.difficulty)
  const setDifficulty = useSimulationStore((state) => state.setDifficulty)
  const isRunning = useSimulationStore((state) => state.isRunning)

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-300">Difficulty</h4>

      <div className="grid gap-2">
        {DIFFICULTY_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => !isRunning && setDifficulty(option.id)}
            disabled={isRunning}
            className={`text-left p-3 rounded-lg border-2 transition-all ${
              difficulty === option.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`font-medium ${
                difficulty === option.id ? 'text-blue-400' : 'text-white'
              }`}>
                {option.name}
              </span>
              <span className="text-xs text-gray-400">
                {option.paramCount} params | {option.dayLength}/day
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-2">{option.description}</p>

            {difficulty === option.id && (
              <ul className="text-xs text-gray-500 space-y-1">
                {option.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span className="text-green-400">\u2713</span>
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </button>
        ))}
      </div>

      {isRunning && (
        <p className="text-xs text-yellow-500">
          Pause simulation to change difficulty
        </p>
      )}
    </div>
  )
}
