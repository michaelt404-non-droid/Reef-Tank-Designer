import { create } from 'zustand'
import { useTankStore } from './tankStore'
import { EQUIPMENT_INFO } from '../data/equipment'

// Inline types to avoid Safari import issues
type EquipmentType = 'pump' | 'heater' | 'skimmer' | 'powerhead' | 'wavemaker' | 'ato'

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
}

const generateId = () => Math.random().toString(36).substring(2, 9)
const TANK_SCALE = 0.1

// Calculate position within tank based on equipment placement preference
function getEquipmentPosition(
  equipmentInfo: typeof EQUIPMENT_INFO[number],
  tankDimensions: { length: number; width: number; height: number }
): [number, number, number] {
  const tankHalfLength = (tankDimensions.length * TANK_SCALE) / 2
  const tankHalfWidth = (tankDimensions.width * TANK_SCALE) / 2
  const tankHeight = tankDimensions.height * TANK_SCALE

  // Convert equipment size from inches to scene units
  const eqHeight = equipmentInfo.size.height * TANK_SCALE

  switch (equipmentInfo.defaultPosition) {
    case 'back':
      // Along back wall
      return [
        (Math.random() - 0.5) * tankHalfLength,
        eqHeight / 2 + 0.1,
        -tankHalfWidth + 0.15,
      ]
    case 'side':
      // Along side wall (randomly left or right)
      const side = Math.random() > 0.5 ? 1 : -1
      return [
        side * (tankHalfLength - 0.15),
        tankHeight * 0.6,
        (Math.random() - 0.5) * tankHalfWidth * 0.5,
      ]
    case 'corner':
      // Back corner
      const cornerSide = Math.random() > 0.5 ? 1 : -1
      return [
        cornerSide * (tankHalfLength - 0.2),
        eqHeight / 2 + 0.1,
        -tankHalfWidth + 0.2,
      ]
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

export const useEquipmentStore = create<EquipmentState>((set) => ({
  equipment: [],
  selectedEquipmentId: null,
  showSumpEquipment: false,

  addEquipment: (equipmentInfoId) => set((state) => {
    const info = EQUIPMENT_INFO.find(e => e.id === equipmentInfoId)
    if (!info) return state

    const tankDimensions = useTankStore.getState().dimensions
    const position = getEquipmentPosition(info, tankDimensions)

    // Rotation based on placement
    let rotation: [number, number, number] = [0, 0, 0]
    if (info.defaultPosition === 'side') {
      rotation = [0, Math.PI / 2, 0] // Face inward
    }

    const newEquipment: PlacedEquipment = {
      id: generateId(),
      equipmentInfoId: info.id,
      type: info.type,
      name: info.name,
      position,
      rotation,
      scale: 1,
      color: info.color,
      visible: info.placement !== 'external', // Hide sump equipment by default
    }

    return { equipment: [...state.equipment, newEquipment] }
  }),

  removeEquipment: (id) => set((state) => ({
    equipment: state.equipment.filter(e => e.id !== id),
    selectedEquipmentId: state.selectedEquipmentId === id ? null : state.selectedEquipmentId,
  })),

  updateEquipment: (id, updates) => set((state) => ({
    equipment: state.equipment.map(e => e.id === id ? { ...e, ...updates } : e),
  })),

  selectEquipment: (id) => set({ selectedEquipmentId: id }),

  toggleSumpVisibility: () => set((state) => ({
    showSumpEquipment: !state.showSumpEquipment,
  })),

  clearAllEquipment: () => set({ equipment: [], selectedEquipmentId: null }),
}))

export type { PlacedEquipment }
