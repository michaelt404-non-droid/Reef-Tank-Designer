import { useRef, useMemo, useEffect, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useEquipmentStore } from '../../stores/equipmentStore'
import { useUIStore } from '../../stores/uiStore'
import { useTankStore } from '../../stores/tankStore'
import { useSimulationStore } from '../../stores/simulationStore'
import { useHistoryStore } from '../../stores/historyStore'
import { EQUIPMENT_INFO } from '../../data/equipment'
import { useDrag3D } from '../../hooks/useDrag3D'

type EquipmentType = 'pump' | 'heater' | 'skimmer' | 'wavemaker' | 'ato'

interface EquipmentMeshProps {
  equipment: {
    id: string
    equipmentInfoId: string
    type: EquipmentType
    position: [number, number, number]
    rotation: [number, number, number]
    scale: number
    color: string
    visible: boolean
  }
}

const TANK_SCALE = 0.1

function createHeaterGeometry(size: { width: number; height: number; depth: number }): THREE.BufferGeometry {
  const height = size.height * TANK_SCALE
  const radius = (size.width * TANK_SCALE) / 2

  // Main tube
  const tube = new THREE.CylinderGeometry(radius, radius, height * 0.85, 12)
  tube.translate(0, height * 0.425, 0)

  return tube
}

function createPumpGeometry(size: { width: number; height: number; depth: number }): THREE.BufferGeometry {
  const w = size.width * TANK_SCALE
  const h = size.height * TANK_SCALE
  const d = size.depth * TANK_SCALE

  // Simple box shape for pump
  const body = new THREE.BoxGeometry(w, h, d)
  body.translate(0, h / 2, 0)
  return body
}

function createSkimmerGeometry(size: { width: number; height: number; depth: number }): THREE.BufferGeometry {
  const w = size.width * TANK_SCALE
  const h = size.height * TANK_SCALE

  // Main body cylinder
  const body = new THREE.CylinderGeometry(w / 2, w / 2, h * 0.7, 16)
  body.translate(0, h * 0.35, 0)

  return body
}

function createPowerheadGeometry(size: { width: number; height: number; depth: number }): THREE.BufferGeometry {
  const w = size.width * TANK_SCALE
  const h = size.height * TANK_SCALE
  const d = size.depth * TANK_SCALE

  // Compact rounded shape
  const body = new THREE.SphereGeometry(Math.max(w, h) / 2, 12, 8)
  body.scale(1, h / w, d / w)
  body.translate(0, h / 2, 0)
  return body
}

function createWavemakerGeometry(size: { width: number; height: number; depth: number }): THREE.BufferGeometry {
  const h = size.height * TANK_SCALE
  const d = size.depth * TANK_SCALE

  // Long cylindrical gyre shape
  const body = new THREE.CylinderGeometry(h / 2, h / 2, d, 12)
  body.rotateZ(Math.PI / 2)
  body.translate(0, h / 2, 0)
  return body
}

function createATOGeometry(size: { width: number; height: number; depth: number }): THREE.BufferGeometry {
  const w = size.width * TANK_SCALE
  const h = size.height * TANK_SCALE
  const d = size.depth * TANK_SCALE

  // Small sensor box
  const body = new THREE.BoxGeometry(w, h, d)
  body.translate(0, h / 2, 0)
  return body
}

function createEquipmentGeometry(type: EquipmentType, size: { width: number; height: number; depth: number }): THREE.BufferGeometry {
  switch (type) {
    case 'heater':
      return createHeaterGeometry(size)
    case 'pump':
      return createPumpGeometry(size)
    case 'skimmer':
      return createSkimmerGeometry(size)
    case 'wavemaker':
      // Use gyre (cylindrical) geometry for long wavemakers, compact (spherical) for smaller ones
      if (size.depth > size.width * 2) {
        return createWavemakerGeometry(size)
      }
      return createPowerheadGeometry(size)
    case 'ato':
      return createATOGeometry(size)
    default:
      return new THREE.BoxGeometry(0.1, 0.1, 0.1)
  }
}

// Component for rendering GLB model equipment
function ModelEquipment({
  modelPath,
  position,
  rotation,
  scale,
  isSelected,
  onClick,
  onPointerDown,
  onHover,
}: {
  modelPath: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  isSelected: boolean
  onClick: (e: ThreeEvent<MouseEvent>) => void
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
  onHover: (h: boolean) => void
}) {
  const { scene } = useGLTF(modelPath)
  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Clone materials to preserve original textures and avoid modifying cached materials
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

  return (
    <group>
      <primitive
        object={clonedScene}
        position={position}
        rotation={rotation}
        scale={scale}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
      />
      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[position[0], position[1] + 0.3, position[2]]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      )}
    </group>
  )
}

