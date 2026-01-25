import type { ProceduralRockType } from '../stores/rockStore'

// Approximate bounding box dimensions for each rock type at scale 1.0
// These are half-extents (distance from center to edge)
const ROCK_HALF_EXTENTS: Record<ProceduralRockType, { x: number; y: number; z: number }> = {
  boulder: { x: 1.0, y: 1.0, z: 1.0 },    // Dodecahedron radius ~1
  branch: { x: 1.0, y: 1.0, z: 1.0 },     // Icosahedron radius ~1
  shelf: { x: 1.0, y: 0.2, z: 0.75 },     // Box 2 x 0.4 x 1.5
  pillar: { x: 0.6, y: 1.0, z: 0.6 },     // Cylinder radius ~0.6, height 2
  rubble: { x: 1.0, y: 1.0, z: 1.0 },     // Octahedron radius ~1
  cave: { x: 1.0, y: 0.8, z: 1.0 },       // Hollow dome
  arch: { x: 1.2, y: 1.0, z: 0.6 },       // Arch structure
}

// Default for custom models (conservative estimate)
const DEFAULT_HALF_EXTENTS = { x: 1.0, y: 1.0, z: 1.0 }

export interface RockBounds {
  halfX: number
  halfY: number
  halfZ: number
}

// Get scaled half-extents for a rock
export function getRockBounds(
  _type: 'procedural' | 'model',
  proceduralType: ProceduralRockType | undefined,
  scale: number
): RockBounds {
  const base = proceduralType ? ROCK_HALF_EXTENTS[proceduralType] : DEFAULT_HALF_EXTENTS
  return {
    halfX: base.x * scale,
    halfY: base.y * scale,
    halfZ: base.z * scale,
  }
}

// Tank dimensions scale factor (matches Tank.tsx)
export const TANK_SCALE = 0.1

// Get tank bounds in 3D units
export function getTankBounds(dimensions: { length: number; width: number; height: number }) {
  return {
    halfX: (dimensions.length * TANK_SCALE) / 2,
    halfZ: (dimensions.width * TANK_SCALE) / 2,
    height: dimensions.height * TANK_SCALE,
  }
}

// Clamp a rock position to stay within tank bounds
// isModelRock: GLB models typically have origin at bottom, procedural rocks have origin at center
export function clampRockPosition(
  position: [number, number, number],
  rockBounds: RockBounds,
  tankBounds: ReturnType<typeof getTankBounds>,
  isModelRock: boolean = false
): [number, number, number] {
  const margin = 0.05 // Small margin from glass
  const sandBedHeight = 0.12 // Height of sand bed (matches Tank.tsx)

  const minX = -tankBounds.halfX + rockBounds.halfX + margin
  const maxX = tankBounds.halfX - rockBounds.halfX - margin
  const minZ = -tankBounds.halfZ + rockBounds.halfZ + margin
  const maxZ = tankBounds.halfZ - rockBounds.halfZ - margin

  // For model rocks (GLB), origin is at the bottom, so position.y IS the bottom
  // For procedural rocks, origin is at center, so position.y - halfY is the bottom
  const minY = isModelRock ? sandBedHeight : sandBedHeight + rockBounds.halfY
  const maxY = isModelRock
    ? tankBounds.height - rockBounds.halfY * 2 - margin
    : tankBounds.height - rockBounds.halfY - margin

  return [
    Math.max(minX, Math.min(maxX, position[0])),
    Math.max(minY, Math.min(maxY, position[1])),
    Math.max(minZ, Math.min(maxZ, position[2])),
  ]
}

// Calculate maximum allowed scale for a rock type given tank dimensions
export function getMaxScale(
  _type: 'procedural' | 'model',
  proceduralType: ProceduralRockType | undefined,
  tankDimensions: { length: number; width: number; height: number }
): number {
  const base = proceduralType ? ROCK_HALF_EXTENTS[proceduralType] : DEFAULT_HALF_EXTENTS
  const tankBounds = getTankBounds(tankDimensions)

  // Calculate max scale that would fit in each dimension
  // Rock needs to fit with some margin on each side
  const margin = 0.1
  const maxScaleX = (tankBounds.halfX - margin) / base.x
  const maxScaleZ = (tankBounds.halfZ - margin) / base.z
  const maxScaleY = (tankBounds.height - margin) / (base.y * 2) // full height, rock sits on bottom

  // Return the smallest (most restrictive) max scale, capped at 1.0
  return Math.min(1.0, maxScaleX, maxScaleZ, maxScaleY)
}
