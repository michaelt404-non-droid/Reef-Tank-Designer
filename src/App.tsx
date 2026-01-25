import { useEffect, useRef } from 'react'
import { Scene } from './components/canvas/Scene'
import { Sidebar } from './components/ui/Sidebar'
import { useUIStore } from './stores/uiStore'
import { useRockStore } from './stores/rockStore'
import { useCoralStore } from './stores/coralStore'
import { useEquipmentStore } from './stores/equipmentStore'
import { useTankStore } from './stores/tankStore'
import { useSimulationStore } from './stores/simulationStore'
import { useHistoryStore } from './stores/historyStore'
import { autoSave, autoRestore, hasAutoSave } from './utils/saveLoad'
import { getRockBounds, getTankBounds, clampRockPosition } from './utils/rockBounds'

function App() {
  const cameraLocked = useUIStore((state) => state.cameraLocked)
  const toggleCameraLock = useUIStore((state) => state.toggleCameraLock)

  // Rock movement and rotation
  const selectedRockId = useRockStore((state) => state.selectedRockId)
  const rocks = useRockStore((state) => state.rocks)
  const updateRock = useRockStore((state) => state.updateRock)

  // Tank dimensions for bounds
  const tankDimensions = useTankStore((state) => state.dimensions)

  // Coral rotation
  const selectedCoralId = useCoralStore((state) => state.selectedCoralId)
  const corals = useCoralStore((state) => state.corals)
  const updateCoral = useCoralStore((state) => state.updateCoral)

  // Equipment rotation
  const selectedEquipmentId = useEquipmentStore((state) => state.selectedEquipmentId)
  const equipment = useEquipmentStore((state) => state.equipment)
  const updateEquipment = useEquipmentStore((state) => state.updateEquipment)

  // Simulation state
  const mode = useSimulationStore((state) => state.mode)
  const isRunning = useSimulationStore((state) => state.isRunning)
  const toggleSimulation = useSimulationStore((state) => state.toggleSimulation)
  const dayCount = useSimulationStore((state) => state.dayCount)
  const timeOfDay = useSimulationStore((state) => state.timeOfDay)

  // Auto-restore on mount
  const hasRestored = useRef(false)
  useEffect(() => {
    if (!hasRestored.current && hasAutoSave()) {
      try {
        autoRestore()
      } catch (error) {
        console.error('Failed to auto-restore:', error)
      }
      hasRestored.current = true
    }
    // Push initial snapshot after restore (or on fresh start)
    useHistoryStore.getState().pushSnapshot('Initial State')
  }, [])

  // Auto-save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      autoSave()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Periodic auto-save when simulation is running
  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => autoSave(), 30000)
    return () => clearInterval(interval)
  }, [isRunning])

  // Undo/Redo keyboard shortcuts
  useEffect(() => {
    const handleUndoRedo = (e: KeyboardEvent) => {
      // Only handle in design mode
      if (mode === 'simulation') return

      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          // Ctrl+Shift+Z = Redo
          useHistoryStore.getState().redo()
        } else {
          // Ctrl+Z = Undo
          useHistoryStore.getState().undo()
        }
      }

      // Ctrl+Y = Redo (Windows alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        useHistoryStore.getState().redo()
      }
    }

    window.addEventListener('keydown', handleUndoRedo)
    return () => window.removeEventListener('keydown', handleUndoRedo)
  }, [mode])

  // Keyboard shortcuts
  useEffect(() => {
    const ROTATION_STEP = Math.PI / 12 // 15 degrees

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // L key - toggle camera lock
      if (e.key === 'l' || e.key === 'L') {
        toggleCameraLock()
        return
      }

      // Arrow keys - rotate selected object
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault() // Prevent page scrolling

        // Check for selected rock
        if (selectedRockId) {
          const rock = rocks.find(r => r.id === selectedRockId)
          if (rock) {
            const [rx, ry, rz] = rock.rotation
            let newRotation: [number, number, number] = [rx, ry, rz]

            switch (e.key) {
              case 'ArrowLeft':
                newRotation = [rx, ry - ROTATION_STEP, rz]
                break
              case 'ArrowRight':
                newRotation = [rx, ry + ROTATION_STEP, rz]
                break
              case 'ArrowUp':
                newRotation = [rx - ROTATION_STEP, ry, rz]
                break
              case 'ArrowDown':
                newRotation = [rx + ROTATION_STEP, ry, rz]
                break
            }
            updateRock(selectedRockId, { rotation: newRotation })
            return
          }
        }

        // Check for selected coral
        if (selectedCoralId) {
          const coral = corals.find(c => c.id === selectedCoralId)
          if (coral) {
            const [rx, ry, rz] = coral.rotation
            let newRotation: [number, number, number] = [rx, ry, rz]

            switch (e.key) {
              case 'ArrowLeft':
                newRotation = [rx, ry - ROTATION_STEP, rz]
                break
              case 'ArrowRight':
                newRotation = [rx, ry + ROTATION_STEP, rz]
                break
              case 'ArrowUp':
                newRotation = [rx - ROTATION_STEP, ry, rz]
                break
              case 'ArrowDown':
                newRotation = [rx + ROTATION_STEP, ry, rz]
                break
            }
            updateCoral(selectedCoralId, { rotation: newRotation })
            return
          }
        }

        // Check for selected equipment
        if (selectedEquipmentId) {
          const equip = equipment.find(eq => eq.id === selectedEquipmentId)
          if (equip) {
            const [rx, ry, rz] = equip.rotation
            let newRotation: [number, number, number] = [rx, ry, rz]

            switch (e.key) {
              case 'ArrowLeft':
                newRotation = [rx, ry - ROTATION_STEP, rz]
                break
              case 'ArrowRight':
                newRotation = [rx, ry + ROTATION_STEP, rz]
                break
              case 'ArrowUp':
                newRotation = [rx - ROTATION_STEP, ry, rz]
                break
              case 'ArrowDown':
                newRotation = [rx + ROTATION_STEP, ry, rz]
                break
            }
            updateEquipment(selectedEquipmentId, { rotation: newRotation })
            return
          }
        }
      }

      // WASD keys - move selected rock (design mode only)
      if (['w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(e.key)) {
        // Only allow in design mode
        if (mode === 'simulation') return

        if (selectedRockId) {
          e.preventDefault()
          const rock = rocks.find(r => r.id === selectedRockId)
          if (rock) {
            const MOVEMENT_STEP = 0.1
            const [x, y, z] = rock.position
            let newPosition: [number, number, number] = [x, y, z]

            switch (e.key.toLowerCase()) {
              case 'w':
                if (e.shiftKey) {
                  // Shift+W = move up (Y+)
                  newPosition = [x, y + MOVEMENT_STEP, z]
                } else {
                  // W = move forward (Z-)
                  newPosition = [x, y, z - MOVEMENT_STEP]
                }
                break
              case 's':
                if (e.shiftKey) {
                  // Shift+S = move down (Y-)
                  newPosition = [x, y - MOVEMENT_STEP, z]
                } else {
                  // S = move backward (Z+)
                  newPosition = [x, y, z + MOVEMENT_STEP]
                }
                break
              case 'a':
                // A = move left (X-)
                newPosition = [x - MOVEMENT_STEP, y, z]
                break
              case 'd':
                // D = move right (X+)
                newPosition = [x + MOVEMENT_STEP, y, z]
                break
            }

            // Apply bounds clamping
            const rockBounds = getRockBounds(rock.type, rock.proceduralType, rock.scale)
            const tankBounds = getTankBounds(tankDimensions)
            const clampedPosition = clampRockPosition(newPosition, rockBounds, tankBounds, rock.type === 'model')

            updateRock(selectedRockId, { position: clampedPosition })
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    toggleCameraLock,
    selectedRockId, rocks, updateRock,
    selectedCoralId, corals, updateCoral,
    selectedEquipmentId, equipment, updateEquipment,
    mode, tankDimensions
  ])

  return (
    <div className="flex h-screen w-screen">
      <Sidebar />
      <main className="flex-1 relative">
        <Scene />

        {/* Floating Controls - Different for design vs simulation mode */}
        {mode === 'simulation' ? (
          // Simulation mode: Floating day counter, play/pause, and lock
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {/* Day counter */}
            <div className="bg-gray-900/90 backdrop-blur px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="text-xl">{timeOfDay === 'day' ? '☀️' : '🌙'}</span>
                <span>Day {dayCount}</span>
              </div>
            </div>

            {/* Play/Pause button */}
            <button
              onClick={toggleSimulation}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isRunning
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isRunning ? '⏸ Pause' : '▶ Start'}
            </button>

            {/* Camera lock toggle */}
            <button
              onClick={toggleCameraLock}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                cameraLocked
                  ? 'bg-yellow-500/90 text-black'
                  : 'bg-gray-800/70 text-gray-400 hover:text-white'
              }`}
            >
              {cameraLocked ? '🔒 Locked' : '🔓 Unlocked'}
            </button>
          </div>
        ) : (
          // Design mode: Camera lock indicator
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg transition-all duration-300 ${
            cameraLocked
              ? 'bg-yellow-500/90 text-black'
              : 'bg-gray-800/70 text-gray-400'
          }`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{cameraLocked ? '🔒' : '🔓'}</span>
              <span>{cameraLocked ? 'Camera Locked - WASD to move, Arrow keys to rotate' : 'Press L to lock camera'}</span>
            </div>
            {(selectedRockId || selectedCoralId || selectedEquipmentId) && (
              <div className="text-xs mt-1 opacity-75 text-center">
                {selectedRockId ? 'WASD: move, Shift+W/S: height, Arrows: rotate' : 'Arrow keys to rotate'}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
