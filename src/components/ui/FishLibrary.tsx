import { useFishStore } from '../../stores/fishStore'
import { useTankStore } from '../../stores/tankStore'
import { FISH_INFO } from '../../data/fish'

// Inline type
type FishType = 'clownfish' | 'tang' | 'wrasse' | 'goby' | 'blenny' | 'angelfish' | 'chromis' | 'cardinalfish'

export function FishLibrary() {
  const fish = useFishStore((state) => state.fish)
  const addFish = useFishStore((state) => state.addFish)
  const clearAllFish = useFishStore((state) => state.clearAllFish)
  const gallons = useTankStore((state) => state.gallons)

  // Count fish by type
  const fishCounts = FISH_INFO.map(info => ({
    ...info,
    count: fish.filter(f => f.fishType === info.id).length,
    tooSmall: gallons < info.minTankSize,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-orange-400">Fish</h2>
        <span className="text-sm text-gray-400">{fish.length} swimming</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {fishCounts.map((fishInfo) => (
          <button
            key={fishInfo.id}
            onClick={() => addFish(fishInfo.id as FishType)}
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

      {fish.length > 0 && (
        <button
          onClick={clearAllFish}
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
