import { useState, useEffect } from 'react'

interface LoadingScreenProps {
  isLoading: boolean
  progress?: number // 0-100
  message?: string
}

export function LoadingScreen({ isLoading, progress, message = 'Loading...' }: LoadingScreenProps) {
  const [visible, setVisible] = useState(isLoading)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (!isLoading && visible) {
      // Start fade out
      setFadeOut(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setFadeOut(false)
      }, 500)
      return () => clearTimeout(timer)
    } else if (isLoading && !visible) {
      setVisible(true)
    }
  }, [isLoading, visible])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Logo / Title */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-cyan-400 mb-2">Reef Tank Designer</h1>
        <p className="text-gray-400">Plan your perfect reef aquarium</p>
      </div>

      {/* Loading animation - animated fish */}
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-cyan-400 animate-pulse"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" opacity="0" />
            <path d="M12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" className="animate-spin origin-center" style={{ animationDuration: '2s' }} />
          </svg>
        </div>
        {/* Swimming fish animation */}
        <div className="absolute inset-0">
          <div className="animate-bounce" style={{ animationDuration: '1.5s' }}>
            <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <ellipse cx="12" cy="12" rx="8" ry="5" />
              <polygon points="20,12 24,8 24,16" />
              <circle cx="7" cy="11" r="1.5" fill="#1a1a2e" />
            </svg>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="w-64 mb-4">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">{Math.round(progress)}%</p>
        </div>
      )}

      {/* Message */}
      <p className="text-gray-400 text-sm">{message}</p>

      {/* Animated dots */}
      <div className="flex gap-1 mt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

// Inline loading spinner for smaller areas
export function LoadingSpinner({ size = 'md', message }: { size?: 'sm' | 'md' | 'lg'; message?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4">
      <svg
        className={`${sizeClasses[size]} text-cyan-400 animate-spin`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {message && <p className="text-xs text-gray-400">{message}</p>}
    </div>
  )
}
