import { useState, useRef, useCallback } from 'react'
import { useRockStore, BUILTIN_ROCKS } from '../../stores/rockStore'
import { useHistoryStore } from '../../stores/historyStore'

export function RockLibrary() {
  const rocks = useRockStore((state) => state.rocks)
  const customRockModels = useRockStore((state) => state.customRockModels)
  const addRock = useRockStore((state) => state.addRock)
  const addCustomModel = useRockStore((state) => state.addCustomModel)
  const clearAllRocks = useRockStore((state) => state.clearAllRocks)

  const [showAddModel, setShowAddModel] = useState(false)
  const [modelName, setModelName] = useState('')
  const [modelPath, setModelPath] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddModel = () => {
    if (modelName && modelPath) {
      addCustomModel(modelName, modelPath)
      setModelName('')
      setModelPath('')
      setShowAddModel(false)
    }
  }

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const glbFile = files.find(f => f.name.endsWith('.glb') || f.name.endsWith('.gltf'))

    if (glbFile) {
      // Create object URL for the dropped file
      const url = URL.createObjectURL(glbFile)
      const name = glbFile.name.replace(/\.(glb|gltf)$/i, '').replace(/[-_]/g, ' ')
      addCustomModel(name, url)
    }
  }, [addCustomModel])

  // Handle file input change
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      const file = files[0]
      if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
        const url = URL.createObjectURL(file)
        const name = file.name.replace(/\.(glb|gltf)$/i, '').replace(/[-_]/g, ' ')
        addCustomModel(name, url)
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [addCustomModel])


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cyan-400">Rocks</h2>
        <span className="text-sm text-gray-400">{rocks.length} placed</span>
      </div>

      {/* Built-in Rock Models */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase mb-2">Rock Types</h3>
        <div className="grid grid-cols-2 gap-2">
          {BUILTIN_ROCKS.map((rockInfo) => (
            <button
              key={rockInfo.id}
              onClick={() => {
                addRock(rockInfo)
                useHistoryStore.getState().pushSnapshot('Add Rock')
              }}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
            >
              <div className="text-sm font-medium text-white">{rockInfo.name}</div>
              <div className="text-xs text-gray-400">{rockInfo.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* User Imported Rock Models */}
      {customRockModels.length > 0 && (
        <div>
          <h3 className="text-xs text-gray-500 uppercase mb-2">Your Imported Models</h3>
          <div className="grid grid-cols-2 gap-2">
            {customRockModels.map((rockInfo) => (
              <button
                key={rockInfo.id}
                onClick={() => {
                  addRock(rockInfo)
                  useHistoryStore.getState().pushSnapshot('Add Rock')
                }}
                className="p-2 bg-emerald-900/50 hover:bg-emerald-800/50 rounded-lg text-left transition-colors"
              >
                <div className="text-sm font-medium text-emerald-300">{rockInfo.name}</div>
                <div className="text-xs text-gray-400">Click to place</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drop Zone for Custom Models */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-emerald-400 bg-emerald-900/30'
            : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="text-emerald-400 text-sm font-medium">
          {isDragging ? 'Drop GLB file here' : 'Import 3D Rock Model'}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Drag & drop or click to select .glb file
        </div>
      </div>

      {/* Manual Path Entry */}
      <button
        onClick={() => setShowAddModel(!showAddModel)}
        className="w-full py-1 text-gray-500 hover:text-gray-400 text-xs transition-colors"
      >
        {showAddModel ? 'Hide manual entry' : 'Or enter path manually...'}
      </button>

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
        </div>
      )}

      {/* Free Model Links */}
      <div className="text-xs text-gray-500 space-y-1 p-2 bg-gray-800/50 rounded">
        <div className="font-medium text-gray-400">Free 3D Rock Models:</div>
        <a
          href="https://sketchfab.com/tags/rock?features=downloadable&sort_by=-likeCount"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-cyan-500 hover:text-cyan-400"
        >
          Sketchfab (free rocks)
        </a>
        <a
          href="https://polyhaven.com/models"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-cyan-500 hover:text-cyan-400"
        >
          Poly Haven (CC0)
        </a>
      </div>

      {rocks.length > 0 && (
        <button
          onClick={() => {
            clearAllRocks()
            useHistoryStore.getState().pushSnapshot('Clear All Rocks')
          }}
          className="w-full py-2 bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded text-sm transition-colors"
        >
          Clear All Rocks
        </button>
      )}

      <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-700">
        <p>Import a .glb model, then click to place</p>
        <p>Lock camera to drag placed rocks</p>
      </div>
    </div>
  )
}
