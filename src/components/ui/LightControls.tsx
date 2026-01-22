import { useLightStore } from '../../stores/lightStore'
import { useTankStore } from '../../stores/tankStore'

export function LightControls() {
  const lights = useLightStore((state) => state.lights)
  const selectedLightId = useLightStore((state) => state.selectedLightId)
  const updateLight = useLightStore((state) => state.updateLight)
  const removeLight = useLightStore((state) => state.removeLight)

  const dimensions = useTankStore((state) => state.dimensions)

  const selectedLight = lights.find(l => l.id === selectedLightId)

  if (!selectedLight) {
    return null
  }

  // Convert tank dimensions to 3D units
  const tankHeight = dimensions.height * 0.1
  const tankHalfLength = (dimensions.length * 0.1) / 2
  const tankHalfWidth = (dimensions.width * 0.1) / 2

  // Calculate height above water in inches
  const heightAboveWater = ((selectedLight.position[1] - tankHeight) / 0.1).toFixed(1)

  return (
    <div className="space-y-3 p-3 bg-gray-700/50 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-cyan-400">
            {selectedLight.fixture.model}
          </span>
          <div className="text-xs text-gray-400">{selectedLight.fixture.brand}</div>
        </div>
        <button
          onClick={() => removeLight(selectedLight.id)}
          className="px-2 py-1 text-xs bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded"
        >
          Delete
        </button>
      </div>

      {/* Enable/Disable */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">Power</label>
        <button
          onClick={() => updateLight(selectedLight.id, { enabled: !selectedLight.enabled })}
          className={`px-3 py-1 rounded text-xs font-medium ${
            selectedLight.enabled
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-600 text-gray-300'
          }`}
        >
          {selectedLight.enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Intensity */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Intensity: {selectedLight.intensity}%
        </label>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={selectedLight.intensity}
          onChange={(e) => updateLight(selectedLight.id, { intensity: Number(e.target.value) })}
          className="w-full accent-cyan-500"
        />
      </div>

      {/* Height */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Height: {heightAboveWater}" above water
        </label>
        <input
          type="range"
          min={tankHeight + 0.2}
          max={tankHeight + 2.4}
          step="0.1"
          value={selectedLight.position[1]}
          onChange={(e) => {
            const newPos: [number, number, number] = [...selectedLight.position]
            newPos[1] = Number(e.target.value)
            updateLight(selectedLight.id, { position: newPos })
          }}
          className="w-full accent-cyan-500"
        />
      </div>

      {/* X Position (Left/Right along tank length) */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Left/Right: {(selectedLight.position[0] / 0.1).toFixed(1)}"
        </label>
        <input
          type="range"
          min={-tankHalfLength}
          max={tankHalfLength}
          step="0.05"
          value={selectedLight.position[0]}
          onChange={(e) => {
            const newPos: [number, number, number] = [...selectedLight.position]
            newPos[0] = Number(e.target.value)
            updateLight(selectedLight.id, { position: newPos })
          }}
          className="w-full accent-cyan-500"
        />
      </div>

      {/* Z Position (Front/Back along tank width) */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Front/Back: {(selectedLight.position[2] / 0.1).toFixed(1)}"
        </label>
        <input
          type="range"
          min={-tankHalfWidth}
          max={tankHalfWidth}
          step="0.05"
          value={selectedLight.position[2]}
          onChange={(e) => {
            const newPos: [number, number, number] = [...selectedLight.position]
            newPos[2] = Number(e.target.value)
            updateLight(selectedLight.id, { position: newPos })
          }}
          className="w-full accent-cyan-500"
        />
      </div>

      {/* Light Info */}
      <div className="pt-2 border-t border-gray-600 text-xs text-gray-400">
        <div>Coverage: {selectedLight.fixture.coverage.length}" × {selectedLight.fixture.coverage.width}"</div>
        <div>Max PAR: {selectedLight.fixture.maxPAR} @ 12"</div>
        <div>Wattage: {selectedLight.fixture.wattage}W</div>
      </div>
    </div>
  )
}
