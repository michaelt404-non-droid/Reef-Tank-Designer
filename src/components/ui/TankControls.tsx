import { useTankStore, TANK_PRESETS } from '../../stores/tankStore'

export function TankControls() {
  const { dimensions, setDimensions, gallons } = useTankStore()

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = TANK_PRESETS[e.target.value as keyof typeof TANK_PRESETS]
    if (preset) {
      setDimensions(preset)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-cyan-400">Tank Dimensions</h2>

      {/* Presets dropdown */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Preset Sizes</label>
        <select
          onChange={handlePresetChange}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="">Custom</option>
          {Object.keys(TANK_PRESETS).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Length */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Length: {dimensions.length}"
        </label>
        <input
          type="range"
          min="10"
          max="96"
          value={dimensions.length}
          onChange={(e) => setDimensions({ length: Number(e.target.value) })}
          className="w-full accent-cyan-500"
        />
      </div>

      {/* Width */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Width: {dimensions.width}"
        </label>
        <input
          type="range"
          min="8"
          max="36"
          value={dimensions.width}
          onChange={(e) => setDimensions({ width: Number(e.target.value) })}
          className="w-full accent-cyan-500"
        />
      </div>

      {/* Height */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Height: {dimensions.height}"
        </label>
        <input
          type="range"
          min="10"
          max="36"
          value={dimensions.height}
          onChange={(e) => setDimensions({ height: Number(e.target.value) })}
          className="w-full accent-cyan-500"
        />
      </div>

      {/* Volume display */}
      <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
        <div className="text-2xl font-bold text-cyan-400">{gallons} gal</div>
        <div className="text-sm text-gray-400">
          {dimensions.length}" × {dimensions.width}" × {dimensions.height}"
        </div>
      </div>
    </div>
  )
}
