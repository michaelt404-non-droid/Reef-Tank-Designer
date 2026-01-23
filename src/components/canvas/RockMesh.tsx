import { useRef, useState, useMemo, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
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

  // Seeded random for consistent geometry
  let seed = 54321
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  // Main rock body - back and sides (horseshoe shape opening to front)
  // Back wall
  const backWall = new THREE.BoxGeometry(1.8, 1.2, 0.5, 4, 4, 2)
  backWall.translate(0, 0.6, -0.5)
  const backPos = backWall.attributes.position
  for (let i = 0; i < backPos.count; i++) {
    const x = backPos.getX(i)
    const y = backPos.getY(i)
    const z = backPos.getZ(i)
    backPos.setXYZ(i,
      x + (seededRandom() - 0.5) * 0.15,
      y + (seededRandom() - 0.5) * 0.1,
      z + (seededRandom() - 0.5) * 0.1
    )
  }
  backPos.needsUpdate = true
  backWall.computeVertexNormals()
  addGeometry(backWall)

  // Left wall
  const leftWall = new THREE.BoxGeometry(0.5, 1.0, 1.0, 2, 4, 4)
  leftWall.translate(-0.9, 0.5, 0)
  const leftPos = leftWall.attributes.position
  for (let i = 0; i < leftPos.count; i++) {
    const x = leftPos.getX(i)
    const y = leftPos.getY(i)
    const z = leftPos.getZ(i)
    leftPos.setXYZ(i,
      x + (seededRandom() - 0.5) * 0.1,
      y + (seededRandom() - 0.5) * 0.1,
      z + (seededRandom() - 0.5) * 0.15
    )
  }
  leftPos.needsUpdate = true
  leftWall.computeVertexNormals()
  addGeometry(leftWall)

  // Right wall
  const rightWall = new THREE.BoxGeometry(0.5, 1.0, 1.0, 2, 4, 4)
  rightWall.translate(0.9, 0.5, 0)
  const rightPos = rightWall.attributes.position
  for (let i = 0; i < rightPos.count; i++) {
    const x = rightPos.getX(i)
    const y = rightPos.getY(i)
    const z = rightPos.getZ(i)
    rightPos.setXYZ(i,
      x + (seededRandom() - 0.5) * 0.1,
      y + (seededRandom() - 0.5) * 0.1,
      z + (seededRandom() - 0.5) * 0.15
    )
  }
  rightPos.needsUpdate = true
  rightWall.computeVertexNormals()
  addGeometry(rightWall)

  // Roof/overhang - extends forward over the opening
  const roof = new THREE.BoxGeometry(2.0, 0.4, 1.4, 4, 2, 4)
  roof.translate(0, 1.1, 0.1)
  const roofPos = roof.attributes.position
  for (let i = 0; i < roofPos.count; i++) {
    const x = roofPos.getX(i)
    const y = roofPos.getY(i)
    const z = roofPos.getZ(i)
    // Make front edge droop down slightly for overhang effect
    const frontDroop = z > 0.3 ? (z - 0.3) * 0.3 : 0
    roofPos.setXYZ(i,
      x + (seededRandom() - 0.5) * 0.12,
      y - frontDroop + (seededRandom() - 0.5) * 0.08,
      z + (seededRandom() - 0.5) * 0.1
    )
  }
  roofPos.needsUpdate = true
  roof.computeVertexNormals()
  addGeometry(roof)

  // Base platform
  const base = new THREE.CylinderGeometry(1.1, 1.3, 0.15, 12)
  base.translate(0, 0.075, 0)
  addGeometry(base)

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

  // Seeded random for consistent geometry
  let seed = 98765
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  // Natural rock bridge - use a tube geometry following an arch path
  // Create arch curve
  const archCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.0, 0.2, 0),
    new THREE.Vector3(-0.8, 0.6, 0),
    new THREE.Vector3(-0.4, 1.1, 0),
    new THREE.Vector3(0, 1.3, 0),
    new THREE.Vector3(0.4, 1.1, 0),
    new THREE.Vector3(0.8, 0.6, 0),
    new THREE.Vector3(1.0, 0.2, 0),
  ])

  // Create tube along the curve for the main bridge
  const bridgeGeo = new THREE.TubeGeometry(archCurve, 20, 0.25, 8, false)

  // Add rocky texture to the bridge
  const bridgePos = bridgeGeo.attributes.position
  for (let i = 0; i < bridgePos.count; i++) {
    const x = bridgePos.getX(i)
    const y = bridgePos.getY(i)
    const z = bridgePos.getZ(i)
    // More noise at the top, less at the base for stability
    const noiseScale = 0.08 + (y / 1.5) * 0.06
    bridgePos.setXYZ(i,
      x + (seededRandom() - 0.5) * noiseScale,
      y + (seededRandom() - 0.5) * noiseScale * 0.7,
      z + (seededRandom() - 0.5) * noiseScale
    )
  }
  bridgePos.needsUpdate = true
  bridgeGeo.computeVertexNormals()
  addGeometry(bridgeGeo)

  // Left rock mass (base of arch)
  const leftBase = new THREE.DodecahedronGeometry(0.45, 0)
  leftBase.scale(1.0, 0.7, 0.8)
  leftBase.translate(-0.9, 0.3, 0)
  const leftPos = leftBase.attributes.position
  for (let i = 0; i < leftPos.count; i++) {
    const x = leftPos.getX(i)
    const y = leftPos.getY(i)
    const z = leftPos.getZ(i)
    leftPos.setXYZ(i,
      x + (seededRandom() - 0.5) * 0.1,
      y + (seededRandom() - 0.5) * 0.08,
      z + (seededRandom() - 0.5) * 0.1
    )
  }
  leftPos.needsUpdate = true
  leftBase.computeVertexNormals()
  addGeometry(leftBase)

  // Right rock mass (base of arch)
  const rightBase = new THREE.DodecahedronGeometry(0.45, 0)
  rightBase.scale(1.0, 0.7, 0.8)
  rightBase.translate(0.9, 0.3, 0)
  const rightPos = rightBase.attributes.position
  for (let i = 0; i < rightPos.count; i++) {
    const x = rightPos.getX(i)
    const y = rightPos.getY(i)
    const z = rightPos.getZ(i)
    rightPos.setXYZ(i,
      x + (seededRandom() - 0.5) * 0.1,
      y + (seededRandom() - 0.5) * 0.08,
      z + (seededRandom() - 0.5) * 0.1
    )
  }
  rightPos.needsUpdate = true
  rightBase.computeVertexNormals()
  addGeometry(rightBase)

  // Small accent rocks
  const accent1 = new THREE.OctahedronGeometry(0.15, 0)
  accent1.translate(-0.5, 0.1, 0.2)
  addGeometry(accent1)

  const accent2 = new THREE.OctahedronGeometry(0.12, 0)
  accent2.translate(0.6, 0.1, -0.15)
  addGeometry(accent2)

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
function ModelRockMesh({ rock, onSelect, onHover }: {
  rock: RockMeshProps['rock']
  onSelect: () => void
  onHover: (hovered: boolean) => void
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
      onClick={(e: ThreeEvent<PointerEvent>) => {
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
  meshRef: React.RefObject<THREE.Mesh | null>
  material: THREE.MeshStandardMaterial
  geometry: THREE.BufferGeometry
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
  onPointerUp: () => void
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void
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

  const rockY = rock.position[1]
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -rockY), [rockY])
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

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!cameraLocked || !isSelected) return
    e.stopPropagation()
    setIsDragging(true)
    // eslint-disable-next-line react-hooks/immutability
    gl.domElement.style.cursor = 'grabbing'
  }

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false)
      // eslint-disable-next-line react-hooks/immutability
      gl.domElement.style.cursor = 'auto'
    }
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !cameraLocked) return

    const rect = gl.domElement.getBoundingClientRect()
    // eslint-disable-next-line react-hooks/immutability
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
      // eslint-disable-next-line react-hooks/immutability
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