export function EquipmentMesh({ equipment }: EquipmentMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const { gl } = useThree()

  const selectedEquipmentId = useEquipmentStore((state) => state.selectedEquipmentId)
  const selectEquipment = useEquipmentStore((state) => state.selectEquipment)
  const updateEquipment = useEquipmentStore((state) => state.updateEquipment)
  const showSumpEquipment = useEquipmentStore((state) => state.showSumpEquipment)
  const cameraLocked = useUIStore((state) => state.cameraLocked)
  const tankDimensions = useTankStore((state) => state.dimensions)
  const mode = useSimulationStore((state) => state.mode)
  const isSimulationMode = mode === 'simulation'

  const isSelected = selectedEquipmentId === equipment.id

  const equipmentInfo = useMemo(() => {
    return EQUIPMENT_INFO.find(e => e.id === equipment.equipmentInfoId)
  }, [equipment.equipmentInfoId])

  // Calculate bounds for dragging - keeps equipment inside tank walls
  const dragBounds = useMemo(() => {
    const tankHalfLength = (tankDimensions.length * TANK_SCALE) / 2
    const tankHalfWidth = (tankDimensions.width * TANK_SCALE) / 2
    const tankHeight = tankDimensions.height * TANK_SCALE

    // Account for equipment size (scaled) to keep it inside the tank
    const eqWidth = (equipmentInfo?.size.width || 2) * TANK_SCALE * equipment.scale
    const eqHeight = (equipmentInfo?.size.height || 2) * TANK_SCALE * equipment.scale
    const eqDepth = (equipmentInfo?.size.depth || 2) * TANK_SCALE * equipment.scale

    const wallMargin = 0.02 // Small gap from glass

    return {
      minX: -tankHalfLength + eqWidth / 2 + wallMargin,
      maxX: tankHalfLength - eqWidth / 2 - wallMargin,
      minY: eqHeight / 2 + 0.02, // Keep above sand
      maxY: tankHeight - eqHeight / 2 - wallMargin,
      minZ: -tankHalfWidth + eqDepth / 2 + wallMargin,
      maxZ: tankHalfWidth - eqDepth / 2 - wallMargin,
    }
  }, [tankDimensions, equipmentInfo, equipment.scale])

  // Use the drag hook
  const { startDrag, canDrag } = useDrag3D({
    position: equipment.position,
    onDrag: (newPosition) => updateEquipment(equipment.id, { position: newPosition }),
    onDragEnd: () => useHistoryStore.getState().pushSnapshot('Move Equipment'),
    enabled: isSelected,
    bounds: dragBounds,
  })

  const geometry = useMemo(() => {
    if (!equipmentInfo) return new THREE.BoxGeometry(0.1, 0.1, 0.1)
    return createEquipmentGeometry(equipment.type, equipmentInfo.size)
  }, [equipment.type, equipmentInfo])

  const material = useMemo(() => {
    return new THREE.MeshLambertMaterial({
      color: equipment.color,
      flatShading: true,
    })
  }, [equipment.color])

  // Dispose geometry and material on unmount or when they change
  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  // Highlight when selected
  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshLambertMaterial
      if (isSelected) {
        mat.emissive.setHex(0x333366)
      } else {
        mat.emissive.setHex(0x000000)
      }
    }
  })

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (isSimulationMode) return
    e.stopPropagation()
    // Select on pointer down if not already selected
    if (!isSelected) {
      selectEquipment(equipment.id)
    }
    // Start drag if camera is locked
    if (cameraLocked) {
      startDrag(e)
    }
  }

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (isSimulationMode) return
    e.stopPropagation()
    selectEquipment(equipment.id)
  }

  const handleHover = (h: boolean) => {
    if (canDrag) {
      gl.domElement.style.cursor = h ? 'grab' : 'auto'
    }
  }

  // Check visibility
  const shouldShow = equipment.visible || (equipmentInfo?.placement === 'external' && showSumpEquipment)
  if (!shouldShow) return null

  // Render GLB model if available
  if (equipmentInfo?.modelPath) {
    return (
      <Suspense fallback={null}>
        <ModelEquipment
          modelPath={equipmentInfo.modelPath}
          position={equipment.position}
          rotation={equipment.rotation}
          scale={equipment.scale}
          isSelected={isSelected}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onHover={handleHover}
        />
      </Suspense>
    )
  }

  // Fallback to procedural geometry
  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        position={equipment.position}
        rotation={equipment.rotation}
        scale={equipment.scale}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={() => handleHover(true)}
        onPointerOut={() => handleHover(false)}
        castShadow
        receiveShadow
      />
      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[equipment.position[0], equipment.position[1] + 0.3, equipment.position[2]]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      )}
    </group>
  )
}
