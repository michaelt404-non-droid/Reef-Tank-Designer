import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEquipmentStore } from '../../stores/equipmentStore'
import { EQUIPMENT_INFO } from '../../data/equipment'

type EquipmentType = 'pump' | 'heater' | 'skimmer' | 'powerhead' | 'wavemaker' | 'ato'

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

  const group = new THREE.Group()

  // Main tube
  const tube = new THREE.CylinderGeometry(radius, radius, height * 0.85, 12)
  tube.translate(0, height * 0.425, 0)

  // Top cap
  const cap = new THREE.CylinderGeometry(radius * 1.3, radius, height * 0.15, 12)
  cap.translate(0, height * 0.925, 0)

  // Merge geometries
  const merged = new THREE.BufferGeometry()
  const tubeMesh = new THREE.Mesh(tube)
  const capMesh = new THREE.Mesh(cap)

  merged.copy(tube)
  return merged
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
  const d = size.depth * TANK_SCALE

  // Main body cylinder
  const body = new THREE.CylinderGeometry(w / 2, w / 2, h * 0.7, 16)
  body.translate(0, h * 0.35, 0)

  // Collection cup on top
  const cup = new THREE.CylinderGeometry(w / 2.5, w / 2, h * 0.3, 16)
  cup.translate(0, h * 0.85, 0)

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
  const w = size.width * TANK_SCALE
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
    case 'powerhead':
      return createPowerheadGeometry(size)
    case 'wavemaker':
      return createWavemakerGeometry(size)
    case 'ato':
      return createATOGeometry(size)
    default:
      return new THREE.BoxGeometry(0.1, 0.1, 0.1)
  }
}

export function EquipmentMesh({ equipment }: EquipmentMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const selectedEquipmentId = useEquipmentStore((state) => state.selectedEquipmentId)
  const selectEquipment = useEquipmentStore((state) => state.selectEquipment)
  const showSumpEquipment = useEquipmentStore((state) => state.showSumpEquipment)

  const isSelected = selectedEquipmentId === equipment.id

  const equipmentInfo = useMemo(() => {
    return EQUIPMENT_INFO.find(e => e.id === equipment.equipmentInfoId)
  }, [equipment.equipmentInfoId])

  const geometry = useMemo(() => {
    if (!equipmentInfo) return new THREE.BoxGeometry(0.1, 0.1, 0.1)
    return createEquipmentGeometry(equipment.type, equipmentInfo.size)
  }, [equipment.type, equipmentInfo])

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: equipment.color,
      roughness: 0.3,
      metalness: 0.7,
    })
  }, [equipment.color])

  // Highlight when selected
  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.emissive.setHex(isSelected ? 0x222266 : 0x000000)
    }
  })

  // Check visibility
  const shouldShow = equipment.visible || (equipmentInfo?.placement === 'external' && showSumpEquipment)
  if (!shouldShow) return null

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={equipment.position}
      rotation={equipment.rotation}
      scale={equipment.scale}
      onClick={(e) => {
        e.stopPropagation()
        selectEquipment(equipment.id)
      }}
      castShadow
      receiveShadow
    />
  )
}
