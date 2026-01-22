// Fish categories for reef tanks
const FISH_TYPES = ['clownfish', 'tang', 'wrasse', 'goby', 'blenny', 'angelfish', 'chromis', 'cardinalfish'] as const
type FishType = typeof FISH_TYPES[number]

// Compatibility levels
type CompatibilityLevel = 'incompatible' | 'caution' | 'compatible'

interface CompatibilityRule {
  fishType: FishType
  level: CompatibilityLevel
  reason: string
}

interface FishInfo {
  id: FishType
  name: string
  description: string
  baseSize: number // relative size
  swimSpeed: number // units per second
  schooling: boolean // tends to swim in groups
  colors: string[]
  minTankSize: number // minimum gallons
  reefSafe: boolean | 'caution' // safe with corals?
  maxPerTank: number // maximum recommended of this species
  compatibility: CompatibilityRule[] // specific compatibility rules
}

export const FISH_INFO: FishInfo[] = [
  {
    id: 'clownfish',
    name: 'Clownfish',
    description: 'Hardy, hosts anemones',
    baseSize: 0.08,
    swimSpeed: 0.3,
    schooling: false,
    colors: ['#FF6B00', '#FF8C00', '#FFD700', '#000000'],
    minTankSize: 20,
    reefSafe: true,
    maxPerTank: 2, // Typically kept as mated pairs
    compatibility: [
      { fishType: 'clownfish', level: 'caution', reason: 'May fight if not a mated pair' },
    ],
  },
  {
    id: 'tang',
    name: 'Tang',
    description: 'Active swimmer, algae eater',
    baseSize: 0.15,
    swimSpeed: 0.5,
    schooling: false,
    colors: ['#4169E1', '#FFD700', '#9370DB', '#20B2AA'],
    minTankSize: 75,
    reefSafe: true,
    maxPerTank: 1, // Territorial with same species
    compatibility: [
      { fishType: 'tang', level: 'incompatible', reason: 'Highly territorial with other tangs' },
      { fishType: 'angelfish', level: 'caution', reason: 'May compete for territory' },
    ],
  },
  {
    id: 'wrasse',
    name: 'Wrasse',
    description: 'Colorful, pest controller',
    baseSize: 0.1,
    swimSpeed: 0.45,
    schooling: false,
    colors: ['#FF69B4', '#00CED1', '#32CD32', '#FF4500'],
    minTankSize: 30,
    reefSafe: true,
    maxPerTank: 2,
    compatibility: [
      { fishType: 'wrasse', level: 'caution', reason: 'Males may fight' },
      { fishType: 'goby', level: 'caution', reason: 'May outcompete for food' },
    ],
  },
  {
    id: 'goby',
    name: 'Goby',
    description: 'Bottom dweller, sand sifter',
    baseSize: 0.06,
    swimSpeed: 0.2,
    schooling: false,
    colors: ['#F5DEB3', '#FFD700', '#4682B4', '#8B4513'],
    minTankSize: 10,
    reefSafe: true,
    maxPerTank: 3,
    compatibility: [
      { fishType: 'blenny', level: 'caution', reason: 'May compete for hiding spots' },
    ],
  },
  {
    id: 'blenny',
    name: 'Blenny',
    description: 'Perches on rocks, personality',
    baseSize: 0.07,
    swimSpeed: 0.25,
    schooling: false,
    colors: ['#8B4513', '#556B2F', '#708090', '#D2691E'],
    minTankSize: 20,
    reefSafe: true,
    maxPerTank: 2,
    compatibility: [
      { fishType: 'blenny', level: 'caution', reason: 'May be territorial with other blennies' },
      { fishType: 'goby', level: 'caution', reason: 'May compete for hiding spots' },
    ],
  },
  {
    id: 'angelfish',
    name: 'Angelfish',
    description: 'Majestic, may nip corals',
    baseSize: 0.12,
    swimSpeed: 0.35,
    schooling: false,
    colors: ['#FFD700', '#4169E1', '#000000', '#FF6347'],
    minTankSize: 55,
    reefSafe: 'caution', // May nip at corals
    maxPerTank: 1,
    compatibility: [
      { fishType: 'angelfish', level: 'incompatible', reason: 'Very territorial with other angels' },
      { fishType: 'tang', level: 'caution', reason: 'May compete for territory' },
    ],
  },
  {
    id: 'chromis',
    name: 'Chromis',
    description: 'Peaceful schooling fish',
    baseSize: 0.05,
    swimSpeed: 0.4,
    schooling: true,
    colors: ['#00BFFF', '#32CD32', '#9370DB', '#FFD700'],
    minTankSize: 30,
    reefSafe: true,
    maxPerTank: 7, // Best kept in odd-numbered schools
    compatibility: [], // Peaceful with everyone
  },
  {
    id: 'cardinalfish',
    name: 'Cardinalfish',
    description: 'Slow swimmer, nocturnal',
    baseSize: 0.06,
    swimSpeed: 0.15,
    schooling: true,
    colors: ['#FF6347', '#FFD700', '#C0C0C0', '#8B0000'],
    minTankSize: 20,
    reefSafe: true,
    maxPerTank: 5,
    compatibility: [], // Peaceful with everyone
  },
]

