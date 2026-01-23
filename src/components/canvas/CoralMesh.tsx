import { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useCoralStore } from '../../stores/coralStore'
import { useLightStore } from '../../stores/lightStore'
import { useUIStore } from '../../stores/uiStore'
import { useTankStore } from '../../stores/tankStore'
import { useSimulationStore } from '../../stores/simulationStore'
import { getCoralPARStatus } from '../../utils/parCalculator'

// Inline types to avoid Safari import issues
type CoralType = 'mushrooms' | 'zoanthids' | 'softCorals' | 'lps' | 'sps' | 'acropora'
type PARStatus = 'optimal' | 'acceptable' | 'incompatible'

interface PlacedCoral {
  id: string
  coralType: CoralType
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  color: string
  // Simulation properties
  health: number
  growthProgress: number
  colorIntensity: number
  baseScale: number
}

interface CoralMeshProps {
  coral: PlacedCoral
}

function createMushroomGeometry(): THREE.BufferGeometry {
  // Detailed mushroom cap with wavy edges and textured surface
  const allPositions: number[] = []
  const allNormals: number[] = []

  // Cap - detailed hemisphere with wavy edges
  const capGeo = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)

  // Add organic waviness to the cap
  const capPositions = capGeo.attributes.position
  for (let i = 0; i < capPositions.count; i++) {
    const x = capPositions.getX(i)
    const origY = capPositions.getY(i)
    const z = capPositions.getZ(i)

    const angle = Math.atan2(z, x)
    const dist = Math.sqrt(x * x + z * z)

    // Wavy edge effect
    const wave = Math.sin(angle * 8) * 0.1 * dist
    let y = origY * 0.35 + wave * 0.3

    // Slight radial ripples
    const ripple = Math.sin(dist * 6) * 0.03
    y += ripple

    capPositions.setXYZ(i, x, y + 0.35, z)
  }
  capPositions.needsUpdate = true
  capGeo.computeVertexNormals()

  const capPos = capGeo.attributes.position.array
  const capNorm = capGeo.attributes.normal.array
  for (let i = 0; i < capPos.length; i++) {
    allPositions.push(capPos[i])
    allNormals.push(capNorm[i])
  }

  // Textured stem with slight taper
  const stemGeo = new THREE.CylinderGeometry(0.15, 0.22, 0.35, 12)
  const stemPositions = stemGeo.attributes.position
  for (let i = 0; i < stemPositions.count; i++) {
    const x = stemPositions.getX(i)
    const z = stemPositions.getZ(i)
    const angle = Math.atan2(z, x)
    const bulge = Math.sin(angle * 5) * 0.02
    stemPositions.setX(i, x + bulge * Math.cos(angle))
    stemPositions.setZ(i, z + bulge * Math.sin(angle))
  }
  stemPositions.needsUpdate = true
  stemGeo.computeVertexNormals()
  stemGeo.translate(0, 0.175, 0)

  const stemPos = stemGeo.attributes.position.array
  const stemNorm = stemGeo.attributes.normal.array
  for (let i = 0; i < stemPos.length; i++) {
    allPositions.push(stemPos[i])
    allNormals.push(stemNorm[i])
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3))

  return geometry
}

