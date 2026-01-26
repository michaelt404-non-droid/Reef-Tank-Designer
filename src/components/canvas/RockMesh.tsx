import { useRef, useMemo, useEffect, Suspense, memo } from 'react'
import { useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useRockStore } from '../../stores/rockStore'
import { useUIStore } from '../../stores/uiStore'
import { useTankStore } from '../../stores/tankStore'
import { useSimulationStore } from '../../stores/simulationStore'
import { useHistoryStore } from '../../stores/historyStore'
import { getRockBounds, getTankBounds } from '../../utils/rockBounds'
import { useDrag3D } from '../../hooks/useDrag3D'
import { getIndicatorGeometry, getSelectionMaterial, getSharedLambertMaterial } from '../../utils/sharedMaterials'


type ProceduralRockType = 'boulder' | 'branch' | 'shelf' | 'pillar' | 'rubble' | 'cave' | 'arch'

interface RockMeshProps {
  rock: {
    id: string
    type: 'procedural' | 'model'
    proceduralType?: ProceduralRockType
    modelPath?: string
    position: [number, number, number]
    rotation: [number, number, number]
    scale: number
    color: string
  }
}

// Seeded random for consistent rock shapes
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

// Apply organic displacement to make rocks look natural
function applyRockDisplacement(geometry: THREE.BufferGeometry, seed: number, intensity: number = 0.15): void {
  const random = seededRandom(seed)
  const positions = geometry.attributes.position

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)

    const dist = Math.sqrt(x * x + y * y + z * z)

    const noise1 = (random() - 0.5) * intensity
    const noise2 = (random() - 0.5) * intensity * 0.5
    const noise3 = (random() - 0.5) * intensity * 0.25

    const totalNoise = noise1 + noise2 + noise3

    if (dist > 0.001) {
      const nx = x / dist
      const ny = y / dist
      const nz = z / dist
      positions.setXYZ(
        i,
        x + nx * totalNoise,
        y + ny * totalNoise,
        z + nz * totalNoise
      )
    }
  }

  positions.needsUpdate = true
  geometry.computeVertexNormals()
}

