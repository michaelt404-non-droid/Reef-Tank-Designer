import { useLightStore } from '../../stores/lightStore'
import { useTankStore } from '../../stores/tankStore'

export function LightsOverview() {
  const lights = useLightStore((state) => state.lights)
  const selectedLightId = useLightStore((state) => state.selectedLightId)
  const selectLight = useLightStore((state) => state.selectLight)
  const dimensions = useTankStore((state) => state.dimensions)

  if (lights.length === 0) {
    return null
  }

  const tankHeight = dimensions.height * 0.1

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-300">Placed Lights</h3>
      <div className="space-y-1">
        {lights.map((light) => {
          const heightAboveWater = ((light.position[1] - tankHeight) / 0.1).toFixed(1)
          const isSelected = light.id === selectedLightId

          return (
            <button
              key={light.id}
              onClick={() => selectLight(light.id)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                isSelected
                  ? 'bg-cyan-600/30 border border-cyan-500'
                  : 'bg-gray-700/50 hover:bg-gray-600/50 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-medium ${light.enabled ? 'text-white' : 'text-gray-500'}`}>
                  {light.fixture.model}
                </span>
                <span className={`${light.enabled ? 'text-cyan-400' : 'text-gray-500'}`}>
                  {heightAboveWater}" above water
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5 text-gray-500">
                <span>{light.fixture.brand}</span>
                <span>{light.intensity}% {!light.enabled && '(off)'}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
