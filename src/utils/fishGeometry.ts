import * as THREE from 'three'

// Inline type to avoid Safari import issues
type FishType = 'clownfish' | 'tang' | 'wrasse' | 'goby' | 'blenny' | 'angelfish' | 'chromis' | 'cardinalfish'

// Species-specific shape parameters
export interface FishShapeParams {
  bodyLength: number
  bodyHeight: number
  bodyWidth: number
  tailType: 'forked' | 'rounded' | 'straight' | 'small'
  tailSize: number
  dorsalType: 'long' | 'short' | 'pointed' | 'two-part'
  dorsalHeight: number
  hasAnalFin: boolean
  eyeSize: number
  noseShape: 'pointed' | 'rounded' | 'blunt'
  bellyBulge: number
}

export function getShapeParams(type: FishType): FishShapeParams {
  switch (type) {
    case 'clownfish':
      return {
        bodyLength: 0.9, bodyHeight: 0.5, bodyWidth: 0.22,
        tailType: 'rounded', tailSize: 0.8,
        dorsalType: 'short', dorsalHeight: 0.35,
        hasAnalFin: true, eyeSize: 0.07, noseShape: 'rounded', bellyBulge: 0.1
      }
    case 'tang':
      return {
        bodyLength: 1.0, bodyHeight: 0.75, bodyWidth: 0.15,
        tailType: 'forked', tailSize: 1.0,
        dorsalType: 'long', dorsalHeight: 0.5,
        hasAnalFin: true, eyeSize: 0.06, noseShape: 'pointed', bellyBulge: 0.05
      }
    case 'wrasse':
      return {
        bodyLength: 1.1, bodyHeight: 0.35, bodyWidth: 0.18,
        tailType: 'rounded', tailSize: 0.7,
        dorsalType: 'long', dorsalHeight: 0.3,
        hasAnalFin: true, eyeSize: 0.05, noseShape: 'pointed', bellyBulge: 0.08
      }
    case 'goby':
      return {
        bodyLength: 0.75, bodyHeight: 0.3, bodyWidth: 0.22,
        tailType: 'small', tailSize: 0.5,
        dorsalType: 'two-part', dorsalHeight: 0.25,
        hasAnalFin: true, eyeSize: 0.08, noseShape: 'blunt', bellyBulge: 0.15
      }
    case 'blenny':
      return {
        bodyLength: 0.95, bodyHeight: 0.25, bodyWidth: 0.18,
        tailType: 'rounded', tailSize: 0.5,
        dorsalType: 'long', dorsalHeight: 0.2,
        hasAnalFin: true, eyeSize: 0.07, noseShape: 'blunt', bellyBulge: 0.05
      }
    case 'angelfish':
      return {
        bodyLength: 0.85, bodyHeight: 0.9, bodyWidth: 0.12,
        tailType: 'straight', tailSize: 0.9,
        dorsalType: 'pointed', dorsalHeight: 0.6,
        hasAnalFin: true, eyeSize: 0.06, noseShape: 'pointed', bellyBulge: 0.0
      }
    case 'chromis':
      return {
        bodyLength: 0.7, bodyHeight: 0.4, bodyWidth: 0.2,
        tailType: 'forked', tailSize: 0.7,
        dorsalType: 'short', dorsalHeight: 0.25,
        hasAnalFin: true, eyeSize: 0.06, noseShape: 'rounded', bellyBulge: 0.08
      }
    case 'cardinalfish':
      return {
        bodyLength: 0.7, bodyHeight: 0.4, bodyWidth: 0.22,
        tailType: 'forked', tailSize: 0.8,
        dorsalType: 'two-part', dorsalHeight: 0.3,
        hasAnalFin: true, eyeSize: 0.09, noseShape: 'rounded', bellyBulge: 0.1
      }
    default:
      return {
        bodyLength: 1.0, bodyHeight: 0.4, bodyWidth: 0.2,
        tailType: 'rounded', tailSize: 0.8,
        dorsalType: 'short', dorsalHeight: 0.3,
        hasAnalFin: true, eyeSize: 0.06, noseShape: 'rounded', bellyBulge: 0.08
      }
  }
}

// Bezier curve interpolation for smooth body profiles
function bezierPoint(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const mt = 1 - t
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3
}