function createZoanthidsGeometry(): THREE.BufferGeometry {
  // Detailed polyp colony with individual polyps showing tentacles
  const allPositions: number[] = []
  const allNormals: number[] = []

  // Create positions for polyp cluster - more polyps
  const polypPositions = [
    [0, 0, 0], [0.25, 0, 0.18], [-0.22, 0, 0.12],
    [0.12, 0, -0.25], [-0.18, 0, -0.18], [0.35, 0, -0.08],
    [-0.32, 0, 0], [0.08, 0, 0.32], [-0.1, 0, -0.35],
    [0.28, 0, 0.28], [-0.28, 0, 0.25], [0.38, 0, 0.15],
  ]

  polypPositions.forEach(([px, , pz]) => {
    const height = 0.15 + Math.random() * 0.1

    // Polyp stalk (tapered cylinder)
    const stalkGeo = new THREE.CylinderGeometry(0.06, 0.08, height, 8)
    stalkGeo.translate(px, height / 2, pz)

    const stalkPos = stalkGeo.attributes.position.array
    const stalkNorm = stalkGeo.attributes.normal.array
    for (let i = 0; i < stalkPos.length; i++) {
      allPositions.push(stalkPos[i])
      allNormals.push(stalkNorm[i])
    }

    // Polyp head (flattened sphere with opening)
    const headGeo = new THREE.SphereGeometry(0.1, 12, 8)
    const headPositions = headGeo.attributes.position
    for (let i = 0; i < headPositions.count; i++) {
      let y = headPositions.getY(i)
      // Create concave center (mouth)
      const x = headPositions.getX(i)
      const z = headPositions.getZ(i)
      const distFromCenter = Math.sqrt(x * x + z * z)
      if (y > 0.02) {
        y = y * 0.6 - (0.08 - distFromCenter) * 0.5
      }
      headPositions.setY(i, y)
    }
    headPositions.needsUpdate = true
    headGeo.computeVertexNormals()
    headGeo.translate(px, height + 0.08, pz)

    const headPos = headGeo.attributes.position.array
    const headNorm = headGeo.attributes.normal.array
    for (let i = 0; i < headPos.length; i++) {
      allPositions.push(headPos[i])
      allNormals.push(headNorm[i])
    }

    // Small tentacles around the head
    const numTentacles = 6
    for (let t = 0; t < numTentacles; t++) {
      const angle = (t / numTentacles) * Math.PI * 2
      const tentGeo = new THREE.CylinderGeometry(0.01, 0.015, 0.08, 4)
      tentGeo.rotateX(0.4)
      tentGeo.rotateY(angle)
      tentGeo.translate(
        px + Math.cos(angle) * 0.08,
        height + 0.12,
        pz + Math.sin(angle) * 0.08
      )

      const tentPos = tentGeo.attributes.position.array
      const tentNorm = tentGeo.attributes.normal.array
      for (let i = 0; i < tentPos.length; i++) {
        allPositions.push(tentPos[i])
        allNormals.push(tentNorm[i])
      }
    }
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3))

  return geometry
}

function createSoftCoralGeometry(): THREE.BufferGeometry {
  // Organic flowing soft coral with multiple swaying branches
  const allPositions: number[] = []
  const allNormals: number[] = []

  // Helper to add geometry
  const addGeometry = (geo: THREE.BufferGeometry) => {
    const pos = geo.attributes.position.array
    const norm = geo.attributes.normal.array
    for (let i = 0; i < pos.length; i++) {
      allPositions.push(pos[i])
      allNormals.push(norm[i])
    }
  }

  // Base/holdfast
  const baseGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.15, 12)
  baseGeo.translate(0, 0.075, 0)
  addGeometry(baseGeo)

  // Main trunk with organic curve
  const trunkGeo = new THREE.CylinderGeometry(0.08, 0.18, 0.8, 12)
  const trunkPos = trunkGeo.attributes.position
  for (let i = 0; i < trunkPos.count; i++) {
    const y = trunkPos.getY(i)
    const normalizedY = (y + 0.4) / 0.8
    // Gentle S-curve
    const curve = Math.sin(normalizedY * Math.PI) * 0.08
    trunkPos.setX(i, trunkPos.getX(i) + curve)
  }
  trunkPos.needsUpdate = true
  trunkGeo.computeVertexNormals()
  trunkGeo.translate(0, 0.55, 0)
  addGeometry(trunkGeo)

  // Multiple flowing branches
  const branchConfigs = [
    { baseY: 0.5, angle: 0, curve: 0.3, length: 0.6 },
    { baseY: 0.6, angle: Math.PI * 0.5, curve: -0.25, length: 0.5 },
    { baseY: 0.7, angle: Math.PI, curve: 0.2, length: 0.55 },
    { baseY: 0.8, angle: Math.PI * 1.5, curve: -0.3, length: 0.45 },
    { baseY: 0.9, angle: Math.PI * 0.25, curve: 0.35, length: 0.5 },
    { baseY: 0.95, angle: Math.PI * 1.25, curve: -0.2, length: 0.4 },
  ]

  branchConfigs.forEach(({ baseY, angle, curve, length }) => {
    const branchGeo = new THREE.CylinderGeometry(0.02, 0.06, length, 8)
    const branchPos = branchGeo.attributes.position

    // Add flowing curve to branch
    for (let i = 0; i < branchPos.count; i++) {
      const y = branchPos.getY(i)
      const normalizedY = (y + length / 2) / length
      const bendAmount = Math.pow(normalizedY, 2) * curve
      branchPos.setX(i, branchPos.getX(i) + bendAmount)
    }
    branchPos.needsUpdate = true
    branchGeo.computeVertexNormals()

    // Tilt outward
    branchGeo.rotateZ(0.4 + Math.random() * 0.2)
    branchGeo.rotateY(angle)
    branchGeo.translate(
      Math.cos(angle) * 0.1,
      baseY + length / 2 * 0.7,
      Math.sin(angle) * 0.1
    )
    addGeometry(branchGeo)

    // Polyp tips on branches
    const tipGeo = new THREE.SphereGeometry(0.04, 8, 6)
    tipGeo.translate(
      Math.cos(angle) * 0.1 + Math.cos(angle + 0.3) * length * 0.4,
      baseY + length * 0.85,
      Math.sin(angle) * 0.1 + Math.sin(angle + 0.3) * length * 0.4
    )
    addGeometry(tipGeo)
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3))

  return geometry
}

