import { useTankStore } from '../stores/tankStore'
import { useRockStore } from '../stores/rockStore'
import { useCoralStore } from '../stores/coralStore'
import { useFishStore } from '../stores/fishStore'
import { useEquipmentStore } from '../stores/equipmentStore'
import { useLightStore } from '../stores/lightStore'
import { useSimulationStore } from '../stores/simulationStore'

// Version for save file compatibility (bumped for simulation support)
const SAVE_VERSION = 2

interface SaveData {
  version: number
  timestamp: number
  name: string
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
  }>
  fish: Array<{
    id: string
    fishType: string
    position: [number, number, number]
    rotation: [number, number, number]
    targetPosition: [number, number, number]
    scale: number
    color: string
    swimSpeed: number
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
  equipment: Array<{
    id: string
    equipmentInfoId: string
    type: 'pump' | 'heater' | 'skimmer' | 'powerhead' | 'wavemaker' | 'ato'
    name: string
    position: [number, number, number]
    rotation: [number, number, number]
    scale: number
    color: string
    visible: boolean
  }>
  // Simulation state (optional for backwards compatibility)
  simulation?: {
    difficulty: 'beginner' | 'intermediate' | 'expert'
    simulationTime: number
    dayProgress: number
    timeOfDay: 'day' | 'night'
    dayCount: number
    waterParams: {
      temperature: number
      salinity: number
      ph: number
      nitrate: number
      ammonia: number
      nitrite: number
      phosphate: number
      alkalinity: number
      calcium: number
      magnesium: number
      potassium: number
      strontium: number
    }
    algaeLevel: number
    autoFeeder: {
      enabled: boolean
      schedule: number[]
      amount: number
      lastFed: number
    }
  }
}

// Gather all state into a save object
export function gatherSaveData(name: string): SaveData {
  const tankState = useTankStore.getState()
  const rockState = useRockStore.getState()
  const coralState = useCoralStore.getState()
  const fishState = useFishStore.getState()
  const equipmentState = useEquipmentStore.getState()
  const lightState = useLightStore.getState()
  const simState = useSimulationStore.getState()

  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    name,
    tank: {
      dimensions: tankState.dimensions,
    },
    rocks: rockState.rocks.map(rock => ({
      id: rock.id,
      rockInfoId: rock.rockInfoId,
      type: rock.type,
      proceduralType: rock.proceduralType,
      modelPath: rock.modelPath,
      position: rock.position,
      rotation: rock.rotation,
      scale: rock.scale,
      color: rock.color,
    })),
    corals: coralState.corals.map(coral => ({
      id: coral.id,
      coralType: coral.coralType,
      position: coral.position,
      rotation: coral.rotation,
      scale: coral.scale,
      color: coral.color,
    })),
    fish: fishState.fish.map(f => ({
      id: f.id,
      fishType: f.fishType,
      position: f.position,
      rotation: f.rotation,
      targetPosition: f.targetPosition,
      scale: f.scale,
      color: f.color,
      swimSpeed: f.swimSpeed,
    })),
    lights: lightState.lights.map(light => ({
      id: light.id,
      fixtureId: light.fixtureId,
      fixture: light.fixture,
      position: light.position,
      intensity: light.intensity,
      enabled: light.enabled,
    })),
    equipment: equipmentState.equipment.map(eq => ({
      id: eq.id,
      equipmentInfoId: eq.equipmentInfoId,
      type: eq.type,
      name: eq.name,
      position: eq.position,
      rotation: eq.rotation,
      scale: eq.scale,
      color: eq.color,
      visible: eq.visible,
    })),
    simulation: {
      difficulty: simState.difficulty,
      simulationTime: simState.simulationTime,
      dayProgress: simState.dayProgress,
      timeOfDay: simState.timeOfDay,
      dayCount: simState.dayCount,
      waterParams: { ...simState.waterParams },
      algaeLevel: simState.algaeLevel,
      autoFeeder: { ...simState.autoFeeder },
    },
  }
}

