import * as THREE from 'three'

// Shared materials cache to avoid creating duplicate materials
const materialCache = new Map<string, THREE.Material>()

// Get or create a shared MeshLambertMaterial
export function getSharedLambertMaterial(color: string, options?: {
  side?: THREE.Side
  flatShading?: boolean
  emissive?: string
  emissiveIntensity?: number
}): THREE.MeshLambertMaterial {
  const key = `lambert-${color}-${options?.side ?? THREE.FrontSide}-${options?.flatShading ?? false}-${options?.emissive ?? 'none'}-${options?.emissiveIntensity ?? 0}`

  if (!materialCache.has(key)) {
    const material = new THREE.MeshLambertMaterial({
      color: new THREE.Color(color),
      side: options?.side ?? THREE.FrontSide,
      flatShading: options?.flatShading ?? false,
      emissive: options?.emissive ? new THREE.Color(options.emissive) : undefined,
      emissiveIntensity: options?.emissiveIntensity ?? 0,
    })
    materialCache.set(key, material)
  }

  return materialCache.get(key) as THREE.MeshLambertMaterial
}

// Get or create a shared MeshBasicMaterial
export function getSharedBasicMaterial(color: string | number, options?: {
  side?: THREE.Side
  transparent?: boolean
  opacity?: number
}): THREE.MeshBasicMaterial {
  const key = `basic-${color}-${options?.side ?? THREE.FrontSide}-${options?.transparent ?? false}-${options?.opacity ?? 1}`

  if (!materialCache.has(key)) {
    const material = new THREE.MeshBasicMaterial({
      color: typeof color === 'string' ? new THREE.Color(color) : color,
      side: options?.side ?? THREE.FrontSide,
      transparent: options?.transparent ?? false,
      opacity: options?.opacity ?? 1,
    })
    materialCache.set(key, material)
  }

  return materialCache.get(key) as THREE.MeshBasicMaterial
}

// Shared indicator materials (selection, health, etc.)
let selectionMaterial: THREE.MeshBasicMaterial | null = null
let healthRedMaterial: THREE.MeshBasicMaterial | null = null
let healthYellowMaterial: THREE.MeshBasicMaterial | null = null
let healthOrangeMaterial: THREE.MeshBasicMaterial | null = null

export function getSelectionMaterial(): THREE.MeshBasicMaterial {
  if (!selectionMaterial) {
    selectionMaterial = new THREE.MeshBasicMaterial({ color: 0x22c55e })
  }
  return selectionMaterial
}

export function getHealthMaterial(health: number, hunger: number): THREE.MeshBasicMaterial | null {
  if (health < 0.3) {
    if (!healthRedMaterial) {
      healthRedMaterial = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 })
    }
    return healthRedMaterial
  }
  if (hunger > 0.7) {
    if (!healthOrangeMaterial) {
      healthOrangeMaterial = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.8 })
    }
    return healthOrangeMaterial
  }
  if (health < 0.6 || hunger > 0.5) {
    if (!healthYellowMaterial) {
      healthYellowMaterial = new THREE.MeshBasicMaterial({ color: 0xeab308, transparent: true, opacity: 0.8 })
    }
    return healthYellowMaterial
  }
  return null
}

// Shared geometry for indicators
let indicatorSphereSmall: THREE.SphereGeometry | null = null
let indicatorSphereLarge: THREE.SphereGeometry | null = null

export function getIndicatorGeometry(size: 'small' | 'large'): THREE.SphereGeometry {
  if (size === 'small') {
    if (!indicatorSphereSmall) {
      indicatorSphereSmall = new THREE.SphereGeometry(0.06, 6, 6)
    }
    return indicatorSphereSmall
  } else {
    if (!indicatorSphereLarge) {
      indicatorSphereLarge = new THREE.SphereGeometry(0.1, 8, 8)
    }
    return indicatorSphereLarge
  }
}

// Clean up all cached materials (call on app unmount if needed)
export function disposeMaterialCache(): void {
  materialCache.forEach((material) => material.dispose())
  materialCache.clear()

  selectionMaterial?.dispose()
  healthRedMaterial?.dispose()
  healthYellowMaterial?.dispose()
  healthOrangeMaterial?.dispose()
  indicatorSphereSmall?.dispose()
  indicatorSphereLarge?.dispose()

  selectionMaterial = null
  healthRedMaterial = null
  healthYellowMaterial = null
  healthOrangeMaterial = null
  indicatorSphereSmall = null
  indicatorSphereLarge = null
}
