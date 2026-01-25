import { useMemo } from 'react'
import { useEquipmentStore } from '../../stores/equipmentStore'
import { useTankStore } from '../../stores/tankStore'
import { useHistoryStore } from '../../stores/historyStore'
import { EQUIPMENT_INFO } from '../../data/equipment'

const TANK_SCALE = 0.1

export function EquipmentControls() {
  const equipment = useEquipmentStore((state) => state.equipment)
  const selectedEquipmentId = useEquipmentStore((state) => state.selectedEquipmentId)
  const updateEquipment = useEquipmentStore((state) => state.updateEquipment)
  const removeEquipment = useEquipmentStore((state) => state.removeEquipment)
  const showSumpEquipment = useEquipmentStore((state) => state.showSumpEquipment)
  const toggleSumpVisibility = useEquipmentStore((state) => state.toggleSumpVisibility)
  const tankDimensions = useTankStore((state) => state.dimensions)

  const selectedEquipment = equipment.find(e => e.id === selectedEquipmentId)
  const equipmentInfo = selectedEquipment
    ? EQUIPMENT_INFO.find(i => i.id === selectedEquipment.equipmentInfoId)
    : null

  // Calculate position bounds based on tank size and equipment size
  // Must be called unconditionally (before any early returns)
  const bounds = useMemo(() => {
    const tankHalfLength = (tankDimensions.length * TANK_SCALE) / 2
    const tankHalfWidth = (tankDimensions.width * TANK_SCALE) / 2
    const tankHeight = tankDimensions.height * TANK_SCALE

    const scale = selectedEquipment?.scale || 1
    const eqWidth = (equipmentInfo?.size.width || 2) * TANK_SCALE * scale
    const eqHeight = (equipmentInfo?.size.height || 2) * TANK_SCALE * scale
    const eqDepth = (equipmentInfo?.size.depth || 2) * TANK_SCALE * scale

    const wallMargin = 0.02

    return {
      minX: -tankHalfLength + eqWidth / 2 + wallMargin,
      maxX: tankHalfLength - eqWidth / 2 - wallMargin,
      minY: eqHeight / 2 + 0.02,
      maxY: tankHeight - eqHeight / 2 - wallMargin,
      minZ: -tankHalfWidth + eqDepth / 2 + wallMargin,
      maxZ: tankHalfWidth - eqDepth / 2 - wallMargin,
    }
  }, [tankDimensions, equipmentInfo, selectedEquipment?.scale])

  if (!selectedEquipment) {
    // Show sump visibility toggle even without selection
    const sumpCount = equipment.filter(e => {
      const info = EQUIPMENT_INFO.find(i => i.id === e.equipmentInfoId)
      return info?.placement === 'external'
    }).length

    if (sumpCount === 0 && equipment.length === 0) return null

    return (
      <div className="bg-gray-700/50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {equipment.length > 0 ? 'Click equipment to select' : 'No equipment placed'}
          </span>
          {sumpCount > 0 && (
            <button
              onClick={toggleSumpVisibility}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showSumpEquipment
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {showSumpEquipment ? 'Hide' : 'Show'} sump ({sumpCount})
            </button>
          )}
        </div>
      </div>
    )
  }

  const handlePositionChange = (axis: 0 | 1 | 2, value: number) => {
    const newPosition: [number, number, number] = [...selectedEquipment.position]
    newPosition[axis] = value
    updateEquipment(selectedEquipment.id, { position: newPosition })
  }

  const handleRotationChange = (value: number) => {
    updateEquipment(selectedEquipment.id, {
      rotation: [0, value, 0],
    })
  }

  const handleScaleChange = (value: number) => {
    // Recalculate bounds with new scale and clamp position
    const tankHalfLength = (tankDimensions.length * TANK_SCALE) / 2
    const tankHalfWidth = (tankDimensions.width * TANK_SCALE) / 2
    const tankHeight = tankDimensions.height * TANK_SCALE

    const eqWidth = (equipmentInfo?.size.width || 2) * TANK_SCALE * value
    const eqHeight = (equipmentInfo?.size.height || 2) * TANK_SCALE * value
    const eqDepth = (equipmentInfo?.size.depth || 2) * TANK_SCALE * value

    const wallMargin = 0.02
    const newBounds = {
      minX: -tankHalfLength + eqWidth / 2 + wallMargin,
      maxX: tankHalfLength - eqWidth / 2 - wallMargin,
      minY: eqHeight / 2 + 0.02,
      maxY: tankHeight - eqHeight / 2 - wallMargin,
      minZ: -tankHalfWidth + eqDepth / 2 + wallMargin,
      maxZ: tankHalfWidth - eqDepth / 2 - wallMargin,
    }

    // Clamp current position to new bounds
    const clampedPosition: [number, number, number] = [
      Math.max(newBounds.minX, Math.min(newBounds.maxX, selectedEquipment.position[0])),
      Math.max(newBounds.minY, Math.min(newBounds.maxY, selectedEquipment.position[1])),
      Math.max(newBounds.minZ, Math.min(newBounds.maxZ, selectedEquipment.position[2])),
    ]

    updateEquipment(selectedEquipment.id, { scale: value, position: clampedPosition })
  }

  const handleVisibilityToggle = () => {
    updateEquipment(selectedEquipment.id, {
      visible: !selectedEquipment.visible,
    })
  }

  return (
    <div className="bg-gray-700/50 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">{selectedEquipment.name}</h3>
          {equipmentInfo && (
            <p className="text-xs text-gray-400">{equipmentInfo.description}</p>
          )}
        </div>
        <button
          onClick={() => {
            removeEquipment(selectedEquipment.id)
            useHistoryStore.getState().pushSnapshot('Delete Equipment')
          }}
          className="p-1.5 bg-red-600/50 hover:bg-red-600 rounded transition-colors"
          title="Delete equipment"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Position X (left/right) */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Left / Right</span>
          <span>{selectedEquipment.position[0].toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={bounds.minX}
          max={bounds.maxX}
          step="0.02"
          value={Math.max(bounds.minX, Math.min(bounds.maxX, selectedEquipment.position[0]))}
          onChange={(e) => handlePositionChange(0, parseFloat(e.target.value))}
          className="w-full h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Position Y (height) */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Height</span>
          <span>{selectedEquipment.position[1].toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={bounds.minY}
          max={bounds.maxY}
          step="0.02"
          value={Math.max(bounds.minY, Math.min(bounds.maxY, selectedEquipment.position[1]))}
          onChange={(e) => handlePositionChange(1, parseFloat(e.target.value))}
          className="w-full h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Position Z (front/back) */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Front / Back</span>
          <span>{selectedEquipment.position[2].toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={bounds.minZ}
          max={bounds.maxZ}
          step="0.02"
          value={Math.max(bounds.minZ, Math.min(bounds.maxZ, selectedEquipment.position[2]))}
          onChange={(e) => handlePositionChange(2, parseFloat(e.target.value))}
          className="w-full h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Rotation */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Rotation</span>
          <span>{Math.round((selectedEquipment.rotation[1] / Math.PI) * 180)}°</span>
        </label>
        <input
          type="range"
          min="0"
          max={Math.PI * 2}
          step="0.1"
          value={selectedEquipment.rotation[1]}
          onChange={(e) => handleRotationChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Scale */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Size</span>
          <span>{Math.round(selectedEquipment.scale * 100)}%</span>
        </label>
        <input
          type="range"
          min="0.2"
          max="1.5"
          step="0.05"
          value={selectedEquipment.scale}
          onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Visibility toggle for this piece */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-600">
        <span className="text-xs text-gray-400">Visible in tank</span>
        <button
          onClick={handleVisibilityToggle}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            selectedEquipment.visible
              ? 'bg-green-600 text-white'
              : 'bg-gray-600 text-gray-300'
          }`}
        >
          {selectedEquipment.visible ? 'Yes' : 'No'}
        </button>
      </div>
    </div>
  )
}