function addGeometryToArrays(geo: THREE.BufferGeometry, positions: number[], normals: number[], uvs: number[]) {
  const pos = geo.attributes.position.array
  const norm = geo.attributes.normal.array
  for (let i = 0; i < pos.length; i++) {
    positions.push(pos[i])
    normals.push(norm[i])
  }
  // Simple UV mapping for fins - use position-based
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i]
    const y = pos[i + 1]
    uvs.push((x + 1) * 0.5, (y + 1) * 0.5)
  }
}

function createTailFin(params: FishShapeParams, positions: number[], normals: number[], uvs: number[]) {
  const tailHeight = params.bodyHeight * params.tailSize
  const tailWidth = 0.02

  // Create tail shape based on type
  const tailLength = 0.35

  const shape = new THREE.Shape()

  if (params.tailType === 'forked') {
    // Forked tail (V-shape)
    shape.moveTo(0, -tailHeight * 0.5)
    shape.lineTo(-tailLength * 0.4, -tailHeight * 0.8)
    shape.quadraticCurveTo(-tailLength, -tailHeight * 0.6, -tailLength, -tailHeight * 0.3)
    shape.lineTo(-tailLength * 0.5, 0)
    shape.lineTo(-tailLength, tailHeight * 0.3)
    shape.quadraticCurveTo(-tailLength, tailHeight * 0.6, -tailLength * 0.4, tailHeight * 0.8)
    shape.lineTo(0, tailHeight * 0.5)
    shape.lineTo(0, -tailHeight * 0.5)
  } else if (params.tailType === 'rounded') {
    // Rounded tail
    shape.moveTo(0, -tailHeight * 0.4)
    shape.quadraticCurveTo(-tailLength * 0.5, -tailHeight * 0.6, -tailLength, -tailHeight * 0.4)
    shape.quadraticCurveTo(-tailLength * 1.2, 0, -tailLength, tailHeight * 0.4)
    shape.quadraticCurveTo(-tailLength * 0.5, tailHeight * 0.6, 0, tailHeight * 0.4)
    shape.lineTo(0, -tailHeight * 0.4)
  } else if (params.tailType === 'straight') {
    // Straight/angular tail (angelfish)
    shape.moveTo(0, -tailHeight * 0.3)
    shape.lineTo(-tailLength * 0.7, -tailHeight * 0.7)
    shape.lineTo(-tailLength, -tailHeight * 0.5)
    shape.lineTo(-tailLength, tailHeight * 0.5)
    shape.lineTo(-tailLength * 0.7, tailHeight * 0.7)
    shape.lineTo(0, tailHeight * 0.3)
    shape.lineTo(0, -tailHeight * 0.3)
  } else {
    // Small rounded tail (goby)
    shape.moveTo(0, -tailHeight * 0.3)
    shape.quadraticCurveTo(-tailLength * 0.7, -tailHeight * 0.35, -tailLength * 0.8, 0)
    shape.quadraticCurveTo(-tailLength * 0.7, tailHeight * 0.35, 0, tailHeight * 0.3)
    shape.lineTo(0, -tailHeight * 0.3)
  }

  const extrudeSettings = { depth: tailWidth, bevelEnabled: false }
  const tailGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  tailGeo.translate(-params.bodyLength * 0.5, 0, -tailWidth / 2)
  tailGeo.computeVertexNormals()

  addGeometryToArrays(tailGeo, positions, normals, uvs)
}

