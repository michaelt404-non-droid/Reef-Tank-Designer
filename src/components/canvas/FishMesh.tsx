import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFishStore } from '../../stores/fishStore'
import { useTankStore } from '../../stores/tankStore'
import { useSimulationStore } from '../../stores/simulationStore'

// Inline type to avoid Safari import issues
type FishType = 'clownfish' | 'tang' | 'wrasse' | 'goby' | 'blenny' | 'angelfish' | 'chromis' | 'cardinalfish'

interface PlacedFish {
  id: string
  fishType: FishType
  position: [number, number, number]
  rotation: [number, number, number]
  targetPosition: [number, number, number]
  scale: number
  color: string
  swimSpeed: number
  // Simulation properties
  hunger: number
  health: number
  age: number
  growthProgress: number
  stressLevel: number
  lastFed: number
}

interface FishMeshProps {
  fish: PlacedFish
}

// Create fish body geometry
function createFishGeometry(type: FishType): THREE.BufferGeometry {
  const allPositions: number[] = []
  const allNormals: number[] = []

  const addGeometry = (geo: THREE.BufferGeometry) => {
    const pos = geo.attributes.position.array
    const norm = geo.attributes.normal.array
    for (let i = 0; i < pos.length; i++) {
      allPositions.push(pos[i])
      allNormals.push(norm[i])
    }
  }

  // Body shape varies by type
  let bodyLength = 1.0
  let bodyHeight = 0.4
  let bodyWidth = 0.2

  switch (type) {
    case 'tang':
    case 'angelfish':
      bodyHeight = 0.7
      bodyWidth = 0.15
      break
    case 'goby':
    case 'blenny':
      bodyLength = 0.8
      bodyHeight = 0.25
      bodyWidth = 0.2
      break
    case 'chromis':
    case 'cardinalfish':
      bodyLength = 0.7
      bodyHeight = 0.35
      break
  }

  // Main body - ellipsoid
  const bodyGeo = new THREE.SphereGeometry(0.5, 16, 12)
  bodyGeo.scale(bodyLength, bodyHeight, bodyWidth)

  // Taper toward tail
  const bodyPositions = bodyGeo.attributes.position
  for (let i = 0; i < bodyPositions.count; i++) {
    const x = bodyPositions.getX(i)
    const y = bodyPositions.getY(i)
    const z = bodyPositions.getZ(i)

    // Taper back half
    if (x < 0) {
      const taperFactor = 1 + x * 0.8
      bodyPositions.setY(i, y * Math.max(0.3, taperFactor))
      bodyPositions.setZ(i, z * Math.max(0.3, taperFactor))
    }

    // Slightly pointed nose
    if (x > 0.3) {
      const pointFactor = 1 - (x - 0.3) * 0.5
      bodyPositions.setY(i, y * pointFactor)
      bodyPositions.setZ(i, z * pointFactor)
    }
  }
  bodyPositions.needsUpdate = true
  bodyGeo.computeVertexNormals()
  addGeometry(bodyGeo)

  // Tail fin
  const tailGeo = new THREE.BoxGeometry(0.3, bodyHeight * 0.8, 0.02)
  const tailPositions = tailGeo.attributes.position
  for (let i = 0; i < tailPositions.count; i++) {
    const x = tailPositions.getX(i)
    const y = tailPositions.getY(i)
    // Fan out the tail
    if (x < 0) {
      tailPositions.setY(i, y * 1.5)
    }
  }
  tailPositions.needsUpdate = true
  tailGeo.computeVertexNormals()
  tailGeo.translate(-bodyLength * 0.55, 0, 0)
  addGeometry(tailGeo)

  // Dorsal fin
  const dorsalGeo = new THREE.BoxGeometry(bodyLength * 0.4, bodyHeight * 0.4, 0.02)
  const dorsalPositions = dorsalGeo.attributes.position
  for (let i = 0; i < dorsalPositions.count; i++) {
    const x = dorsalPositions.getX(i)
    const y = dorsalPositions.getY(i)
    // Curve the top
    if (y > 0) {
      dorsalPositions.setY(i, y * (1 - Math.abs(x) * 0.5))
    }
  }
  dorsalPositions.needsUpdate = true
  dorsalGeo.computeVertexNormals()
  dorsalGeo.translate(0, bodyHeight * 0.6, 0)
  addGeometry(dorsalGeo)

  // Pectoral fins (sides)
  const pectoralGeo = new THREE.BoxGeometry(0.15, 0.08, bodyWidth * 0.6)
  pectoralGeo.rotateX(0.3)
  pectoralGeo.translate(bodyLength * 0.15, -bodyHeight * 0.1, bodyWidth * 0.4)
  addGeometry(pectoralGeo)

  const pectoral2Geo = pectoralGeo.clone()
  pectoral2Geo.translate(0, 0, -bodyWidth * 0.8)
  addGeometry(pectoral2Geo)

  // Eye bumps
  const eyeGeo = new THREE.SphereGeometry(0.06, 8, 6)
  eyeGeo.translate(bodyLength * 0.35, bodyHeight * 0.1, bodyWidth * 0.35)
  addGeometry(eyeGeo)

  const eye2Geo = eyeGeo.clone()
  eye2Geo.translate(0, 0, -bodyWidth * 0.7)
  addGeometry(eye2Geo)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3))

  return geometry
}

