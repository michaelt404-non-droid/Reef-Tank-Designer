import { getRockBounds } from './rockBounds'

type ProceduralRockType = 'boulder' | 'branch' | 'shelf' | 'pillar' | 'rubble' | 'cave' | 'arch'

interface Rock {
  id: string
  type: 'procedural' | 'model'
  proceduralType?: ProceduralRockType
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
}

interface CollisionResult {
  collides: boolean
  normal?: [number, number, number]
}

// Define opening zones for caves and arches that fish can swim through
function getOpeningZone(rock: Rock): { min: [number, number, number], max: [number, number, number] } | null {
  const bounds = getRockBounds(rock.type, rock.proceduralType, rock.scale)

  if (rock.proceduralType === 'cave') {
    // Cave opening is on the front (+Z side), lower portion
    // The cave structure has an open front face where fish can enter
    return {
      min: [
        rock.position[0] - bounds.halfX * 0.6,
        rock.position[1],
        rock.position[2] + bounds.halfZ * 0.3
      ],
      max: [
        rock.position[0] + bounds.halfX * 0.6,
        rock.position[1] + bounds.halfY * 0.9,
        rock.position[2] + bounds.halfZ * 1.5
      ]
    }
  }

  if (rock.proceduralType === 'arch') {
    // Arch opening is the gap under the arch bridge
    // Fish can swim through the center opening
    return {
      min: [
        rock.position[0] - bounds.halfX * 0.4,
        rock.position[1],
        rock.position[2] - bounds.halfZ * 0.8
      ],
      max: [
        rock.position[0] + bounds.halfX * 0.4,
        rock.position[1] + bounds.halfY * 0.5,
        rock.position[2] + bounds.halfZ * 0.8
      ]
    }
  }

  return null
}

function pointInBox(
  point: [number, number, number],
  min: [number, number, number],
  max: [number, number, number]
): boolean {
  return (
    point[0] >= min[0] && point[0] <= max[0] &&
    point[1] >= min[1] && point[1] <= max[1] &&
    point[2] >= min[2] && point[2] <= max[2]
  )
}

// Check if a fish position collides with any rock
export function checkFishRockCollision(
  fishPosition: [number, number, number],
  fishRadius: number,
  rocks: Rock[]
): CollisionResult {
  for (const rock of rocks) {
    const bounds = getRockBounds(rock.type, rock.proceduralType, rock.scale)

    const [fx, fy, fz] = fishPosition
    const [rx, ry, rz] = rock.position

    // Calculate distance from fish to rock center
    const dx = fx - rx
    const dy = fy - ry
    const dz = fz - rz

    // AABB collision check with margin for fish size
    const margin = fishRadius
    const inX = Math.abs(dx) < bounds.halfX + margin
    const inY = Math.abs(dy) < bounds.halfY + margin
    const inZ = Math.abs(dz) < bounds.halfZ + margin

    if (inX && inY && inZ) {
      // Potential collision - check if fish is in an opening zone
      const opening = getOpeningZone(rock)
      if (opening && pointInBox(fishPosition, opening.min, opening.max)) {
        // Fish is in the opening, no collision
        continue
      }

      // Calculate push direction (normal) - push fish out in direction of least penetration
      const penetrationX = bounds.halfX + margin - Math.abs(dx)
      const penetrationY = bounds.halfY + margin - Math.abs(dy)
      const penetrationZ = bounds.halfZ + margin - Math.abs(dz)

      let normal: [number, number, number] = [0, 0, 0]
      const minPenetration = Math.min(penetrationX, penetrationY, penetrationZ)

      if (minPenetration === penetrationX) {
        normal = [dx > 0 ? 1 : -1, 0, 0]
      } else if (minPenetration === penetrationY) {
        normal = [0, dy > 0 ? 1 : -1, 0]
      } else {
        normal = [0, 0, dz > 0 ? 1 : -1]
      }

      return { collides: true, normal }
    }
  }

  return { collides: false }
}

// Get an adjusted position that avoids rock collision
export function getCollisionFreePosition(
  _currentPos: [number, number, number],
  desiredPos: [number, number, number],
  fishRadius: number,
  rocks: Rock[]
): [number, number, number] {
  const collision = checkFishRockCollision(desiredPos, fishRadius, rocks)

  if (!collision.collides) {
    return desiredPos
  }

  // Push fish away from rock
  const [nx, ny, nz] = collision.normal!
  const pushStrength = fishRadius + 0.05

  return [
    desiredPos[0] + nx * pushStrength,
    desiredPos[1] + ny * pushStrength,
    desiredPos[2] + nz * pushStrength
  ]
}
