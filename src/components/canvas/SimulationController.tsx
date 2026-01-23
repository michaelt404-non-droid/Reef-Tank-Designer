import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSimulationStore, TIME_CONFIG, DIFFICULTY_CONFIG } from '../../stores/simulationStore'
import type { SimulationState } from '../../stores/simulationStore'
import { useFishStore } from '../../stores/fishStore'
import { useCoralStore } from '../../stores/coralStore'

/**
 * SimulationController - Non-visual component that drives the simulation tick loop
 * Uses useFrame to update simulation state every frame
 */
export function SimulationController() {
  // Initialize ref without calling Date.now() during render
  const lastTimeRef = useRef<number>(0)
  const initializedRef = useRef<boolean>(false)

  const isRunning = useSimulationStore((state: SimulationState) => state.isRunning)
  const mode = useSimulationStore((state: SimulationState) => state.mode)
  const tick = useSimulationStore((state: SimulationState) => state.tick)
  const difficulty = useSimulationStore((state: SimulationState) => state.difficulty)

  // Get fish for simulation
  const fish = useFishStore((state: { fish: unknown[] }) => state.fish)
  const tickFish = useFishStore((state: { tickFish: (a: number, b: number, c: number) => void }) => state.tickFish)

  // Get corals for simulation
  const corals = useCoralStore((state: { corals: unknown[] }) => state.corals)
  const tickCorals = useCoralStore((state: { tickCorals: (a: number, b: number, c: number, d: number) => void }) => state.tickCorals)

  // Get water quality for coral health calculations
  const waterParams = useSimulationStore((state: SimulationState) => state.waterParams)

  useFrame(() => {
    const now = Date.now()

    // Initialize time ref on first frame
    if (!initializedRef.current) {
      lastTimeRef.current = now
      initializedRef.current = true
    }

    // Only tick when in simulation mode and running
    if (mode !== 'simulation' || !isRunning) {
      lastTimeRef.current = now
      return
    }
    const deltaMs = now - lastTimeRef.current
    lastTimeRef.current = now

    // Convert to seconds and cap at reasonable max (prevents huge jumps on tab switch)
    const deltaSeconds = Math.min(deltaMs / 1000, 0.1)

    // Call the main simulation tick function
    tick(deltaSeconds)

    // Tick fish simulation (hunger, health, etc.) - every simulation hour
    const timeConfig = TIME_CONFIG[difficulty]
    const diffConfig = DIFFICULTY_CONFIG[difficulty]
    const deltaSimSeconds = deltaSeconds * timeConfig.simSecondsPerRealSecond
    const deltaSimHours = deltaSimSeconds / 3600

    // Tick fish state
    if (fish.length > 0 && deltaSimHours > 0) {
      tickFish(deltaSimHours, diffConfig.decayRate, diffConfig.minHealth)
    }

    // Calculate overall water quality score (0-1) for coral health
    // Based on key parameters: ammonia, nitrate, alkalinity, calcium
    const calcWaterQuality = () => {
      let score = 1.0

      // Ammonia is very harmful
      if (waterParams.ammonia > 0.1) score -= Math.min(0.4, waterParams.ammonia * 2)

      // High nitrates stress corals
      if (waterParams.nitrate > 20) score -= Math.min(0.3, (waterParams.nitrate - 20) / 100)

      // Alkalinity affects coral calcification
      if (waterParams.alkalinity < 7 || waterParams.alkalinity > 13) {
        score -= 0.2
      }

      // Calcium needed for growth
      if (waterParams.calcium < 380 || waterParams.calcium > 480) {
        score -= 0.15
      }

      // pH stability
      if (waterParams.ph < 8.0 || waterParams.ph > 8.5) {
        score -= 0.1
      }

      return Math.max(0.1, Math.min(1, score))
    }

    // Tick coral state
    if (corals.length > 0 && deltaSimHours > 0) {
      const waterQuality = calcWaterQuality()
      tickCorals(deltaSimHours, diffConfig.decayRate, diffConfig.minHealth, waterQuality)
    }
  })

  // This component renders nothing
  return null
}
