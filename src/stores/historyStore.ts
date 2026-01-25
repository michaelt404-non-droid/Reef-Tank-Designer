import { create } from 'zustand'
import { useTankStore } from './tankStore'
import { useRockStore } from './rockStore'
import { useCoralStore } from './coralStore'
import { useFishStore } from './fishStore'
import { useEquipmentStore } from './equipmentStore'
import { useLightStore } from './lightStore'

// Snapshot of all design-mode state
interface DesignSnapshot {
  tank: {
    dimensions: { length: number; width: number; height: number }
  }
  rocks: Array<{
    id: string
    rockInfoId: string
    type: 'procedural' | 'model'
    proceduralType?: string
    modelPath?: string
    position: [number, number, number]
    rotation: [number, number, number]
    scale: number
    color: string
  }>
  corals: Array<{
    id: string
    coralType: string
    position: [number, number, number]
    rotation: [number, number, number]
    scale: number
    color: string
    health: number
    growthProgress: number
    colorIntensity: number
    baseScale: number
  }>
  fish: Array<{
    id: string
    fishType: string
    position: [number, number, number]
    rotation: [number, number, number]
    targetPosition: [number, number, number]
    scale: number
    initialScale: number
    color: string
    swimSpeed: number
    hunger: number
    health: number
    age: number
    growthProgress: number
    stressLevel: number
    lastFed: number
  }>
  equipment: Array<{
    id: string
    equipmentInfoId: string
    type: 'pump' | 'heater' | 'skimmer' | 'wavemaker' | 'ato'
    name: string
    position: [number, number, number]
    rotation: [number, number, number]
    scale: number
    color: string
    visible: boolean
  }>
  lights: Array<{
    id: string
    fixtureId: string
    fixture: {
      id: string
      brand: string
      model: string
      type: 'led' | 'hybrid' | 't5'
      coverage: { length: number; width: number }
      maxPAR: number
      spreadAngle: number
      colors: string[]
      wattage: number
      price: number
    }
    position: [number, number, number]
    intensity: number
    enabled: boolean
  }>
  timestamp: number
  action: string
}

interface HistoryState {
  past: DesignSnapshot[]
  future: DesignSnapshot[]
  maxHistory: number

  // Actions
  pushSnapshot: (action: string) => void
  undo: () => void
  redo: () => void
  clear: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

// Gather current state from all design stores
function gatherSnapshot(action: string): DesignSnapshot {
  const tankState = useTankStore.getState()
  const rockState = useRockStore.getState()
  const coralState = useCoralStore.getState()
  const fishState = useFishStore.getState()
  const equipmentState = useEquipmentStore.getState()
  const lightState = useLightStore.getState()

  return {
    tank: {
      dimensions: { ...tankState.dimensions },
    },
    rocks: rockState.rocks.map(rock => ({
      id: rock.id,
      rockInfoId: rock.rockInfoId,
      type: rock.type,
      proceduralType: rock.proceduralType,
      modelPath: rock.modelPath,
      position: [...rock.position] as [number, number, number],
      rotation: [...rock.rotation] as [number, number, number],
      scale: rock.scale,
      color: rock.color,
    })),
    corals: coralState.corals.map(coral => ({
      id: coral.id,
      coralType: coral.coralType,
      position: [...coral.position] as [number, number, number],
      rotation: [...coral.rotation] as [number, number, number],
      scale: coral.scale,
      color: coral.color,
      health: coral.health,
      growthProgress: coral.growthProgress,
      colorIntensity: coral.colorIntensity,
      baseScale: coral.baseScale,
    })),
    fish: fishState.fish.map(f => ({
      id: f.id,
      fishType: f.fishType,
      position: [...f.position] as [number, number, number],
      rotation: [...f.rotation] as [number, number, number],
      targetPosition: [...f.targetPosition] as [number, number, number],
      scale: f.scale,
      initialScale: f.initialScale,
      color: f.color,
      swimSpeed: f.swimSpeed,
      hunger: f.hunger,
      health: f.health,
      age: f.age,
      growthProgress: f.growthProgress,
      stressLevel: f.stressLevel,
      lastFed: f.lastFed,
    })),
    equipment: equipmentState.equipment.map(eq => ({
      id: eq.id,
      equipmentInfoId: eq.equipmentInfoId,
      type: eq.type,
      name: eq.name,
      position: [...eq.position] as [number, number, number],
      rotation: [...eq.rotation] as [number, number, number],
      scale: eq.scale,
      color: eq.color,
      visible: eq.visible,
    })),
    lights: lightState.lights.map(light => ({
      id: light.id,
      fixtureId: light.fixtureId,
      fixture: { ...light.fixture },
      position: [...light.position] as [number, number, number],
      intensity: light.intensity,
      enabled: light.enabled,
    })),
    timestamp: Date.now(),
    action,
  }
}

// Restore state from a snapshot
function restoreSnapshot(snapshot: DesignSnapshot): void {
  // Restore tank dimensions
  useTankStore.getState().setDimensions(snapshot.tank.dimensions)

  // Restore rocks
  useRockStore.setState({
    rocks: snapshot.rocks.map(rock => ({
      ...rock,
      proceduralType: rock.proceduralType as 'boulder' | 'branch' | 'shelf' | 'pillar' | 'rubble' | 'cave' | 'arch' | undefined,
    })),
    selectedRockId: null,
  })

  // Restore corals
  useCoralStore.setState({
    corals: snapshot.corals.map(coral => ({
      ...coral,
      coralType: coral.coralType as 'mushrooms' | 'zoanthids' | 'softCorals' | 'lps' | 'sps' | 'acropora',
    })),
    selectedCoralId: null,
  })

  // Restore fish
  useFishStore.setState({
    fish: snapshot.fish.map(f => ({
      ...f,
      fishType: f.fishType as 'clownfish' | 'tang' | 'wrasse' | 'goby' | 'blenny' | 'angelfish' | 'chromis' | 'cardinalfish',
    })),
    selectedFishId: null,
  })

  // Restore equipment
  useEquipmentStore.setState({
    equipment: snapshot.equipment,
    selectedEquipmentId: null,
  })

  // Restore lights
  useLightStore.setState({
    lights: snapshot.lights,
    selectedLightId: null,
  })
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  maxHistory: 50,

  pushSnapshot: (action: string) => {
    const snapshot = gatherSnapshot(action)
    set((state) => ({
      past: [...state.past.slice(-(state.maxHistory - 1)), snapshot],
      future: [], // Clear future on new action
    }))
  },

  undo: () => {
    const { past, future } = get()
    if (past.length === 0) return

    // Current state becomes future
    const currentSnapshot = gatherSnapshot('Current')

    // Get the previous state
    const previousSnapshot = past[past.length - 1]
    const newPast = past.slice(0, -1)

    // Restore the previous state
    restoreSnapshot(previousSnapshot)

    set({
      past: newPast,
      future: [currentSnapshot, ...future],
    })
  },

  redo: () => {
    const { past, future } = get()
    if (future.length === 0) return

    // Current state becomes past
    const currentSnapshot = gatherSnapshot('Current')

    // Get the next state
    const nextSnapshot = future[0]
    const newFuture = future.slice(1)

    // Restore the next state
    restoreSnapshot(nextSnapshot)

    set({
      past: [...past, currentSnapshot],
      future: newFuture,
    })
  },

  clear: () => {
    set({ past: [], future: [] })
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}))
