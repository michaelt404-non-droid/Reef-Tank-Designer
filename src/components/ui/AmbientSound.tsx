import { useState, useRef, useEffect, useCallback } from 'react'

// Generate procedural water/bubbling sound using Web Audio API
function createWaterSound(audioContext: AudioContext, volume: number): () => void {
  const masterGain = audioContext.createGain()
  masterGain.gain.value = volume * 0.3
  masterGain.connect(audioContext.destination)

  // Create multiple layers for a richer water sound

  // Layer 1: Low frequency rumble (water flow)
  const noise1 = audioContext.createBufferSource()
  const noiseBuffer1 = createNoiseBuffer(audioContext, 2)
  noise1.buffer = noiseBuffer1
  noise1.loop = true

  const lowFilter = audioContext.createBiquadFilter()
  lowFilter.type = 'lowpass'
  lowFilter.frequency.value = 200
  lowFilter.Q.value = 1

  const lowGain = audioContext.createGain()
  lowGain.gain.value = 0.4

  noise1.connect(lowFilter)
  lowFilter.connect(lowGain)
  lowGain.connect(masterGain)
  noise1.start()

  // Layer 2: Mid-frequency water sounds
  const noise2 = audioContext.createBufferSource()
  const noiseBuffer2 = createNoiseBuffer(audioContext, 2)
  noise2.buffer = noiseBuffer2
  noise2.loop = true

  const midFilter = audioContext.createBiquadFilter()
  midFilter.type = 'bandpass'
  midFilter.frequency.value = 800
  midFilter.Q.value = 0.5

  const midGain = audioContext.createGain()
  midGain.gain.value = 0.2

  noise2.connect(midFilter)
  midFilter.connect(midGain)
  midGain.connect(masterGain)
  noise2.start()

  // Layer 3: High-frequency bubbles
  const noise3 = audioContext.createBufferSource()
  const noiseBuffer3 = createNoiseBuffer(audioContext, 2)
  noise3.buffer = noiseBuffer3
  noise3.loop = true

  const highFilter = audioContext.createBiquadFilter()
  highFilter.type = 'highpass'
  highFilter.frequency.value = 2000
  highFilter.Q.value = 1

  const highGain = audioContext.createGain()
  highGain.gain.value = 0.1

  // Add some tremolo to the high frequency for bubble-like effect
  const lfo = audioContext.createOscillator()
  const lfoGain = audioContext.createGain()
  lfo.frequency.value = 3
  lfoGain.gain.value = 0.05

  lfo.connect(lfoGain)
  lfoGain.connect(highGain.gain)
  lfo.start()

  noise3.connect(highFilter)
  highFilter.connect(highGain)
  highGain.connect(masterGain)
  noise3.start()

  // Return cleanup function
  return () => {
    noise1.stop()
    noise2.stop()
    noise3.stop()
    lfo.stop()
    masterGain.disconnect()
  }
}

// Create a buffer of pink noise (more natural sounding than white noise)
function createNoiseBuffer(audioContext: AudioContext, seconds: number): AudioBuffer {
  const sampleRate = audioContext.sampleRate
  const bufferSize = sampleRate * seconds
  const buffer = audioContext.createBuffer(1, bufferSize, sampleRate)
  const data = buffer.getChannelData(0)

  // Pink noise algorithm (more natural water-like sound)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.96900 * b2 + white * 0.1538520
    b3 = 0.86650 * b3 + white * 0.3104856
    b4 = 0.55000 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.0168980
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
    b6 = white * 0.115926
  }

  return buffer
}

export function AmbientSound() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const audioContextRef = useRef<AudioContext | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const startSound = useCallback(() => {
    if (audioContextRef.current) return

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    audioContextRef.current = audioContext

    cleanupRef.current = createWaterSound(audioContext, volume)
    setIsPlaying(true)
  }, [volume])

  const stopSound = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setIsPlaying(false)
  }, [])

  // Update volume when changed
  useEffect(() => {
    if (isPlaying && audioContextRef.current) {
      // Restart with new volume
      stopSound()
      setTimeout(() => {
        if (volume > 0) {
          startSound()
        }
      }, 50)
    }
  }, [volume])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current()
      if (audioContextRef.current) audioContextRef.current.close()
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

      <p className="text-xs text-gray-500 mt-2">
        {isPlaying ? 'Playing water sounds...' : 'Click play for water ambience'}
      </p>
    </div>
  )
}
