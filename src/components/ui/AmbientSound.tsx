import { useState, useRef, useEffect, useCallback } from 'react'

// Available sound options - add more files to public/sounds/ and list them here
const SOUND_OPTIONS = [
  { id: 'water-ambient', label: 'Water Flow', file: '/sounds/water-ambient.mp3' },
  { id: 'bubbles', label: 'Bubbles', file: '/sounds/bubbles.mp3' },
  { id: 'ocean', label: 'Ocean Waves', file: '/sounds/ocean.mp3' },
] as const

type SoundId = typeof SOUND_OPTIONS[number]['id']

export function AmbientSound() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [selectedSound, setSelectedSound] = useState<SoundId>('water-ambient')
  const [loadError, setLoadError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const selectedOption = SOUND_OPTIONS.find(s => s.id === selectedSound) || SOUND_OPTIONS[0]

  const startSound = useCallback(() => {
    setLoadError(null)

    const audio = new Audio(selectedOption.file)
    audio.loop = true
    audio.volume = volume

    audio.onerror = () => {
      setLoadError(`Could not load ${selectedOption.file}`)
      setIsPlaying(false)
    }

    audio.play()
      .then(() => {
        audioRef.current = audio
        setIsPlaying(true)
      })
      .catch((err) => {
        setLoadError(`Playback failed: ${err.message}`)
        setIsPlaying(false)
      })
  }, [selectedOption.file, volume])

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setIsPlaying(false)
  }, [])

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Stop and restart when sound selection changes while playing
  useEffect(() => {
    if (isPlaying) {
      stopSound()
      startSound()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSound])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  const toggleSound = () => {
    if (isPlaying) {
      stopSound()
    } else {
      startSound()
    }
  }

  return (
    <div className="bg-gray-700/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-200">Ambient Sound</h3>
        <button
          onClick={toggleSound}
          className={`p-1.5 rounded transition-colors ${
            isPlaying
              ? 'bg-blue-600 text-white'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
          title={isPlaying ? 'Stop sound' : 'Play water sounds'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* Sound selector */}
      <div className="mb-2">
        <select
          value={selectedSound}
          onChange={(e) => setSelectedSound(e.target.value as SoundId)}
          className="w-full bg-gray-600 text-gray-200 text-xs rounded px-2 py-1.5 border-none focus:ring-1 focus:ring-blue-500"
        >
          {SOUND_OPTIONS.map(option => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="flex-1 h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-xs text-gray-400 w-8 text-right">{Math.round(volume * 100)}%</span>
      </div>

      {loadError ? (
        <p className="text-xs text-red-400 mt-2">{loadError}</p>
      ) : (
        <p className="text-xs text-gray-500 mt-2">
          {isPlaying ? `Playing: ${selectedOption.label}` : 'Select a sound and press play'}
        </p>
      )}
    </div>
  )
}
