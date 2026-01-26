import { create } from 'zustand'
import { useRockStore } from './rockStore'
import { useFishStore } from './fishStore'
import { useCoralStore } from './coralStore'

// Inline types to avoid Safari import issues
type Difficulty = 'beginner' | 'intermediate' | 'expert'
type TimeOfDay = 'day' | 'night'
type CleanupCrewType = 'snail' | 'hermitCrab' | 'emeraldCrab' | 'cleaner_shrimp' | 'sea_urchin'

interface CleanupCrewMember {
  id: string
  type: CleanupCrewType
}

interface FoodParticle {
  id: string
  position: [number, number, number]
  velocity: [number, number, number]
  type: 'pellet' | 'flake' | 'frozen'
  nutrition: number
  createdAt: number
}

interface AutoFeeder {
  enabled: boolean
  schedule: number[] // hours of day (0-24) to feed
  amount: number // 1-10 scale
  lastFed: number // simulation timestamp
}

interface WaterParams {
  // Beginner params (4)
  temperature: number    // °F (ideal 76-82)
  salinity: number       // ppt (ideal 1.024-1.026 specific gravity, ~35 ppt)
  ph: number            // ideal 8.1-8.4
  nitrate: number       // ppm (ideal <10, dangerous >40)

  // Intermediate params (+4 = 8)
  ammonia: number       // ppm (ideal 0, dangerous >0.25)
  nitrite: number       // ppm (ideal 0, dangerous >0.5)
  phosphate: number     // ppm (ideal <0.03)
  alkalinity: number    // dKH (ideal 8-12)

  // Expert params (+4 = 12)
  calcium: number       // ppm (ideal 400-450)
  magnesium: number     // ppm (ideal 1280-1350)
  potassium: number     // ppm (ideal 380-420)
  strontium: number     // ppm (ideal 8-10)
}

// Time configuration by difficulty
const TIME_CONFIG = {
  beginner: {
    dayDuration: 5 * 60,      // 5 min real time
    nightDuration: 1 * 60,    // 1 min real time
    simSecondsPerRealSecond: 86400 / (6 * 60),  // ~240x speed
  },
  intermediate: {
    dayDuration: 15 * 60,     // 15 min real time
    nightDuration: 3 * 60,    // 3 min real time
    simSecondsPerRealSecond: 86400 / (18 * 60), // ~80x speed
  },
  expert: {
    dayDuration: 30 * 60,     // 30 min real time
    nightDuration: 7 * 60,    // ~7 min real time (5-10 avg)
    simSecondsPerRealSecond: 86400 / (37 * 60), // ~39x speed
  },
}

// Difficulty config type
interface DifficultyConfig {
  algaeRate: number
  decayRate: number
  minHealth: number
  recoveryRate: number
  coralGrowthRate: number
  showParams: readonly (keyof WaterParams)[]
}

// Difficulty modifiers
const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    algaeRate: 0.5,           // 50% slower
    decayRate: 0.5,           // 50% slower
    minHealth: 0.3,           // Nothing dies, min 30% health
    recoveryRate: 1.5,        // 50% faster recovery
    coralGrowthRate: 1.5,     // 50% faster growth
    showParams: ['temperature', 'salinity', 'ph', 'nitrate'],
  },
  intermediate: {
    algaeRate: 1.0,           // Normal rates
    decayRate: 1.0,
    minHealth: 0.25,          // Min 25% health
    recoveryRate: 1.0,
    coralGrowthRate: 1.0,
    showParams: ['temperature', 'salinity', 'ph', 'nitrate', 'ammonia', 'nitrite', 'phosphate', 'alkalinity'],
  },
  expert: {
    algaeRate: 1.2,           // 20% faster
    decayRate: 1.2,
    minHealth: 0,             // Things can die
    recoveryRate: 0.8,        // 20% slower recovery
    coralGrowthRate: 0.8,     // 20% slower growth
    showParams: ['temperature', 'salinity', 'ph', 'nitrate', 'ammonia', 'nitrite', 'phosphate', 'alkalinity', 'calcium', 'magnesium', 'potassium', 'strontium'],
  },
}