function createProceduralGeometry(type: ProceduralRockType): THREE.BufferGeometry {
  let geometry: THREE.BufferGeometry

  switch (type) {
    case 'boulder': {
      geometry = new THREE.IcosahedronGeometry(1, 2)
      geometry.scale(1.1, 0.85, 0.95)
      applyRockDisplacement(geometry, 12345, 0.18)
      break
    }
    case 'branch': {
      const group: number[] = []
      const normals: number[] = []

      const main = new THREE.CapsuleGeometry(0.25, 0.8, 6, 12)
      applyRockDisplacement(main, 23456, 0.1)
      const mainPos = main.attributes.position.array
      const mainNorm = main.attributes.normal.array
      for (let i = 0; i < mainPos.length; i++) { group.push(mainPos[i]); normals.push(mainNorm[i]) }

      const b1 = new THREE.CapsuleGeometry(0.15, 0.5, 5, 10)
      b1.rotateZ(Math.PI / 4)
      b1.translate(0.25, 0.2, 0.1)
      applyRockDisplacement(b1, 34567, 0.08)
      const b1Pos = b1.attributes.position.array
      const b1Norm = b1.attributes.normal.array
      for (let i = 0; i < b1Pos.length; i++) { group.push(b1Pos[i]); normals.push(b1Norm[i]) }

      const b2 = new THREE.CapsuleGeometry(0.12, 0.4, 5, 10)
      b2.rotateZ(-Math.PI / 3)
      b2.rotateY(Math.PI / 4)
      b2.translate(-0.2, 0.3, 0.15)
      applyRockDisplacement(b2, 45678, 0.08)
      const b2Pos = b2.attributes.position.array
      const b2Norm = b2.attributes.normal.array
      for (let i = 0; i < b2Pos.length; i++) { group.push(b2Pos[i]); normals.push(b2Norm[i]) }

      geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(group, 3))
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
      break
    }
    case 'shelf': {
      geometry = new THREE.BoxGeometry(2, 0.35, 1.4, 8, 3, 6)
      applyRockDisplacement(geometry, 56789, 0.12)
      break
    }
    case 'pillar': {
      geometry = new THREE.CylinderGeometry(0.35, 0.55, 2, 10, 6)
      applyRockDisplacement(geometry, 67890, 0.15)
      break
    }
    case 'rubble': {
      const pieces: number[] = []
      const pNormals: number[] = []

      for (let i = 0; i < 5; i++) {
        const size = 0.15 + seededRandom(78901 + i)() * 0.15
        const piece = new THREE.DodecahedronGeometry(size, 0)
        piece.translate(
          (seededRandom(78902 + i)() - 0.5) * 0.5,
          size,
          (seededRandom(78903 + i)() - 0.5) * 0.5
        )
        applyRockDisplacement(piece, 78900 + i * 111, 0.05)
        const pPos = piece.attributes.position.array
        const pNorm = piece.attributes.normal.array
        for (let j = 0; j < pPos.length; j++) { pieces.push(pPos[j]); pNormals.push(pNorm[j]) }
      }

      geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(pieces, 3))
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(pNormals, 3))
      break
    }
    case 'cave': {
      const caveGroup: number[] = []
      const caveNormals: number[] = []

      const back = new THREE.SphereGeometry(1, 12, 8, Math.PI * 0.3, Math.PI * 0.4, 0, Math.PI * 0.6)
      back.scale(1.5, 1, 0.6)
      back.translate(0, 0.5, -0.3)
      const backPos = back.attributes.position.array
      const backNorm = back.attributes.normal.array
      for (let i = 0; i < backPos.length; i++) { caveGroup.push(backPos[i]); caveNormals.push(backNorm[i]) }

      const left = new THREE.CylinderGeometry(0.25, 0.35, 1.2, 8)
      left.translate(-0.7, 0.6, 0.2)
      applyRockDisplacement(left, 89012, 0.1)
      const leftPos = left.attributes.position.array
      const leftNorm = left.attributes.normal.array
      for (let i = 0; i < leftPos.length; i++) { caveGroup.push(leftPos[i]); caveNormals.push(leftNorm[i]) }

      const right = new THREE.CylinderGeometry(0.2, 0.3, 1.1, 8)
      right.translate(0.65, 0.55, 0.15)
      applyRockDisplacement(right, 90123, 0.1)
      const rightPos = right.attributes.position.array
      const rightNorm = right.attributes.normal.array
      for (let i = 0; i < rightPos.length; i++) { caveGroup.push(rightPos[i]); caveNormals.push(rightNorm[i]) }

      const roof = new THREE.BoxGeometry(1.8, 0.3, 0.8, 6, 2, 4)
      roof.translate(0, 1.15, 0)
      applyRockDisplacement(roof, 11234, 0.1)
      const roofPos = roof.attributes.position.array
      const roofNorm = roof.attributes.normal.array
      for (let i = 0; i < roofPos.length; i++) { caveGroup.push(roofPos[i]); caveNormals.push(roofNorm[i]) }

      const base = new THREE.CylinderGeometry(0.9, 1.1, 0.15, 12)
      base.translate(0, 0.075, 0)
      const basePos = base.attributes.position.array
      const baseNorm = base.attributes.normal.array
      for (let i = 0; i < basePos.length; i++) { caveGroup.push(basePos[i]); caveNormals.push(baseNorm[i]) }

      geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(caveGroup, 3))
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(caveNormals, 3))
      break
    }
    case 'arch': {
      const archGroup: number[] = []
      const archNormals: number[] = []

      const bridge = new THREE.TorusGeometry(0.7, 0.2, 10, 20, Math.PI)
      bridge.rotateX(Math.PI / 2)
      bridge.translate(0, 0.7, 0)
      applyRockDisplacement(bridge, 22345, 0.08)
      const bridgePos = bridge.attributes.position.array
      const bridgeNorm = bridge.attributes.normal.array
      for (let i = 0; i < bridgePos.length; i++) { archGroup.push(bridgePos[i]); archNormals.push(bridgeNorm[i]) }

      const leftBase = new THREE.DodecahedronGeometry(0.35, 1)
      leftBase.scale(1, 0.8, 0.9)
      leftBase.translate(-0.7, 0.3, 0)
      applyRockDisplacement(leftBase, 33456, 0.1)
      const leftBasePos = leftBase.attributes.position.array
      const leftBaseNorm = leftBase.attributes.normal.array
      for (let i = 0; i < leftBasePos.length; i++) { archGroup.push(leftBasePos[i]); archNormals.push(leftBaseNorm[i]) }

      const rightBase = new THREE.DodecahedronGeometry(0.3, 1)
      rightBase.scale(0.9, 0.85, 1)
      rightBase.translate(0.7, 0.25, 0)
      applyRockDisplacement(rightBase, 44567, 0.1)
      const rightBasePos = rightBase.attributes.position.array
      const rightBaseNorm = rightBase.attributes.normal.array
      for (let i = 0; i < rightBasePos.length; i++) { archGroup.push(rightBasePos[i]); archNormals.push(rightBaseNorm[i]) }

      geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(archGroup, 3))
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(archNormals, 3))
      break
    }
    default:
      geometry = new THREE.IcosahedronGeometry(1, 2)
      applyRockDisplacement(geometry, 99999, 0.15)
  }

  return geometry
}

