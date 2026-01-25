import { useMemo } from 'react'
import * as THREE from 'three'
import { useLightStore } from '../../stores/lightStore'
import { useTankStore } from '../../stores/tankStore'
import { useSimulationStore } from '../../stores/simulationStore'
import { calculateTotalPAR, getPARColor } from '../../utils/parCalculator'

const SCALE = 0.1
const RESOLUTION = 20 // Grid resolution

export function PAROverlay() {
  const lights = useLightStore((state) => state.lights)
  const showPAROverlay = useLightStore((state) => state.showPAROverlay)
  const dimensions = useTankStore((state) => state.dimensions)
  const mode = useSimulationStore((state) => state.mode)

  // Generate PAR heatmap geometry
  const { geometry } = useMemo(() => {
    const tankLength = dimensions.length * SCALE
    const tankWidth = dimensions.width * SCALE

    const positions: number[] = []
    const colorArray: number[] = []

    const sandY = 0.16 // Just above sand

    for (let i = 0; i < RESOLUTION; i++) {
      for (let j = 0; j < RESOLUTION; j++) {
        const x1 = (i / RESOLUTION - 0.5) * tankLength
        const x2 = ((i + 1) / RESOLUTION - 0.5) * tankLength
        const z1 = (j / RESOLUTION - 0.5) * tankWidth
        const z2 = ((j + 1) / RESOLUTION - 0.5) * tankWidth

        // Calculate PAR at center of this cell
        const centerX = (x1 + x2) / 2
        const centerZ = (z1 + z2) / 2
        const par = calculateTotalPAR(lights, { x: centerX, y: sandY, z: centerZ })

        // Get color for this PAR value
        const color = new THREE.Color(getPARColor(par))

        // Create two triangles for this cell
        // Triangle 1
        positions.push(x1, sandY, z1)
        positions.push(x2, sandY, z1)
        positions.push(x1, sandY, z2)

        // Triangle 2
        positions.push(x2, sandY, z1)
        positions.push(x2, sandY, z2)
        positions.push(x1, sandY, z2)

        // Add colors for all 6 vertices
        for (let v = 0; v < 6; v++) {
          colorArray.push(color.r, color.g, color.b)
        }
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colorArray, 3))

    return { geometry: geo, colors: colorArray }
  }, [lights, dimensions])

  // Hide PAR overlay in simulation mode or when disabled
  if (!showPAROverlay || lights.length === 0 || mode === 'simulation') return null

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
