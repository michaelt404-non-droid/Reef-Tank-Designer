import { useRef, useState, useMemo, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useRockStore } from '../../stores/rockStore'
import { useUIStore } from '../../stores/uiStore'
import { useTankStore } from '../../stores/tankStore'
import { getRockBounds, getTankBounds, clampRockPosition } from '../../utils/rockBounds'

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

function createCaveGeometry(): THREE.BufferGeometry {
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

  // Outer dome
  const outerGeo = new THREE.SphereGeometry(1, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  outerGeo.scale(1.2, 0.8, 1.2)

  // Add rock texture
  const outerPos = outerGeo.attributes.position
  for (let i = 0; i < outerPos.count; i++) {
    const x = outerPos.getX(i)
    const y = outerPos.getY(i)
    const z = outerPos.getZ(i)
    const noise = 0.1
    outerPos.setXYZ(i, x + (Math.random() - 0.5) * noise, y + (Math.random() - 0.5) * noise, z + (Math.random() - 0.5) * noise)
  }
  outerPos.needsUpdate = true
  outerGeo.computeVertexNormals()
  addGeometry(outerGeo)

  // Cave opening (front cutout effect using a recessed section)
  const openingGeo = new THREE.SphereGeometry(0.6, 12, 8, 0, Math.PI, 0, Math.PI / 2)
  openingGeo.scale(1, 0.7, 0.8)
  openingGeo.rotateX(Math.PI)
  openingGeo.translate(0, 0.3, 0.7)
  addGeometry(openingGeo)

  // Base
  const baseGeo = new THREE.CylinderGeometry(1.1, 1.3, 0.2, 12)
  baseGeo.translate(0, 0.1, 0)
  addGeometry(baseGeo)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3))
  return geometry
}

function createArchGeometry(): THREE.BufferGeometry {
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

  // Left pillar
  const leftPillar = new THREE.CylinderGeometry(0.25, 0.35, 1.5, 8)
  leftPillar.translate(-0.8, 0.75, 0)
  const leftPos = leftPillar.attributes.position
  for (let i = 0; i < leftPos.count; i++) {
    const x = leftPos.getX(i)
    const y = leftPos.getY(i)
    const z = leftPos.getZ(i)
    leftPos.setXYZ(i, x + (Math.random() - 0.5) * 0.1, y + (Math.random() - 0.5) * 0.05, z + (Math.random() - 0.5) * 0.1)
  }
  leftPos.needsUpdate = true
  leftPillar.computeVertexNormals()
  addGeometry(leftPillar)

  // Right pillar
  const rightPillar = new THREE.CylinderGeometry(0.25, 0.35, 1.5, 8)
  rightPillar.translate(0.8, 0.75, 0)
  const rightPos = rightPillar.attributes.position
  for (let i = 0; i < rightPos.count; i++) {
    const x = rightPos.getX(i)
    const y = rightPos.getY(i)
    const z = rightPos.getZ(i)
    rightPos.setXYZ(i, x + (Math.random() - 0.5) * 0.1, y + (Math.random() - 0.5) * 0.05, z + (Math.random() - 0.5) * 0.1)
  }
  rightPos.needsUpdate = true
  rightPillar.computeVertexNormals()
  addGeometry(rightPillar)

  // Arch top (torus section)
  const archTop = new THREE.TorusGeometry(0.8, 0.3, 8, 12, Math.PI)
  archTop.rotateX(Math.PI / 2)
  archTop.rotateZ(Math.PI / 2)
  archTop.translate(0, 1.5, 0)
  const archPos = archTop.attributes.position
  for (let i = 0; i < archPos.count; i++) {
    const x = archPos.getX(i)
    const y = archPos.getY(i)
    const z = archPos.getZ(i)
    archPos.setXYZ(i, x + (Math.random() - 0.5) * 0.08, y + (Math.random() - 0.5) * 0.08, z + (Math.random() - 0.5) * 0.08)
  }
  archPos.needsUpdate = true
  archTop.computeVertexNormals()
  addGeometry(archTop)

  // Base
  const baseGeo = new THREE.BoxGeometry(2.2, 0.15, 0.8)
  baseGeo.translate(0, 0.075, 0)
  addGeometry(baseGeo)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3))
  return geometry
}

function createProceduralGeometry(type: ProceduralRockType): THREE.BufferGeometry {
  let geometry: THREE.BufferGeometry

  switch (type) {
    case 'boulder':
      geometry = new THREE.DodecahedronGeometry(1, 1)
      break
    case 'branch':
      geometry = new THREE.IcosahedronGeometry(1, 0)
      break
    case 'shelf':
      geometry = new THREE.BoxGeometry(2, 0.4, 1.5)
      break
    case 'pillar':
      geometry = new THREE.CylinderGeometry(0.4, 0.6, 2, 6)
      break
    case 'rubble':
      geometry = new THREE.OctahedronGeometry(1, 0)
      break
    case 'cave':
      return createCaveGeometry()
    case 'arch':
      return createArchGeometry()
    default:
      geometry = new THREE.DodecahedronGeometry(1, 1)
  }

  if (type !== 'shelf') {
    const positions = geometry.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)
      const noise = 0.15
      positions.setXYZ(
        i,
        x + (Math.random() - 0.5) * noise,
        y + (Math.random() - 0.5) * noise,
        z + (Math.random() - 0.5) * noise
      )
    }
    positions.needsUpdate = true
    geometry.computeVertexNormals()
  }

  return geometry
}

