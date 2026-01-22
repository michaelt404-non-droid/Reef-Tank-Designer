import { useCoralStore } from '../../stores/coralStore'
import { CORAL_INFO, CORAL_PAR_REQUIREMENTS } from '../../data/corals'

export function CoralLibrary() {
  const corals = useCoralStore((state) => state.corals)
  const addCoral = useCoralStore((state) => state.addCoral)
  const clearAllCorals = useCoralStore((state) => state.clearAllCorals)

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
              onClick={() => addCoral(coralInfo.id)}
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

      {corals.length > 0 && (
        <button
          onClick={clearAllCorals}
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
