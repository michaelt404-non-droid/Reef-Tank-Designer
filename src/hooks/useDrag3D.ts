import { useRef, useCallback, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useUIStore } from '../stores/uiStore'

// Type for events that can trigger drag - supports both React events and ThreeEvent
type DragEvent = React.PointerEvent | PointerEvent | ThreeEvent<PointerEvent>

interface UseDrag3DOptions {
  position: [number, number, number]
  onDrag: (newPosition: [number, number, number]) => void
  onDragEnd?: () => void
  enabled?: boolean
  bounds?: {
    minX: number
    maxX: number
    minY: number
    maxY: number
    minZ: number
    maxZ: number
  }
}

export function useDrag3D({ position, onDrag, onDragEnd, enabled = true, bounds }: UseDrag3DOptions) {
  const { camera, gl } = useThree()
  const cameraLocked = useUIStore((state) => state.cameraLocked)

  const isDragging = useRef(false)
  const dragPlane = useRef(new THREE.Plane())
  const dragOffset = useRef(new THREE.Vector3())
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const currentPosition = useRef(new THREE.Vector3(...position))
  const isVerticalMode = useRef(false)

  // Update current position when prop changes
  useEffect(() => {
    currentPosition.current.set(...position)
  }, [position])

  const updateMouseFromEvent = useCallback((e: MouseEvent | PointerEvent) => {
    const rect = gl.domElement.getBoundingClientRect()
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }, [gl])

  const setupDragPlane = useCallback((vertical: boolean) => {
    isVerticalMode.current = vertical

    if (vertical) {
      // Vertical plane facing the camera
      const cameraDir = camera.getWorldDirection(new THREE.Vector3())
      cameraDir.y = 0
      cameraDir.normalize()
      if (cameraDir.length() < 0.01) {
        cameraDir.set(0, 0, 1)
      }
      dragPlane.current.setFromNormalAndCoplanarPoint(cameraDir, currentPosition.current)
    } else {
      // Horizontal plane at current Y
      dragPlane.current.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 1, 0),
        currentPosition.current
      )
    }
  }, [camera])

  const handleWindowPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return

    updateMouseFromEvent(e)

    // Check if shift key state changed
    if (e.shiftKey !== isVerticalMode.current) {
      setupDragPlane(e.shiftKey)
    }

    raycaster.current.setFromCamera(mouse.current, camera)

    const intersection = new THREE.Vector3()
    if (raycaster.current.ray.intersectPlane(dragPlane.current, intersection)) {
      let newX: number, newY: number, newZ: number

      if (isVerticalMode.current) {
        // Vertical mode: only change Y
        newX = currentPosition.current.x
        newY = intersection.y - dragOffset.current.y
        newZ = currentPosition.current.z
      } else {
        // Horizontal mode: change X and Z
        newX = intersection.x - dragOffset.current.x
        newY = currentPosition.current.y
        newZ = intersection.z - dragOffset.current.z
      }

      // Apply bounds if provided
      if (bounds) {
        newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX))
        newY = Math.max(bounds.minY, Math.min(bounds.maxY, newY))
        newZ = Math.max(bounds.minZ, Math.min(bounds.maxZ, newZ))
      }

      currentPosition.current.set(newX, newY, newZ)
      onDrag([newX, newY, newZ])
    }
  }, [camera, bounds, onDrag, setupDragPlane, updateMouseFromEvent])

  const handleWindowPointerUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false
      gl.domElement.style.cursor = 'auto'

      // Call onDragEnd callback
      onDragEnd?.()

      // Remove window listeners
      window.removeEventListener('pointermove', handleWindowPointerMove)
      window.removeEventListener('pointerup', handleWindowPointerUp)
    }
  }, [gl, handleWindowPointerMove, onDragEnd])

  const startDrag = useCallback((e: DragEvent) => {
    if (!enabled || !cameraLocked) return

    e.stopPropagation()
    isDragging.current = true
    gl.domElement.style.cursor = 'grabbing'

    // Extract the native PointerEvent from various event types
    let nativeEvent: PointerEvent
    if ('nativeEvent' in e && e.nativeEvent instanceof PointerEvent) {
      // React.PointerEvent or ThreeEvent (both have nativeEvent)
      nativeEvent = e.nativeEvent
    } else if (e instanceof PointerEvent) {
      // Native PointerEvent
      nativeEvent = e
    } else {
      // Fallback - create a minimal event for mouse position
      nativeEvent = e as unknown as PointerEvent
    }

    updateMouseFromEvent(nativeEvent)
    setupDragPlane(nativeEvent.shiftKey || false)

    // Calculate offset from click point to object center
    raycaster.current.setFromCamera(mouse.current, camera)
    const intersection = new THREE.Vector3()
    if (raycaster.current.ray.intersectPlane(dragPlane.current, intersection)) {
      dragOffset.current.copy(intersection).sub(currentPosition.current)
    }

    // Add window-level listeners for smooth dragging
    window.addEventListener('pointermove', handleWindowPointerMove)
    window.addEventListener('pointerup', handleWindowPointerUp)
  }, [enabled, cameraLocked, gl, camera, setupDragPlane, updateMouseFromEvent, handleWindowPointerMove, handleWindowPointerUp])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove)
      window.removeEventListener('pointerup', handleWindowPointerUp)
    }
  }, [handleWindowPointerMove, handleWindowPointerUp])

  return {
    isDragging: isDragging.current,
    startDrag,
    canDrag: enabled && cameraLocked,
  }
}