function createDorsalFin(params: FishShapeParams, positions: number[], normals: number[], uvs: number[]) {
  const finHeight = params.bodyHeight * params.dorsalHeight
  const finThickness = 0.015

  if (params.dorsalType === 'two-part') {
    // Two-part dorsal (spiny + soft) for goby/cardinalfish
    // First part (spiny)
    const shape1 = new THREE.Shape()
    shape1.moveTo(-0.15, 0)
    shape1.lineTo(-0.12, finHeight * 0.8)
    shape1.lineTo(-0.05, finHeight * 0.7)
    shape1.lineTo(0, finHeight * 0.6)
    shape1.lineTo(0.05, 0)
    shape1.lineTo(-0.15, 0)

    const geo1 = new THREE.ExtrudeGeometry(shape1, { depth: finThickness, bevelEnabled: false })
    geo1.translate(params.bodyLength * 0.05, params.bodyHeight * 0.45, -finThickness / 2)
    geo1.computeVertexNormals()
    addGeometryToArrays(geo1, positions, normals, uvs)

    // Second part (soft)
    const shape2 = new THREE.Shape()
    shape2.moveTo(-0.1, 0)
    shape2.quadraticCurveTo(-0.08, finHeight * 0.6, 0, finHeight * 0.5)
    shape2.quadraticCurveTo(0.08, finHeight * 0.4, 0.12, 0)
    shape2.lineTo(-0.1, 0)

    const geo2 = new THREE.ExtrudeGeometry(shape2, { depth: finThickness, bevelEnabled: false })
    geo2.translate(-params.bodyLength * 0.15, params.bodyHeight * 0.42, -finThickness / 2)
    geo2.computeVertexNormals()
    addGeometryToArrays(geo2, positions, normals, uvs)
  } else {
    const shape = new THREE.Shape()
    const finLength = params.dorsalType === 'long' ? params.bodyLength * 0.6 : params.bodyLength * 0.35

    if (params.dorsalType === 'pointed') {
      // Pointed dorsal (angelfish) - tall triangular
      shape.moveTo(-finLength * 0.4, 0)
      shape.lineTo(-finLength * 0.2, finHeight * 0.3)
      shape.quadraticCurveTo(0, finHeight * 1.1, finLength * 0.15, finHeight * 0.5)
      shape.lineTo(finLength * 0.25, 0)
      shape.lineTo(-finLength * 0.4, 0)
    } else if (params.dorsalType === 'long') {
      // Long continuous dorsal (tang, wrasse, blenny)
      shape.moveTo(-finLength * 0.5, 0)
      for (let i = 0; i <= 8; i++) {
        const t = i / 8
        const x = -finLength * 0.5 + finLength * t
        const height = finHeight * (0.6 + 0.4 * Math.sin(t * Math.PI))
        // Add slight ray-like ridges
        const ridge = (i % 2 === 0) ? 1.05 : 0.95
        if (i === 0) shape.lineTo(x, height * ridge)
        else shape.lineTo(x, height * ridge)
      }
      shape.lineTo(finLength * 0.5, 0)
      shape.lineTo(-finLength * 0.5, 0)
    } else {
      // Short rounded dorsal (clownfish, chromis)
      shape.moveTo(-finLength * 0.5, 0)
      shape.quadraticCurveTo(-finLength * 0.3, finHeight * 0.9, 0, finHeight * 0.85)
      shape.quadraticCurveTo(finLength * 0.3, finHeight * 0.7, finLength * 0.5, 0)
      shape.lineTo(-finLength * 0.5, 0)
    }

    const geo = new THREE.ExtrudeGeometry(shape, { depth: finThickness, bevelEnabled: false })
    geo.translate(params.bodyLength * 0.05, params.bodyHeight * 0.45, -finThickness / 2)
    geo.computeVertexNormals()
    addGeometryToArrays(geo, positions, normals, uvs)
  }
}

function createAnalFin(params: FishShapeParams, positions: number[], normals: number[], uvs: number[]) {
  const finHeight = params.bodyHeight * 0.25
  const finLength = params.bodyLength * 0.25
  const finThickness = 0.012

  const shape = new THREE.Shape()
  shape.moveTo(-finLength * 0.5, 0)
  shape.quadraticCurveTo(-finLength * 0.3, -finHeight * 0.8, 0, -finHeight * 0.7)
  shape.quadraticCurveTo(finLength * 0.3, -finHeight * 0.5, finLength * 0.5, 0)
  shape.lineTo(-finLength * 0.5, 0)

  const geo = new THREE.ExtrudeGeometry(shape, { depth: finThickness, bevelEnabled: false })
  geo.translate(-params.bodyLength * 0.15, -params.bodyHeight * 0.4, -finThickness / 2)
  geo.computeVertexNormals()
  addGeometryToArrays(geo, positions, normals, uvs)
}

function createPelvicFins(params: FishShapeParams, positions: number[], normals: number[], uvs: number[]) {
  const finSize = params.bodyHeight * 0.15
  const finThickness = 0.008

  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.quadraticCurveTo(-finSize * 0.3, -finSize * 0.8, -finSize * 0.5, -finSize)
  shape.quadraticCurveTo(-finSize * 0.2, -finSize * 0.6, 0, 0)

  // Left pelvic
  const geo1 = new THREE.ExtrudeGeometry(shape, { depth: finThickness, bevelEnabled: false })
  geo1.rotateY(-0.3)
  geo1.translate(params.bodyLength * 0.1, -params.bodyHeight * 0.35, params.bodyWidth * 0.25)
  geo1.computeVertexNormals()
  addGeometryToArrays(geo1, positions, normals, uvs)

  // Right pelvic
  const geo2 = new THREE.ExtrudeGeometry(shape, { depth: finThickness, bevelEnabled: false })
  geo2.rotateY(0.3)
  geo2.translate(params.bodyLength * 0.1, -params.bodyHeight * 0.35, -params.bodyWidth * 0.25)
  geo2.computeVertexNormals()
  addGeometryToArrays(geo2, positions, normals, uvs)
}

