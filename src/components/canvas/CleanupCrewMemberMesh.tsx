import { useRef, useMemo, useState, useCallback, useEffect, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { CleanupCrewMember } from '../../stores/simulationStore'
import { useTankStore } from '../../stores/tankStore'
import { CLEANUP_CREW_INFO } from '../../data/cleanupCrew'

interface CleanupCrewMemberMeshProps {
  member: CleanupCrewMember
}

const TANK_SCALE = 0.1

// Component for rendering GLB model cleanup crew with original textures
function ModelCleanupCrew({ modelPath }: { modelPath: string }) {
  const { scene } = useGLTF(modelPath)
  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map(mat => {
              const clonedMat = mat.clone()
              clonedMat.side = THREE.DoubleSide
              return clonedMat
            })
          } else {
            child.material = child.material.clone()
            child.material.side = THREE.DoubleSide
          }
        }
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  return <primitive object={clonedScene} />
}

// Procedural geometry for shrimp (no GLB model yet)
function createShrimpGeometry(): THREE.BufferGeometry {
  const allPositions: number[] = []
  const allNormals: number[] = []

  const addGeometry = (geo: THREE.BufferGeometry, offset: [number, number, number] = [0, 0, 0]) => {
    const pos = geo.attributes.position.array
    const norm = geo.attributes.normal.array
    for (let i = 0; i < pos.length; i += 3) {
      allPositions.push(pos[i] + offset[0], pos[i + 1] + offset[1], pos[i + 2] + offset[2])
      allNormals.push(norm[i], norm[i + 1], norm[i + 2])
    }
  }

  const head = new THREE.SphereGeometry(0.035, 12, 8)
  head.scale(1.2, 0.9, 1.0)
  addGeometry(head, [0, 0.035, 0.04])

  for (let i = 0; i < 5; i++) {
    const segmentSize = 0.028 - i * 0.003
    const segment = new THREE.SphereGeometry(segmentSize, 8, 6)
    segment.scale(1, 0.8, 0.9)
    addGeometry(segment, [0, 0.03, -0.02 - i * 0.025])
  }

  const tailCenter = new THREE.CylinderGeometry(0.015, 0.02, 0.004, 8)
  tailCenter.rotateX(Math.PI / 2)
  tailCenter.translate(0, 0.025, -0.16)
  addGeometry(tailCenter)

  for (let side = -1; side <= 1; side += 2) {
    const antenna = new THREE.CylinderGeometry(0.002, 0.001, 0.12, 4)
    antenna.rotateX(-0.3)
    antenna.rotateZ(side * 0.3)
    antenna.translate(side * 0.015, 0.055, 0.1)
    addGeometry(antenna)
  }

  for (let i = 0; i < 5; i++) {
    for (let side = -1; side <= 1; side += 2) {
      const leg = new THREE.CylinderGeometry(0.003, 0.002, 0.035, 4)
      leg.rotateZ(side * (0.6 + i * 0.1))
      leg.translate(side * 0.025, 0.01, 0.02 - i * 0.025)
      addGeometry(leg)
    }
  }

  const clawL = new THREE.SphereGeometry(0.012, 6, 6)
  clawL.scale(1.5, 0.6, 0.8)
  clawL.translate(0.035, 0.02, 0.06)
  addGeometry(clawL)

  const clawR = new THREE.SphereGeometry(0.012, 6, 6)
  clawR.scale(1.5, 0.6, 0.8)
  clawR.translate(-0.035, 0.02, 0.06)
  addGeometry(clawR)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3))
  geometry.computeVertexNormals()
  return geometry
}

function ProceduralShrimp() {
  const geometry = useMemo(() => createShrimpGeometry(), [])

  const material = useMemo(() => {
    return new THREE.MeshLambertMaterial({
      color: '#FF6666',
      flatShading: false,
      emissive: new THREE.Color('#FF6666'),
      emissiveIntensity: 0.1,
    })
  }, [])

  const outlineMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.BackSide,
    })
  }, [])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
      outlineMaterial.dispose()
    }
  }, [geometry, material, outlineMaterial])

  return (
    <>
      <mesh geometry={geometry} material={material} castShadow />
      <mesh geometry={geometry} material={outlineMaterial} scale={1.04} />
    </>
  )
}

// Movement types
type MovementSurface = 'glass' | 'sand_and_rocks'

function getMovementSurface(type: string): MovementSurface {
  switch (type) {
    case 'snail':
    case 'sea_urchin':
      return 'glass'
    case 'hermitCrab':
    case 'emeraldCrab':
    default:
      return 'sand_and_rocks'
  }
}

