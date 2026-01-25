// Cleanup crew types for reef tanks
const CLEANUP_CREW_TYPES = ['snail', 'hermitCrab', 'emeraldCrab', 'cleaner_shrimp', 'sea_urchin'] as const
type CleanupCrewType = typeof CLEANUP_CREW_TYPES[number]

interface CleanupCrewInfo {
  id: CleanupCrewType
  name: string
  description: string
  algaeReduction: number  // per hour of sim time
  reefSafe: boolean
  nocturnal: boolean      // more active at night
  maxPerTank: number
  color: string
  modelPath?: string      // Optional GLB model path
}

export const CLEANUP_CREW_INFO: CleanupCrewInfo[] = [
  {
    id: 'snail',
    name: 'Turbo Snail',
    description: 'Excellent algae grazer',
    algaeReduction: 0.005,
    reefSafe: true,
    nocturnal: false,
    maxPerTank: 10,
    color: '#8B7355',
    modelPath: '/models/cleanup/turbo_snail.glb',
  },
  {
    id: 'hermitCrab',
    name: 'Hermit Crab',
    description: 'Scavenges and grazes',
    algaeReduction: 0.003,
    reefSafe: true,
    nocturnal: true,
    maxPerTank: 15,
    color: '#CD853F',
    modelPath: '/models/cleanup/hermit_crab.glb',
  },
  {
    id: 'emeraldCrab',
    name: 'Emerald Crab',
    description: 'Eats bubble algae',
    algaeReduction: 0.008,
    reefSafe: true,
    nocturnal: true,
    maxPerTank: 3,
    color: '#2E8B57',
    modelPath: '/models/cleanup/hermit_crab.glb',  // Reuse hermit crab model
  },
  {
    id: 'cleaner_shrimp',
    name: 'Cleaner Shrimp',
    description: 'Picks parasites off fish',
    algaeReduction: 0.002,
    reefSafe: true,
    nocturnal: false,
    maxPerTank: 4,
    color: '#FF6347',
  },
  {
    id: 'sea_urchin',
    name: 'Pincushion Urchin',
    description: 'Grazes algae off rocks',
    algaeReduction: 0.006,
    reefSafe: true,
    nocturnal: true,
    maxPerTank: 3,
    color: '#8B4513',
    modelPath: '/models/cleanup/sea_urchin.glb',
  },
]

// Calculate total algae reduction rate from cleanup crew
export function calculateCleanupRate(
  crew: Array<{ type: CleanupCrewType }>,
  isNight: boolean
): number {
  let totalRate = 0

  for (const member of crew) {
    const info = CLEANUP_CREW_INFO.find(c => c.id === member.type)
    if (!info) continue

    let rate = info.algaeReduction
    // Nocturnal creatures work 50% faster at night, 50% slower during day
    if (info.nocturnal) {
      rate *= isNight ? 1.5 : 0.5
    }

    totalRate += rate
  }

  return totalRate
}

export { CLEANUP_CREW_TYPES }
export type { CleanupCrewType, CleanupCrewInfo }
