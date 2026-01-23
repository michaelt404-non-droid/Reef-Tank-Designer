import { useState } from 'react'
import { useEquipmentStore } from '../../stores/equipmentStore'
import { EQUIPMENT_TYPES, getEquipmentTypeLabel, getEquipmentByType } from '../../data/equipment'

type EquipmentType = 'pump' | 'heater' | 'skimmer' | 'powerhead' | 'wavemaker' | 'ato'

export function EquipmentLibrary() {
  const [expanded, setExpanded] = useState(false)
  const [selectedType, setSelectedType] = useState<EquipmentType | null>(null)
  const addEquipment = useEquipmentStore((state) => state.addEquipment)
  const equipment = useEquipmentStore((state) => state.equipment)
  const clearAllEquipment = useEquipmentStore((state) => state.clearAllEquipment)

  const getEquipmentCount = (type: EquipmentType) => {
    return equipment.filter(e => e.type === type).length
  }

  const handleAddEquipment = (equipmentInfoId: string) => {
    addEquipment(equipmentInfoId)
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="text-lg font-semibold text-white">Equipment</h2>
        <svg
          className={`w-5 h-5 text-gray-400 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-gray-400 mb-2">
            Add pumps, heaters, and other gear
          </p>

          {/* Equipment type tabs */}
          <div className="flex flex-wrap gap-1 mb-2">
            {(EQUIPMENT_TYPES as readonly EquipmentType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {getEquipmentTypeLabel(type)}
                {getEquipmentCount(type) > 0 && (
                  <span className="ml-1 text-blue-300">({getEquipmentCount(type)})</span>
                )}
              </button>
            ))}
          </div>

          {/* Equipment list for selected type */}
          {selectedType && (
            <div className="bg-gray-700/50 rounded-lg p-2 space-y-1">
              <h3 className="text-xs font-medium text-gray-300 mb-1">
                {getEquipmentTypeLabel(selectedType)}
              </h3>
              {getEquipmentByType(selectedType).map((info) => (
                <button
                  key={info.id}
                  onClick={() => handleAddEquipment(info.id)}
                  className="w-full text-left px-2 py-1.5 bg-gray-600/50 hover:bg-gray-600 rounded text-xs transition-colors"
                >
                  <div className="font-medium text-gray-200">{info.name}</div>
                  <div className="text-gray-400">{info.description}</div>
                </button>
              ))}
            </div>
          )}

          {/* Quick add common equipment */}
          {!selectedType && (
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => handleAddEquipment('heater-200w')}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-center transition-colors"
                title="Add heater"
              >
                <div className="text-lg mb-1">🌡️</div>
                <div className="text-gray-300">Heater</div>
              </button>
              <button
                onClick={() => handleAddEquipment('powerhead-medium')}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-center transition-colors"
                title="Add powerhead"
              >
                <div className="text-lg mb-1">🌊</div>
                <div className="text-gray-300">Powerhead</div>
              </button>
              <button
                onClick={() => handleAddEquipment('skimmer-nano')}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-center transition-colors"
                title="Add skimmer"
              >
                <div className="text-lg mb-1">🫧</div>
                <div className="text-gray-300">Skimmer</div>
              </button>
            </div>
          )}

          {/* Equipment count and clear */}
          {equipment.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-600">
              <span className="text-xs text-gray-400">
                {equipment.length} piece{equipment.length !== 1 ? 's' : ''} placed
              </span>
              <button
                onClick={clearAllEquipment}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