function createLPSGeometry(): THREE.BufferGeometry {
  // Detailed brain coral with meandering ridges and valleys
  const geometry = new THREE.SphereGeometry(1, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2)

  const positions = geometry.attributes.position
  for (let i = 0; i < positions.count; i++) {
    let x = positions.getX(i)
    let y = positions.getY(i)
    let z = positions.getZ(i)

    const angle = Math.atan2(z, x)
    const dist = Math.sqrt(x * x + z * z)

    // Multiple overlapping wave patterns for brain-like ridges
    const ridge1 = Math.sin(angle * 6 + dist * 2) * 0.08
    const ridge2 = Math.sin(angle * 10 - dist * 3) * 0.04
    const ridge3 = Math.cos(angle * 4 + y * 5) * 0.05

    // Combine ridges with height-based falloff
    const ridgeEffect = (ridge1 + ridge2 + ridge3) * (1 - y * 0.5)

    // Create valleys (grooves between ridges)
    const valley = Math.abs(Math.sin(angle * 8)) * 0.06 * dist

    // Apply deformation
    const radialOffset = ridgeEffect - valley * 0.5
    x += radialOffset * Math.cos(angle)
    z += radialOffset * Math.sin(angle)

    // Slight vertical undulation
    y += Math.sin(angle * 12) * 0.03 * (1 - y)

    positions.setXYZ(i, x, y, z)
  }

  positions.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

function createSPSGeometry(): THREE.BufferGeometry {
  // Detailed staghorn-style SPS with textured branches
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

  // Encrusting base
  const baseGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.2, 16)
  const basePositions = baseGeo.attributes.position
  for (let i = 0; i < basePositions.count; i++) {
    const x = basePositions.getX(i)
    const z = basePositions.getZ(i)
    const angle = Math.atan2(z, x)
    const bump = Math.sin(angle * 8) * 0.03
    basePositions.setX(i, x + bump * Math.cos(angle))
    basePositions.setZ(i, z + bump * Math.sin(angle))
  }
  basePositions.needsUpdate = true
  baseGeo.computeVertexNormals()
  baseGeo.translate(0, 0.1, 0)
  addGeometry(baseGeo)

  // Create textured branch
  const createBranch = (length: number, radius: number, segments: number) => {
    const branchGeo = new THREE.CylinderGeometry(radius * 0.6, radius, length, segments)
    const branchPos = branchGeo.attributes.position

    // Add corallite texture (small bumps)
    for (let i = 0; i < branchPos.count; i++) {
      const x = branchPos.getX(i)
      const y = branchPos.getY(i)
      const z = branchPos.getZ(i)
      const angle = Math.atan2(z, x)
      const bump = Math.sin(angle * 12 + y * 20) * 0.008
      branchPos.setX(i, x + bump * Math.cos(angle))
      branchPos.setZ(i, z + bump * Math.sin(angle))
    }
    branchPos.needsUpdate = true
    branchGeo.computeVertexNormals()
    return branchGeo
  }

  // Main branches with sub-branches
  const numBranches = 7
  for (let i = 0; i < numBranches; i++) {
    const angle = (i / numBranches) * Math.PI * 2 + Math.random() * 0.3
    const length = 0.6 + Math.random() * 0.4
    const tilt = 0.25 + Math.random() * 0.25

    const branchGeo = createBranch(length, 0.06, 10)
    branchGeo.rotateX(Math.sin(angle) * tilt)
    branchGeo.rotateZ(-Math.cos(angle) * tilt)
    branchGeo.translate(
      Math.cos(angle) * 0.12,
      0.25 + length / 2,
      Math.sin(angle) * 0.12
    )
    addGeometry(branchGeo)

    // Pointed tip
    const tipGeo = new THREE.ConeGeometry(0.035, 0.1, 6)
    tipGeo.rotateX(Math.sin(angle) * tilt)
    tipGeo.rotateZ(-Math.cos(angle) * tilt)
    tipGeo.translate(
      Math.cos(angle) * 0.12 + Math.sin(angle) * tilt * length * 0.3,
      0.25 + length + 0.05,
      Math.sin(angle) * 0.12 + Math.cos(angle) * tilt * length * 0.3
    )
    addGeometry(tipGeo)

    // Sub-branches
    if (Math.random() > 0.3) {
      const subAngle = angle + (Math.random() - 0.5) * 0.8
      const subLength = length * 0.5
      const subGeo = createBranch(subLength, 0.035, 8)
      subGeo.rotateX(Math.sin(subAngle) * (tilt + 0.3))
      subGeo.rotateZ(-Math.cos(subAngle) * (tilt + 0.3))
      subGeo.translate(
        Math.cos(angle) * 0.12 + Math.cos(subAngle) * 0.08,
        0.25 + length * 0.6,
        Math.sin(angle) * 0.12 + Math.sin(subAngle) * 0.08
      )
      addGeometry(subGeo)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3))

  return geometry
}

