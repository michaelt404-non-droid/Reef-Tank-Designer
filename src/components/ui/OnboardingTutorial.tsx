import { useState, useEffect } from 'react'

interface TutorialStep {
  id: string
  title: string
  description: string
  target?: string // CSS selector for highlight (optional)
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Reef Tank Designer!',
    description: 'This tool helps you plan and visualize your perfect reef aquarium. Let\'s take a quick tour of the main features.',
    position: 'center',
  },
  {
    id: 'sidebar',
    title: 'Sidebar Controls',
    description: 'Use the sidebar on the left to switch between different categories: Tank size, Rocks, Lights, Corals, Fish, and Equipment. Each tab has controls for adding and customizing items.',
    position: 'top-right',
  },
  {
    id: 'tank',
    title: 'Tank Setup',
    description: 'Start by setting your tank dimensions in the Tank tab. Choose from preset sizes or customize length, width, and height. The volume is calculated automatically.',
    position: 'top-right',
  },
  {
    id: 'rocks',
    title: 'Adding Rocks',
    description: 'In the Rocks tab, click any rock type to add it to your tank. You can drag rocks to reposition them. Use WASD keys to move and Arrow keys to rotate when a rock is selected.',
    position: 'top-right',
  },
  {
    id: 'camera',
    title: 'Camera Controls',
    description: 'Click and drag to rotate the view. Scroll to zoom in/out. Press L to lock the camera when you want to position objects without accidentally moving the view.',
    position: 'center',
  },
  {
    id: 'lights',
    title: 'Lighting & PAR',
    description: 'Add lights from the Lights tab. The PAR (light intensity) heatmap helps you place corals in their ideal lighting zones - different coral types need different light levels.',
    position: 'top-right',
  },
  {
    id: 'simulation',
    title: 'Simulation Mode',
    description: 'Switch to Simulate mode to watch your tank come alive! Feed your fish, manage water quality, and watch your corals grow over time. Choose from Beginner, Intermediate, or Expert difficulty.',
    position: 'top-right',
  },
  {
    id: 'save',
    title: 'Save Your Work',
    description: 'Your tank is auto-saved, but you can also export it as a .reef file to share or backup. Find Save/Load options in the Tank tab.',
    position: 'top-right',
  },
  {
    id: 'done',
    title: 'You\'re Ready!',
    description: 'That\'s the basics! Explore the different tabs and start building your dream reef tank. You can view this tutorial again from the Tank tab. Happy reefing!',
    position: 'center',
  },
]

const STORAGE_KEY = 'reef-tank-tutorial-completed'

export function OnboardingTutorial() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if user has seen the tutorial
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) {
      // Small delay to let the app render first
      const timer = setTimeout(() => setIsOpen(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTutorial()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    completeTutorial()
  }

  const completeTutorial = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsOpen(false)
    setCurrentStep(0)
  }

  const step = TUTORIAL_STEPS[currentStep]

  // Function to restart tutorial (can be called from outside)
  const restartTutorial = () => {
    setCurrentStep(0)
    setIsOpen(true)
  }

  // Expose restart function globally for the help button
  useEffect(() => {
    (window as unknown as { restartTutorial: () => void }).restartTutorial = restartTutorial
    return () => {
      delete (window as unknown as { restartTutorial?: () => void }).restartTutorial
    }
  }, [])

  if (!isOpen) return null

  const getPositionClasses = () => {
    switch (step.position) {
      case 'top-left':
        return 'top-20 left-96'
      case 'top-right':
        return 'top-20 right-8'
      case 'bottom-left':
        return 'bottom-20 left-96'
      case 'bottom-right':
        return 'bottom-20 right-8'
      case 'center':
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={handleSkip} />

      {/* Tutorial card */}
      <div
        className={`fixed z-50 ${getPositionClasses()} w-96 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden`}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step counter */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-gray-500">
              Step {currentStep + 1} of {TUTORIAL_STEPS.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Skip tutorial
            </button>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>

          {/* Description */}
          <p className="text-gray-300 text-sm leading-relaxed mb-6">{step.description}</p>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex gap-1">
              {TUTORIAL_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentStep ? 'bg-cyan-400' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// Button to show tutorial again
export function ShowTutorialButton() {
  const handleClick = () => {
    const win = window as unknown as { restartTutorial?: () => void }
    if (win.restartTutorial) {
      win.restartTutorial()
    }
  }

  return (
    <button
      onClick={handleClick}
      className="text-xs text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      View Tutorial
    </button>
  )
}
