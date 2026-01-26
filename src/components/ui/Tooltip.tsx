import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export function Tooltip({ content, children, position = 'top', delay = 300 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = position === 'top' ? rect.top : rect.bottom
        setCoords({ x, y })
      }
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return {
          left: coords.x,
          top: coords.y - 8,
          transform: 'translate(-50%, -100%)',
        }
      case 'bottom':
        return {
          left: coords.x,
          top: coords.y + 8,
          transform: 'translate(-50%, 0)',
        }
      case 'left':
        return {
          left: coords.x - 8,
          top: coords.y,
          transform: 'translate(-100%, -50%)',
        }
      case 'right':
        return {
          left: coords.x + 8,
          top: coords.y,
          transform: 'translate(0, -50%)',
        }
    }
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onTouchStart={showTooltip}
        onTouchEnd={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div
          className="fixed z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg pointer-events-none max-w-xs"
          style={getPositionStyles()}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' :
              position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' :
              position === 'left' ? 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2' :
              'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </>
  )
}

// Help icon with tooltip
interface HelpTooltipProps {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function HelpTooltip({ content, position = 'top' }: HelpTooltipProps) {
  return (
    <Tooltip content={content} position={position}>
      <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] text-gray-400 bg-gray-700 rounded-full cursor-help hover:bg-gray-600 hover:text-gray-300 transition-colors">
        ?
      </span>
    </Tooltip>
  )
}
