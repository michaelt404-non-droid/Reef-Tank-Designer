// Equipment types for reef tanks
const EQUIPMENT_TYPES = ['pump', 'heater', 'skimmer', 'powerhead', 'wavemaker', 'ato'] as const
type EquipmentType = typeof EQUIPMENT_TYPES[number]

interface EquipmentInfo {
  id: string
  type: EquipmentType
  name: string
  description: string
  brand?: string
  size: { width: number; height: number; depth: number } // inches
  color: string
  minTankSize: number // gallons
  placement: 'internal' | 'external' | 'both'
  defaultPosition: 'back' | 'side' | 'sump' | 'corner'
}

export const EQUIPMENT_INFO: EquipmentInfo[] = [
  // Return Pumps
  {
    id: 'return-pump-small',
    type: 'pump',
    name: 'Return Pump (Small)',
    description: '500-1000 GPH return pump',
    size: { width: 3, height: 4, depth: 3 },
    color: '#2a2a2a',
    minTankSize: 20,
    placement: 'external',
    defaultPosition: 'sump',
  },
  {
    id: 'return-pump-large',
    type: 'pump',
    name: 'Return Pump (Large)',
    description: '1500-3000 GPH return pump',
    size: { width: 4, height: 5, depth: 4 },
    color: '#1a1a1a',
    minTankSize: 75,
    placement: 'external',
    defaultPosition: 'sump',
  },

  // Heaters
  {
    id: 'heater-100w',
    type: 'heater',
    name: 'Heater 100W',
    description: 'For tanks up to 30 gallons',
    size: { width: 1, height: 10, depth: 1 },
    color: '#333333',
    minTankSize: 10,
    placement: 'internal',
    defaultPosition: 'back',
  },
  {
    id: 'heater-200w',
    type: 'heater',
    name: 'Heater 200W',
    description: 'For tanks up to 60 gallons',
    size: { width: 1.5, height: 12, depth: 1.5 },
    color: '#333333',
    minTankSize: 30,
    placement: 'internal',
    defaultPosition: 'back',
  },
  {
    id: 'heater-300w',
    type: 'heater',
    name: 'Heater 300W',
    description: 'For tanks up to 100 gallons',
    size: { width: 1.5, height: 14, depth: 1.5 },
    color: '#333333',
    minTankSize: 60,
    placement: 'internal',
    defaultPosition: 'back',
  },

  // Protein Skimmers
  {
    id: 'skimmer-nano',
    type: 'skimmer',
    name: 'Nano Skimmer',
    description: 'HOB skimmer for small tanks',
    size: { width: 3, height: 12, depth: 4 },
    color: '#404040',
    minTankSize: 10,
    placement: 'both',
    defaultPosition: 'back',
  },
  {
    id: 'skimmer-medium',
    type: 'skimmer',
    name: 'Medium Skimmer',
    description: 'In-sump skimmer for medium tanks',
    size: { width: 5, height: 18, depth: 6 },
    color: '#383838',
    minTankSize: 50,
    placement: 'external',
    defaultPosition: 'sump',
  },
  {
    id: 'skimmer-large',
    type: 'skimmer',
    name: 'Large Skimmer',
    description: 'High capacity in-sump skimmer',
    size: { width: 8, height: 24, depth: 10 },
    color: '#303030',
    minTankSize: 100,
    placement: 'external',
    defaultPosition: 'sump',
  },

  // Powerheads / Wavemakers
  {
    id: 'powerhead-small',
    type: 'powerhead',
    name: 'Powerhead (Small)',
    description: '500 GPH flow',
    size: { width: 2, height: 2, depth: 3 },
    color: '#222222',
    minTankSize: 10,
    placement: 'internal',
    defaultPosition: 'side',
  },
  {
    id: 'powerhead-medium',
    type: 'powerhead',
    name: 'Powerhead (Medium)',
    description: '1500 GPH flow',
    size: { width: 3, height: 3, depth: 4 },
    color: '#222222',
    minTankSize: 40,
    placement: 'internal',
    defaultPosition: 'side',
  },
  {
    id: 'wavemaker-gyre',
    type: 'wavemaker',
    name: 'Gyre Wavemaker',
    description: 'Wide flow pattern',
    size: { width: 2, height: 3, depth: 10 },
    color: '#1f1f1f',
    minTankSize: 50,
    placement: 'internal',
    defaultPosition: 'side',
  },

  // ATO (Auto Top Off)
  {
    id: 'ato-basic',
    type: 'ato',
    name: 'ATO System',
    description: 'Automatic top-off with float switch',
    size: { width: 2, height: 6, depth: 2 },
    color: '#4a4a4a',
    minTankSize: 20,
    placement: 'both',
    defaultPosition: 'corner',
  },
]

// Get equipment info by ID
export function getEquipmentInfo(id: string): EquipmentInfo | undefined {
  return EQUIPMENT_INFO.find(e => e.id === id)
}

// Get equipment by type
export function getEquipmentByType(type: EquipmentType): EquipmentInfo[] {
  return EQUIPMENT_INFO.filter(e => e.type === type)
}

// Get display label for equipment type
export function getEquipmentTypeLabel(type: EquipmentType): string {
  const labels: Record<EquipmentType, string> = {
    pump: 'Return Pumps',
    heater: 'Heaters',
    skimmer: 'Protein Skimmers',
    powerhead: 'Powerheads',
    wavemaker: 'Wavemakers',
    ato: 'Auto Top-Off',
  }
  return labels[type]
}

export { EQUIPMENT_TYPES }
export type { EquipmentType, EquipmentInfo }
