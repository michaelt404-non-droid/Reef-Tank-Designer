import { create } from 'zustand'
import { useTankStore } from './tankStore'
import { FISH_INFO } from '../data/fish'

// Inline type to avoid Safari import issues
type FishType = 'clownfish' | 'tang' | 'wrasse' | 'goby' | 'blenny' | 'angelfish' | 'chromis' | 'cardinalfish'

interface PlacedFish {
  id: string
  fishType: FishType
  position: [number, number, number]
  rotation: [number, number, number]
  targetPosition: [number, number, number]
  scale: number
  initialScale: number  // Original scale when fish was added (for growth cap)
  color: string
  swimSpeed: number
  // Simulation properties
  hunger: number        // 0-1 (0 = full, 1 = starving)
  health: number        // 0-1 (0 = dead, 1 = perfect health)
  age: number           // simulation days old
  growthProgress: number // 0-1 progress to next size increase
  stressLevel: number   // 0-1 (affects behavior and health)
  lastFed: number       // simulation timestamp when last fed
}

interface FishState {
  fish: PlacedFish[]
  selectedFishId: string | null
  addFish: (fishType: FishType) => void
  removeFish: (id: string) => void
  updateFish: (id: string, updates: Partial<PlacedFish>) => void
  selectFish: (id: string | null) => void
  clearAllFish: () => void
  // Simulation methods
  tickFish: (deltaSimHours: number, difficultyMod: number, minHealth: number) => void
  feedFish: (fishId: string, nutrition: number, simTime: number) => void
  findHungriestFishNear: (position: [number, number, number], maxDistance: number) => PlacedFish | null
}

const generateId = () => Math.random().toString(36).substring(2, 9)

// Generate a random position within tank bounds
function getRandomPosition(tankDimensions: { length: number; width: number; height: number }): [number, number, number] {
  const SCALE = 0.1
  const margin = 0.3
  const tankHalfLength = (tankDimensions.length * SCALE) / 2 - margin
  const tankHalfWidth = (tankDimensions.width * SCALE) / 2 - margin
  const tankHeight = tankDimensions.height * SCALE

  return [
    (Math.random() - 0.5) * tankHalfLength * 2,
    0.3 + Math.random() * (tankHeight - 0.6), // Stay in water column
    (Math.random() - 0.5) * tankHalfWidth * 2,
  ]
}

export const useFishStore = create<FishState>((set) => ({
  fish: [],
  selectedFishId: null,

  addFish: (fishType) => set((state) => {
    const fishInfo = FISH_INFO.find(f => f.id === fishType)
    if (!fishInfo) return state

    const tankDimensions = useTankStore.getState().dimensions
    const position = getRandomPosition(tankDimensions)
    const targetPosition = getRandomPosition(tankDimensions)

    // Random scale variation
    const scale = fishInfo.baseSize * (0.8 + Math.random() * 0.4)

    // Random color from fish's palette
    const color = fishInfo.colors[Math.floor(Math.random() * fishInfo.colors.length)]

    const newFish: PlacedFish = {
      id: generateId(),
      fishType,
      position,
      rotation: [0, Math.random() * Math.PI * 2, 0],
      targetPosition,
      scale,
      initialScale: scale, // Store original scale for growth calculations
      color,
      swimSpeed: fishInfo.swimSpeed * (0.8 + Math.random() * 0.4),
      // Initialize simulation properties
      hunger: 0.2,        // Start slightly hungry
      health: 1.0,        // Start healthy
      age: 0,             // Newborn
      growthProgress: 0,  // No growth yet
      stressLevel: 0.1,   // Slight stress from being new
      lastFed: 0,         // Never fed
    }

    return { fish: [...state.fish, newFish] }
  }),

  removeFish: (id) => set((state) => ({
    fish: state.fish.filter(f => f.id !== id),
    selectedFishId: state.selectedFishId === id ? null : state.selectedFishId,
  })),

  updateFish: (id, updates) => set((state) => ({
    fish: state.fish.map(f => f.id === id ? { ...f, ...updates } : f),
  })),

  selectFish: (id) => set({ selectedFishId: id }),

  clearAllFish: () => set({ fish: [], selectedFishId: null }),

  // Simulation methods
  tickFish: (deltaSimHours, difficultyMod, minHealth) => set((state) => {
    const updatedFish = state.fish.map(fish => {
      // Hunger increases over time (faster when stressed)
      const hungerRate = 0.02 * (1 + fish.stressLevel * 0.5) * difficultyMod
      const newHunger = Math.min(1, fish.hunger + hungerRate * deltaSimHours)

      // Health affected by hunger and stress
      let healthDelta = 0
      if (newHunger > 0.7) {
        // Starving - lose health
        healthDelta = -0.01 * (newHunger - 0.7) * 3 * difficultyMod * deltaSimHours
      } else if (newHunger < 0.3 && fish.stressLevel < 0.3) {
        // Well fed and calm - slowly recover health
        healthDelta = 0.005 * deltaSimHours / difficultyMod
      }
      const newHealth = Math.max(minHealth, Math.min(1, fish.health + healthDelta))

      // Stress naturally decreases over time (faster when full)
      const stressRecovery = 0.01 * (1 - newHunger * 0.5) * deltaSimHours
      const newStress = Math.max(0, fish.stressLevel - stressRecovery)

      // Age increases (1 day = 24 sim hours)
      const newAge = fish.age + deltaSimHours / 24

      // Growth progress (slower when hungry/stressed)
      const growthRate = 0.001 * (1 - newHunger * 0.5) * (1 - newStress * 0.5) * deltaSimHours
      const newGrowth = Math.min(1, fish.growthProgress + growthRate)

      // Scale based on growth progress - up to 20% larger at full maturity
      // Uses initialScale to prevent unbounded compounding
      const growthBonus = newGrowth * 0.2 // Up to 20% larger at full growth
      const initialScale = fish.initialScale ?? fish.scale // Fallback for existing saves
      const newScale = initialScale * (1 + growthBonus)

      return {
        ...fish,
        hunger: newHunger,
        health: newHealth,
        stressLevel: newStress,
        age: newAge,
        growthProgress: newGrowth,
        scale: newScale,
      }
    })

    return { fish: updatedFish }
  }),

  feedFish: (fishId, nutrition, simTime) => set((state) => ({
    fish: state.fish.map(fish => {
      if (fish.id !== fishId) return fish
      // Reduce hunger based on nutrition value
      const hungerReduction = nutrition * 0.15
      return {
        ...fish,
        hunger: Math.max(0, fish.hunger - hungerReduction),
        lastFed: simTime,
        stressLevel: Math.max(0, fish.stressLevel - 0.05), // Feeding reduces stress
      }
    }),
  })),

  findHungriestFishNear: (position, maxDistance): PlacedFish | null => {
    const currentFish = useFishStore.getState().fish
    let hungriestFish: PlacedFish | null = null
    let highestHunger = 0.3 // Minimum hunger threshold to seek food

    for (const f of currentFish) {
      const dx = f.position[0] - position[0]
      const dy = f.position[1] - position[1]
      const dz = f.position[2] - position[2]
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (distance <= maxDistance && f.hunger > highestHunger) {
        highestHunger = f.hunger
        hungriestFish = f
      }
    }

    return hungriestFish
  },
}))

export type { PlacedFish }