export function CleanupCrewMemberMesh({ member }: CleanupCrewMemberMeshProps) {
  const meshRef = useRef<THREE.Group>(null)
  useThree()
  const { dimensions } = useTankStore()

  const crewInfo = useMemo(() =>
    CLEANUP_CREW_INFO.find(c => c.id === member.type),
    [member.type]
  )

  const movementSurface = getMovementSurface(member.type)

  // Tank bounds
  const tankBounds = useMemo(() => {
    const tankLength = dimensions.length * TANK_SCALE
    const tankWidth = dimensions.width * TANK_SCALE
    const tankHeight = dimensions.height * TANK_SCALE
    // Sand bed is 0.12 tall, positioned at y=0.08, so sand surface is at 0.08 + 0.06 = 0.14
    // Add a small offset to ensure creatures sit on top of the sand
    return {
      halfLength: tankLength / 2,
      halfWidth: tankWidth / 2,
      height: tankHeight,
      sandY: 0.15,
    }
  }, [dimensions])

  // Initialize position based on movement type
  const [position, setPosition] = useState<THREE.Vector3>(() => {
    if (movementSurface === 'glass') {
      // Start on a random glass wall
      const wall = Math.floor(Math.random() * 4)
      const y = tankBounds.sandY + Math.random() * (tankBounds.height - tankBounds.sandY - 0.1)
      switch (wall) {
        case 0: return new THREE.Vector3(-tankBounds.halfLength + 0.02, y, (Math.random() - 0.5) * tankBounds.halfWidth * 1.8)
        case 1: return new THREE.Vector3(tankBounds.halfLength - 0.02, y, (Math.random() - 0.5) * tankBounds.halfWidth * 1.8)
        case 2: return new THREE.Vector3((Math.random() - 0.5) * tankBounds.halfLength * 1.8, y, -tankBounds.halfWidth + 0.02)
        default: return new THREE.Vector3((Math.random() - 0.5) * tankBounds.halfLength * 1.8, y, tankBounds.halfWidth - 0.02)
      }
    } else {
      // Start on sand
      return new THREE.Vector3(
        (Math.random() - 0.5) * tankBounds.halfLength * 1.5,
        tankBounds.sandY,
        (Math.random() - 0.5) * tankBounds.halfWidth * 1.5
      )
    }
  })

  // Surface normal (up vector for orientation)
  const [surfaceNormal, setSurfaceNormal] = useState<THREE.Vector3>(() => {
    if (movementSurface === 'glass') {
      // Determine which wall we're on based on initial position
      if (Math.abs(position.x) > Math.abs(position.z)) {
        return new THREE.Vector3(position.x > 0 ? -1 : 1, 0, 0)
      } else {
        return new THREE.Vector3(0, 0, position.z > 0 ? -1 : 1)
      }
    }
    return new THREE.Vector3(0, 1, 0) // Sand/rock = up
  })

  const [targetPoint, setTargetPoint] = useState<THREE.Vector3 | null>(null)
  const [facingAngle, setFacingAngle] = useState(Math.random() * Math.PI * 2)

  // Find a new target on the appropriate surface
  const findNewTarget = useCallback(() => {
    if (movementSurface === 'glass') {
      // Pick a random point on the glass walls
      const currentWall = getCurrentWall(position, tankBounds)

      // 70% chance to stay on same wall, 30% to move to adjacent wall
      let targetWall = currentWall
      if (Math.random() < 0.3) {
        const adjacentWalls = getAdjacentWalls(currentWall)
        targetWall = adjacentWalls[Math.floor(Math.random() * adjacentWalls.length)]
      }

      const y = tankBounds.sandY + 0.05 + Math.random() * (tankBounds.height - tankBounds.sandY - 0.15)
      let newTarget: THREE.Vector3

      switch (targetWall) {
        case 'left':
          newTarget = new THREE.Vector3(-tankBounds.halfLength + 0.02, y, (Math.random() - 0.5) * tankBounds.halfWidth * 1.8)
          break
        case 'right':
          newTarget = new THREE.Vector3(tankBounds.halfLength - 0.02, y, (Math.random() - 0.5) * tankBounds.halfWidth * 1.8)
          break
        case 'front':
          newTarget = new THREE.Vector3((Math.random() - 0.5) * tankBounds.halfLength * 1.8, y, -tankBounds.halfWidth + 0.02)
          break
        default: // back
          newTarget = new THREE.Vector3((Math.random() - 0.5) * tankBounds.halfLength * 1.8, y, tankBounds.halfWidth - 0.02)
      }

      setTargetPoint(newTarget)
      setSurfaceNormal(getWallNormal(targetWall))
    } else {
      // Hermit crab: sand only
      setTargetPoint(new THREE.Vector3(
        (Math.random() - 0.5) * tankBounds.halfLength * 1.6,
        tankBounds.sandY,
        (Math.random() - 0.5) * tankBounds.halfWidth * 1.6
      ))
      setSurfaceNormal(new THREE.Vector3(0, 1, 0))
    }
  }, [position, tankBounds, movementSurface])

  // Movement
  useFrame((state, delta) => {
    if (!meshRef.current) return

    const speed = delta * (
      member.type === 'snail' ? 0.02 :
      member.type === 'sea_urchin' ? 0.015 :
      member.type === 'cleaner_shrimp' ? 0.05 :
      0.03 // hermit/emerald crab
    )

    // Find new target if needed
    if (!targetPoint || position.distanceTo(targetPoint) < 0.05) {
      findNewTarget()
      return
    }

    // Move toward target
    const direction = new THREE.Vector3().subVectors(targetPoint, position)
    const distance = direction.length()
    direction.normalize()

    // Calculate new position
    const moveAmount = Math.min(speed, distance)
    const newPos = position.clone().addScaledVector(direction, moveAmount)

    // Constrain to surface
    if (movementSurface === 'glass') {
      // Keep on the glass - snap to nearest wall
      const wall = getCurrentWall(newPos, tankBounds)
      switch (wall) {
        case 'left':
          newPos.x = -tankBounds.halfLength + 0.02
          break
        case 'right':
          newPos.x = tankBounds.halfLength - 0.02
          break
        case 'front':
          newPos.z = -tankBounds.halfWidth + 0.02
          break
        case 'back':
          newPos.z = tankBounds.halfWidth - 0.02
          break
      }
      // Clamp Y
      newPos.y = Math.max(tankBounds.sandY + 0.03, Math.min(tankBounds.height - 0.05, newPos.y))
      setSurfaceNormal(getWallNormal(wall))
    } else {
      // Sand only - stay on sand level
      newPos.y = tankBounds.sandY

      // Clamp to tank bounds
      newPos.x = Math.max(-tankBounds.halfLength + 0.05, Math.min(tankBounds.halfLength - 0.05, newPos.x))
      newPos.z = Math.max(-tankBounds.halfWidth + 0.05, Math.min(tankBounds.halfWidth - 0.05, newPos.z))
    }

    setPosition(newPos)
    meshRef.current.position.copy(newPos)

    // Calculate facing direction (only rotate around surface normal axis)
    const flatDirection = direction.clone()
    if (movementSurface === 'glass') {
      // For glass, project direction onto the wall plane
      flatDirection.sub(surfaceNormal.clone().multiplyScalar(flatDirection.dot(surfaceNormal)))
    } else {
      flatDirection.y = 0 // Keep flat for ground movement
    }

    if (flatDirection.lengthSq() > 0.0001) {
      flatDirection.normalize()
      const targetAngle = Math.atan2(flatDirection.x, flatDirection.z)
      // Smooth rotation
      let angleDiff = targetAngle - facingAngle
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      const newAngle = facingAngle + angleDiff * Math.min(1, delta * 3)
      setFacingAngle(newAngle)
    }

    // Apply orientation - creature's "up" should align with surface normal
    // and "forward" should be the facing direction
    const up = surfaceNormal.clone()
    const forward = new THREE.Vector3(Math.sin(facingAngle), 0, Math.cos(facingAngle))

    // For glass walls, rotate forward into the wall plane
    if (movementSurface === 'glass') {
      forward.sub(up.clone().multiplyScalar(forward.dot(up))).normalize()
    }

    const right = new THREE.Vector3().crossVectors(up, forward).normalize()
    forward.crossVectors(right, up).normalize()

    const rotMatrix = new THREE.Matrix4().makeBasis(right, up, forward)
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMatrix)

    meshRef.current.quaternion.slerp(targetQuat, delta * 5)

    // Subtle animation
    if (member.type === 'cleaner_shrimp') {
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 8) * 0.001
    }
  })

  // Much smaller scales
  const modelScale = useMemo(() => {
    switch (member.type) {
      case 'snail': return 0.06
      case 'hermitCrab': return 0.05
      case 'emeraldCrab': return 0.045
      case 'sea_urchin': return 0.04
      case 'cleaner_shrimp': return 0.08
      default: return 0.05
    }
  }, [member.type])

  return (
    <group
      ref={meshRef}
      position={position.toArray()}
      scale={modelScale}
    >
      {crewInfo?.modelPath ? (
        <Suspense fallback={null}>
          <ModelCleanupCrew modelPath={crewInfo.modelPath} />
        </Suspense>
      ) : (
        <ProceduralShrimp />
      )}
    </group>
  )
}