// Ideal water parameters
const IDEAL_PARAMS: WaterParams = {
  temperature: 78,
  salinity: 35,
  ph: 8.3,
  nitrate: 5,
  ammonia: 0,
  nitrite: 0,
  phosphate: 0.02,
  alkalinity: 9,
  calcium: 420,
  magnesium: 1320,
  potassium: 400,
  strontium: 9,
}

// Parameter ranges (min, ideal low, ideal high, max)
const PARAM_RANGES: Record<keyof WaterParams, [number, number, number, number]> = {
  temperature: [65, 76, 82, 90],
  salinity: [28, 34, 36, 42],
  ph: [7.6, 8.1, 8.4, 8.8],
  nitrate: [0, 0, 10, 100],
  ammonia: [0, 0, 0.1, 2],
  nitrite: [0, 0, 0.1, 2],
  phosphate: [0, 0, 0.03, 1],
  alkalinity: [5, 8, 12, 16],
  calcium: [300, 400, 450, 550],
  magnesium: [1100, 1280, 1350, 1500],
  potassium: [300, 380, 420, 500],
  strontium: [4, 8, 10, 15],
}

interface SimulationState {
  // Mode
  isRunning: boolean
  mode: 'design' | 'simulation'
  difficulty: Difficulty

  // Time
  simulationTime: number      // elapsed sim-seconds
  dayProgress: number         // 0-1 (progress through current day/night cycle)
  timeOfDay: TimeOfDay
  dayCount: number
  lastTickTime: number        // real time of last tick (ms)

  // Water
  waterParams: WaterParams

  // Algae
  algaeLevel: number          // 0-1
  lastCleaning: number        // simulation timestamp

  // Feeding
  autoFeeder: AutoFeeder
  foodParticles: FoodParticle[]

  // Cleanup Crew
  cleanupCrew: CleanupCrewMember[]

  // Actions
  setMode: (mode: 'design' | 'simulation') => void
  setDifficulty: (difficulty: Difficulty) => void
  startSimulation: () => void
  stopSimulation: () => void
  toggleSimulation: () => void
  tick: (deltaRealSeconds: number) => void
  feedManually: (position: [number, number, number], amount?: number) => void
  removeFoodParticle: (id: string) => void
  updateFoodParticle: (id: string, updates: Partial<FoodParticle>) => void
  performWaterChange: (percent: number) => void
  cleanGlass: () => void
  doseParameter: (param: keyof WaterParams, amount: number) => void
  resetSimulation: () => void
  addCleanupCrew: (type: CleanupCrewType) => void
  removeCleanupCrew: (id: string) => void

  // Getters
  getTimeConfig: () => typeof TIME_CONFIG.beginner
  getDifficultyConfig: () => DifficultyConfig
  getParamStatus: (param: keyof WaterParams) => 'optimal' | 'acceptable' | 'warning' | 'critical'
}

const generateId = () => Math.random().toString(36).substring(2, 9)

// Calculate bioload contribution from fish
function calculateBioload(fishCount: number): number {
  // Each fish adds to ammonia/nitrate production
  return fishCount * 0.002 // per simulation hour
}

// Calculate bacterial capacity from live rock
// More rock = more beneficial bacteria = better ammonia/nitrite processing
function calculateBacterialCapacity(): number {
  const rocks = useRockStore.getState().rocks
  if (rocks.length === 0) return 0

  // Each rock contributes based on its scale (larger rocks = more surface area for bacteria)
  let totalCapacity = 0
  for (const rock of rocks) {
    // Base capacity per rock, scaled by size
    // Rock scale is typically 0.2-0.5, so multiply by 10 for reasonable values
    totalCapacity += rock.scale * 10
  }

  return totalCapacity
}

// Count dead fish (health = 0) that haven't been removed
function countDeadFish(): number {
  const fish = useFishStore.getState().fish
  return fish.filter(f => f.health <= 0).length
}