function createPectoralFins(params: FishShapeParams, positions: number[], normals: number[], uvs: number[]) {
  // Tear-drop shaped pectoral fins
  const finLength = params.bodyLength * 0.2
  const finWidth = params.bodyHeight * 0.25
  const finThickness = 0.01

  const shape = new THREE.Shape()
  shape.moveTo(finLength * 0.3, 0)
  shape.quadraticCurveTo(finLength * 0.2, finWidth * 0.4, -finLength * 0.2, finWidth * 0.3)
  shape.quadraticCurveTo(-finLength * 0.5, 0, -finLength * 0.2, -finWidth * 0.3)
  shape.quadraticCurveTo(finLength * 0.2, -finWidth * 0.4, finLength * 0.3, 0)

  // Left pectoral
  const geo1 = new THREE.ExtrudeGeometry(shape, { depth: finThickness, bevelEnabled: false })
  geo1.rotateX(Math.PI / 2)
  geo1.rotateY(-0.2)
  geo1.rotateZ(0.3)
  geo1.translate(params.bodyLength * 0.15, -params.bodyHeight * 0.05, params.bodyWidth * 0.4)
  geo1.computeVertexNormals()
  addGeometryToArrays(geo1, positions, normals, uvs)

  // Right pectoral
  const geo2 = new THREE.ExtrudeGeometry(shape, { depth: finThickness, bevelEnabled: false })
  geo2.rotateX(-Math.PI / 2)
  geo2.rotateY(0.2)
  geo2.rotateZ(-0.3)
  geo2.translate(params.bodyLength * 0.15, -params.bodyHeight * 0.05, -params.bodyWidth * 0.4)
  geo2.computeVertexNormals()
  addGeometryToArrays(geo2, positions, normals, uvs)
}

function createEyes(params: FishShapeParams, positions: number[], normals: number[], uvs: number[]) {
  const eyeRadius = params.eyeSize

  // Eye socket (slightly larger, darker indent)
  const socketGeo = new THREE.SphereGeometry(eyeRadius * 1.2, 10, 8)
  // Flatten it slightly for socket effect
  socketGeo.scale(1, 1, 0.6)

  // Left eye socket
  const socket1 = socketGeo.clone()
  socket1.translate(params.bodyLength * 0.35, params.bodyHeight * 0.15, params.bodyWidth * 0.38)
  socket1.computeVertexNormals()
  addGeometryToArrays(socket1, positions, normals, uvs)

  // Right eye socket
  const socket2 = socketGeo.clone()
  socket2.translate(params.bodyLength * 0.35, params.bodyHeight * 0.15, -params.bodyWidth * 0.38)
  socket2.computeVertexNormals()
  addGeometryToArrays(socket2, positions, normals, uvs)

  // Eye ball (main white part)
  const eyeGeo = new THREE.SphereGeometry(eyeRadius, 10, 8)

  // Left eye
  const eye1 = eyeGeo.clone()
  eye1.translate(params.bodyLength * 0.36, params.bodyHeight * 0.15, params.bodyWidth * 0.42)
  eye1.computeVertexNormals()
  addGeometryToArrays(eye1, positions, normals, uvs)

  // Right eye
  const eye2 = eyeGeo.clone()
  eye2.translate(params.bodyLength * 0.36, params.bodyHeight * 0.15, -params.bodyWidth * 0.42)
  eye2.computeVertexNormals()
  addGeometryToArrays(eye2, positions, normals, uvs)

  // Pupil (small dark indent)
  const pupilGeo = new THREE.SphereGeometry(eyeRadius * 0.45, 8, 6)
  pupilGeo.scale(1, 1, 0.5) // Flatten

  // Left pupil
  const pupil1 = pupilGeo.clone()
  pupil1.translate(params.bodyLength * 0.38, params.bodyHeight * 0.15, params.bodyWidth * 0.46)
  pupil1.computeVertexNormals()
  addGeometryToArrays(pupil1, positions, normals, uvs)

  // Right pupil
  const pupil2 = pupilGeo.clone()
  pupil2.translate(params.bodyLength * 0.38, params.bodyHeight * 0.15, -params.bodyWidth * 0.46)
  pupil2.computeVertexNormals()
  addGeometryToArrays(pupil2, positions, normals, uvs)
}

