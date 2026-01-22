import { create } from 'zustand'
import { useTankStore } from './tankStore'
import { useRockStore } from './rockStore'
import { useLightStore } from './lightStore'
import { CORAL_INFO, CORAL_PAR_REQUIREMENTS } from '../data/corals'
import { calculateTotalPAR } from '../utils/parCalculator'
import { getRockBounds } from '../utils/rockBounds'

// Inline type to avoid Safari import issues
type CoralType = 'mushrooms' | 'zoanthids' | 'softCorals' | 'lps' | 'sps' | 'acropora'

interface PlacedCoral {
  id: string
  coralType: CoralType
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  color: string
  // Simulation properties
  health: number           // 0-1 (0 = dead, 1 = thriving)
  growthProgress: number   // 0-1 (progress to next size increase)
  colorIntensity: number   // 0-1 (1 = vibrant, 0 = bleached white)
  baseScale: number        // Original scale before growth
}

interface CoralState {
  corals: PlacedCoral[]
  selectedCoralId: string | null
  addCoral: (coralType: CoralType) => void
  removeCoral: (id: string) => void
  updateCoral: (id: string, updates: Partial<PlacedCoral>) => void
  selectCoral: (id: string | null) => void
  clearAllCorals: () => void
  // Simulation methods
  tickCorals: (deltaSimHours: number, difficultyMod: number, minHealth: number, waterQuality: number) => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

// Collision radius for each coral type (approximate)
const CORAL_COLLISION_RADIUS: Record<CoralType, number> = {
  mushrooms: 0.15,
  zoanthids: 0.12,
  softCorals: 0.18,
  lps: 0.16,
  sps: 0.14,
  acropora: 0.18,
}

// Calculate distance between two 3D points
function distance3D(a: [number, number, number], b: [number, number, number]): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

// Check if a position collides with existing corals
function collidesWithCorals(
  position: [number, number, number],
  coralType: CoralType,
  scale: number,
  existingCorals: PlacedCoral[]
): boolean {
  const newRadius = CORAL_COLLISION_RADIUS[coralType] * scale

  for (const coral of existingCorals) {
    const existingRadius = CORAL_COLLISION_RADIUS[coral.coralType] * coral.scale
    const minDistance = newRadius + existingRadius
    const actualDistance = distance3D(position, coral.position)

    if (actualDistance < minDistance) {
      return true
    }
  }

  return false
}

// Check if a position is inside a rock (collision detection)
function isInsideRock(
  position: [number, number, number],
  rocks: ReturnType<typeof useRockStore.getState>['rocks']
): boolean {
  for (const rock of rocks) {
    const bounds = getRockBounds(rock.type, rock.proceduralType, rock.scale)

    // Simple AABB collision with some margin (allow surface placement)
    const margin = 0.05
    const dx = Math.abs(position[0] - rock.position[0])
    const dy = Math.abs(position[1] - rock.position[1])
    const dz = Math.abs(position[2] - rock.position[2])

    // Check if inside the rock volume (not on surface)
    if (
      dx < bounds.halfX - margin &&
      dy < bounds.halfY - margin &&
      dz < bounds.halfZ - margin
    ) {
      return true
    }
  }

  return false
}

// Try to find a non-colliding position near the original
function findNonCollidingPosition(
  originalPosition: [number, number, number],
  coralType: CoralType,
  scale: number,
  existingCorals: PlacedCoral[],
  rocks: ReturnType<typeof useRockStore.getState>['rocks']
): [number, number, number] | null {
  const radius = CORAL_COLLISION_RADIUS[coralType] * scale
  const searchRadius = radius * 4
  const attempts = 20

  for (let i = 0; i < attempts; i++) {
    // Spiral outward search pattern
    const angle = (i / attempts) * Math.PI * 4
    const dist = (i / attempts) * searchRadius
    const offsetX = Math.cos(angle) * dist
    const offsetZ = Math.sin(angle) * dist

    const testPosition: [number, number, number] = [
      originalPosition[0] + offsetX,
      originalPosition[1],
      originalPosition[2] + offsetZ,
    ]

    if (
      !collidesWithCorals(testPosition, coralType, scale, existingCorals) &&
      !isInsideRock(testPosition, rocks)
    ) {
      return testPosition
    }
  }

  return null
}

// Find valid positions on rocks for a coral based on PAR requirements
function findValidRockPositions(
  coralType: CoralType,
  scale: number,
  rocks: ReturnType<typeof useRockStore.getState>['rocks'],
  lights: ReturnType<typeof useLightStore.getState>['lights'],
  existingCorals: PlacedCoral[]
): { position: [number, number, number]; par: number }[] {
  const parReq = CORAL_PAR_REQUIREMENTS[coralType]
  const validPositions: { position: [number, number, number]; par: number }[] = []

  for (const rock of rocks) {
    const bounds = getRockBounds(rock.type, rock.proceduralType, rock.scale)

    // Sample more positions on rock surface for better coverage
    const samplePoints: [number, number, number][] = []

    // Top surface points - more samples
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const radiusRatio = 0.3 + Math.random() * 0.6
      const radius = bounds.halfX * radiusRatio
      samplePoints.push([
        rock.position[0] + Math.cos(angle) * radius,
        rock.position[1] + bounds.halfY * 0.95,
        rock.position[2] + Math.sin(angle) * radius,
      ])
    }

    // Center top
    samplePoints.push([
      rock.position[0],
      rock.position[1] + bounds.halfY * 0.95,
      rock.position[2],
    ])

    // Side positions at different heights - more samples
    const heightLevels = [0.2, 0.4, 0.6, 0.8, 0.95]
    for (const heightRatio of heightLevels) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        samplePoints.push([
          rock.position[0] + Math.cos(angle) * bounds.halfX * 1.02,
          rock.position[1] - bounds.halfY + bounds.halfY * 2 * heightRatio,
          rock.position[2] + Math.sin(angle) * bounds.halfZ * 1.02,
        ])
      }
    }

    // Check PAR and collisions at each sample point
    for (const point of samplePoints) {
      // Skip if collides with existing corals
      if (collidesWithCorals(point, coralType, scale, existingCorals)) {
        continue
      }

      // Skip if inside a rock
      if (isInsideRock(point, rocks)) {
        continue
      }

      const par = calculateTotalPAR(lights, { x: point[0], y: point[1], z: point[2] })

      // Check if PAR is within acceptable range
      if (par >= parReq.min && par <= parReq.max) {
        validPositions.push({ position: point, par })
      }
    }
  }

  // Sort by how close to optimal PAR
  const optimal = parReq.optimal
  validPositions.sort((a, b) => {
    const aDiff = Math.abs(a.par - optimal)
    const bDiff = Math.abs(b.par - optimal)
    return aDiff - bDiff
  })

  return validPositions
}