function createAcroporaGeometry(): THREE.BufferGeometry {
  // Highly detailed Acropora with table/staghorn growth form
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

  // Create detailed branch with radial corallites
  const createAcroBranch = (length: number, baseRadius: number) => {
    const branchGeo = new THREE.CylinderGeometry(baseRadius * 0.5, baseRadius, length, 12)
    const branchPos = branchGeo.attributes.position

    // Add radial corallite bumps
    for (let i = 0; i < branchPos.count; i++) {
      const x = branchPos.getX(i)
      const y = branchPos.getY(i)
      const z = branchPos.getZ(i)
      const angle = Math.atan2(z, x)

      // Radial corallites
      const corallite = Math.max(0, Math.sin(angle * 8 + y * 15)) * 0.015
      // Axial texture
      const axial = Math.sin(y * 30) * 0.005

      branchPos.setX(i, x + (corallite + axial) * Math.cos(angle))
      branchPos.setZ(i, z + (corallite + axial) * Math.sin(angle))
    }
    branchPos.needsUpdate = true
    branchGeo.computeVertexNormals()
    return branchGeo
  }

  // Central trunk
  const trunkGeo = createAcroBranch(0.5, 0.12)
  trunkGeo.translate(0, 0.25, 0)
  addGeometry(trunkGeo)

  // Encrusting base
  const baseGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.12, 16)
  baseGeo.translate(0, 0.06, 0)
  addGeometry(baseGeo)

  // Primary branches (table-forming)
  const primaryBranches = 8
  for (let i = 0; i < primaryBranches; i++) {
    const angle = (i / primaryBranches) * Math.PI * 2
    const length = 0.5 + Math.random() * 0.3
    const tilt = 0.35 + Math.random() * 0.2

    const branchGeo = createAcroBranch(length, 0.045)
    branchGeo.rotateX(Math.sin(angle) * tilt)
    branchGeo.rotateZ(-Math.cos(angle) * tilt)

    const offsetMag = 0.08
    branchGeo.translate(
      Math.cos(angle) * offsetMag,
      0.4 + length * 0.4,
      Math.sin(angle) * offsetMag
    )
    addGeometry(branchGeo)

    // Axial corallite tip
    const tipGeo = new THREE.ConeGeometry(0.025, 0.08, 6)
    const tipOffset = length * 0.7
    tipGeo.rotateX(Math.sin(angle) * tilt)
    tipGeo.rotateZ(-Math.cos(angle) * tilt)
    tipGeo.translate(
      Math.cos(angle) * offsetMag + Math.sin(angle) * tilt * tipOffset * 0.5,
      0.4 + length + 0.04,
      Math.sin(angle) * offsetMag - Math.cos(angle) * tilt * tipOffset * 0.5
    )
    addGeometry(tipGeo)

    // Secondary branches
    const numSecondary = 2 + Math.floor(Math.random() * 2)
    for (let j = 0; j < numSecondary; j++) {
      const subAngle = angle + (j - numSecondary / 2) * 0.5
      const subLength = length * (0.4 + Math.random() * 0.2)
      const subTilt = tilt + 0.2 + Math.random() * 0.15
      const branchY = 0.35 + length * (0.3 + j * 0.2)

      const subGeo = createAcroBranch(subLength, 0.025)
      subGeo.rotateX(Math.sin(subAngle) * subTilt)
      subGeo.rotateZ(-Math.cos(subAngle) * subTilt)
      subGeo.translate(
        Math.cos(angle) * offsetMag + Math.cos(subAngle) * 0.06,
        branchY,
        Math.sin(angle) * offsetMag + Math.sin(subAngle) * 0.06
      )
      addGeometry(subGeo)

      // Sub-branch tip
      const subTipGeo = new THREE.ConeGeometry(0.015, 0.05, 5)
      subTipGeo.rotateX(Math.sin(subAngle) * subTilt)
      subTipGeo.rotateZ(-Math.cos(subAngle) * subTilt)
      subTipGeo.translate(
        Math.cos(angle) * offsetMag + Math.cos(subAngle) * (0.06 + subLength * 0.4),
        branchY + subLength * 0.8,
        Math.sin(angle) * offsetMag + Math.sin(subAngle) * (0.06 + subLength * 0.4)
      )
      addGeometry(subTipGeo)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3))

  return geometry
}

