import { create } from 'zustand'
import { createHistoryStore } from './historyStore'

export interface TankDimensions {
  length: number  // inches
  width: number   // inches
  height: number  // inches
}

export interface TankHistoryState {
  dimensions: TankDimensions
}

export const useTankHistoryStore = createHistoryStore<TankHistoryState>({
  dimensions: { length: 0, width: 0, height: 0 },
})

export interface TankState {
  dimensions: TankDimensions
  setDimensions: (dimensions: Partial<TankDimensions>) => void
  gallons: number
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

export const useTankStore = create<TankState>((set, get) => {
  // Subscribe to history changes to update canUndo/canRedo
  useTankHistoryStore.subscribe((historyState) => {
    set({
      canUndo: historyState.past.length > 0,
      canRedo: historyState.future.length > 0,
    })
  })

  return {
    dimensions: TANK_PRESETS['40 Breeder'],
    gallons: calculateGallons(TANK_PRESETS['40 Breeder']),
    canUndo: false,
    canRedo: false,

    setDimensions: (newDimensions) => {
      const oldDimensions = get().dimensions
      const dimensions = { ...oldDimensions, ...newDimensions }

      set({
        dimensions,
        gallons: calculateGallons(dimensions)
      })

      useTankHistoryStore.getState().addState({ dimensions })
    },

    undo: () => {
      useTankHistoryStore.getState().undo()
      const historyPresent = useTankHistoryStore.getState().present
      if (historyPresent) {
        set({
          dimensions: historyPresent.dimensions,
          gallons: calculateGallons(historyPresent.dimensions)
        })
      }
    },

    redo: () => {
      useTankHistoryStore.getState().redo()
      const historyPresent = useTankHistoryStore.getState().present
      if (historyPresent) {
        set({
          dimensions: historyPresent.dimensions,
          gallons: calculateGallons(historyPresent.dimensions)
        })
      }
    },
  }
})

// Initialize history store with initial tank dimensions
useTankHistoryStore.getState().clear({ dimensions: useTankStore.getState().dimensions })
