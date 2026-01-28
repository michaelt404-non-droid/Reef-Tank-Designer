import { create } from 'zustand'
import { useTankStore } from './tankStore'
import { createHistoryStore } from './historyStore'
import { EQUIPMENT_INFO } from '../data/equipment'

// Inline types to avoid Safari import issues
type EquipmentType = 'pump' | 'heater' | 'skimmer' | 'wavemaker' | 'ato'

interface PlacedEquipment {
  id: string
  equipmentInfoId: string
  type: EquipmentType
  name: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  color: string
  visible: boolean // Can hide sump equipment
}

export interface EquipmentHistoryState {
  equipment: PlacedEquipment[]
}

export const useEquipmentHistoryStore = createHistoryStore<EquipmentHistoryState>({
  equipment: [],
})

interface EquipmentState {
  equipment: PlacedEquipment[]
  selectedEquipmentId: string | null
  showSumpEquipment: boolean
  addEquipment: (equipmentInfoId: string) => void
  removeEquipment: (id: string) => void
  updateEquipment: (id: string, updates: Partial<PlacedEquipment>) => void
  selectEquipment: (id: string | null) => void
  toggleSumpVisibility: () => void
  clearAllEquipment: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

const generateId = () => Math.random().toString(36).substring(2, 9)
const TANK_SCALE = 0.1

// Calculate equipment scale proportional to tank size
// Base scale assumes a ~48" tank, scale up/down from there
function getEquipmentScale(
  tankDimensions: { length: number; width: number; height: number }
): number {
  const baselineTankSize = 48 // inches - a standard 4ft tank
  const tankSize = Math.min(tankDimensions.length, tankDimensions.width)
  // Scale proportionally, with a reasonable range (0.3 to 1.5)
  const scale = Math.max(0.3, Math.min(1.5, tankSize / baselineTankSize))
  return scale
}

// Calculate position within tank based on equipment placement preference
// Keeps equipment inside the tank walls
function getEquipmentPosition(
  equipmentInfo: typeof EQUIPMENT_INFO[number],
  tankDimensions: { length: number; width: number; height: number },
  equipmentScale: number
): [number, number, number] {
  const tankHalfLength = (tankDimensions.length * TANK_SCALE) / 2
  const tankHalfWidth = (tankDimensions.width * TANK_SCALE) / 2
  const tankHeight = tankDimensions.height * TANK_SCALE

  // Convert equipment size from inches to scene units, accounting for scale
  const eqWidth = equipmentInfo.size.width * TANK_SCALE * equipmentScale
  const eqHeight = equipmentInfo.size.height * TANK_SCALE * equipmentScale
  const eqDepth = equipmentInfo.size.depth * TANK_SCALE * equipmentScale

  // Margin to keep equipment inside the glass
  const wallMargin = 0.02

  switch (equipmentInfo.defaultPosition) {
    case 'back':
      // Along back wall - position so equipment is against the glass, not through it
      return [
        (Math.random() - 0.5) * (tankHalfLength - eqWidth) * 0.8,
        Math.min(eqHeight / 2 + 0.1, tankHeight - eqHeight / 2),
        -tankHalfWidth + eqDepth / 2 + wallMargin,
      ]
    case 'side': {
      // Along side wall (randomly left or right)
      const side = Math.random() > 0.5 ? 1 : -1
      return [
        side * (tankHalfLength - eqDepth / 2 - wallMargin),
        Math.min(tankHeight * 0.6, tankHeight - eqHeight / 2),
        (Math.random() - 0.5) * (tankHalfWidth - eqWidth) * 0.5,
      ]
    }
    case 'corner': {
      // Back corner
      const cornerSide = Math.random() > 0.5 ? 1 : -1
      return [
        cornerSide * (tankHalfLength - eqWidth / 2 - wallMargin),
        Math.min(eqHeight / 2 + 0.1, tankHeight - eqHeight / 2),
        -tankHalfWidth + eqDepth / 2 + wallMargin,
      ]
    }
    case 'sump':
      // Below/behind tank (not visible in main view)
      return [
        (Math.random() - 0.5) * 0.5,
        -0.5,
        -tankHalfWidth - 0.5,
      ]
    default:
      return [0, 0.5, 0]
  }
}

export const useEquipmentStore = create<EquipmentState>((set, get) => {
  // Subscribe to history changes to update canUndo/canRedo
  useEquipmentHistoryStore.subscribe((historyState) => {
    set({
      canUndo: historyState.past.length > 0,
      canRedo: historyState.future.length > 0,
    })
  })

  return {
    equipment: [],
    selectedEquipmentId: null,
    showSumpEquipment: false,
    canUndo: false,
    canRedo: false,

    addEquipment: (equipmentInfoId) => {
      const info = EQUIPMENT_INFO.find(e => e.id === equipmentInfoId)
      if (!info) return

      const tankDimensions = useTankStore.getState().dimensions
      const scale = getEquipmentScale(tankDimensions)
      const position = getEquipmentPosition(info, tankDimensions, scale)

      let rotation: [number, number, number] = [0, 0, 0]
      if (info.defaultPosition === 'side') {
        rotation = [0, Math.PI / 2, 0]
      }

      const newEquipment: PlacedEquipment = {
        id: generateId(),
        equipmentInfoId: info.id,
        type: info.type,
        name: info.name,
        position,
        rotation,
        scale,
        color: info.color,
        visible: info.placement !== 'external',
      }

      const updatedEquipment = [...get().equipment, newEquipment]
      set({ equipment: updatedEquipment })
      useEquipmentHistoryStore.getState().addState({ equipment: updatedEquipment })
    },

    removeEquipment: (id) => {
      const updatedEquipment = get().equipment.filter(e => e.id !== id)
      set({
        equipment: updatedEquipment,
        selectedEquipmentId: get().selectedEquipmentId === id ? null : get().selectedEquipmentId,
      })
      useEquipmentHistoryStore.getState().addState({ equipment: updatedEquipment })
    },

    updateEquipment: (id, updates) => {
      const updatedEquipment = get().equipment.map(e => e.id === id ? { ...e, ...updates } : e)
      set({ equipment: updatedEquipment })
      useEquipmentHistoryStore.getState().addState({ equipment: updatedEquipment })
    },

    selectEquipment: (id) => set({ selectedEquipmentId: id }),

    toggleSumpVisibility: () => set((state) => ({
      showSumpEquipment: !state.showSumpEquipment,
    })),

    clearAllEquipment: () => {
      set({ equipment: [], selectedEquipmentId: null })
      useEquipmentHistoryStore.getState().addState({ equipment: [] })
    },

    undo: () => {
      useEquipmentHistoryStore.getState().undo()
      const historyPresent = useEquipmentHistoryStore.getState().present
      if (historyPresent) {
        set({ equipment: historyPresent.equipment })
      }
    },

    redo: () => {
      useEquipmentHistoryStore.getState().redo()
      const historyPresent = useEquipmentHistoryStore.getState().present
      if (historyPresent) {
        set({ equipment: historyPresent.equipment })
      }
    },
  }
})

// Initialize history store with initial equipment state
useEquipmentHistoryStore.getState().clear({ equipment: useEquipmentStore.getState().equipment })

export type { PlacedEquipment }
