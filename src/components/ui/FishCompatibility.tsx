import { useMemo } from 'react'
import { useFishStore } from '../../stores/fishStore'
import { useTankStore } from '../../stores/tankStore'
import { useCoralStore } from '../../stores/coralStore'
import { analyzeTankCompatibility, calculateTankGallons, FISH_INFO } from '../../data/fish'

export function FishCompatibility() {
  const fish = useFishStore((state) => state.fish)
  const tankDimensions = useTankStore((state) => state.dimensions)
  const corals = useCoralStore((state) => state.corals)

  const report = useMemo(() => {
    const tankGallons = calculateTankGallons(tankDimensions)
    return analyzeTankCompatibility(fish, tankGallons, corals.length > 0)
  }, [fish, tankDimensions, corals.length])

  const tankGallons = useMemo(() => calculateTankGallons(tankDimensions), [tankDimensions])

  // Don't show if no fish
  if (fish.length === 0) return null

  const hasIssues = report.issues.length > 0 || report.warnings.length > 0 || report.coralWarnings.length > 0
  const hasIncompatible = report.issues.some(i => i.level === 'incompatible')

  const getFishName = (type: string) => FISH_INFO.find(f => f.id === type)?.name || type

  return (
    <div className="bg-gray-700/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-200">Compatibility</h3>
        <span className="text-xs text-gray-400">({tankGallons}g tank)</span>
        {!hasIssues && (
          <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            All compatible
          </span>
        )}
        {hasIssues && hasIncompatible && (
          <span className="ml-auto text-xs text-red-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Issues found
          </span>
        )}
        {hasIssues && !hasIncompatible && (
          <span className="ml-auto text-xs text-yellow-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Warnings
          </span>
        )}
      </div>

      {hasIssues && (
        <div className="space-y-1.5 text-xs">
          {/* Incompatible fish pairs */}
          {report.issues.filter(i => i.level === 'incompatible').map((issue, idx) => (
            <div key={`inc-${idx}`} className="flex items-start gap-1.5 text-red-400 bg-red-900/20 rounded px-2 py-1">
              <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="font-medium">{getFishName(issue.fish1Type)}</span>
                {issue.fish1Type !== issue.fish2Type && (
                  <> + <span className="font-medium">{getFishName(issue.fish2Type)}</span></>
                )}
                <span className="text-red-300 block">{issue.reason}</span>
              </div>
            </div>
          ))}

          {/* Caution fish pairs */}
          {report.issues.filter(i => i.level === 'caution').map((issue, idx) => (
            <div key={`cau-${idx}`} className="flex items-start gap-1.5 text-yellow-400 bg-yellow-900/20 rounded px-2 py-1">
              <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="font-medium">{getFishName(issue.fish1Type)}</span>
                {issue.fish1Type !== issue.fish2Type && (
                  <> + <span className="font-medium">{getFishName(issue.fish2Type)}</span></>
                )}
                <span className="text-yellow-300 block">{issue.reason}</span>
              </div>
            </div>
          ))}

          {/* Tank warnings */}
          {report.warnings.map((warning, idx) => (
            <div key={`warn-${idx}`} className="flex items-start gap-1.5 text-orange-400 bg-orange-900/20 rounded px-2 py-1">
              <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>{warning}</span>
            </div>
          ))}

          {/* Coral warnings */}
          {report.coralWarnings.map((warning, idx) => (
            <div key={`coral-${idx}`} className="flex items-start gap-1.5 text-pink-400 bg-pink-900/20 rounded px-2 py-1">
              <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 11-2 0 1 1 0 012 0zm0-3a1 1 0 01-2 0V6a1 1 0 112 0v4z" />
              </svg>
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
