// Inline type to avoid Safari import issues
interface LightFixtureData {
  id: string
  brand: string
  model: string
  type: 'led' | 'hybrid' | 't5'
  coverage: { length: number; width: number }
  maxPAR: number
  spreadAngle: number
  colors: string[]
  wattage: number
  price: number
}

interface PlacedLight {
  id: string
  fixtureId: string
  fixture: LightFixtureData
  position: [number, number, number]
  intensity: number
  enabled: boolean
}

// Scale factor: 1 inch = 0.1 3D units
const SCALE = 0.1

// Calculate PAR at a specific point from a single light
export function calculatePARFromLight(
  light: PlacedLight,
  point: { x: number; y: number; z: number }
): number {
  if (!light.enabled) return 0

  const { fixture, position, intensity } = light

  // Calculate horizontal distance from light center to point
  const dx = point.x - position[0]
  const dz = point.z - position[2]
  const horizontalDistance = Math.sqrt(dx * dx + dz * dz)

  // Calculate vertical distance (light height - point height)
  const verticalDistance = position[1] - point.y

  // If point is above light or very close, return 0
  if (verticalDistance <= 0) return 0

  // Calculate total distance
  const totalDistance = Math.sqrt(horizontalDistance * horizontalDistance + verticalDistance * verticalDistance)

  // Calculate angle from vertical (0 = directly below)
  const angleFromVertical = Math.atan2(horizontalDistance, verticalDistance) * (180 / Math.PI)

  // If outside spread angle, no light
  const halfSpread = fixture.spreadAngle / 2
  if (angleFromVertical > halfSpread) return 0

  // Base PAR at this distance using inverse square law
  // Reference: maxPAR is at 12" (1.2 units in our scale)
  const referenceDistance = 1.2
  const distanceFactor = Math.pow(referenceDistance / totalDistance, 2)

  // Angle falloff (cosine-like falloff from center)
  const angleFactor = Math.cos((angleFromVertical / halfSpread) * (Math.PI / 2))

  // Calculate final PAR
  const par = fixture.maxPAR * distanceFactor * angleFactor * (intensity / 100)

  return Math.max(0, Math.round(par))
}

// Calculate total PAR at a point from all lights
export function calculateTotalPAR(
  lights: PlacedLight[],
  point: { x: number; y: number; z: number }
): number {
  let totalPAR = 0

  for (const light of lights) {
    totalPAR += calculatePARFromLight(light, point)
  }

  return Math.round(totalPAR)
}

// Generate PAR grid for the tank floor
export function generatePARGrid(
  lights: PlacedLight[],
  tankDimensions: { length: number; width: number; height: number },
  resolution: number = 10 // points per axis
): { x: number; z: number; par: number }[] {
  const grid: { x: number; z: number; par: number }[] = []

  // Convert tank dimensions to 3D units
  const tankLength = tankDimensions.length * SCALE
  const tankWidth = tankDimensions.width * SCALE

  // Sample points on the sand bed (y = 0.1 for sand surface)
  const sandY = 0.15

  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = (i / resolution - 0.5) * tankLength
      const z = (j / resolution - 0.5) * tankWidth

      const par = calculateTotalPAR(lights, { x, y: sandY, z })
      grid.push({ x, z, par })
    }
  }

  return grid
}

// Get PAR color based on value (for heatmap)
export function getPARColor(par: number): string {
  // PAR zones for reef tanks:
  // 0-50: Low (soft corals, mushrooms) - Blue
  // 50-150: Low-Medium (LPS, some softies) - Cyan
  // 150-300: Medium (most LPS, some SPS) - Green
  // 300-500: Medium-High (SPS) - Yellow
  // 500-700: High (light-loving SPS) - Orange
  // 700+: Very High (acropora, etc.) - Red

  if (par < 50) return '#1e3a5f'      // Dark blue
  if (par < 150) return '#0891b2'     // Cyan
  if (par < 300) return '#22c55e'     // Green
  if (par < 500) return '#eab308'     // Yellow
  if (par < 700) return '#f97316'     // Orange
  return '#ef4444'                     // Red
}

// Get PAR zone description
export function getPARZone(par: number): string {
  if (par < 50) return 'Very Low'
  if (par < 150) return 'Low'
  if (par < 300) return 'Medium'
  if (par < 500) return 'Medium-High'
  if (par < 700) return 'High'
  return 'Very High'
}

// Coral PAR requirements
export const CORAL_PAR_REQUIREMENTS = {
  mushrooms: { min: 30, optimal: 75, max: 150 },
  zoanthids: { min: 50, optimal: 150, max: 300 },
  softCorals: { min: 50, optimal: 100, max: 200 },
  lps: { min: 100, optimal: 200, max: 350 },
  sps: { min: 250, optimal: 400, max: 600 },
  acropora: { min: 300, optimal: 500, max: 800 },
}

// Inline types to avoid Safari import issues
type CoralPARType = keyof typeof CORAL_PAR_REQUIREMENTS
type PARStatus = 'optimal' | 'acceptable' | 'incompatible'

// Get PAR compatibility status for a coral at a position
export function getCoralPARStatus(
  coralType: CoralPARType,
  position: { x: number; y: number; z: number },
  lights: PlacedLight[]
): { status: PARStatus; par: number } {
  const par = calculateTotalPAR(lights, position)
  const req = CORAL_PAR_REQUIREMENTS[coralType]

  if (par >= req.min && par <= req.max) {
    // Within acceptable range, check if optimal
    if (par >= req.optimal * 0.8 && par <= req.optimal * 1.2) {
      return { status: 'optimal', par }
    }
    return { status: 'acceptable', par }
  }
  return { status: 'incompatible', par }
}