function createCoralGeometry(type: CoralType): THREE.BufferGeometry {
  switch (type) {
    case 'mushrooms':
      return createMushroomGeometry()
    case 'zoanthids':
      return createZoanthidsGeometry()
    case 'softCorals':
      return createSoftCoralGeometry()
    case 'lps':
      return createLPSGeometry()
    case 'sps':
      return createSPSGeometry()
    case 'acropora':
      return createAcroporaGeometry()
    default:
      return new THREE.SphereGeometry(0.5, 8, 6)
  }
}

function getStatusColor(status: PARStatus): number {
  switch (status) {
    case 'optimal':
      return 0x22c55e // Green
    case 'acceptable':
      return 0xeab308 // Yellow
    case 'incompatible':
      return 0xef4444 // Red
  }
}

export function CoralMesh({ coral }: CoralMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const { camera, gl } = useThree()

  const selectedCoralId = useCoralStore((state) => state.selectedCoralId)
  const selectCoral = useCoralStore((state) => state.selectCoral)
  const updateCoral = useCoralStore((state) => state.updateCoral)

  const lights = useLightStore((state) => state.lights)
  const cameraLocked = useUIStore((state) => state.cameraLocked)
  const tankDimensions = useTankStore((state) => state.dimensions)

  // Simulation state
  const mode = useSimulationStore((state) => state.mode)
  const isRunning = useSimulationStore((state) => state.isRunning)
  const isSimulating = mode === 'simulation' && isRunning

  const isSelected = selectedCoralId === coral.id

  // Get PAR status for this coral
  const parStatus = useMemo(() => {
    return getCoralPARStatus(
      coral.coralType,
      { x: coral.position[0], y: coral.position[1], z: coral.position[2] },
      lights
    )
  }, [coral.coralType, coral.position, lights])

  const geometry = useMemo(() => createCoralGeometry(coral.coralType), [coral.coralType])

  // Calculate display color with bleaching effect
  const displayColor = useMemo(() => {
    const baseColor = new THREE.Color(coral.color)
    const whiteColor = new THREE.Color(0xffffff)
    // Lerp toward white based on colorIntensity (1 = full color, 0 = white/bleached)
    const intensity = coral.colorIntensity ?? 1
    return baseColor.lerp(whiteColor, 1 - intensity)
  }, [coral.color, coral.colorIntensity])

  // Enhanced coral material with subsurface scattering and wet look
  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: displayColor,
      roughness: 0.35,
      metalness: 0.0,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
      // Subsurface scattering simulation
      transmission: 0.1,
      thickness: 0.5,
      ior: 1.4,
      // Slight sheen for organic look
      sheen: 0.3,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color(displayColor).multiplyScalar(1.2),
    })
    return mat
  }, [displayColor])

  const coralY = coral.position[1]
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -coralY), [coralY])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const mouse = useMemo(() => new THREE.Vector2(), [])

  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshPhysicalMaterial
      if (isDragging) {
        mat.emissive.setHex(0x444444)
        mat.emissiveIntensity = 0.5
      } else if (isSelected) {
        mat.emissive.setHex(getStatusColor(parStatus.status))
        mat.emissiveIntensity = 0.2
      } else if (hovered) {
        mat.emissive.setHex(0xffffff)
        mat.emissiveIntensity = 0.1
      } else {
        mat.emissive.setHex(0x000000)
        mat.emissiveIntensity = 0
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
      // Clamp position to tank bounds
      const SCALE = 0.1
      const margin = 0.1
      const tankHalfLength = (tankDimensions.length * SCALE) / 2 - margin
      const tankHalfWidth = (tankDimensions.width * SCALE) / 2 - margin

      const clampedX = Math.max(-tankHalfLength, Math.min(tankHalfLength, intersection.x))
      const clampedZ = Math.max(-tankHalfWidth, Math.min(tankHalfWidth, intersection.z))

      updateCoral(coral.id, { position: [clampedX, coral.position[1], clampedZ] })
    }
  }

  const handleSelect = () => selectCoral(coral.id)
  const handleHover = (h: boolean) => {
    setHovered(h)
    if (!h) handlePointerUp()
    if (cameraLocked && isSelected) {
      // eslint-disable-next-line react-hooks/immutability
      gl.domElement.style.cursor = h ? 'grab' : 'auto'
    }
  }

  return (
    <group position={coral.position} rotation={coral.rotation} scale={coral.scale}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onClick={(e) => {
          e.stopPropagation()
          handleSelect()
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerOver={() => handleHover(true)}
        onPointerOut={() => handleHover(false)}
        castShadow
        receiveShadow
      />
      {/* Small PAR status indicator sphere */}
      {isSelected && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color={getStatusColor(parStatus.status)} />
        </mesh>
      )}
      {/* Health indicator during simulation (only show if unhealthy) */}
      {isSimulating && !isSelected && (coral.health ?? 1) < 0.7 && (
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshBasicMaterial
            color={(coral.health ?? 1) < 0.4 ? '#ef4444' : '#eab308'}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  )
}
