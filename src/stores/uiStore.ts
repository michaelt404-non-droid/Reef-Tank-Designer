import { create } from 'zustand';

interface UIState {
  isAuthModalOpen: boolean;
  toggleAuthModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAuthModalOpen: false,
  toggleAuthModal: () => set((state) => ({ isAuthModalOpen: !state.isAuthModalOpen })),
}));