// Create fish body geometry with improved shapes
export function createFishGeometry(type: FishType): { geometry: THREE.BufferGeometry; uvs: Float32Array } {
  const allPositions: number[] = []
  const allNormals: number[] = []
  const allUvs: number[] = []

  const params = getShapeParams(type)

  const addGeometry = (geo: THREE.BufferGeometry, uvOffset = { u: 0, v: 0 }, uvScale = { u: 1, v: 1 }) => {
    const pos = geo.attributes.position.array
    const norm = geo.attributes.normal.array
    for (let i = 0; i < pos.length; i++) {
      allPositions.push(pos[i])
      allNormals.push(norm[i])
    }
    // Generate UVs based on position
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i]
      const y = pos[i + 1]
      // Map x to u (0-1 along body length)
      const u = ((x / params.bodyLength) + 0.5) * uvScale.u + uvOffset.u
      // Map y to v
      const v = ((y / params.bodyHeight) + 0.5) * uvScale.v + uvOffset.v
      allUvs.push(Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v)))
    }
  }

  // Main body - use higher resolution sphere with Bezier profile deformation
  const bodySegmentsX = 24
  const bodySegmentsY = 16
  const bodyGeo = new THREE.SphereGeometry(0.5, bodySegmentsX, bodySegmentsY)
  bodyGeo.scale(params.bodyLength, params.bodyHeight, params.bodyWidth)

  const bodyPositions = bodyGeo.attributes.position
  for (let i = 0; i < bodyPositions.count; i++) {
    const x = bodyPositions.getX(i)
    let y = bodyPositions.getY(i)
    const z = bodyPositions.getZ(i)

    // Normalize x position for profile calculation (-0.5 to 0.5)
    const normalizedX = x / params.bodyLength

    // Bezier curve for body profile (top view - width)
    // Control points create tapered tail and pointed/rounded nose
    let widthMultiplier: number
    if (normalizedX < 0) {
      // Tail end - taper smoothly
      const t = (normalizedX + 0.5) / 0.5 // 0 at tail, 1 at middle
      widthMultiplier = bezierPoint(t, 0.2, 0.4, 0.8, 1.0)
    } else {
      // Head end - nose shape
      const t = normalizedX / 0.5 // 0 at middle, 1 at nose
      if (params.noseShape === 'pointed') {
        widthMultiplier = bezierPoint(t, 1.0, 0.9, 0.5, 0.15)
      } else if (params.noseShape === 'blunt') {
        widthMultiplier = bezierPoint(t, 1.0, 0.95, 0.8, 0.5)
      } else {
        widthMultiplier = bezierPoint(t, 1.0, 0.9, 0.7, 0.35)
      }
    }

    // Bezier curve for body profile (side view - height)
    let heightMultiplier: number
    if (normalizedX < 0) {
      // Tail end taper
      const t = (normalizedX + 0.5) / 0.5
      heightMultiplier = bezierPoint(t, 0.25, 0.5, 0.85, 1.0)
    } else {
      // Head end
      const t = normalizedX / 0.5
      heightMultiplier = bezierPoint(t, 1.0, 0.95, 0.7, 0.4)
    }

    // Apply belly bulge (lower half only)
    if (y < 0) {
      const bellyFactor = 1 + params.bellyBulge * Math.cos(normalizedX * Math.PI) * (1 - Math.abs(y / (params.bodyHeight * 0.5)))
      y *= bellyFactor
    }

    bodyPositions.setY(i, y * heightMultiplier)
    bodyPositions.setZ(i, z * widthMultiplier)

    // Slight x adjustment for streamlined shape
    if (normalizedX < -0.3) {
      // Elongate tail section slightly
      bodyPositions.setX(i, x * 1.1)
    }
  }
  bodyPositions.needsUpdate = true
  bodyGeo.computeVertexNormals()
  addGeometry(bodyGeo)

  // Tail fin - shape varies by type
  createTailFin(params, allPositions, allNormals, allUvs)

  // Dorsal fin
  createDorsalFin(params, allPositions, allNormals, allUvs)

  // Anal fin (below body)
  if (params.hasAnalFin) {
    createAnalFin(params, allPositions, allNormals, allUvs)
  }

  // Pelvic fins (small paired fins near belly)
  createPelvicFins(params, allPositions, allNormals, allUvs)

  // Pectoral fins (tear-drop shape on sides)
  createPectoralFins(params, allPositions, allNormals, allUvs)

  // Eyes with proper socket and pupil indent
  createEyes(params, allPositions, allNormals, allUvs)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(allUvs, 2))

  return { geometry, uvs: new Float32Array(allUvs) }
}

