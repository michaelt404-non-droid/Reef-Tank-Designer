import { useRef, useMemo, useEffect, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useCoralStore } from '../../stores/coralStore'
import { useLightStore } from '../../stores/lightStore'
import { useUIStore } from '../../stores/uiStore'
import { useTankStore } from '../../stores/tankStore'
import { useSimulationStore } from '../../stores/simulationStore'
import { useHistoryStore } from '../../stores/historyStore'
import { CORAL_INFO } from '../../data/corals'
import { getCoralPARStatus } from '../../utils/parCalculator'
import { useDrag3D } from '../../hooks/useDrag3D'

// Inline types to avoid Safari import issues
type CoralType = 'mushrooms' | 'zoanthids' | 'softCorals' | 'lps' | 'sps' | 'acropora'
type PARStatus = 'optimal' | 'acceptable' | 'incompatible'

interface PlacedCoral {
  id: string
  coralType: CoralType | string  // Allow both for custom corals
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  color: string
  health: number
  growthProgress: number
  colorIntensity: number
  baseScale: number
}

interface CoralMeshProps {
  coral: PlacedCoral
}

// --- Model Loading Component ---
function ModelCoral({
  modelPath,
  color,
  colorIntensity,
  preserveOriginalMaterials = false,
}: {
  modelPath: string
  color: string
  colorIntensity: number
  preserveOriginalMaterials?: boolean
}) {
  const { scene } = useGLTF(modelPath)
  const clonedScene = useMemo(() => scene.clone(), [scene])
  const bleachOverlaysRef = useRef<THREE.Mesh[]>([])

  const displayColor = useMemo(() => {
    const baseColor = new THREE.Color(color)
    const whiteColor = new THREE.Color(0xffffff)
    return baseColor.lerp(whiteColor, 1 - (colorIntensity ?? 1))
  }, [color, colorIntensity])

  const cartoonMaterial = useMemo(() => new THREE.MeshLambertMaterial({
    color: displayColor,
    side: THREE.DoubleSide,
    flatShading: false,
    emissive: displayColor,
    emissiveIntensity: 0.15,
  }), [displayColor])

  const outlineMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.BackSide,
  }), [])

  // Bleaching overlay material - white with top-to-bottom gradient
  const bleachMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        bleachAmount: { value: 0 },
      },
      vertexShader: `
        varying float vHeight;
        void main() {
          // Get the world position to calculate height
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vHeight = position.y; // Use local Y for gradient
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float bleachAmount;
        varying float vHeight;
        void main() {
          // Normalize height (assuming coral is roughly -1 to 1 in local space)
          float normalizedHeight = clamp((vHeight + 1.0) / 2.0, 0.0, 1.0);
          // Bleaching starts from top, so invert and apply gradient
          float gradient = normalizedHeight * 1.5; // Top gets more bleaching
          float alpha = bleachAmount * gradient * 0.85;
          gl_FragColor = vec4(1.0, 1.0, 1.0, clamp(alpha, 0.0, 0.85));
        }
      `,
    })
  }, [])

  // Update bleach amount based on colorIntensity
  useEffect(() => {
    // bleachAmount is inverse of colorIntensity (1 = healthy/invisible, 0 = bleached/white)
    const bleachAmount = 1 - (colorIntensity ?? 1)
    bleachMaterial.uniforms.bleachAmount.value = bleachAmount
  }, [colorIntensity, bleachMaterial])

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true

        // For models with original materials, add bleaching overlay
        if (preserveOriginalMaterials) {
          // Create white overlay mesh for bleaching effect
          const bleachOverlay = child.clone()
          bleachOverlay.material = bleachMaterial
          bleachOverlay.scale.multiplyScalar(1.01) // Slightly larger to avoid z-fighting
          bleachOverlay.renderOrder = 1 // Render after the main mesh
          child.parent?.add(bleachOverlay)
          bleachOverlaysRef.current.push(bleachOverlay)
          return
        }

        // For built-in models without textures, apply cartoon styling
        const outlineMesh = child.clone()
        outlineMesh.material = outlineMaterial
        outlineMesh.scale.multiplyScalar(1.03)
        child.parent?.add(outlineMesh)

        child.material = cartoonMaterial
      }
    })

    return () => {
      if (!preserveOriginalMaterials) {
        cartoonMaterial.dispose()
        outlineMaterial.dispose()
      }
      bleachMaterial.dispose()
      bleachOverlaysRef.current = []
    }
  }, [clonedScene, cartoonMaterial, outlineMaterial, bleachMaterial, preserveOriginalMaterials])

  return <primitive object={clonedScene} />
}

function getStatusColor(status: PARStatus): number {
  switch (status) {
    case 'optimal': return 0x22c55e // Green
    case 'acceptable': return 0xeab308 // Yellow
    case 'incompatible': return 0xef4444 // Red
  }
}

