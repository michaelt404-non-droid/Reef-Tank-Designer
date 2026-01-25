import { useState } from 'react'
import { useLightStore } from '../../stores/lightStore'
import { useHistoryStore } from '../../stores/historyStore'
import { LIGHT_FIXTURES, LIGHT_BRANDS } from '../../data/lights'

export function LightLibrary() {
  const lights = useLightStore((state) => state.lights)
  const addLight = useLightStore((state) => state.addLight)
  const showPAROverlay = useLightStore((state) => state.showPAROverlay)
  const togglePAROverlay = useLightStore((state) => state.togglePAROverlay)
  const clearAllLights = useLightStore((state) => state.clearAllLights)

  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)

  const filteredLights = selectedBrand
    ? LIGHT_FIXTURES.filter(l => l.brand === selectedBrand)
    : LIGHT_FIXTURES

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cyan-400">Lighting</h2>
        <span className="text-sm text-gray-400">{lights.length} placed</span>
      </div>

      {/* PAR Overlay Toggle */}
      <button
        onClick={togglePAROverlay}
        className={`w-full py-2 px-3 rounded font-medium text-sm transition-colors ${
          showPAROverlay
            ? 'bg-emerald-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        {showPAROverlay ? '🌈 PAR Heatmap ON' : '🌈 Show PAR Heatmap'}
      </button>

      {/* Brand Filter */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setSelectedBrand(null)}
          className={`px-2 py-1 text-xs rounded ${
            !selectedBrand ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          All
        </button>
        {LIGHT_BRANDS.map(brand => (
          <button
            key={brand}
            onClick={() => setSelectedBrand(brand)}
            className={`px-2 py-1 text-xs rounded ${
              selectedBrand === brand ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* Light List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {filteredLights.map(fixture => (
          <button
            key={fixture.id}
            onClick={() => {
              addLight(fixture)
              useHistoryStore.getState().pushSnapshot('Add Light')
            }}
            className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-white">{fixture.model}</div>
                <div className="text-xs text-gray-400">{fixture.brand}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-cyan-400">{fixture.maxPAR} PAR</div>
                <div className="text-xs text-gray-500">{fixture.wattage}W</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {lights.length > 0 && (
        <button
          onClick={() => {
            clearAllLights()
            useHistoryStore.getState().pushSnapshot('Clear All Lights')
          }}
          className="w-full py-2 bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded text-sm transition-colors"
        >
          Clear All Lights
        </button>
      )}

      {/* PAR Legend */}
      {showPAROverlay && lights.length > 0 && (
        <div className="p-2 bg-gray-700/50 rounded text-xs">
          <div className="font-medium text-gray-300 mb-1">PAR Zones:</div>
          <div className="grid grid-cols-2 gap-1">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: '#1e3a5f' }}></span>
              <span className="text-gray-400">&lt;50 Low</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: '#0891b2' }}></span>
              <span className="text-gray-400">50-150</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }}></span>
              <span className="text-gray-400">150-300</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: '#eab308' }}></span>
              <span className="text-gray-400">300-500</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }}></span>
              <span className="text-gray-400">500-700</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></span>
              <span className="text-gray-400">700+ High</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