// Component for loaded 3D model rocks
function ModelRockMesh({ rock, onSelect, onHover, isSelected, isDragging }: {
  rock: RockMeshProps['rock']
  onSelect: () => void
  onHover: (hovered: boolean) => void
  isSelected: boolean
  isDragging: boolean
}) {
  const { scene } = useGLTF(rock.modelPath!)
  const clonedScene = useMemo(() => scene.clone(), [scene])

  // Apply color tint to all meshes in the model
  useMemo(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: rock.color,
          roughness: 0.9,
          metalness: 0.1,
        })
      }
    })
  }, [clonedScene, rock.color])

  return (
    <primitive
      object={clonedScene}
      position={rock.position}
      rotation={rock.rotation}
      scale={rock.scale}
      onClick={(e: THREE.Event) => {
        e.stopPropagation()
        onSelect()
      }}
      onPointerOver={() => onHover(true)}
      onPointerOut={() => onHover(false)}
    />
  )
}

// Component for procedural rocks
function ProceduralRockMesh({ rock, meshRef, material, geometry, onPointerDown, onPointerUp, onPointerMove, onSelect, onHover }: {
  rock: RockMeshProps['rock']
  meshRef: React.RefObject<THREE.Mesh>
  material: THREE.MeshStandardMaterial
  geometry: THREE.BufferGeometry
  onPointerDown: (e: THREE.Event) => void
  onPointerUp: () => void
  onPointerMove: (e: THREE.Event) => void
  onSelect: () => void
  onHover: (hovered: boolean) => void
}) {
  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={rock.position}
      rotation={rock.rotation}
      scale={rock.scale}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
      onPointerOver={() => onHover(true)}
      onPointerOut={() => onHover(false)}
      castShadow
      receiveShadow
    />
  )
}

export function RockMesh({ rock }: RockMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const { camera, gl } = useThree()

  const selectedRockId = useRockStore((state) => state.selectedRockId)
  const selectRock = useRockStore((state) => state.selectRock)
  const updateRock = useRockStore((state) => state.updateRock)

  const cameraLocked = useUIStore((state) => state.cameraLocked)

  const tankDimensions = useTankStore((state) => state.dimensions)

  const isSelected = selectedRockId === rock.id

  const geometry = useMemo(() => {
    if (rock.type === 'procedural' && rock.proceduralType) {
      return createProceduralGeometry(rock.proceduralType)
    }
    return new THREE.BoxGeometry(1, 1, 1) // Fallback
  }, [rock.type, rock.proceduralType])

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: rock.color,
    roughness: 0.9,
    metalness: 0.1,
    flatShading: true,
  }), [rock.color])

  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -rock.position[1]), [rock.position[1]])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const mouse = useMemo(() => new THREE.Vector2(), [])

  useFrame(() => {
    if (meshRef.current && rock.type === 'procedural') {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      if (isDragging) {
        mat.emissive.setHex(0x666666)
      } else if (isSelected) {
        mat.emissive.setHex(0x444444)
      } else if (hovered) {
        mat.emissive.setHex(0x222222)
      } else {
        mat.emissive.setHex(0x000000)
      }
    }
  })

  const handlePointerDown = (e: THREE.Event) => {
    if (!cameraLocked || !isSelected) return
    e.stopPropagation()
    setIsDragging(true)
    gl.domElement.style.cursor = 'grabbing'
  }

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false)
      gl.domElement.style.cursor = 'auto'
    }
  }

  const handlePointerMove = (e: THREE.Event) => {
    if (!isDragging || !cameraLocked) return

    const rect = gl.domElement.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    const intersection = new THREE.Vector3()
    if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
      // Clamp position to stay within tank bounds
      const rockBounds = getRockBounds(rock.type, rock.proceduralType, rock.scale)
      const tankBounds = getTankBounds(tankDimensions)
      const clampedPosition = clampRockPosition(
        [intersection.x, rock.position[1], intersection.z],
        rockBounds,
        tankBounds
      )
      updateRock(rock.id, { position: clampedPosition })
    }
  }

  const handleSelect = () => selectRock(rock.id)
  const handleHover = (h: boolean) => {
    setHovered(h)
    if (!h) handlePointerUp()
    if (cameraLocked && isSelected) {
      gl.domElement.style.cursor = h ? 'grab' : 'auto'
    }
  }

  if (rock.type === 'model' && rock.modelPath) {
    return (
      <Suspense fallback={null}>
        <ModelRockMesh
          rock={rock}
          onSelect={handleSelect}
          onHover={handleHover}
          isSelected={isSelected}
          isDragging={isDragging}
        />
      </Suspense>
    )
  }

  return (
    <ProceduralRockMesh
      rock={rock}
      meshRef={meshRef}
      material={material}
      geometry={geometry}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onSelect={handleSelect}
      onHover={handleHover}
    />
  )
}
