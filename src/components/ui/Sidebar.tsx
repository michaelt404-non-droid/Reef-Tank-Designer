import { useState } from 'react'
import { TankControls } from './TankControls'
import { RockLibrary } from './RockLibrary'
import { RockControls } from './RockControls'
import { LightLibrary } from './LightLibrary'
import { LightsOverview } from './LightsOverview'
import { LightControls } from './LightControls'
import { CoralLibrary } from './CoralLibrary'
import { CoralsOverview } from './CoralsOverview'
import { CoralControls } from './CoralControls'
import { FishLibrary } from './FishLibrary'
import { FishControls } from './FishControls'
import { FishCompatibility } from './FishCompatibility'
import { EquipmentLibrary } from './EquipmentLibrary'
import { EquipmentControls } from './EquipmentControls'
import { AmbientSound } from './AmbientSound'
import { SaveLoadControls } from './SaveLoadControls'
import { SimulationPanel } from './SimulationPanel'
import { UndoRedoControls } from './UndoRedoControls'
import { useSimulationStore } from '../../stores/simulationStore'

type DesignTab = 'tank' | 'rocks' | 'lights' | 'corals' | 'fish' | 'equipment'

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-700 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 px-1 text-left hover:bg-gray-700/30 transition-colors"
      >
        <span className="text-sm font-medium text-gray-300">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="pb-3">{children}</div>}
    </div>
  )
}

const TAB_CONFIG: { id: DesignTab; label: string; icon: string }[] = [
  { id: 'tank', label: 'Tank', icon: '🐠' },
  { id: 'rocks', label: 'Rocks', icon: '🪨' },
  { id: 'lights', label: 'Lights', icon: '💡' },
  { id: 'corals', label: 'Corals', icon: '🪸' },
  { id: 'fish', label: 'Fish', icon: '🐟' },
  { id: 'equipment', label: 'Equip', icon: '⚙️' },
]

export function Sidebar() {
  const mode = useSimulationStore((state) => state.mode)
  const setMode = useSimulationStore((state) => state.setMode)
  const [activeTab, setActiveTab] = useState<DesignTab>('tank')

  return (
    <aside className="w-80 bg-gray-800/90 backdrop-blur border-r border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Reef Tank Designer</h1>
            <p className="text-sm text-gray-400">Plan your perfect reef</p>
          </div>
          {mode === 'design' && <UndoRedoControls />}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex rounded-lg bg-gray-700/50 p-1">
          <button
            onClick={() => setMode('design')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === 'design'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Design
          </button>
          <button
            onClick={() => setMode('simulation')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === 'simulation'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Simulate
          </button>
        </div>
      </div>

      {/* Simulation Mode - Minimal sidebar with just essential controls */}
      {mode === 'simulation' && (
        <div className="flex-1 overflow-y-auto p-4">
          <SimulationPanel />
        </div>
      )}

      {/* Design Mode */}
      {mode === 'design' && (
        <>
          {/* Tab Bar */}
          <div className="flex border-b border-gray-700 bg-gray-800/50">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-1 text-center transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <div className="text-lg">{tab.icon}</div>
                <div className="text-[10px] leading-tight">{tab.label}</div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-blue-500 rounded-t" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'tank' && (
              <div className="space-y-2">
                <CollapsibleSection title="Save / Load">
                  <SaveLoadControls />
                </CollapsibleSection>
                <CollapsibleSection title="Tank Dimensions">
                  <TankControls />
                </CollapsibleSection>
                <CollapsibleSection title="Ambient Sound" defaultOpen={false}>
                  <AmbientSound />
                </CollapsibleSection>
              </div>
            )}

            {activeTab === 'rocks' && (
              <div className="space-y-2">
                <CollapsibleSection title="Rock Library">
                  <RockLibrary />
                </CollapsibleSection>
                <CollapsibleSection title="Selected Rock" defaultOpen={false}>
                  <RockControls />
                </CollapsibleSection>
              </div>
            )}

            {activeTab === 'lights' && (
              <div className="space-y-2">
                <CollapsibleSection title="Light Library">
                  <LightLibrary />
                </CollapsibleSection>
                <CollapsibleSection title="Lights Overview" defaultOpen={false}>
                  <LightsOverview />
                </CollapsibleSection>
                <CollapsibleSection title="Selected Light" defaultOpen={false}>
                  <LightControls />
                </CollapsibleSection>
              </div>
            )}

            {activeTab === 'corals' && (
              <div className="space-y-2">
                <CollapsibleSection title="Coral Library">
                  <CoralLibrary />
                </CollapsibleSection>
                <CollapsibleSection title="Corals Overview" defaultOpen={false}>
                  <CoralsOverview />
                </CollapsibleSection>
                <CollapsibleSection title="Selected Coral" defaultOpen={false}>
                  <CoralControls />
                </CollapsibleSection>
              </div>
            )}

            {activeTab === 'fish' && (
              <div className="space-y-2">
                <CollapsibleSection title="Fish Library">
                  <FishLibrary />
                </CollapsibleSection>
                <CollapsibleSection title="Selected Fish" defaultOpen={false}>
                  <FishControls />
                </CollapsibleSection>
                <CollapsibleSection title="Compatibility" defaultOpen={false}>
                  <FishCompatibility />
                </CollapsibleSection>
              </div>
            )}

            {activeTab === 'equipment' && (
              <div className="space-y-2">
                <CollapsibleSection title="Equipment Library">
                  <EquipmentLibrary />
                </CollapsibleSection>
                <CollapsibleSection title="Selected Equipment" defaultOpen={false}>
                  <EquipmentControls />
                </CollapsibleSection>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  )
}
