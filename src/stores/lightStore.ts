import { create } from 'zustand'

interface LightFixtureData {
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

export interface PlacedLight {
  id: string
  fixtureId: string
  fixture: LightFixtureData
  position: [number, number, number]
  intensity: number
  enabled: boolean
}

interface LightState {
  lights: PlacedLight[]
  selectedLightId: string | null
  showPAROverlay: boolean
  addLight: (fixture: LightFixtureData) => void
  removeLight: (id: string) => void
  updateLight: (id: string, updates: Partial<PlacedLight>) => void
  selectLight: (id: string | null) => void
  togglePAROverlay: () => void
  clearAllLights: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export const useLightStore = create<LightState>((set) => ({
  lights: [],
  selectedLightId: null,
  showPAROverlay: true,

  addLight: (fixture) => set((state) => {
    const newLight: PlacedLight = {
      id: generateId(),
      fixtureId: fixture.id,
      fixture,
      position: [0, 3, 0],
      intensity: 100,
      enabled: true,
    }
    return { lights: [...state.lights, newLight] }
  }),

  removeLight: (id) => set((state) => ({
    lights: state.lights.filter(l => l.id !== id),
    selectedLightId: state.selectedLightId === id ? null : state.selectedLightId,
  })),

  updateLight: (id, updates) => set((state) => ({
    lights: state.lights.map(l => l.id === id ? { ...l, ...updates } : l),
  })),

  selectLight: (id) => set({ selectedLightId: id }),

  togglePAROverlay: () => set((state) => ({ showPAROverlay: !state.showPAROverlay })),

  clearAllLights: () => set({ lights: [], selectedLightId: null }),
}))
