import { useSimulationStore } from '../stores/simulationStore'

/**
 * Hook to get simulation-aware values for fish and corals
 * These can be used by mesh components to adjust behavior
 */
export function useSimulationContext() {
  const mode = useSimulationStore((state) => state.mode)
  const isRunning = useSimulationStore((state) => state.isRunning)
  const timeOfDay = useSimulationStore((state) => state.timeOfDay)
  const dayProgress = useSimulationStore((state) => state.dayProgress)
  const difficulty = useSimulationStore((state) => state.difficulty)
  const getDifficultyConfig = useSimulationStore((state) => state.getDifficultyConfig)

  return {
    isSimulating: mode === 'simulation' && isRunning,
    mode,
    isRunning,
    timeOfDay,
    dayProgress,
    difficulty,
    difficultyConfig: getDifficultyConfig(),
  }
}
