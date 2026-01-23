// Coral PAR requirements (duplicated from parCalculator to avoid Safari import issues)
export const CORAL_PAR_REQUIREMENTS = {
  mushrooms: { min: 30, optimal: 75, max: 150 },
  zoanthids: { min: 50, optimal: 150, max: 300 },
  softCorals: { min: 50, optimal: 100, max: 200 },
  lps: { min: 100, optimal: 200, max: 350 },
  sps: { min: 250, optimal: 400, max: 600 },
  acropora: { min: 300, optimal: 500, max: 800 },
} as const

// Inline type to avoid Safari import issues
type CoralType = 'mushrooms' | 'zoanthids' | 'softCorals' | 'lps' | 'sps' | 'acropora'

interface CoralInfo {
  id: CoralType
  name: string
  description: string
  baseScale: number
  baseColors: string[]
}

export const CORAL_INFO: CoralInfo[] = [
  {
    id: 'mushrooms',
    name: 'Mushrooms',
    description: 'Low light, easy care',
    baseScale: 0.15,
    baseColors: ['#8B4513', '#9932CC', '#228B22', '#DC143C', '#4169E1'],
  },
  {
    id: 'zoanthids',
    name: 'Zoanthids',
    description: 'Colorful polyp colonies',
    baseScale: 0.12,
    baseColors: ['#FF6347', '#00CED1', '#FFD700', '#FF1493', '#7FFF00'],
  },
  {
    id: 'softCorals',
    name: 'Soft Corals',
    description: 'Flowing, flexible',
    baseScale: 0.2,
    baseColors: ['#DA70D6', '#20B2AA', '#F0E68C', '#DDA0DD', '#98FB98'],
  },
  {
    id: 'lps',
    name: 'LPS',
    description: 'Large polyp stony',
    baseScale: 0.18,
    baseColors: ['#FF7F50', '#40E0D0', '#ADFF2F', '#FF69B4', '#87CEEB'],
  },
  {
    id: 'sps',
    name: 'SPS',
    description: 'Small polyp stony',
    baseScale: 0.18,
    baseColors: ['#FF4500', '#00FA9A', '#FFE4B5', '#E6E6FA', '#F5DEB3'],
  },
  {
    id: 'acropora',
    name: 'Acropora',
    description: 'Very high light SPS',
    baseScale: 0.2,
    baseColors: ['#FF69B4', '#00BFFF', '#FFDAB9', '#E0FFFF', '#DDA0DD'],
  },
]
