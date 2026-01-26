import { useRef, useMemo, useEffect, Suspense, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useFishStore } from '../../stores/fishStore'
import { useTankStore } from '../../stores/tankStore'
import { useSimulationStore } from '../../stores/simulationStore'
import { FISH_INFO } from '../../data/fish'
import { getSelectionMaterial, getHealthMaterial, getIndicatorGeometry, getSharedLambertMaterial, getSharedBasicMaterial } from '../../utils/sharedMaterials'
import type { FishInfo } from '../../data/fish'

// Simplified PlacedFish type for this component
interface PlacedFish {
  id: string
  fishType: FishInfo['id']
  position: [number, number, number]
  rotation: [number, number, number]
  targetPosition: [number, number, number]
  scale: number
  color: string
  swimSpeed: number
  hunger: number
  health: number
}

interface FishMeshProps {
  fish: PlacedFish
}

// --- Model Loading Component ---
// This component loads the GLB model and applies materials.
function ModelFish({
  fish,
  modelPath,
  preserveOriginalMaterials = false,
}: {
  fish: PlacedFish
  modelPath: string
  preserveOriginalMaterials?: boolean
}) {
  const { scene } = useGLTF(modelPath)

  // Memoize the cloned scene to prevent re-creation on every render
  const clonedScene = useMemo(() => scene.clone(), [scene])

  const cartoonMaterial = getSharedLambertMaterial(fish.color, {
    side: THREE.DoubleSide,
    emissive: fish.color,
    emissiveIntensity: 0.1,
  })

  const outlineMaterial = getSharedBasicMaterial(0x000000, { side: THREE.BackSide })

  // Apply materials
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true

        // For custom uploaded models, preserve original materials/textures
        if (preserveOriginalMaterials) {
          return
        }

        // For built-in models, apply cartoon styling
        const outlineMesh = child.clone()
        outlineMesh.material = outlineMaterial
        outlineMesh.scale.multiplyScalar(1.05)
        child.parent?.add(outlineMesh)

        // Apply the main cartoon material to the original mesh
        child.material = cartoonMaterial
      }
    })
    // No cleanup function needed here because materials are shared and managed centrally.
  }, [clonedScene, cartoonMaterial, outlineMaterial, preserveOriginalMaterials])

  return <primitive object={clonedScene} />
}


