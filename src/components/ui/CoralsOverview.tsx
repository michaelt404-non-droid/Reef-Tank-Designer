import { useMemo } from 'react'
import { useCoralStore } from '../../stores/coralStore'
import { useLightStore } from '../../stores/lightStore'
import { CORAL_INFO } from '../../data/corals'
import { getCoralPARStatus } from '../../utils/parCalculator'

// Inline type to avoid Safari import issues
type PARStatus = 'optimal' | 'acceptable' | 'incompatible'

function StatusIcon({ status }: { status: PARStatus }) {
  switch (status) {
    case 'optimal':
      return <span className="text-green-400">✓</span>
    case 'acceptable':
      return <span className="text-yellow-400">~</span>
    case 'incompatible':
      return <span className="text-red-400">✗</span>
  }
}

export function CoralsOverview() {
  const corals = useCoralStore((state) => state.corals)
  const selectedCoralId = useCoralStore((state) => state.selectedCoralId)
  const selectCoral = useCoralStore((state) => state.selectCoral)
  const lights = useLightStore((state) => state.lights)

  // Calculate PAR status for all corals
  const coralsWithStatus = useMemo(() => {
    return corals.map(coral => {
      const status = getCoralPARStatus(
        coral.coralType,
        { x: coral.position[0], y: coral.position[1], z: coral.position[2] },
        lights
      )
      const coralInfo = CORAL_INFO.find(c => c.id === coral.coralType)
      return { coral, status, coralInfo }
    })
  }, [corals, lights])

  if (corals.length === 0) {
    return null
  }

  // Count status types
  const optimalCount = coralsWithStatus.filter(c => c.status.status === 'optimal').length
  const acceptableCount = coralsWithStatus.filter(c => c.status.status === 'acceptable').length
  const incompatibleCount = coralsWithStatus.filter(c => c.status.status === 'incompatible').length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Placed Corals</h3>
        <div className="flex gap-2 text-xs">
          {optimalCount > 0 && <span className="text-green-400">{optimalCount} ✓</span>}
          {acceptableCount > 0 && <span className="text-yellow-400">{acceptableCount} ~</span>}
          {incompatibleCount > 0 && <span className="text-red-400">{incompatibleCount} ✗</span>}
        </div>
      </div>

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {coralsWithStatus.map(({ coral, status, coralInfo }) => {
          const isSelected = coral.id === selectedCoralId

          return (
            <button
              key={coral.id}
              onClick={() => selectCoral(coral.id)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                isSelected
                  ? 'bg-pink-600/30 border border-pink-500'
                  : 'bg-gray-700/50 hover:bg-gray-600/50 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">
                  {coralInfo?.name || coral.coralType}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{status.par} PAR</span>
                  <StatusIcon status={status.status} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
