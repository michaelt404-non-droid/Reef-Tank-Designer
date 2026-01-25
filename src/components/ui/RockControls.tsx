import { useRockStore } from '../../stores/rockStore'
import { useUIStore } from '../../stores/uiStore'
import { useTankStore } from '../../stores/tankStore'
import { useHistoryStore } from '../../stores/historyStore'
import { getMaxScale, getRockBounds, getTankBounds, clampRockPosition } from '../../utils/rockBounds'

export function RockControls() {
  const rocks = useRockStore((state) => state.rocks)
  const selectedRockId = useRockStore((state) => state.selectedRockId)
  const updateRock = useRockStore((state) => state.updateRock)
  const removeRock = useRockStore((state) => state.removeRock)

  const cameraLocked = useUIStore((state) => state.cameraLocked)
  const toggleCameraLock = useUIStore((state) => state.toggleCameraLock)

  const tankDimensions = useTankStore((state) => state.dimensions)

  const selectedRock = rocks.find(r => r.id === selectedRockId)

  // Calculate max scale based on tank size and rock type
  const maxScale = selectedRock
    ? getMaxScale(selectedRock.type, selectedRock.proceduralType, tankDimensions)
    : 1.0

  return (
    <div className="space-y-3">
      {/* Camera Lock Toggle */}
      <button
        onClick={toggleCameraLock}
        className={`w-full py-2 px-3 rounded font-medium text-sm transition-colors ${
          cameraLocked
            ? 'bg-cyan-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        {cameraLocked ? '🔒 Camera Locked (Drag Mode)' : '🔓 Lock Camera to Drag'}
      </button>

      {cameraLocked && (
        <p className="text-xs text-cyan-400">
          Click a rock to select, then drag to move it
        </p>
      )}

      {!selectedRock ? (
        <div className="text-sm text-gray-500 italic">
          Select a rock to edit
        </div>
      ) : (
        <div className="space-y-3 p-3 bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-cyan-400">
              {selectedRock.type}
            </span>
            <button
              onClick={() => {
                removeRock(selectedRock.id)
                useHistoryStore.getState().pushSnapshot('Delete Rock')
              }}
              className="px-2 py-1 text-xs bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded"
            >
              Delete
            </button>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Height: {selectedRock.position[1].toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max={getTankBounds(tankDimensions).height - 0.1}
              step="0.05"
              value={selectedRock.position[1]}
              onChange={(e) => {
                const newY = Number(e.target.value)
                // Clamp full position after height change
                const rockBounds = getRockBounds(selectedRock.type, selectedRock.proceduralType, selectedRock.scale)
                const tankBounds = getTankBounds(tankDimensions)
                const isModelRock = selectedRock.type === 'model'
                const clampedPosition = clampRockPosition(
                  [selectedRock.position[0], newY, selectedRock.position[2]],
                  rockBounds,
                  tankBounds,
                  isModelRock
                )
                updateRock(selectedRock.id, { position: clampedPosition })
              }}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Size: {(selectedRock.scale * 100).toFixed(0)}%
              {maxScale < 1 && (
                <span className="text-yellow-500 ml-1">(max {(maxScale * 100).toFixed(0)}%)</span>
              )}
            </label>
            <input
              type="range"
              min="0.1"
              max={maxScale}
              step="0.05"
              value={Math.min(selectedRock.scale, maxScale)}
              onChange={(e) => {
                const newScale = Number(e.target.value)
                // After scale change, clamp position to stay in bounds
                const rockBounds = getRockBounds(selectedRock.type, selectedRock.proceduralType, newScale)
                const tankBounds = getTankBounds(tankDimensions)
                const isModelRock = selectedRock.type === 'model'
                const clampedPosition = clampRockPosition(selectedRock.position, rockBounds, tankBounds, isModelRock)
                updateRock(selectedRock.id, { scale: newScale, position: clampedPosition })
              }}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Rotation: {Math.round((selectedRock.rotation[1] * 180) / Math.PI)}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              step="15"
              value={Math.round((selectedRock.rotation[1] * 180) / Math.PI)}
              onChange={(e) => {
                const newRot: [number, number, number] = [...selectedRock.rotation]
                newRot[1] = (Number(e.target.value) * Math.PI) / 180
                updateRock(selectedRock.id, { rotation: newRot })
              }}
              className="w-full accent-cyan-500"
            />
          </div>

        </div>
      )}
    </div>
  )
}
