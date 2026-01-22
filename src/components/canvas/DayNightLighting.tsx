import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '../../stores/simulationStore'

/**
 * DayNightLighting - Adjusts scene lighting based on simulation time of day
 * Creates smooth transitions between day and night lighting
 */
export function DayNightLighting() {
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const sunRef = useRef<THREE.DirectionalLight>(null)
  const moonRef = useRef<THREE.DirectionalLight>(null)

  const mode = useSimulationStore((state) => state.mode)
  const dayProgress = useSimulationStore((state) => state.dayProgress)
  const difficulty = useSimulationStore((state) => state.difficulty)

  // Time config for calculating transition points
  const timeConfig = useMemo(() => {
    const configs = {
      beginner: { dayDuration: 5 * 60, nightDuration: 1 * 60 },
      intermediate: { dayDuration: 15 * 60, nightDuration: 3 * 60 },
      expert: { dayDuration: 30 * 60, nightDuration: 7 * 60 },
    }
    return configs[difficulty]
  }, [difficulty])

  const dayRatio = timeConfig.dayDuration / (timeConfig.dayDuration + timeConfig.nightDuration)

  // Only apply lighting effects in simulation mode
  const isSimulating = mode === 'simulation'

  useFrame(() => {
    if (!ambientRef.current || !sunRef.current || !moonRef.current) return

    if (!isSimulating) {
      // Default daytime lighting when not simulating
      ambientRef.current.intensity = 0.5
      sunRef.current.intensity = 1.0
      moonRef.current.intensity = 0
      return
    }

    // Calculate transition factor for smooth day/night changes
    // dayProgress goes 0 -> dayRatio (day) -> 1 (night ends)
    let dayFactor: number
    const transitionDuration = 0.05 // 5% of cycle for sunrise/sunset

    if (dayProgress < transitionDuration) {
      // Sunrise transition
      dayFactor = dayProgress / transitionDuration
    } else if (dayProgress < dayRatio - transitionDuration) {
      // Full day
      dayFactor = 1
    } else if (dayProgress < dayRatio + transitionDuration) {
      // Sunset transition
      dayFactor = 1 - (dayProgress - (dayRatio - transitionDuration)) / (transitionDuration * 2)
    } else if (dayProgress < 1 - transitionDuration) {
      // Full night
      dayFactor = 0
    } else {
      // Pre-sunrise transition (end of night)
      dayFactor = (dayProgress - (1 - transitionDuration)) / transitionDuration
    }

    // Clamp factor
    dayFactor = Math.max(0, Math.min(1, dayFactor))

    // Apply lighting based on day factor
    // Day: warm, bright
    // Night: cool, dim with moonlight

    // Ambient light
    const dayAmbient = 0.5
    const nightAmbient = 0.15
    ambientRef.current.intensity = nightAmbient + (dayAmbient - nightAmbient) * dayFactor

    // Sun/main light
    sunRef.current.intensity = dayFactor * 1.0

    // Moon light (blue-ish)
    moonRef.current.intensity = (1 - dayFactor) * 0.3

    // Color temperature shift
    const dayColor = new THREE.Color(0xffffff)
    const sunsetColor = new THREE.Color(0xffaa66)
    const nightColor = new THREE.Color(0x6688cc)

    if (dayFactor > 0.8) {
      // Day - white light
      ambientRef.current.color = dayColor
    } else if (dayFactor > 0.2) {
      // Transition - warm sunset/sunrise colors
      const t = (dayFactor - 0.2) / 0.6
      ambientRef.current.color = sunsetColor.clone().lerp(dayColor, t)
    } else {
      // Night - cool blue
      const t = dayFactor / 0.2
      ambientRef.current.color = nightColor.clone().lerp(sunsetColor, t)
    }
  })

  return (
    <>
      {/* Ambient light - base illumination */}
      <ambientLight ref={ambientRef} intensity={0.5} />

      {/* Sun/main directional light */}
      <directionalLight
        ref={sunRef}
        position={[10, 10, 5]}
        intensity={1}
        color={0xffffff}
        castShadow
      />

      {/* Moon light - subtle blue fill from opposite side */}
      <directionalLight
        ref={moonRef}
        position={[-5, 8, -5]}
        intensity={0}
        color={0x6688cc}
      />

      {/* Secondary fill light */}
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />
    </>
  )
}
