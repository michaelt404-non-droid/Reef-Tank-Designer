import { useSimulationStore, PARAM_RANGES, DIFFICULTY_CONFIG } from '../../stores/simulationStore'
import { HelpTooltip } from './Tooltip'

// Inline types to avoid Safari issues
type WaterParams = {
  temperature: number
  salinity: number
  ph: number
  nitrate: number
  ammonia: number
  nitrite: number
  phosphate: number
  alkalinity: number
  calcium: number
  magnesium: number
  potassium: number
  strontium: number
}

type ParamStatus = 'optimal' | 'acceptable' | 'warning' | 'critical'

const PARAM_LABELS: Record<keyof WaterParams, { name: string; unit: string; help: string }> = {
  temperature: { name: 'Temperature', unit: '°F', help: 'Ideal: 76-82°F. Too cold slows metabolism, too hot causes stress.' },
  salinity: { name: 'Salinity', unit: 'ppt', help: 'Ideal: 34-36 ppt. Affects osmotic balance in fish and corals.' },
  ph: { name: 'pH', unit: '', help: 'Ideal: 8.1-8.4. Affected by CO2, alkalinity, and biological processes.' },
  nitrate: { name: 'Nitrate', unit: 'ppm', help: 'Ideal: <10 ppm. End product of nitrogen cycle. High levels fuel algae growth.' },
  ammonia: { name: 'Ammonia', unit: 'ppm', help: 'Ideal: 0 ppm. Toxic to fish! Produced by waste, converted by bacteria in live rock.' },
  nitrite: { name: 'Nitrite', unit: 'ppm', help: 'Ideal: 0 ppm. Toxic intermediate in nitrogen cycle. Bacteria convert it to nitrate.' },
  phosphate: { name: 'Phosphate', unit: 'ppm', help: 'Ideal: <0.03 ppm. High levels promote algae and inhibit coral growth.' },
  alkalinity: { name: 'Alkalinity', unit: 'dKH', help: 'Ideal: 8-12 dKH. Buffers pH and is consumed by corals for skeleton building.' },
  calcium: { name: 'Calcium', unit: 'ppm', help: 'Ideal: 400-450 ppm. Essential for coral skeleton growth.' },
  magnesium: { name: 'Magnesium', unit: 'ppm', help: 'Ideal: 1280-1350 ppm. Helps maintain calcium and alkalinity balance.' },
  potassium: { name: 'Potassium', unit: 'ppm', help: 'Ideal: 380-420 ppm. Important for coral coloration.' },
  strontium: { name: 'Strontium', unit: 'ppm', help: 'Ideal: 8-10 ppm. Trace element used in coral calcification.' },
}

function getStatusColor(status: ParamStatus): string {
  switch (status) {
    case 'optimal': return 'text-green-400'
    case 'acceptable': return 'text-blue-400'
    case 'warning': return 'text-yellow-400'
    case 'critical': return 'text-red-400'
  }
}

function getStatusBg(status: ParamStatus): string {
  switch (status) {
    case 'optimal': return 'bg-green-500'
    case 'acceptable': return 'bg-blue-500'
    case 'warning': return 'bg-yellow-500'
    case 'critical': return 'bg-red-500'
  }
}

interface ParamGaugeProps {
  param: keyof WaterParams
  value: number
  status: ParamStatus
  compact?: boolean
}

function ParamGauge({ param, value, status, compact }: ParamGaugeProps) {
  const { name, unit, help } = PARAM_LABELS[param]
  const [min, idealLow, idealHigh, max] = PARAM_RANGES[param]

  // Calculate position on gauge (0-100)
  const position = ((value - min) / (max - min)) * 100
  const idealLowPos = ((idealLow - min) / (max - min)) * 100
  const idealHighPos = ((idealHigh - min) / (max - min)) * 100

  // Format display value
  const displayValue = param === 'ph' ? value.toFixed(2) :
    param === 'phosphate' || param === 'ammonia' || param === 'nitrite' ? value.toFixed(3) :
    value.toFixed(1)

  if (compact) {
    return (
      <div className="flex items-center justify-between py-1">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          {name}
          <HelpTooltip content={help} position="right" />
        </span>
        <span className={`text-xs font-medium ${getStatusColor(status)}`}>
          {displayValue}{unit && ` ${unit}`}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-gray-700/30 rounded p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-300 flex items-center gap-1">
          {name}
          <HelpTooltip content={help} position="right" />
        </span>
        <span className={`text-sm font-medium ${getStatusColor(status)}`}>
          {displayValue}{unit && ` ${unit}`}
        </span>
      </div>

      {/* Gauge bar */}
      <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
        {/* Ideal zone indicator */}
        <div
          className="absolute h-full bg-green-900/50"
          style={{
            left: `${idealLowPos}%`,
            width: `${idealHighPos - idealLowPos}%`,
          }}
        />
        {/* Current value indicator */}
        <div
          className={`absolute top-0 w-1.5 h-full rounded-full ${getStatusBg(status)} transition-all duration-300`}
          style={{ left: `${Math.max(0, Math.min(100, position))}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Range labels */}
      <div className="flex justify-between mt-0.5 text-[10px] text-gray-600">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

export function WaterQualityDisplay() {
  const waterParams = useSimulationStore((state) => state.waterParams)
  const difficulty = useSimulationStore((state) => state.difficulty)
  const getParamStatus = useSimulationStore((state) => state.getParamStatus)
  const doseParameter = useSimulationStore((state) => state.doseParameter)

  const visibleParams = DIFFICULTY_CONFIG[difficulty].showParams

  // Count issues
  const issues = visibleParams.filter(p => {
    const status = getParamStatus(p)
    return status === 'warning' || status === 'critical'
  }).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">Water Quality</h4>
        {issues > 0 && (
          <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
            {issues} issue{issues > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {visibleParams.map((param) => (
          <ParamGauge
            key={param}
            param={param}
            value={waterParams[param]}
            status={getParamStatus(param)}
            compact={visibleParams.length > 6}
          />
        ))}
      </div>

      {/* Dosing controls for expert mode */}
      {difficulty === 'expert' && (
        <div className="pt-2 border-t border-gray-700">
          <details className="group" style={{ touchAction: 'manipulation' }}>
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300 select-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
              Dosing Controls
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {(['alkalinity', 'calcium', 'magnesium'] as const).map((param) => (
                <button
                  key={param}
                  onClick={() => doseParameter(param, param === 'magnesium' ? 20 : param === 'calcium' ? 10 : 0.5)}
                  className="text-xs py-1 px-2 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded transition-colors"
                >
                  + {PARAM_LABELS[param].name}
                </button>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
