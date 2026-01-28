import { create } from 'zustand'
import { produce } from 'immer'

interface HistoryState<T> {
  past: T[]
  present: T | null
  future: T[]
  /**
   * Adds a new state to the history.
   * Clears the future history when a new state is added.
   * @param newState The new state to add.
   */
  addState: (newState: T) => void
  /**
   * Undoes the last state change, moving the present state to the future.
   */
  undo: () => void
  /**
   * Redoes the last undone state change, moving a future state to the present.
   */
  redo: () => void
  /**
   * Clears all history (past and future) and sets a new initial present state.
   * @param initialState The initial state to set.
   */
  clear: (initialState: T) => void
}

const MAX_HISTORY_SIZE = 50 // Limit the history size to prevent excessive memory usage

export const createHistoryStore = <T>(initialState: T) =>
  create<HistoryState<T>>()((set, get) => ({
    past: [],
    present: initialState,
    future: [],

    addState: (newState: T) => {
      set(produce((state: HistoryState<T>) => {
        if (state.present !== null) {
          state.past.push(state.present)
          // Enforce MAX_HISTORY_SIZE
          if (state.past.length > MAX_HISTORY_SIZE) {
            state.past.shift() // Remove the oldest state
          }
        }
        state.present = newState
        state.future = [] // Clear future when a new state is added
      }))
    },

    undo: () => {
      set(produce((state: HistoryState<T>) => {
        if (state.past.length > 0) {
          const previousState = state.past.pop()!
          if (state.present !== null) {
            state.future.unshift(state.present)
          }
          state.present = previousState
        }
      }))
    },

    redo: () => {
      set(produce((state: HistoryState<T>) => {
        if (state.future.length > 0) {
          const nextState = state.future.shift()!
          if (state.present !== null) {
            state.past.push(state.present)
          }
          state.present = nextState
        }
      }))
    },

    clear: (initialState: T) => {
      set({
        past: [],
        present: initialState,
        future: [],
      })
    },
  }))