export function FishMesh({ fish }: FishMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const tailRef = useRef<number>(0)

  const updateFish = useFishStore((state) => state.updateFish)
  const selectFish = useFishStore((state) => state.selectFish)
  const selectedFishId = useFishStore((state) => state.selectedFishId)
  const tankDimensions = useTankStore((state) => state.dimensions)

  // Simulation state
  const mode = useSimulationStore((state) => state.mode)
  const isRunning = useSimulationStore((state) => state.isRunning)
  const foodParticles = useSimulationStore((state) => state.foodParticles)

  const isSelected = selectedFishId === fish.id
  const isSimulating = mode === 'simulation' && isRunning

  const geometry = useMemo(() => createFishGeometry(fish.fishType), [fish.fishType])

  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: fish.color,
    roughness: 0.3,
    metalness: 0.1,
    clearcoat: 0.5,
    clearcoatRoughness: 0.3,
  }), [fish.color])

  // Swimming animation and AI
  useFrame((_, delta) => {
    if (!groupRef.current) return

    const SCALE = 0.1
    const margin = 0.2
    const tankHalfLength = (tankDimensions.length * SCALE) / 2 - margin
    const tankHalfWidth = (tankDimensions.width * SCALE) / 2 - margin
    const tankHeight = tankDimensions.height * SCALE

    // Get current position
    let [x, y, z] = fish.position
    let [tx, ty, tz] = fish.targetPosition

    // In simulation mode, hungry fish seek food
    let seekingFood = false
    if (isSimulating && fish.hunger > 0.3 && foodParticles.length > 0) {
      // Find nearest food particle
      let nearestFood = null
      let nearestDist = Infinity

      for (const food of foodParticles) {
        const fdx = food.position[0] - x
        const fdy = food.position[1] - y
        const fdz = food.position[2] - z
        const foodDist = Math.sqrt(fdx * fdx + fdy * fdy + fdz * fdz)

        // Only target food within detection range (hungrier = larger range)
        const detectionRange = 1.5 + fish.hunger * 2 // 1.5 to 3.5 units
        if (foodDist < nearestDist && foodDist < detectionRange) {
          nearestDist = foodDist
          nearestFood = food
        }
      }

      if (nearestFood) {
        // Target the food particle
        tx = nearestFood.position[0]
        ty = nearestFood.position[1]
        tz = nearestFood.position[2]
        seekingFood = true
      }
    }

    // Calculate direction to target
    const dx = tx - x
    const dy = ty - y
    const dz = tz - z
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

    // If close to target and not seeking food, pick new random target
    if (distance < 0.1 && !seekingFood) {
      const newTarget: [number, number, number] = [
        (Math.random() - 0.5) * tankHalfLength * 2,
        0.3 + Math.random() * (tankHeight - 0.6),
        (Math.random() - 0.5) * tankHalfWidth * 2,
      ]
      updateFish(fish.id, { targetPosition: newTarget })
      return
    }

    // Calculate speed based on hunger and health
    // Hungry fish swim faster toward food, but low health slows them down
    let speedMultiplier = 1.0
    if (isSimulating) {
      const hungerBoost = seekingFood ? (1 + fish.hunger * 0.5) : (1 - fish.hunger * 0.3)
      const healthPenalty = 0.5 + fish.health * 0.5 // 50% to 100% based on health
      speedMultiplier = hungerBoost * healthPenalty
    }

    // Move toward target
    const speed = fish.swimSpeed * delta * speedMultiplier
    const moveX = (dx / distance) * speed
    const moveY = (dy / distance) * speed
    const moveZ = (dz / distance) * speed

    x += moveX
    y += moveY
    z += moveZ

    // Clamp to tank bounds
    x = Math.max(-tankHalfLength, Math.min(tankHalfLength, x))
    y = Math.max(0.2, Math.min(tankHeight - 0.2, y))
    z = Math.max(-tankHalfWidth, Math.min(tankHalfWidth, z))

    // Calculate rotation to face direction
    const targetAngle = Math.atan2(dz, dx)

    // Smooth rotation
    let currentAngle = fish.rotation[1]
    let angleDiff = targetAngle - currentAngle

    // Normalize angle difference
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

    const newAngle = currentAngle + angleDiff * Math.min(1, delta * 3)

    // Tail wiggle animation - faster when seeking food
    const wiggleSpeed = seekingFood ? 15 : 10
    tailRef.current += delta * wiggleSpeed * fish.swimSpeed
    const tailWiggle = Math.sin(tailRef.current) * 0.1

    // Apply slight roll when turning
    const roll = angleDiff * 0.3

    // Update fish state
    updateFish(fish.id, {
      position: [x, y, z],
      rotation: [roll, newAngle, 0],
    })

    // Update mesh
    groupRef.current.position.set(x, y, z)
    groupRef.current.rotation.set(roll, newAngle + Math.PI, tailWiggle)
  })

  // Determine health indicator color
  const getHealthColor = () => {
    if (!isSimulating) return null
    if (fish.health < 0.3) return '#ef4444' // Red - critical
    if (fish.hunger > 0.7) return '#f97316' // Orange - very hungry
    if (fish.health < 0.6 || fish.hunger > 0.5) return '#eab308' // Yellow - warning
    return null // Don't show indicator if healthy and fed
  }
  const healthColor = getHealthColor()

  return (
    <group ref={groupRef} scale={fish.scale}>
      <mesh
        geometry={geometry}
        material={material}
        onClick={(e) => {
          e.stopPropagation()
          selectFish(fish.id)
        }}
        castShadow
      />
      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      )}
      {/* Health/hunger indicator during simulation */}
      {healthColor && !isSelected && (
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshBasicMaterial color={healthColor} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  )
}