export const useCoralStore = create<CoralState>((set) => ({
  corals: [],
  selectedCoralId: null,

  addCoral: (coralType) => set((state) => {
    const coralInfo = CORAL_INFO.find(c => c.id === coralType)
    if (!coralInfo) return state

    // Get rocks and lights for PAR-aware placement
    const rocks = useRockStore.getState().rocks
    const lights = useLightStore.getState().lights

    // Get tank dimensions for fallback placement
    const tankDimensions = useTankStore.getState().dimensions
    const SCALE = 0.1
    const tankHalfLength = (tankDimensions.length * SCALE) / 2
    const tankHalfWidth = (tankDimensions.width * SCALE) / 2

    // Calculate scale first (needed for collision detection)
    const scale = coralInfo.baseScale * (0.8 + Math.random() * 0.4)

    let position: [number, number, number] | null = null

    // Try to find a valid rock position with correct PAR and no collisions
    const validPositions = findValidRockPositions(coralType, scale, rocks, lights, state.corals)

    if (validPositions.length > 0) {
      // Pick from top positions (closest to optimal PAR) with some randomness
      const topCount = Math.min(5, validPositions.length)
      const selected = validPositions[Math.floor(Math.random() * topCount)]
      position = selected.position
    } else if (rocks.length > 0) {
      // No valid PAR positions, try to find any non-colliding position on rocks
      for (const rock of rocks) {
        const bounds = getRockBounds(rock.type, rock.proceduralType, rock.scale)

        // Try multiple positions on this rock
        for (let attempt = 0; attempt < 10; attempt++) {
          const angle = Math.random() * Math.PI * 2
          const radiusRatio = 0.5 + Math.random() * 0.5
          const testPosition: [number, number, number] = [
            rock.position[0] + Math.cos(angle) * bounds.halfX * radiusRatio,
            rock.position[1] + bounds.halfY * (0.5 + Math.random() * 0.5),
            rock.position[2] + Math.sin(angle) * bounds.halfZ * radiusRatio,
          ]

          if (!collidesWithCorals(testPosition, coralType, scale, state.corals)) {
            position = testPosition
            break
          }
        }

        if (position) break
      }

      // If still no position, try to find a non-colliding spot near existing coral
      if (!position && state.corals.length > 0) {
        const randomCoral = state.corals[Math.floor(Math.random() * state.corals.length)]
        position = findNonCollidingPosition(
          randomCoral.position,
          coralType,
          scale,
          state.corals,
          rocks
        )
      }
    }

    // Fallback to sand bed with collision detection
    if (!position) {
      const margin = 0.2
      let attempts = 0
      const maxAttempts = 30

      while (attempts < maxAttempts) {
        const testPosition: [number, number, number] = [
          (Math.random() - 0.5) * (tankHalfLength * 2 - margin * 2),
          0.15,
          (Math.random() - 0.5) * (tankHalfWidth * 2 - margin * 2),
        ]

        if (!collidesWithCorals(testPosition, coralType, scale, state.corals)) {
          position = testPosition
          break
        }

        attempts++
      }

      // Last resort - just place it somewhere
      if (!position) {
        position = [
          (Math.random() - 0.5) * (tankHalfLength * 2 - margin * 2),
          0.15,
          (Math.random() - 0.5) * (tankHalfWidth * 2 - margin * 2),
        ]
      }
    }

    // Random color from coral's palette
    const color = coralInfo.baseColors[Math.floor(Math.random() * coralInfo.baseColors.length)]

    const newCoral: PlacedCoral = {
      id: generateId(),
      coralType,
      position,
      rotation: [0, Math.random() * Math.PI * 2, 0],
      scale,
      color,
      // Initialize simulation properties
      health: 1.0,           // Start healthy
      growthProgress: 0,     // No growth yet
      colorIntensity: 1.0,   // Full color
      baseScale: scale,      // Remember original size
    }

    return { corals: [...state.corals, newCoral] }
  }),

  removeCoral: (id) => set((state) => ({
    corals: state.corals.filter(c => c.id !== id),
    selectedCoralId: state.selectedCoralId === id ? null : state.selectedCoralId,
  })),

  updateCoral: (id, updates) => set((state) => ({
    corals: state.corals.map(c => c.id === id ? { ...c, ...updates } : c),
  })),

  selectCoral: (id) => set({ selectedCoralId: id }),

  clearAllCorals: () => set({ corals: [], selectedCoralId: null }),

  // Simulation methods
  tickCorals: (deltaSimHours, difficultyMod, minHealth, waterQuality) => set((state) => {
    const lights = useLightStore.getState().lights

    const updatedCorals = state.corals.map(coral => {
      // Calculate PAR at coral's position
      const par = calculateTotalPAR(lights, {
        x: coral.position[0],
        y: coral.position[1],
        z: coral.position[2],
      })

      // Get PAR requirements for this coral type
      const parReq = CORAL_PAR_REQUIREMENTS[coral.coralType]

      // Calculate PAR factor (how well-suited the light is)
      let parFactor = 1.0
      if (par < parReq.min) {
        // Too little light
        parFactor = Math.max(0.2, par / parReq.min)
      } else if (par > parReq.max) {
        // Too much light (can cause bleaching)
        parFactor = Math.max(0.3, 1 - (par - parReq.max) / parReq.max)
      } else if (par >= parReq.optimal * 0.8 && par <= parReq.optimal * 1.2) {
        // Optimal range - bonus
        parFactor = 1.2
      }

      // Health changes based on PAR and water quality
      const healthTarget = parFactor * waterQuality
      const healthDelta = (healthTarget - coral.health) * 0.02 * deltaSimHours * difficultyMod
      const newHealth = Math.max(minHealth, Math.min(1, coral.health + healthDelta))

      // Color intensity follows health (bleaching when stressed)
      // Color recovers slower than it fades
      let colorDelta = 0
      if (newHealth < coral.colorIntensity) {
        // Bleaching - color fades relatively quickly
        colorDelta = (newHealth - coral.colorIntensity) * 0.1 * deltaSimHours
      } else {
        // Recovery - color returns slowly
        colorDelta = (newHealth - coral.colorIntensity) * 0.02 * deltaSimHours / difficultyMod
      }
      const newColorIntensity = Math.max(0.1, Math.min(1, coral.colorIntensity + colorDelta))

      // Growth only happens when healthy and in good conditions
      let growthDelta = 0
      if (newHealth > 0.7 && waterQuality > 0.6) {
        // Growth rate based on coral type (SPS/Acropora grow slower)
        const baseGrowthRate = coral.coralType === 'acropora' ? 0.001 :
                               coral.coralType === 'sps' ? 0.0015 :
                               coral.coralType === 'lps' ? 0.002 :
                               0.003 // Softies grow faster

        growthDelta = baseGrowthRate * parFactor * waterQuality * deltaSimHours / difficultyMod
      }
      const newGrowthProgress = Math.min(1, coral.growthProgress + growthDelta)

      // Scale increases with growth (up to 50% larger than base)
      const growthScale = coral.baseScale * (1 + newGrowthProgress * 0.5)

      return {
        ...coral,
        health: newHealth,
        colorIntensity: newColorIntensity,
        growthProgress: newGrowthProgress,
        scale: growthScale,
      }
    })

    return { corals: updatedCorals }
  }),
}))