// Pattern generation for vertex colors
export type PatternType = 'solid' | 'stripes' | 'horizontal_stripes' | 'spots' | 'gradient' | 'two_tone'

export interface PatternConfig {
  type: PatternType
  colors?: string[]
  stripeCount?: number
  stripeWidth?: number
  spotSize?: number
  spotDensity?: number
}

export function getPatternForFish(fishType: FishType): PatternConfig {
  // Default patterns by species (FishInfo doesn't have pattern property)
  switch (fishType) {
    case 'clownfish':
      return { type: 'stripes', stripeCount: 3, stripeWidth: 0.12 }
    case 'tang':
      return { type: 'gradient' }
    case 'wrasse':
      return { type: 'horizontal_stripes', stripeCount: 4, stripeWidth: 0.08 }
    case 'angelfish':
      return { type: 'stripes', stripeCount: 5, stripeWidth: 0.08 }
    case 'chromis':
      return { type: 'solid' }
    case 'cardinalfish':
      return { type: 'spots', spotSize: 0.1, spotDensity: 0.3 }
    default:
      return { type: 'solid' }
  }
}

export function generateVertexColors(
  uvs: Float32Array,
  baseColor: string,
  pattern: PatternConfig
): Float32Array {
  const color = new THREE.Color(baseColor)
  const white = new THREE.Color('#FFFFFF')
  const darkColor = new THREE.Color(baseColor).multiplyScalar(0.3)

  const colors: number[] = []
  const vertexCount = uvs.length / 2

  for (let i = 0; i < vertexCount; i++) {
    const u = uvs[i * 2]
    const v = uvs[i * 2 + 1]

    let finalColor = color.clone()

    switch (pattern.type) {
      case 'stripes': {
        // Vertical stripes (clownfish-style)
        const stripeCount = pattern.stripeCount || 3
        const stripeWidth = pattern.stripeWidth || 0.1
        const stripePhase = u * stripeCount * Math.PI * 2
        const stripeFactor = Math.sin(stripePhase)
        if (Math.abs(stripeFactor) > (1 - stripeWidth * 5)) {
          finalColor = white.clone()
        }
        break
      }
      case 'horizontal_stripes': {
        // Horizontal stripes
        const stripeCount = pattern.stripeCount || 4
        const stripeWidth = pattern.stripeWidth || 0.08
        const stripePhase = v * stripeCount * Math.PI * 2
        const stripeFactor = Math.sin(stripePhase)
        if (stripeFactor > (1 - stripeWidth * 8)) {
          finalColor.lerp(darkColor, 0.7)
        }
        break
      }
      case 'spots': {
        // Scattered spots
        const spotSize = pattern.spotSize || 0.1
        const spotDensity = pattern.spotDensity || 0.3
        // Use pseudo-random based on UV
        const seed = Math.sin(u * 127.1 + v * 311.7) * 43758.5453
        const random = seed - Math.floor(seed)
        if (random < spotDensity) {
          // Check if we're at spot center
          const spotU = u % spotSize
          const spotV = v % spotSize
          const distFromCenter = Math.sqrt(
            Math.pow(spotU - spotSize / 2, 2) + Math.pow(spotV - spotSize / 2, 2)
          )
          if (distFromCenter < spotSize * 0.3) {
            finalColor = darkColor.clone()
          }
        }
        break
      }
      case 'gradient': {
        // Head-to-tail gradient
        finalColor.lerp(darkColor, u * 0.4)
        break
      }
      case 'two_tone': {
        // Upper/lower body split
        if (v < 0.45) {
          finalColor.lerp(darkColor, 0.5)
        }
        break
      }
      // solid - no changes needed
    }

    colors.push(finalColor.r, finalColor.g, finalColor.b)
  }

  return new Float32Array(colors)
}
