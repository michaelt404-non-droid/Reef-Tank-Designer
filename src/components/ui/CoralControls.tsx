import { useMemo } from 'react'
import { useCoralStore } from '../../stores/coralStore'
import { useLightStore } from '../../stores/lightStore'
import { useTankStore } from '../../stores/tankStore'
import { useHistoryStore } from '../../stores/historyStore'
import { CORAL_INFO, CORAL_PAR_REQUIREMENTS } from '../../data/corals'
import { getCoralPARStatus } from '../../utils/parCalculator'

export function CoralControls() {
  const corals = useCoralStore((state) => state.corals)
  const selectedCoralId = useCoralStore((state) => state.selectedCoralId)
  const updateCoral = useCoralStore((state) => state.updateCoral)
  const removeCoral = useCoralStore((state) => state.removeCoral)

  const lights = useLightStore((state) => state.lights)
  const dimensions = useTankStore((state) => state.dimensions)

  const selectedCoral = corals.find(c => c.id === selectedCoralId)

  const parStatus = useMemo(() => {
    if (!selectedCoral) return null
    return getCoralPARStatus(
      selectedCoral.coralType,
      { x: selectedCoral.position[0], y: selectedCoral.position[1], z: selectedCoral.position[2] },
      lights
    )
  }, [selectedCoral, lights])

  if (!selectedCoral || !parStatus) {
    return null
  }

  type CoralType = 'mushrooms' | 'zoanthids' | 'softCorals' | 'lps' | 'sps' | 'acropora'
  const coralInfo = CORAL_INFO.find(c => c.id === selectedCoral.coralType)
  const parReq = CORAL_PAR_REQUIREMENTS[selectedCoral.coralType as CoralType] ?? { min: 50, optimal: 150, max: 300 }

  // Convert tank dimensions to 3D units
  const SCALE = 0.1
  const tankHeight = dimensions.height * SCALE
  const tankHalfLength = (dimensions.length * SCALE) / 2
  const tankHalfWidth = (dimensions.width * SCALE) / 2

  const getStatusStyles = () => {
    switch (parStatus.status) {
      case 'optimal':
        return { bg: 'bg-green-900/50', text: 'text-green-400', label: 'Optimal' }
      case 'acceptable':
        return { bg: 'bg-yellow-900/50', text: 'text-yellow-400', label: 'Acceptable' }
      case 'incompatible':
        return { bg: 'bg-red-900/50', text: 'text-red-400', label: 'Incompatible' }
    }
  }

  const statusStyles = getStatusStyles()

  return (
    <div className="space-y-3 p-3 bg-gray-700/50 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-pink-400">
            {coralInfo?.name || selectedCoral.coralType}
          </span>
          <div className="text-xs text-gray-400">{coralInfo?.description}</div>
        </div>
        <button
          onClick={() => {
            removeCoral(selectedCoral.id)
            useHistoryStore.getState().pushSnapshot('Delete Coral')
          }}
          className="px-2 py-1 text-xs bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded"
        >
          Delete
        </button>
      </div>

      {/* PAR Status */}
      <div className={`p-2 rounded ${statusStyles.bg}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">PAR Status</span>
          <span className={`text-xs font-medium ${statusStyles.text}`}>
            {statusStyles.label}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">Current PAR</span>
          <span className="text-sm font-medium text-white">{parStatus.par}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Ideal: {parReq.min}-{parReq.max} (optimal: ~{parReq.optimal})
        </div>
      </div>

      {/* Height/Y Position */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Height: {(selectedCoral.position[1] / SCALE).toFixed(1)}"
        </label>
        <input
          type="range"
          min={0.1}
          max={tankHeight - 0.1}
          step="0.05"
          value={selectedCoral.position[1]}
          onChange={(e) => {
            const newPos: [number, number, number] = [...selectedCoral.position]
            newPos[1] = Number(e.target.value)
            updateCoral(selectedCoral.id, { position: newPos })
          }}
          className="w-full accent-pink-500"
        />
      </div>

      {/* X Position (Left/Right) */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Left/Right: {(selectedCoral.position[0] / SCALE).toFixed(1)}"
        </label>
        <input
          type="range"
          min={-tankHalfLength + 0.1}
          max={tankHalfLength - 0.1}
          step="0.05"
          value={selectedCoral.position[0]}
          onChange={(e) => {
            const newPos: [number, number, number] = [...selectedCoral.position]
            newPos[0] = Number(e.target.value)
            updateCoral(selectedCoral.id, { position: newPos })
          }}
          className="w-full accent-pink-500"
        />
      </div>

      {/* Z Position (Front/Back) */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Front/Back: {(selectedCoral.position[2] / SCALE).toFixed(1)}"
        </label>
        <input
          type="range"
          min={-tankHalfWidth + 0.1}
          max={tankHalfWidth - 0.1}
          step="0.05"
          value={selectedCoral.position[2]}
          onChange={(e) => {
            const newPos: [number, number, number] = [...selectedCoral.position]
            newPos[2] = Number(e.target.value)
            updateCoral(selectedCoral.id, { position: newPos })
          }}
          className="w-full accent-pink-500"
        />
      </div>

      {/* Scale */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Scale: {(selectedCoral.scale * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min={0.05}
          max={0.4}
          step="0.01"
          value={selectedCoral.scale}
          onChange={(e) => updateCoral(selectedCoral.id, { scale: Number(e.target.value) })}
          className="w-full accent-pink-500"
        />
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Rotation: {Math.round(selectedCoral.rotation[1] * (180 / Math.PI))}°
        </label>
        <input
          type="range"
          min={0}
          max={Math.PI * 2}
          step={0.1}
          value={selectedCoral.rotation[1]}
          onChange={(e) => {
            const newRot: [number, number, number] = [...selectedCoral.rotation]
            newRot[1] = Number(e.target.value)
            updateCoral(selectedCoral.id, { rotation: newRot })
          }}
          className="w-full accent-pink-500"
        />
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={selectedCoral.color}
            onChange={(e) => updateCoral(selectedCoral.id, { color: e.target.value })}
            className="w-10 h-8 rounded cursor-pointer border border-gray-600"
          />
          <span className="text-xs text-gray-400 font-mono">{selectedCoral.color}</span>
        </div>
        {/* Quick color presets */}
        <div className="flex gap-1 mt-2">
          {coralInfo?.baseColors.map((color, i) => (
            <button
              key={i}
              onClick={() => updateCoral(selectedCoral.id, { color })}
              className="w-6 h-6 rounded border border-gray-600 hover:border-white transition-colors"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