// --- Main Coral Component ---
export function CoralMesh({ coral }: CoralMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const isDraggingRef = useRef(false)

  const { gl } = useThree()
  const selectedCoralId = useCoralStore((state) => state.selectedCoralId)
  const selectCoral = useCoralStore((state) => state.selectCoral)
  const updateCoral = useCoralStore((state) => state.updateCoral)
  const lights = useLightStore((state) => state.lights)
  const cameraLocked = useUIStore((state) => state.cameraLocked)
  const tankDimensions = useTankStore((state) => state.dimensions)
  const mode = useSimulationStore((state) => state.mode)
  const isRunning = useSimulationStore((state) => state.isRunning)
  const isSimulating = mode === 'simulation' && isRunning

  const isSelected = selectedCoralId === coral.id

  // Get custom coral models from the store
  const customCoralModels = useCoralStore((state) => state.customCoralModels)

  // Get model information from CORAL_INFO or customCoralModels
  const coralInfo = useMemo(() =>
    [...CORAL_INFO, ...customCoralModels].find(c => c.id === coral.coralType),
    [coral.coralType, customCoralModels]
  )

  const parStatus = useMemo(() => getCoralPARStatus(coral.coralType, { x: coral.position[0], y: coral.position[1], z: coral.position[2] }, lights), [coral.coralType, coral.position, lights])

  // Calculate bounds for dragging
  const dragBounds = useMemo(() => {
    const SCALE = 0.1
    const margin = 0.1
    const tankHalfLength = (tankDimensions.length * SCALE) / 2 - margin
    const tankHalfWidth = (tankDimensions.width * SCALE) / 2 - margin
    const tankHeight = tankDimensions.height * SCALE
    return {
      minX: -tankHalfLength,
      maxX: tankHalfLength,
      minY: 0.1,
      maxY: tankHeight - 0.1,
      minZ: -tankHalfWidth,
      maxZ: tankHalfWidth,
    }
  }, [tankDimensions])

  // Use the drag hook
  const { startDrag, canDrag } = useDrag3D({
    position: coral.position,
    onDrag: (newPosition) => updateCoral(coral.id, { position: newPosition }),
    onDragEnd: () => useHistoryStore.getState().pushSnapshot('Move Coral'),
    enabled: isSelected,
    bounds: dragBounds,
  })

  const swayOffset = useMemo(() => {
    let hash = 0
    for (let i = 0; i < coral.id.length; i++) {
      hash = coral.id.charCodeAt(i) + ((hash << 5) - hash)
    }
    return (hash % 1000) / 1000 * Math.PI * 2
  }, [coral.id])

  // Swaying animation
  useFrame((state) => {
    if (groupRef.current && !isDraggingRef.current && (coral.coralType === 'softCorals' || coral.coralType === 'mushrooms' || coral.coralType === 'zoanthids')) {
      const time = state.clock.elapsedTime
      const swayAmount = 0.03
      const sway1 = Math.sin(time * 0.5 + swayOffset) * swayAmount
      const sway2 = Math.sin(time * 0.8 + swayOffset * 1.5) * swayAmount * 0.5
      const sway3 = Math.cos(time * 0.3 + swayOffset * 0.7) * swayAmount * 0.3
      groupRef.current.rotation.x = coral.rotation[0] + sway1 + sway2
      groupRef.current.rotation.z = coral.rotation[2] + sway2 + sway3
    }
  })

  // --- Interaction Handlers ---
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (mode === 'simulation') return
    e.stopPropagation()
    // Select on pointer down if not already selected
    if (!isSelected) {
      selectCoral(coral.id)
    }
    // Start drag if camera is locked
    if (cameraLocked) {
      isDraggingRef.current = true
      startDrag(e)
    }
  }

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (mode === 'simulation') return
    e.stopPropagation()
    selectCoral(coral.id)
  }

  const handleHover = (h: boolean) => {
    if (!h) isDraggingRef.current = false
    if (canDrag) {
      gl.domElement.style.cursor = h ? 'grab' : 'auto'
    }
  }

  if (!coralInfo || !coralInfo.modelPath) {
    return (
      <group ref={groupRef}>
        <mesh>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </group>
    )
  }

  return (
    <group
      ref={groupRef}
      position={coral.position}
      rotation={coral.rotation}
      scale={coral.scale}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerOver={() => handleHover(true)}
      onPointerOut={() => handleHover(false)}
    >
      <Suspense fallback={null}>
        <ModelCoral
          modelPath={coralInfo.modelPath}
          color={coral.color}
          colorIntensity={coral.colorIntensity}
          preserveOriginalMaterials={true}
        />
      </Suspense>

      {/* Indicators */}
      {isSelected && (
        <mesh position={[0, 1.5 / coral.scale, 0]}>
          <sphereGeometry args={[0.1 / coral.scale, 8, 8]} />
          <meshBasicMaterial color={getStatusColor(parStatus.status)} />
        </mesh>
      )}
      {isSimulating && !isSelected && (coral.health ?? 1) < 0.7 && (
        <mesh position={[0, 1.2 / coral.scale, 0]}>
          <sphereGeometry args={[0.06 / coral.scale, 6, 6]} />
          <meshBasicMaterial color={(coral.health ?? 1) < 0.4 ? '#ef4444' : '#eab308'} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  )
}
