import { useFishStore } from '../../stores/fishStore'
import { FISH_INFO } from '../../data/fish'

export function FishControls() {
  const fish = useFishStore((state) => state.fish)
  const selectedFishId = useFishStore((state) => state.selectedFishId)
  const updateFish = useFishStore((state) => state.updateFish)
  const removeFish = useFishStore((state) => state.removeFish)

  const selectedFish = fish.find(f => f.id === selectedFishId)

  if (!selectedFish) {
    return null
  }

  const fishInfo = FISH_INFO.find(f => f.id === selectedFish.fishType)

  return (
    <div className="space-y-3 p-3 bg-gray-700/50 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-orange-400">
            {fishInfo?.name || selectedFish.fishType}
          </span>
          <div className="text-xs text-gray-400">{fishInfo?.description}</div>
        </div>
        <button
          onClick={() => removeFish(selectedFish.id)}
          className="px-2 py-1 text-xs bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded"
        >
          Remove
        </button>
      </div>

      {/* Scale */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Size: {(selectedFish.scale * 1000).toFixed(0)}%
        </label>
        <input
          type="range"
          min={0.04}
          max={0.25}
          step="0.01"
          value={selectedFish.scale}
          onChange={(e) => updateFish(selectedFish.id, { scale: Number(e.target.value) })}
          className="w-full accent-orange-500"
        />
      </div>

      {/* Swim Speed */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Swim Speed: {(selectedFish.swimSpeed * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min={0.1}
          max={1.0}
          step="0.05"
          value={selectedFish.swimSpeed}
          onChange={(e) => updateFish(selectedFish.id, { swimSpeed: Number(e.target.value) })}
          className="w-full accent-orange-500"
        />
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={selectedFish.color}
            onChange={(e) => updateFish(selectedFish.id, { color: e.target.value })}
            className="w-10 h-8 rounded cursor-pointer border border-gray-600"
          />
          <span className="text-xs text-gray-400 font-mono">{selectedFish.color}</span>
        </div>
        {/* Quick color presets */}
        <div className="flex gap-1 mt-2">
          {fishInfo?.colors.map((color, i) => (
            <button
              key={i}
              onClick={() => updateFish(selectedFish.id, { color })}
              className="w-6 h-6 rounded border border-gray-600 hover:border-white transition-colors"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="pt-2 border-t border-gray-600 text-xs text-gray-500">
        <div>Position: ({selectedFish.position.map(p => p.toFixed(2)).join(', ')})</div>
        {fishInfo?.schooling && <div className="text-blue-400">Schooling fish - add more!</div>}
      </div>
    </div>
  )
}
