import { create } from 'zustand'

interface UIState {
  cameraLocked: boolean
  setCameraLocked: (locked: boolean) => void
  toggleCameraLock: () => void
}

export const useUIStore = create<UIState>((set) => ({
  cameraLocked: false,
  setCameraLocked: (locked) => set({ cameraLocked: locked }),
  toggleCameraLock: () => set((state) => ({ cameraLocked: !state.cameraLocked })),
}))
