import { useState, useRef, useCallback } from 'react'
import { useFishStore } from '../../stores/fishStore'
import { useTankStore } from '../../stores/tankStore'
import { useHistoryStore } from '../../stores/historyStore'
import { FISH_INFO } from '../../data/fish'

// Inline type
type FishType = 'clownfish' | 'tang' | 'wrasse' | 'goby' | 'blenny' | 'angelfish' | 'chromis' | 'cardinalfish'

export function FishLibrary() {
  const fish = useFishStore((state) => state.fish)
  const customFishModels = useFishStore((state) => state.customFishModels)
  const addFish = useFishStore((state) => state.addFish)
  const addCustomFishModel = useFishStore((state) => state.addCustomFishModel)
  const clearAllFish = useFishStore((state) => state.clearAllFish)
  const gallons = useTankStore((state) => state.gallons)

  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Count fish by type
  const fishCounts = FISH_INFO.map(info => ({
    ...info,
    count: fish.filter(f => f.fishType === info.id).length,
    tooSmall: gallons < info.minTankSize,
  }))

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const glbFile = files.find(f => f.name.endsWith('.glb') || f.name.endsWith('.gltf'))

    if (glbFile) {
      const url = URL.createObjectURL(glbFile)
      const name = glbFile.name.replace(/\.(glb|gltf)$/i, '').replace(/[-_]/g, ' ')
      addCustomFishModel(name, url)
    }
  }, [addCustomFishModel])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      const file = files[0]
      if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
        const url = URL.createObjectURL(file)
        const name = file.name.replace(/\.(glb|gltf)$/i, '').replace(/[-_]/g, ' ')
        addCustomFishModel(name, url)
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [addCustomFishModel])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-orange-400">Fish</h2>
        <span className="text-sm text-gray-400">{fish.length} swimming</span>
      </div>

      <div>
        <h3 className="text-xs text-gray-500 uppercase mb-2">Fish Types</h3>
        <div className="grid grid-cols-2 gap-2">
          {fishCounts.map((fishInfo) => (
            <button
              key={fishInfo.id}
              onClick={() => {
                addFish(fishInfo.id as FishType)
                useHistoryStore.getState().pushSnapshot('Add Fish')
              }}
              disabled={fishInfo.tooSmall}
              className={`p-2 rounded-lg text-left transition-colors relative ${
                fishInfo.tooSmall
                  ? 'bg-gray-800 opacity-50 cursor-not-allowed'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{fishInfo.name}</span>
                {fishInfo.count > 0 && (
                  <span className="text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded-full">
                    {fishInfo.count}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">{fishInfo.description}</div>
              <div className="text-xs text-gray-500 mt-1">
                {fishInfo.tooSmall ? (
                  <span className="text-red-400">Min {fishInfo.minTankSize}gal</span>
                ) : (
                  <span>Min {fishInfo.minTankSize}gal</span>
                )}
                {fishInfo.schooling && <span className="ml-1 text-blue-400">• Schools</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {customFishModels.length > 0 && (
        <div>
          <h3 className="text-xs text-gray-500 uppercase mb-2">Your Imported Fish</h3>
          <div className="grid grid-cols-2 gap-2">
            {customFishModels.map((fishInfo) => (
              <button
                key={fishInfo.id}
                onClick={() => {
                  addFish(fishInfo.id as FishType)
                  useHistoryStore.getState().pushSnapshot('Add Fish')
                }}
                className="p-2 bg-emerald-900/50 hover:bg-emerald-800/50 rounded-lg text-left transition-colors"
              >
                <div className="text-sm font-medium text-emerald-300">{fishInfo.name}</div>
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
          {isDragging ? 'Drop GLB file here' : 'Import 3D Fish Model'}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Drag & drop or click to select .glb file
        </div>
      </div>

      <div className="text-xs text-gray-500 space-y-1 p-2 bg-gray-800/50 rounded">
        <div className="font-medium text-gray-400">Free 3D Fish Models:</div>
        <a
          href="https://sketchfab.com/tags/fish?features=downloadable&sort_by=-likeCount"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-cyan-500 hover:text-cyan-400"
        >
          Sketchfab (free fish)
        </a>
      </div>

      {fish.length > 0 && (
        <button
          onClick={() => {
            clearAllFish()
            useHistoryStore.getState().pushSnapshot('Clear All Fish')
          }}
          className="w-full py-2 bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded text-sm transition-colors"
        >
          Clear All Fish
        </button>
      )}

      <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-700">
        <p>Fish swim automatically</p>
        <p>Click fish to select</p>
        <p>Tank: {gallons.toFixed(0)} gallons</p>
      </div>
    </div>
  )
}