// Count dead corals (health = 0) that haven't been removed
function countDeadCorals(): number {
  const corals = useCoralStore.getState().corals
  return corals.filter(c => c.health <= 0).length
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  // Initial state
  isRunning: false,
  mode: 'design',
  difficulty: 'beginner',

  simulationTime: 0,
  dayProgress: 0,
  timeOfDay: 'day',
  dayCount: 1,
  lastTickTime: 0,

  waterParams: { ...IDEAL_PARAMS },

  algaeLevel: 0,
  lastCleaning: 0,

  autoFeeder: {
    enabled: false,
    schedule: [8, 18], // 8am and 6pm
    amount: 5,
    lastFed: 0,
  },
  foodParticles: [],
  cleanupCrew: [],

  // Actions
  setMode: (mode) => set({ mode }),

  setDifficulty: (difficulty) => set({ difficulty }),

  startSimulation: () => set({
    isRunning: true,
    lastTickTime: Date.now(),
  }),

  stopSimulation: () => set({ isRunning: false }),

  toggleSimulation: () => {
    const state = get()
    if (state.isRunning) {
      get().stopSimulation()
    } else {
      get().startSimulation()
    }
  },

  tick: (deltaRealSeconds) => {
    const state = get()
    if (!state.isRunning) return

    const timeConfig = TIME_CONFIG[state.difficulty]
    const diffConfig = DIFFICULTY_CONFIG[state.difficulty]

    // Convert real time to simulation time
    const deltaSimSeconds = deltaRealSeconds * timeConfig.simSecondsPerRealSecond
    const newSimTime = state.simulationTime + deltaSimSeconds

    // Calculate day/night progress
    const totalCycleReal = timeConfig.dayDuration + timeConfig.nightDuration
    const dayRatio = timeConfig.dayDuration / totalCycleReal

    // Time within current cycle (real seconds equivalent)
    const cycleTimeReal = (deltaRealSeconds + (state.dayProgress * totalCycleReal)) % totalCycleReal
    const newProgress = cycleTimeReal / totalCycleReal

    // Determine time of day
    const newTimeOfDay: TimeOfDay = newProgress < dayRatio ? 'day' : 'night'
    let newDayCount = state.dayCount

    // Check for day transition
    const wasDay = state.timeOfDay === 'day'
    const isDay = newTimeOfDay === 'day'
    if (wasDay && !isDay) {
      // Day just ended, night starting
    } else if (!wasDay && isDay) {
      // Night just ended, new day starting
      newDayCount++
    }

    // Update water parameters (decay over time)
    const simHours = deltaSimSeconds / 3600
    const params = { ...state.waterParams }

    // Get actual fish count for bioload calculation
    const fishCount = useFishStore.getState().fish.length
    const deadFishCount = countDeadFish()
    const deadCoralCount = countDeadCorals()

    // Calculate bioload from living fish
    const bioload = calculateBioload(fishCount) * simHours * diffConfig.decayRate

    // Dead organisms produce ammonia spikes until removed!
    // Dead fish produce significant ammonia, dead corals produce less
    const deadOrganismAmmonia = (deadFishCount * 0.05 + deadCoralCount * 0.02) * simHours * diffConfig.decayRate

    // Calculate bacterial capacity from live rock
    const bacterialCapacity = calculateBacterialCapacity()

    // Bacteria processing rate depends on rock amount vs bioload
    // If bacterial capacity >= bioload * 50, bacteria can fully process ammonia/nitrite
    // Less rock = slower processing, more buildup
    const processingEfficiency = Math.min(1, bacterialCapacity / Math.max(1, (fishCount + 1) * 5))

    // Ammonia cycle: ammonia -> nitrite -> nitrate
    // Fish and dead organisms produce ammonia, bacteria convert it

    // Ammonia production from living fish and dead organisms
    const ammoniaProduction = bioload * 0.5 + deadOrganismAmmonia

    // Bacteria consume ammonia - more rock = faster processing
    // With enough rock, bacteria keep ammonia at 0
    const bacteriaAmmoniaConsumption = params.ammonia * (0.1 + processingEfficiency * 0.9) * simHours

    params.ammonia = Math.max(0, params.ammonia + ammoniaProduction - bacteriaAmmoniaConsumption)

    // Ammonia converts to nitrite (bacteria process)
    const ammoniaToNitrite = bacteriaAmmoniaConsumption * 0.5

    // Bacteria also consume nitrite - more rock = faster processing
    const bacteriaNitriteConsumption = params.nitrite * (0.08 + processingEfficiency * 0.92) * simHours

    params.nitrite = Math.max(0, params.nitrite + ammoniaToNitrite - bacteriaNitriteConsumption)

    // Nitrite converts to nitrate (this is the end product, accumulates over time)
    const nitriteToNitrate = bacteriaNitriteConsumption
    params.nitrate = Math.min(100, params.nitrate + nitriteToNitrate + bioload * 0.1)

    // Phosphate accumulation
    params.phosphate = Math.min(1, params.phosphate + bioload * 0.05)

    // Natural pH drift
    params.ph = Math.max(7.6, Math.min(8.8, params.ph - 0.001 * simHours * diffConfig.decayRate))

    // Temperature drift (slight cooling)
    params.temperature = Math.max(72, params.temperature - 0.01 * simHours)

    // Alkalinity consumption by corals
    params.alkalinity = Math.max(5, params.alkalinity - 0.02 * simHours * diffConfig.decayRate)

    // Calcium consumption by corals
    params.calcium = Math.max(300, params.calcium - 0.5 * simHours * diffConfig.decayRate)

    // Algae growth based on nutrients and light
    const nutrientFactor = (params.nitrate / 20 + params.phosphate / 0.1) / 2
    const lightFactor = newTimeOfDay === 'day' ? 1 : 0.1
    const algaeGrowth = 0.01 * nutrientFactor * lightFactor * simHours * diffConfig.algaeRate

    // Cleanup crew reduces algae
    const isNight = newTimeOfDay === 'night'
    let cleanupReduction = 0
    for (const member of state.cleanupCrew) {
      // Algae reduction rates per type (per sim hour)
      const rates: Record<string, { base: number; nocturnal: boolean }> = {
        snail: { base: 0.005, nocturnal: false },
        hermitCrab: { base: 0.003, nocturnal: true },
        emeraldCrab: { base: 0.008, nocturnal: true },
        cleaner_shrimp: { base: 0.002, nocturnal: false },
        sea_urchin: { base: 0.006, nocturnal: true },
      }
      const rate = rates[member.type]
      if (rate) {
        // Nocturnal creatures 50% more effective at night, 50% less during day
        const multiplier = rate.nocturnal ? (isNight ? 1.5 : 0.5) : 1
        cleanupReduction += rate.base * multiplier * simHours
      }
    }

    const newAlgaeLevel = Math.min(1, Math.max(0, state.algaeLevel + algaeGrowth - cleanupReduction))

    // Update food particles (gravity, consumption check)
    const updatedFood = state.foodParticles
      .map(p => ({
        ...p,
        position: [
          p.position[0] + p.velocity[0] * deltaRealSeconds,
          Math.max(0.1, p.position[1] + p.velocity[1] * deltaRealSeconds), // Floor at sand level
          p.position[2] + p.velocity[2] * deltaRealSeconds,
        ] as [number, number, number],
        velocity: [
          p.velocity[0] * 0.98, // Water resistance
          p.position[1] <= 0.15 ? 0 : p.velocity[1] - 0.5 * deltaRealSeconds, // Gravity until floor
          p.velocity[2] * 0.98,
        ] as [number, number, number],
      }))
      // Remove old particles (after 30 sim seconds = ~2 min real at beginner)
      .filter(p => newSimTime - p.createdAt < 120)

    set({
      simulationTime: newSimTime,
      dayProgress: newProgress,
      timeOfDay: newTimeOfDay,
      dayCount: newDayCount,
      waterParams: params,
      algaeLevel: newAlgaeLevel,
      foodParticles: updatedFood,
      lastTickTime: Date.now(),
    })
  },

  feedManually: (position, amount = 5) => {
    const state = get()
    const particles: FoodParticle[] = []

    // Create multiple food particles based on amount
    const particleCount = Math.floor(amount * 2) + 3 // 3-23 particles

    for (let i = 0; i < particleCount; i++) {
      const spread = 0.3
      const foodTypes: Array<'pellet' | 'flake' | 'frozen'> = ['pellet', 'flake', 'frozen']
      const type = foodTypes[Math.floor(Math.random() * foodTypes.length)]

      particles.push({
        id: generateId(),
        position: [
          position[0] + (Math.random() - 0.5) * spread,
          position[1],
          position[2] + (Math.random() - 0.5) * spread,
        ],
        velocity: [
          (Math.random() - 0.5) * 0.1,
          -0.2 - Math.random() * 0.3, // Fall speed varies by type
          (Math.random() - 0.5) * 0.1,
        ],
        type,
        nutrition: type === 'frozen' ? 1.5 : type === 'pellet' ? 1.0 : 0.8,
        createdAt: state.simulationTime,
      })
    }

    set({
      foodParticles: [...state.foodParticles, ...particles],
    })
  },

  removeFoodParticle: (id) => set((state) => ({
    foodParticles: state.foodParticles.filter(p => p.id !== id),
  })),

  updateFoodParticle: (id, updates) => set((state) => ({
    foodParticles: state.foodParticles.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ),
  })),

  performWaterChange: (percent) => {
    const state = get()
    const factor = percent / 100

    // Water change moves parameters toward ideal
    const params = { ...state.waterParams }
    for (const key of Object.keys(params) as Array<keyof WaterParams>) {
      params[key] = params[key] + (IDEAL_PARAMS[key] - params[key]) * factor
    }

    set({
      waterParams: params,
      // Cleaning bonus for larger water changes
      algaeLevel: state.algaeLevel * (1 - factor * 0.3),
    })
  },

  cleanGlass: () => set((state) => ({
    algaeLevel: Math.max(0, state.algaeLevel - 0.4),
    lastCleaning: state.simulationTime,
  })),

  doseParameter: (param, amount) => set((state) => {
    const newParams = { ...state.waterParams }
    const range = PARAM_RANGES[param]
    newParams[param] = Math.max(range[0], Math.min(range[3], newParams[param] + amount))
    return { waterParams: newParams }
  }),

  resetSimulation: () => set({
    isRunning: false,
    simulationTime: 0,
    dayProgress: 0,
    timeOfDay: 'day',
    dayCount: 1,
    waterParams: { ...IDEAL_PARAMS },
    algaeLevel: 0,
    lastCleaning: 0,
    foodParticles: [],
    autoFeeder: {
      enabled: false,
      schedule: [8, 18],
      amount: 5,
      lastFed: 0,
    },
    cleanupCrew: [],
  }),

  addCleanupCrew: (type) => set((state) => ({
    cleanupCrew: [...state.cleanupCrew, { id: generateId(), type }],
  })),

  removeCleanupCrew: (id) => set((state) => ({
    cleanupCrew: state.cleanupCrew.filter(c => c.id !== id),
  })),

  // Getters
  getTimeConfig: () => TIME_CONFIG[get().difficulty],

  getDifficultyConfig: () => DIFFICULTY_CONFIG[get().difficulty],

  getParamStatus: (param) => {
    const value = get().waterParams[param]
    const [min, idealLow, idealHigh, max] = PARAM_RANGES[param]

    if (value >= idealLow && value <= idealHigh) return 'optimal'
    if (value < min || value > max) return 'critical'
    if (value < idealLow - (idealLow - min) * 0.5 || value > idealHigh + (max - idealHigh) * 0.5) return 'warning'
    return 'acceptable'
  },
}))

// Export types and constants for use elsewhere
export { TIME_CONFIG, DIFFICULTY_CONFIG, IDEAL_PARAMS, PARAM_RANGES }
export type { Difficulty, TimeOfDay, WaterParams, FoodParticle, AutoFeeder, SimulationState, CleanupCrewType, CleanupCrewMember }
