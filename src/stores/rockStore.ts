import { create } from 'zustand'
import { useTankStore } from './tankStore'
import { getMaxScale, getRockBounds, getTankBounds, clampRockPosition } from '../utils/rockBounds'

export type ProceduralRockType = 'boulder' | 'branch' | 'shelf' | 'pillar' | 'rubble' | 'cave' | 'arch'

export interface RockInfo {
  id: string
  name: string
  description: string
  baseScale: number
  type: 'procedural' | 'model'
  proceduralType?: ProceduralRockType
  modelPath?: string
}

// Built-in procedural rocks
export const PROCEDURAL_ROCKS: RockInfo[] = [
  { id: 'boulder', name: 'Boulder', description: 'Large rounded rock', baseScale: 0.4, type: 'procedural', proceduralType: 'boulder' },
  { id: 'branch', name: 'Branch Rock', description: 'Branching structure', baseScale: 0.35, type: 'procedural', proceduralType: 'branch' },
  { id: 'shelf', name: 'Shelf Rock', description: 'Flat platform rock', baseScale: 0.5, type: 'procedural', proceduralType: 'shelf' },
  { id: 'pillar', name: 'Pillar', description: 'Tall vertical rock', baseScale: 0.3, type: 'procedural', proceduralType: 'pillar' },
  { id: 'rubble', name: 'Rubble', description: 'Small rock pieces', baseScale: 0.2, type: 'procedural', proceduralType: 'rubble' },
  { id: 'cave', name: 'Cave', description: 'Hollow hiding spot', baseScale: 0.4, type: 'procedural', proceduralType: 'cave' },
  { id: 'arch', name: 'Arch', description: 'Swim-through arch', baseScale: 0.45, type: 'procedural', proceduralType: 'arch' },
]

// This will be populated with custom model rocks
export const MODEL_ROCKS: RockInfo[] = []

export interface PlacedRock {
  id: string
  rockInfoId: string
  type: 'procedural' | 'model'
  proceduralType?: ProceduralRockType
  modelPath?: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  color: string
}

interface RockState {
  rocks: PlacedRock[]
  customRockModels: RockInfo[]
  selectedRockId: string | null
  addRock: (rockInfo: RockInfo) => void
  addCustomModel: (name: string, modelPath: string) => void
  removeRock: (id: string) => void
  updateRock: (id: string, updates: Partial<PlacedRock>) => void
  selectRock: (id: string | null) => void
  clearAllRocks: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

const ROCK_COLORS = [
  '#8B7355',
  '#6B5344',
  '#9C8B7A',
  '#7A6B5A',
  '#5C4D3D',
  '#A89B8B',
  '#8A8278',
]

export const useRockStore = create<RockState>((set) => ({
  rocks: [],
  customRockModels: [],
  selectedRockId: null,

  addRock: (rockInfo) => set((state) => {
    // Get tank dimensions to constrain rock placement
    const tankDimensions = useTankStore.getState().dimensions
    const tankBounds = getTankBounds(tankDimensions)

    // Calculate max scale for this rock type and clamp initial scale
    const maxScale = getMaxScale(rockInfo.type, rockInfo.proceduralType, tankDimensions)
    const baseScale = rockInfo.baseScale * (0.8 + Math.random() * 0.4)
    const clampedScale = Math.min(baseScale, maxScale)

    // Generate initial position within tank bounds
    const rockBounds = getRockBounds(rockInfo.type, rockInfo.proceduralType, clampedScale)
    const initialPosition: [number, number, number] = [
      (Math.random() - 0.5) * (tankBounds.halfX * 2 - rockBounds.halfX * 2 - 0.2),
      rockBounds.halfY + 0.05, // Sit just above sand bed
      (Math.random() - 0.5) * (tankBounds.halfZ * 2 - rockBounds.halfZ * 2 - 0.2),
    ]
    const clampedPosition = clampRockPosition(initialPosition, rockBounds, tankBounds)

    const newRock: PlacedRock = {
      id: generateId(),
      rockInfoId: rockInfo.id,
      type: rockInfo.type,
      proceduralType: rockInfo.proceduralType,
      modelPath: rockInfo.modelPath,
      position: clampedPosition,
      rotation: [0, Math.random() * Math.PI * 2, 0],
      scale: clampedScale,
      color: ROCK_COLORS[Math.floor(Math.random() * ROCK_COLORS.length)],
    }
    return { rocks: [...state.rocks, newRock] }
  }),

  addCustomModel: (name, modelPath) => set((state) => {
    const newModel: RockInfo = {
      id: `model-${generateId()}`,
      name,
      description: 'Custom 3D model',
      baseScale: 0.5,
      type: 'model',
      modelPath,
    }
    return { customRockModels: [...state.customRockModels, newModel] }
  }),

  removeRock: (id) => set((state) => ({
    rocks: state.rocks.filter(r => r.id !== id),
    selectedRockId: state.selectedRockId === id ? null : state.selectedRockId,
  })),

  updateRock: (id, updates) => set((state) => ({
    rocks: state.rocks.map(r => r.id === id ? { ...r, ...updates } : r),
  })),

  selectRock: (id) => set({ selectedRockId: id }),

  clearAllRocks: () => set({ rocks: [], selectedRockId: null }),
}))
