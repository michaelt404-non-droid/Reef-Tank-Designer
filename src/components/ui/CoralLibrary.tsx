import { useState, useRef, useCallback } from 'react'
import { useCoralStore } from '../../stores/coralStore'
import { useHistoryStore } from '../../stores/historyStore'
import { CORAL_INFO, CORAL_PAR_REQUIREMENTS } from '../../data/corals'

export function CoralLibrary() {
  const corals = useCoralStore((state) => state.corals)
  const customCoralModels = useCoralStore((state) => state.customCoralModels)
  const addCoral = useCoralStore((state) => state.addCoral)
  const addCustomCoralModel = useCoralStore((state) => state.addCustomCoralModel)
  const clearAllCorals = useCoralStore((state) => state.clearAllCorals)

  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const glbFile = files.find(f => f.name.endsWith('.glb') || f.name.endsWith('.gltf'))

    if (glbFile) {
      const url = URL.createObjectURL(glbFile)
      const name = glbFile.name.replace(/\.(glb|gltf)$/i, '').replace(/[-_]/g, ' ')
      addCustomCoralModel(name, url)
    }
  }, [addCustomCoralModel])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      const file = files[0]
      if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
        const url = URL.createObjectURL(file)
        const name = file.name.replace(/\.(glb|gltf)$/i, '').replace(/[-_]/g, ' ')
        addCustomCoralModel(name, url)
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [addCustomCoralModel])

  // Count corals by type
  const coralCounts = CORAL_INFO.map(info => ({
    ...info,
    count: corals.filter(c => c.coralType === info.id).length
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-pink-400">Corals</h2>
        <span className="text-sm text-gray-400">{corals.length} placed</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {coralCounts.map((coralInfo) => {
          const par = CORAL_PAR_REQUIREMENTS[coralInfo.id]
          return (
            <button
              key={coralInfo.id}
              onClick={() => {
                addCoral(coralInfo.id)
                useHistoryStore.getState().pushSnapshot('Add Coral')
              }}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{coralInfo.name}</span>
                {coralInfo.count > 0 && (
                  <span className="text-xs bg-pink-600 text-white px-1.5 py-0.5 rounded-full">
                    {coralInfo.count}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">{coralInfo.description}</div>
              <div className="text-xs text-gray-500 mt-1">
                PAR: {par.min}-{par.max}
              </div>
            </button>
          )
        })}
      </div>

      {customCoralModels.length > 0 && (
        <div>
          <h3 className="text-xs text-gray-500 uppercase mb-2">Your Imported Corals</h3>
          <div className="grid grid-cols-2 gap-2">
            {customCoralModels.map((coralInfo) => (
              <button
                key={coralInfo.id}
                onClick={() => {
                  addCoral(coralInfo.id)
                  useHistoryStore.getState().pushSnapshot('Add Coral')
                }}
                className="p-2 bg-emerald-900/50 hover:bg-emerald-800/50 rounded-lg text-left transition-colors"
              >
                <div className="text-sm font-medium text-emerald-300">{coralInfo.name}</div>
                <div className="text-xs text-gray-400">Click to place</div>
              </button>
            ))}
          </div>
        </div>
      )}

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
          {isDragging ? 'Drop GLB file here' : 'Import 3D Coral Model'}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Drag & drop or click to select .glb file
        </div>
      </div>

      {corals.length > 0 && (
        <button
          onClick={() => {
            clearAllCorals()
            useHistoryStore.getState().pushSnapshot('Clear All Corals')
          }}
          className="w-full py-2 bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded text-sm transition-colors"
        >
          Clear All Corals
        </button>
      )}

      <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-700">
        <p>Click coral type to add</p>
        <p>Lock camera to drag corals</p>
      </div>
    </div>
  )
}
