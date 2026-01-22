import { useState } from 'react'
import { useRockStore, PROCEDURAL_ROCKS } from '../../stores/rockStore'

export function RockLibrary() {
  const rocks = useRockStore((state) => state.rocks)
  const customRockModels = useRockStore((state) => state.customRockModels)
  const addRock = useRockStore((state) => state.addRock)
  const addCustomModel = useRockStore((state) => state.addCustomModel)
  const clearAllRocks = useRockStore((state) => state.clearAllRocks)

  const [showAddModel, setShowAddModel] = useState(false)
  const [modelName, setModelName] = useState('')
  const [modelPath, setModelPath] = useState('')

  const handleAddModel = () => {
    if (modelName && modelPath) {
      addCustomModel(modelName, modelPath)
      setModelName('')
      setModelPath('')
      setShowAddModel(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cyan-400">Rocks</h2>
        <span className="text-sm text-gray-400">{rocks.length} placed</span>
      </div>

      {/* Procedural Rocks */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase mb-2">Basic Shapes</h3>
        <div className="grid grid-cols-2 gap-2">
          {PROCEDURAL_ROCKS.map((rockInfo) => (
            <button
              key={rockInfo.id}
              onClick={() => addRock(rockInfo)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
            >
              <div className="text-sm font-medium text-white">{rockInfo.name}</div>
              <div className="text-xs text-gray-400">{rockInfo.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Model Rocks */}
      {customRockModels.length > 0 && (
        <div>
          <h3 className="text-xs text-gray-500 uppercase mb-2">Custom Models</h3>
          <div className="grid grid-cols-2 gap-2">
            {customRockModels.map((rockInfo) => (
              <button
                key={rockInfo.id}
                onClick={() => addRock(rockInfo)}
                className="p-2 bg-emerald-900/50 hover:bg-emerald-800/50 rounded-lg text-left transition-colors"
              >
                <div className="text-sm font-medium text-emerald-300">{rockInfo.name}</div>
                <div className="text-xs text-gray-400">3D Model</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Model Button */}
      <button
        onClick={() => setShowAddModel(!showAddModel)}
        className="w-full py-2 bg-emerald-900/30 hover:bg-emerald-800/30 text-emerald-400 rounded text-sm transition-colors border border-emerald-800/50"
      >
        + Add 3D Model Rock
      </button>

      {/* Add Model Form */}
      {showAddModel && (
        <div className="p-3 bg-gray-700/50 rounded-lg space-y-2">
          <input
            type="text"
            placeholder="Rock name"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white"
          />
          <input
            type="text"
            placeholder="/models/rocks/myrock.glb"
            value={modelPath}
            onChange={(e) => setModelPath(e.target.value)}
            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddModel}
              className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddModel(false)}
              className="flex-1 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Place .glb files in: public/models/rocks/
          </p>
        </div>
      )}

      {rocks.length > 0 && (
        <button
          onClick={clearAllRocks}
          className="w-full py-2 bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded text-sm transition-colors"
        >
          Clear All Rocks
        </button>
      )}

      <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-700">
        <p>Click rock type to add</p>
        <p>Lock camera to drag rocks</p>
      </div>
    </div>
  )
}
