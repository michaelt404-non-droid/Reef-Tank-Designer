import { create } from 'zustand'

export interface TankDimensions {
  length: number  // inches
  width: number   // inches
  height: number  // inches
}

export interface TankState {
  dimensions: TankDimensions
  setDimensions: (dimensions: Partial<TankDimensions>) => void
  gallons: number
}

// Common tank presets (in inches)
export const TANK_PRESETS = {
  '10 Gallon': { length: 20, width: 10, height: 12 },
  '20 Long': { length: 30, width: 12, height: 12 },
  '29 Gallon': { length: 30, width: 12, height: 18 },
  '40 Breeder': { length: 36, width: 18, height: 16 },
  '55 Gallon': { length: 48, width: 13, height: 21 },
  '75 Gallon': { length: 48, width: 18, height: 21 },
  '90 Gallon': { length: 48, width: 18, height: 24 },
  '120 Gallon': { length: 48, width: 24, height: 24 },
  '180 Gallon': { length: 72, width: 24, height: 24 },
} as const

// Calculate gallons from dimensions (in inches)
const calculateGallons = (dims: TankDimensions): number => {
  return Math.round((dims.length * dims.width * dims.height) / 231 * 10) / 10
}

export const useTankStore = create<TankState>((set) => ({
  dimensions: TANK_PRESETS['40 Breeder'],
  gallons: calculateGallons(TANK_PRESETS['40 Breeder']),

  setDimensions: (newDimensions) => set((state) => {
    const dimensions = { ...state.dimensions, ...newDimensions }
    return {
      dimensions,
      gallons: calculateGallons(dimensions)
    }
  }),
}))