// --- Main Fish Component ---
const FishMeshComponent = ({ fish }: FishMeshProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const updateFish = useFishStore((state) => state.updateFish)
  const selectFish = useFishStore((state) => state.selectFish)
  const selectedFishId = useFishStore((state) => state.selectedFishId)
  const allFish = useFishStore((state) => state.fish)
  const tankDimensions = useTankStore((state) => state.dimensions)

  // Simulation state
  const mode = useSimulationStore((state) => state.mode)
  const isRunning = useSimulationStore((state) => state.isRunning)
  const foodParticles = useSimulationStore((state) => state.foodParticles)

  const isSelected = selectedFishId === fish.id
  const isSimulating = mode === 'simulation' && isRunning

  // Get custom fish models from the store
  const customFishModels = useFishStore((state) => state.customFishModels)

  // Get model information from FISH_INFO or customFishModels
  const fishInfo = useMemo(() =>
    [...FISH_INFO, ...customFishModels].find(f => f.id === fish.fishType),
    [fish.fishType, customFishModels]
  )

  // Find fish of the same type for schooling/pairing behavior
  const sameFish = useMemo(() =>
    allFish.filter(f => f.fishType === fish.fishType && f.id !== fish.id),
    [allFish, fish.fishType, fish.id]
  )

  // Determine if this fish schools or pairs
  const isSchooling = fishInfo?.schooling ?? false
  const isPairing = fish.fishType === 'clownfish' && sameFish.length === 1
  const swimZone = fishInfo?.swimZone ?? 'all'

  // Refs for smooth animation values
  const tailRef = useRef(0)
  const bodyFlexRef = useRef(0)

  // Use refs to track position internally - initialized once, then managed by useFrame
  const positionRef = useRef<[number, number, number] | null>(null)
  const targetRef = useRef<[number, number, number] | null>(null)
  const angleRef = useRef<number | null>(null)
  const frameCountRef = useRef(0)

  // --- Swimming AI and Animation ---
  useFrame((_, delta) => {
    if (!groupRef.current) return

    const SCALE = 0.1
    const margin = 0.2
    const tankHalfLength = (tankDimensions.length * SCALE) / 2 - margin
    const tankHalfWidth = (tankDimensions.width * SCALE) / 2 - margin
    const tankHeight = tankDimensions.height * SCALE

    // Calculate swim zone Y bounds based on fish preference
    // Zones divide the tank into regions: bottom (0-20%), lower (10-40%), middle (30-70%), upper (60-90%), top (80-100%)
    const getZoneBounds = (zone: string): { minY: number; maxY: number } => {
      const sandHeight = 0.15 // Above sand bed
      const surfaceMargin = 0.15 // Below water surface
      const usableMin = sandHeight
      const usableMax = tankHeight - surfaceMargin

      switch (zone) {
        case 'bottom':
          return { minY: usableMin, maxY: usableMin + (usableMax - usableMin) * 0.25 }
        case 'lower':
          return { minY: usableMin + (usableMax - usableMin) * 0.1, maxY: usableMin + (usableMax - usableMin) * 0.45 }
        case 'middle':
          return { minY: usableMin + (usableMax - usableMin) * 0.3, maxY: usableMin + (usableMax - usableMin) * 0.7 }
        case 'upper':
          return { minY: usableMin + (usableMax - usableMin) * 0.55, maxY: usableMin + (usableMax - usableMin) * 0.9 }
        case 'top':
          return { minY: usableMin + (usableMax - usableMin) * 0.75, maxY: usableMax }
        case 'all':
        default:
          return { minY: usableMin, maxY: usableMax }
      }
    }
    const zoneBounds = getZoneBounds(swimZone)

    // Initialize refs on first frame
    if (positionRef.current === null) {
      positionRef.current = [...fish.position]
      targetRef.current = [...fish.targetPosition]
      angleRef.current = fish.rotation[1]
    }

    // Use internal refs for smooth animation - refs are guaranteed non-null after above check
    const currentPos = positionRef.current!
    const currentTarget = targetRef.current!
    let [x, y, z] = currentPos
    let [tx, ty, tz] = currentTarget

    // --- AI: Target Selection (Food, School/Pair, or Random) ---
    let seekingFood = false
    let socialTarget: [number, number, number] | null = null

    // Priority 1: Seek food when hungry
    if (isSimulating && fish.hunger > 0.15 && foodParticles.length > 0) {
      let nearestFood = null
      let nearestDist = Infinity
      for (const food of foodParticles) {
        const distSq = (food.position[0] - x)**2 + (food.position[1] - y)**2 + (food.position[2] - z)**2
        if (distSq < nearestDist) {
          nearestDist = distSq
          nearestFood = food
        }
      }

      // Increased detection range: 2.5 + hunger * 3 (max ~5.5 units)
      const detectionRange = 2.5 + fish.hunger * 3
      if (nearestFood && nearestDist < detectionRange ** 2) {
        [tx, ty, tz] = nearestFood.position
        seekingFood = true
      }
    }

    // Priority 2: Schooling behavior - swim toward center of school with slight offset
    if (!seekingFood && isSchooling && sameFish.length > 0) {
      // Calculate center of school
      let schoolX = 0, schoolY = 0, schoolZ = 0
      for (const mate of sameFish) {
        schoolX += mate.position[0]
        schoolY += mate.position[1]
        schoolZ += mate.position[2]
      }
      schoolX /= sameFish.length
      schoolY /= sameFish.length
      schoolZ /= sameFish.length

      // Check distance to school center
      const distToSchool = Math.sqrt((schoolX - x)**2 + (schoolY - y)**2 + (schoolZ - z)**2)
      const schoolRadius = 0.8 // Desired school radius

      if (distToSchool > schoolRadius) {
        // Too far from school - swim toward center with slight random offset
        const offset = 0.3
        socialTarget = [
          schoolX + (Math.random() - 0.5) * offset,
          Math.max(zoneBounds.minY, Math.min(zoneBounds.maxY, schoolY + (Math.random() - 0.5) * offset * 0.5)),
          schoolZ + (Math.random() - 0.5) * offset,
        ]
      }
    }

    // Priority 2b: Pairing behavior - clownfish stay near their mate
    if (!seekingFood && isPairing && sameFish.length === 1) {
      const mate = sameFish[0]
      const distToMate = Math.sqrt(
        (mate.position[0] - x)**2 + (mate.position[1] - y)**2 + (mate.position[2] - z)**2
      )
      const pairRadius = 0.5 // Stay within this distance of mate

      if (distToMate > pairRadius) {
        // Swim toward mate with slight offset
        const offset = 0.2
        socialTarget = [
          mate.position[0] + (Math.random() - 0.5) * offset,
          Math.max(zoneBounds.minY, Math.min(zoneBounds.maxY, mate.position[1] + (Math.random() - 0.5) * offset * 0.5)),
          mate.position[2] + (Math.random() - 0.5) * offset,
        ]
      }
    }

    // Apply social target if we have one
    if (socialTarget && !seekingFood) {
      tx = socialTarget[0]
      ty = socialTarget[1]
      tz = socialTarget[2]
      targetRef.current = socialTarget
    }

    // Recalculate distance to target
    let distToTargetSq = (tx - x)**2 + (ty - y)**2 + (tz - z)**2

    // If close to target and no social/food goal, find a random new one
    if (distToTargetSq < 0.1**2 && !seekingFood && !socialTarget) {
      // For schooling fish, wander within a smaller radius near school
      // For pairing fish, wander near mate
      // For solo fish, wander more freely
      let idleRadius = isSimulating ? 0.5 : 0.8
      let baseX = x, baseY = y, baseZ = z

      if (isSchooling && sameFish.length > 0) {
        // Wander near school center
        idleRadius = 0.4
        let schoolX = 0, schoolY = 0, schoolZ = 0
        for (const mate of sameFish) {
          schoolX += mate.position[0]
          schoolY += mate.position[1]
          schoolZ += mate.position[2]
        }
        baseX = (schoolX / sameFish.length + x) / 2
        baseY = (schoolY / sameFish.length + y) / 2
        baseZ = (schoolZ / sameFish.length + z) / 2
      } else if (isPairing && sameFish.length === 1) {
        // Wander near mate
        idleRadius = 0.3
        baseX = (sameFish[0].position[0] + x) / 2
        baseY = (sameFish[0].position[1] + y) / 2
        baseZ = (sameFish[0].position[2] + z) / 2
      }

      const newTarget: [number, number, number] = [
        Math.max(-tankHalfLength, Math.min(tankHalfLength, baseX + (Math.random() - 0.5) * idleRadius * 2)),
        Math.max(zoneBounds.minY, Math.min(zoneBounds.maxY, baseY + (Math.random() - 0.5) * idleRadius)),
        Math.max(-tankHalfWidth, Math.min(tankHalfWidth, baseZ + (Math.random() - 0.5) * idleRadius * 2)),
      ]
      // Update both ref and store
      targetRef.current = newTarget
      updateFish(fish.id, { targetPosition: newTarget })
      // Use the new target immediately
      tx = newTarget[0]
      ty = newTarget[1]
      tz = newTarget[2]
      // Recalculate distance with new target
      distToTargetSq = (tx - x)**2 + (ty - y)**2 + (tz - z)**2
    }

    // --- Movement ---
    const distance = Math.sqrt(distToTargetSq)
    // Speed multipliers (reduced for slower, more natural movement)
    let speedMultiplier = isSimulating
      ? (seekingFood ? 0.8 + fish.hunger * 0.4 : 0.4 - fish.hunger * 0.1) * (0.5 + fish.health * 0.5)
      : 0.3

    const speed = fish.swimSpeed * delta * speedMultiplier
    if (distance > 0) {
      x += (tx - x) / distance * speed
      y += (ty - y) / distance * speed
      z += (tz - z) / distance * speed
    }


    // Clamp to tank bounds and swim zone
    x = Math.max(-tankHalfLength, Math.min(tankHalfLength, x))
    y = Math.max(zoneBounds.minY, Math.min(zoneBounds.maxY, y))
    z = Math.max(-tankHalfWidth, Math.min(tankHalfWidth, z))

    // --- Rotation ---
    const targetAngle = Math.atan2(tz - z, tx - x)
    const currentAngle = angleRef.current!
    let angleDiff = targetAngle - currentAngle
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
    const newAngle = currentAngle + angleDiff * Math.min(1, delta * 3)

    // --- Animation ---
    const effectiveSpeed = speed / delta
    const tailAmplitude = seekingFood ? 0.15 : (0.08 + effectiveSpeed * 0.3)
    const tailFrequency = seekingFood ? 18 : (8 + effectiveSpeed * 15)
    tailRef.current += delta * tailFrequency * fish.swimSpeed
    const tailWiggle = Math.sin(tailRef.current) * tailAmplitude
    
    const bodyFlexAmount = seekingFood ? 0.05 : 0.02
    bodyFlexRef.current += delta * tailFrequency * 0.5
    const bodyFlex = Math.sin(bodyFlexRef.current) * bodyFlexAmount * effectiveSpeed

    const roll = angleDiff * 0.3 + bodyFlex
    const pitch = (ty - y) / (distance + 0.001) * 0.2

    // Update internal refs for next frame
    positionRef.current = [x, y, z]
    angleRef.current = newAngle

    // Apply updates to the 3D group immediately
    groupRef.current.position.set(x, y, z)
    groupRef.current.rotation.set(roll, newAngle + Math.PI, tailWiggle)

    // Update fish state in the store less frequently (every 10 frames) to reduce overhead
    frameCountRef.current++
    if (frameCountRef.current % 10 === 0) {
      updateFish(fish.id, {
        position: [x, y, z],
        rotation: [roll, newAngle, pitch],
      })
    }
  })

  // --- Health Indicator ---
  const healthMaterial = isSimulating ? getHealthMaterial(fish.health, fish.hunger) : null

  if (!fishInfo || !fishInfo.modelPath) {
    // Fallback if model info is missing
    return (
      <group ref={groupRef} scale={fish.scale}>
        <mesh>
          <boxGeometry args={[0.5, 0.2, 0.1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </group>
    )
  }

  return (
    <group
      ref={groupRef}
      scale={fish.scale}
      onClick={(e) => {
        e.stopPropagation()
        selectFish(fish.id)
      }}
    >
      <Suspense fallback={null}>
        <ModelFish
          fish={fish}
          modelPath={fishInfo.modelPath}
          preserveOriginalMaterials={true}
        />
      </Suspense>

      {/* Selection and Health Indicators */}
      {isSelected && (
        <mesh
          position={[0, 0.8 / fish.scale, 0]}
          geometry={getIndicatorGeometry('large')}
          material={getSelectionMaterial()}
        />
      )}
      {healthMaterial && !isSelected && (
        <mesh
          position={[0, 0.6 / fish.scale, 0]}
          geometry={getIndicatorGeometry('small')}
          material={healthMaterial}
        />
      )}
    </group>
  )
}

export const FishMesh = memo(FishMeshComponent)
