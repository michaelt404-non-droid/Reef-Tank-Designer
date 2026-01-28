import { create } from 'zustand'
import { useTankStore } from './tankStore'
import { createHistoryStore } from './historyStore'
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

export interface RockHistoryState {
  rocks: PlacedRock[]
}

export const useRockHistoryStore = createHistoryStore<RockHistoryState>({
  rocks: [],
})

// Built-in 3D model rocks
export const BUILTIN_ROCKS: RockInfo[] = [
  { id: 'chunky-reef', name: 'Chunky Reef', description: 'Textured reef rock', baseScale: 0.3, type: 'model', modelPath: '/models/rocks/chunky_reef_texture.glb' },
  { id: 'flat-plate', name: 'Flat Plate', description: 'Plating reef rock', baseScale: 0.3, type: 'model', modelPath: '/models/rocks/flat_plating_reef_texture.glb' },
  { id: 'rubble', name: 'Rubble', description: 'Small rock pieces', baseScale: 0.3, type: 'model', modelPath: '/models/rocks/rubble_texture.glb' },
  { id: 'pillar', name: 'Pillar', description: 'Tall vertical rock', baseScale: 0.3, type: 'model', modelPath: '/models/rocks/pillar_texture.glb' },
  { id: 'cave', name: 'Cave', description: 'Hollow hiding spot', baseScale: 0.3, type: 'model', modelPath: '/models/rocks/cave_texture.glb' },
  { id: 'arch', name: 'Arch', description: 'Swim-through arch', baseScale: 0.3, type: 'model', modelPath: '/models/rocks/arch_texture.glb' },
]

// Legacy - keeping for backwards compatibility
export const PROCEDURAL_ROCKS: RockInfo[] = []
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
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
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

export const useRockStore = create<RockState>((set, get) => {
  // Subscribe to history changes to update canUndo/canRedo
  useRockHistoryStore.subscribe((historyState) => {
    set({
      canUndo: historyState.past.length > 0,
      canRedo: historyState.future.length > 0,
    })
  })

  return {
    rocks: [],
    customRockModels: [],
    selectedRockId: null,
    canUndo: false,
    canRedo: false,

    addRock: (rockInfo) => {
      const tankDimensions = useTankStore.getState().dimensions
      const tankBounds = getTankBounds(tankDimensions)

      const maxScale = getMaxScale(rockInfo.type, rockInfo.proceduralType, tankDimensions)
      const baseScale = rockInfo.baseScale * (0.8 + Math.random() * 0.4)
      const clampedScale = Math.min(baseScale, maxScale)

      const rockBounds = getRockBounds(rockInfo.type, rockInfo.proceduralType, clampedScale)
      const isModelRock = rockInfo.type === 'model'
      const sandBedHeight = 0.12

      const initialY = isModelRock ? sandBedHeight : sandBedHeight + rockBounds.halfY

      const initialPosition: [number, number, number] = [
        (Math.random() - 0.5) * (tankBounds.halfX * 2 - rockBounds.halfX * 2 - 0.2),
        initialY,
        (Math.random() - 0.5) * (tankBounds.halfZ * 2 - rockBounds.halfZ * 2 - 0.2),
      ]
      const clampedPosition = clampRockPosition(initialPosition, rockBounds, tankBounds, isModelRock)

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
      const updatedRocks = [...get().rocks, newRock]
      set({ rocks: updatedRocks })
      useRockHistoryStore.getState().addState({ rocks: updatedRocks })
    },

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

    removeRock: (id) => {
      const updatedRocks = get().rocks.filter(r => r.id !== id)
      set({
        rocks: updatedRocks,
        selectedRockId: get().selectedRockId === id ? null : get().selectedRockId,
      })
      useRockHistoryStore.getState().addState({ rocks: updatedRocks })
    },

    updateRock: (id, updates) => {
      const updatedRocks = get().rocks.map(r => r.id === id ? { ...r, ...updates } : r)
      set({ rocks: updatedRocks })
      useRockHistoryStore.getState().addState({ rocks: updatedRocks })
    },

    selectRock: (id) => set({ selectedRockId: id }),

    clearAllRocks: () => {
      set({ rocks: [], selectedRockId: null })
      useRockHistoryStore.getState().addState({ rocks: [] })
    },

    undo: () => {
      useRockHistoryStore.getState().undo()
      const historyPresent = useRockHistoryStore.getState().present
      if (historyPresent) {
        set({ rocks: historyPresent.rocks })
      }
    },

    redo: () => {
      useRockHistoryStore.getState().redo()
      const historyPresent = useRockHistoryStore.getState().present
      if (historyPresent) {
        set({ rocks: historyPresent.rocks })
      }
    },
  }
})

// Initialize history store with initial rock state
useRockHistoryStore.getState().clear({ rocks: useRockStore.getState().rocks })