const RockMeshComponent = ({ rock }: RockMeshProps) => {
  const groupRef = useRef<THREE.Group>(null)

  const { gl } = useThree()

  const selectedRockId = useRockStore((state) => state.selectedRockId)
  const selectRock = useRockStore((state) => state.selectRock)
  const updateRock = useRockStore((state) => state.updateRock)
  const cameraLocked = useUIStore((state) => state.cameraLocked)
  const tankDimensions = useTankStore((state) => state.dimensions)
  const mode = useSimulationStore((state) => state.mode)
  const isSimulationMode = mode === 'simulation'

  const isSelected = selectedRockId === rock.id

  // Calculate bounds for dragging
  const dragBounds = useMemo(() => {
    const rockBounds = getRockBounds(rock.type, rock.proceduralType, rock.scale)
    const tankBounds = getTankBounds(tankDimensions)
    const margin = 0.05
    const sandBedHeight = 0.12

    // For model rocks (GLB), origin is typically at the bottom
    // For procedural rocks, origin is at the center
    const isModelRock = rock.type === 'model'
    const yOffset = isModelRock ? 0 : rockBounds.halfY

    return {
      minX: -tankBounds.halfX + rockBounds.halfX + margin,
      maxX: tankBounds.halfX - rockBounds.halfX - margin,
      minY: sandBedHeight + yOffset,
      maxY: tankBounds.height - (isModelRock ? rockBounds.halfY * 2 : rockBounds.halfY) - margin,
      minZ: -tankBounds.halfZ + rockBounds.halfZ - margin,
      maxZ: tankBounds.halfZ - rockBounds.halfZ - margin,
    }
  }, [rock.type, rock.proceduralType, rock.scale, tankDimensions])

  // Use the drag hook
  const { startDrag, canDrag } = useDrag3D({
    position: rock.position,
    onDrag: (newPosition) => updateRock(rock.id, { position: newPosition }),
    onDragEnd: () => useHistoryStore.getState().pushSnapshot('Move Rock'),
    enabled: isSelected,
    bounds: dragBounds,
  })

  const geometry = useMemo(() => {
    if (rock.type === 'procedural' && rock.proceduralType) {
      return createProceduralGeometry(rock.proceduralType)
    }
    // Return a placeholder, though this path should ideally not be hit with valid data
    return new THREE.BoxGeometry(1, 1, 1)
  }, [rock.type, rock.proceduralType])

  const material = getSharedLambertMaterial(rock.color, { flatShading: true, side: THREE.DoubleSide })

  // Dispose of unique procedural geometry on unmount
  useEffect(() => {
    return () => {
      if (rock.type === 'procedural') {
        geometry.dispose()
      }
    }
  }, [geometry, rock.type])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (isSimulationMode) return
    e.stopPropagation()
    selectRock(rock.id)
  }

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (isSimulationMode) return
    e.stopPropagation()
    // Select on pointer down if not already selected
    if (!isSelected) {
      selectRock(rock.id)
    }
    // Start drag if camera is locked
    if (cameraLocked) {
      startDrag(e)
    }
  }

  const handleHover = (h: boolean) => {
    if (canDrag) {
      gl.domElement.style.cursor = h ? 'grab' : 'auto'
    }
  }

  // Model rock rendering
  if (rock.type === 'model' && rock.modelPath) {
    return (
      <Suspense fallback={null}>
        <ModelRock
          rock={rock}
          isSelected={isSelected}
          onPointerDown={handlePointerDown}
          onClick={handleClick}
          onHover={handleHover}
        />
      </Suspense>
    )
  }

  // Procedural rock rendering
  return (
    <group ref={groupRef}>
      <mesh
        geometry={geometry}
        material={material}
        position={rock.position}
        rotation={rock.rotation}
        scale={rock.scale}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={() => handleHover(true)}
        onPointerOut={() => handleHover(false)}
        castShadow
        receiveShadow
      />
      {/* Selection indicator */}
      {isSelected && (
        <mesh
          position={[rock.position[0], rock.position[1] + rock.scale * 1.2, rock.position[2]]}
          geometry={getIndicatorGeometry('small')}
          material={getSelectionMaterial()}
        />
      )}
    </group>
  )
}

export const RockMesh = memo(RockMeshComponent)

const ModelRockComponent = ({
  rock,
  isSelected,
  onPointerDown,
  onClick,
  onHover,
}: {
  rock: RockMeshProps['rock']
  isSelected: boolean
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
  onClick: (e: ThreeEvent<MouseEvent>) => void
  onHover: (h: boolean) => void
}) => {
  const { scene } = useGLTF(rock.modelPath!)
  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.side = THREE.DoubleSide
            })
          } else {
            child.material.side = THREE.DoubleSide
          }
        }
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  return (
    <group>
      <primitive
        object={clonedScene}
        position={rock.position}
        rotation={rock.rotation}
        scale={rock.scale}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
      />
      {/* Selection indicator */}
      {isSelected && (
        <mesh
          position={[rock.position[0], rock.position[1] + rock.scale * 1.2, rock.position[2]]}
          geometry={getIndicatorGeometry('small')}
          material={getSelectionMaterial()}
        />
      )}
    </group>
  )
}

const ModelRock = memo(ModelRockComponent)