// Compatibility checking functions
interface CompatibilityIssue {
  fish1Type: FishType
  fish2Type: FishType
  level: CompatibilityLevel
  reason: string
}

interface TankCompatibilityReport {
  issues: CompatibilityIssue[]
  warnings: string[] // General warnings (tank size, overstocking, etc.)
  coralWarnings: string[] // Warnings about coral-nipper fish
}

// Check compatibility between two fish types
export function checkPairCompatibility(fish1: FishType, fish2: FishType): CompatibilityRule | null {
  const fish1Info = FISH_INFO.find(f => f.id === fish1)
  if (!fish1Info) return null

  // Check fish1's rules for fish2
  const rule = fish1Info.compatibility.find(c => c.fishType === fish2)
  if (rule) return rule

  // Check reverse (fish2's rules for fish1)
  const fish2Info = FISH_INFO.find(f => f.id === fish2)
  if (!fish2Info) return null

  const reverseRule = fish2Info.compatibility.find(c => c.fishType === fish1)
  if (reverseRule) return reverseRule

  return null // Compatible by default
}

// Analyze full tank compatibility
export function analyzeTankCompatibility(
  fishInTank: Array<{ fishType: FishType }>,
  tankSizeGallons: number,
  hasCorals: boolean
): TankCompatibilityReport {
  const issues: CompatibilityIssue[] = []
  const warnings: string[] = []
  const coralWarnings: string[] = []

  // Count fish by type
  const fishCounts = new Map<FishType, number>()
  for (const fish of fishInTank) {
    fishCounts.set(fish.fishType, (fishCounts.get(fish.fishType) || 0) + 1)
  }

  // Check max per tank limits
  for (const [fishType, count] of fishCounts) {
    const info = FISH_INFO.find(f => f.id === fishType)
    if (info && count > info.maxPerTank) {
      warnings.push(`Too many ${info.name}s (${count}/${info.maxPerTank} max recommended)`)
    }

    // Check minimum tank size
    if (info && tankSizeGallons < info.minTankSize) {
      warnings.push(`${info.name} needs ${info.minTankSize}+ gallon tank (yours: ${tankSizeGallons}g)`)
    }

    // Check coral safety
    if (hasCorals && info) {
      if (info.reefSafe === false) {
        coralWarnings.push(`${info.name} is NOT reef safe - will damage corals`)
      } else if (info.reefSafe === 'caution') {
        coralWarnings.push(`${info.name} may nip at corals - monitor closely`)
      }
    }
  }

  // Check pairwise compatibility
  const fishTypes = Array.from(fishCounts.keys())
  const checkedPairs = new Set<string>()

  for (let i = 0; i < fishTypes.length; i++) {
    for (let j = i; j < fishTypes.length; j++) {
      const fish1 = fishTypes[i]
      const fish2 = fishTypes[j]
      const pairKey = [fish1, fish2].sort().join('-')

      if (checkedPairs.has(pairKey)) continue
      checkedPairs.add(pairKey)

      // For same species, only check if there are multiple
      if (fish1 === fish2 && fishCounts.get(fish1)! <= 1) continue

      const rule = checkPairCompatibility(fish1, fish2)
      if (rule && rule.level !== 'compatible') {
        issues.push({
          fish1Type: fish1,
          fish2Type: fish2,
          level: rule.level,
          reason: rule.reason,
        })
      }
    }
  }

  // Sort issues by severity
  issues.sort((a, b) => {
    if (a.level === 'incompatible' && b.level !== 'incompatible') return -1
    if (b.level === 'incompatible' && a.level !== 'incompatible') return 1
    return 0
  })

  return { issues, warnings, coralWarnings }
}

// Calculate approximate tank volume in gallons from dimensions (inches)
export function calculateTankGallons(dimensions: { length: number; width: number; height: number }): number {
  // Volume in cubic inches / 231 = gallons
  return Math.round((dimensions.length * dimensions.width * dimensions.height) / 231)
}

export { FISH_TYPES }
export type { FishType, FishInfo, CompatibilityLevel, CompatibilityRule, CompatibilityIssue, TankCompatibilityReport }