// Restore state from save data
export function restoreSaveData(data: SaveData): boolean {
  try {
    // Validate version
    if (data.version !== SAVE_VERSION) {
      console.warn('Save file version mismatch, attempting to load anyway')
    }

    // Restore tank dimensions
    useTankStore.getState().setDimensions(data.tank.dimensions)

    // Clear and restore rocks
    const rockStore = useRockStore.getState()
    rockStore.clearAllRocks()
    for (const rock of data.rocks) {
      // Directly set rocks array to preserve IDs
      useRockStore.setState(state => ({
        rocks: [...state.rocks, rock as any]
      }))
    }

    // Clear and restore corals
    const coralStore = useCoralStore.getState()
    coralStore.clearAllCorals()
    for (const coral of data.corals) {
      useCoralStore.setState(state => ({
        corals: [...state.corals, coral as any]
      }))
    }

    // Clear and restore fish
    const fishStore = useFishStore.getState()
    fishStore.clearAllFish()
    if (data.fish) {
      for (const f of data.fish) {
        useFishStore.setState(state => ({
          fish: [...state.fish, f as any]
        }))
      }
    }

    // Clear and restore lights
    const lightStore = useLightStore.getState()
    lightStore.clearAllLights()
    for (const light of data.lights) {
      useLightStore.setState(state => ({
        lights: [...state.lights, light as any]
      }))
    }

    // Clear and restore equipment
    const equipmentStore = useEquipmentStore.getState()
    equipmentStore.clearAllEquipment()
    if (data.equipment) {
      for (const eq of data.equipment) {
        useEquipmentStore.setState(state => ({
          equipment: [...state.equipment, eq as any]
        }))
      }
    }

    // Restore simulation state if present
    if (data.simulation) {
      useSimulationStore.setState({
        difficulty: data.simulation.difficulty,
        simulationTime: data.simulation.simulationTime,
        dayProgress: data.simulation.dayProgress,
        timeOfDay: data.simulation.timeOfDay,
        dayCount: data.simulation.dayCount,
        waterParams: data.simulation.waterParams,
        algaeLevel: data.simulation.algaeLevel,
        autoFeeder: data.simulation.autoFeeder,
        isRunning: false, // Always start paused after load
        mode: 'design', // Start in design mode
      })
    }

    return true
  } catch (error) {
    console.error('Failed to restore save data:', error)
    return false
  }
}

// Save to localStorage
export function saveToLocalStorage(name: string): boolean {
  try {
    const data = gatherSaveData(name)
    const saves = getLocalStorageSaves()
    saves[name] = data
    localStorage.setItem('reef-tank-saves', JSON.stringify(saves))
    return true
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
    return false
  }
}

// Get all saves from localStorage
export function getLocalStorageSaves(): Record<string, SaveData> {
  try {
    const raw = localStorage.getItem('reef-tank-saves')
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

// Load from localStorage
export function loadFromLocalStorage(name: string): boolean {
  try {
    const saves = getLocalStorageSaves()
    const data = saves[name]
    if (!data) return false
    return restoreSaveData(data)
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
    return false
  }
}

// Delete from localStorage
export function deleteFromLocalStorage(name: string): boolean {
  try {
    const saves = getLocalStorageSaves()
    delete saves[name]
    localStorage.setItem('reef-tank-saves', JSON.stringify(saves))
    return true
  } catch {
    return false
  }
}

// Export to file (download)
export function exportToFile(name: string): void {
  const data = gatherSaveData(name)
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${name.replace(/[^a-z0-9]/gi, '_')}.reef`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Import from file
export function importFromFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string
        const data = JSON.parse(json) as SaveData
        const success = restoreSaveData(data)
        resolve(success)
      } catch (error) {
        console.error('Failed to import file:', error)
        resolve(false)
      }
    }
    reader.onerror = () => resolve(false)
    reader.readAsText(file)
  })
}
