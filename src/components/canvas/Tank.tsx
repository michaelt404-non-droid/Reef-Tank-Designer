import { useMemo, useCallback, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTankStore } from '../../stores/tankStore'
import { useSimulationStore } from '../../stores/simulationStore'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'

// Convert inches to 3D units (1 inch = 0.1 units for nice scale)
const SCALE = 0.1

// Water surface shader for animated ripples
const waterSurfaceVertexShader = `
  uniform float uTime;
  uniform float uWaveHeight;

  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Multiple wave frequencies for realistic water
    float wave1 = sin(pos.x * 4.0 + uTime * 0.8) * cos(pos.y * 3.0 + uTime * 0.6);
    float wave2 = sin(pos.x * 6.0 - uTime * 1.2) * sin(pos.y * 5.0 + uTime * 0.9);
    float wave3 = cos(pos.x * 2.5 + pos.y * 4.0 + uTime * 0.5);

    float elevation = (wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.3) * uWaveHeight;
    pos.z += elevation;
    vElevation = elevation;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const waterSurfaceFragmentShader = `
  uniform vec3 uWaterColor;
  uniform vec3 uFoamColor;
  uniform float uTime;

  varying vec2 vUv;
  varying float vElevation;

  void main() {
    // Base water color
    vec3 deepColor = uWaterColor;
    vec3 shallowColor = uFoamColor;

    // Color variation based on wave height
    float heightFactor = clamp(vElevation * 15.0 + 0.5, 0.0, 1.0);
    vec3 color = mix(deepColor, shallowColor, heightFactor * 0.4);

    // Shimmer effect
    float shimmer = sin(vUv.x * 30.0 + uTime * 2.0) * sin(vUv.y * 30.0 - uTime * 1.5);
    shimmer = shimmer * 0.5 + 0.5; // Normalize to 0-1
    color += shimmer * 0.08;

    // Specular-like highlights based on wave peaks
    float highlight = pow(max(vElevation * 10.0, 0.0), 2.0);
    color += vec3(highlight * 0.3);

    gl_FragColor = vec4(color, 0.75);
  }
`

export function Tank() {
  const { dimensions } = useTankStore()
  const mode = useSimulationStore((state) => state.mode)
  const feedManually = useSimulationStore((state) => state.feedManually)

  const waterSurfaceRef = useRef<THREE.Mesh>(null)

  // Convert dimensions to 3D scale
  const size = useMemo(() => ({
    x: dimensions.length * SCALE,
    y: dimensions.height * SCALE,
    z: dimensions.width * SCALE,
  }), [dimensions])

  // Click-to-feed handler for water surface
  const handleWaterSurfaceClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    if (mode !== 'simulation') return
    event.stopPropagation()
    const point = event.point
    feedManually([point.x, point.y, point.z], 5)
  }, [mode, feedManually])

  // Glass thickness
  const glassThickness = 0.03

  // Glass material - simplified for better performance
  const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.2,
    roughness: 0.05,
    metalness: 0.0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
  }), [])

  // Water surface shader material
  const waterSurfaceMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: waterSurfaceVertexShader,
    fragmentShader: waterSurfaceFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uWaveHeight: { value: 0.008 },
      uWaterColor: { value: new THREE.Color(0x0077aa) },
      uFoamColor: { value: new THREE.Color(0x99ddff) },
    },
    transparent: true,
    side: THREE.DoubleSide,
  }), [])



  // Sand material - using BasicMaterial to avoid environment reflections
  const sandMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xf4e4bc,
  }), [])

  // Animate water effects
  useFrame((state) => {
    const time = state.clock.elapsedTime

    if (waterSurfaceMaterial.uniforms) {
      waterSurfaceMaterial.uniforms.uTime.value = time
    }
  })

  // Dispose materials on unmount
  useEffect(() => {
    return () => {
      glassMaterial.dispose()
      waterSurfaceMaterial.dispose()
      sandMaterial.dispose()
    }
  }, [glassMaterial, waterSurfaceMaterial, sandMaterial])

  return (
    <group position={[0, size.y / 2, 0]}>
      {/* Glass panels */}
      {/* Back panel */}
      <mesh position={[0, 0, -size.z / 2]} material={glassMaterial}>
        <boxGeometry args={[size.x, size.y, glassThickness]} />
      </mesh>

      {/* Front panel */}
      <mesh position={[0, 0, size.z / 2]} material={glassMaterial}>
        <boxGeometry args={[size.x, size.y, glassThickness]} />
      </mesh>

      {/* Left panel */}
      <mesh position={[-size.x / 2, 0, 0]} material={glassMaterial}>
        <boxGeometry args={[glassThickness, size.y, size.z]} />
      </mesh>

      {/* Right panel */}
      <mesh position={[size.x / 2, 0, 0]} material={glassMaterial}>
        <boxGeometry args={[glassThickness, size.y, size.z]} />
      </mesh>

      {/* Bottom panel */}
      <mesh position={[0, -size.y / 2, 0]} material={glassMaterial}>
        <boxGeometry args={[size.x, glassThickness, size.z]} />
      </mesh>

      {/* Animated water surface */}
      <mesh
        ref={waterSurfaceRef}
        position={[0, size.y / 2 - 0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={waterSurfaceMaterial}
        onClick={handleWaterSurfaceClick}
      >
        <planeGeometry args={[size.x - 0.08, size.z - 0.08, 32, 32]} />
      </mesh>

      {/* Sand bed */}
      <mesh position={[0, -size.y / 2 + 0.08, 0]} material={sandMaterial} receiveShadow>
        <boxGeometry args={[size.x - 0.08, 0.12, size.z - 0.08]} />
      </mesh>

    </group>
  )
}