// Helper functions
type Wall = 'left' | 'right' | 'front' | 'back'

function getCurrentWall(pos: THREE.Vector3, bounds: { halfLength: number; halfWidth: number }): Wall {
  const distLeft = Math.abs(pos.x - (-bounds.halfLength))
  const distRight = Math.abs(pos.x - bounds.halfLength)
  const distFront = Math.abs(pos.z - (-bounds.halfWidth))
  const distBack = Math.abs(pos.z - bounds.halfWidth)

  const minDist = Math.min(distLeft, distRight, distFront, distBack)
  if (minDist === distLeft) return 'left'
  if (minDist === distRight) return 'right'
  if (minDist === distFront) return 'front'
  return 'back'
}

function getAdjacentWalls(wall: Wall): Wall[] {
  switch (wall) {
    case 'left': return ['front', 'back']
    case 'right': return ['front', 'back']
    case 'front': return ['left', 'right']
    case 'back': return ['left', 'right']
  }
}

function getWallNormal(wall: Wall): THREE.Vector3 {
  switch (wall) {
    case 'left': return new THREE.Vector3(1, 0, 0)
    case 'right': return new THREE.Vector3(-1, 0, 0)
    case 'front': return new THREE.Vector3(0, 0, 1)
    case 'back': return new THREE.Vector3(0, 0, -1)
  }
}
