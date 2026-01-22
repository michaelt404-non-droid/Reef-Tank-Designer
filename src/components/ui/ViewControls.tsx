interface ViewControlsProps {
  onViewChange: (view: string) => void
}

export function ViewControls({ onViewChange }: ViewControlsProps) {
  const views = [
    { id: 'front', label: 'Front', icon: '⬜' },
    { id: 'back', label: 'Back', icon: '⬜' },
    { id: 'left', label: 'Left', icon: '◧' },
    { id: 'right', label: 'Right', icon: '◨' },
    { id: 'top', label: 'Top', icon: '⬒' },
    { id: 'free', label: '360°', icon: '◉' },
  ]

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-gray-800/80 backdrop-blur rounded-lg p-2">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
          title={view.label}
        >
          <span className="mr-1">{view.icon}</span>
          {view.label}
        </button>
      ))}
    </div>
  )
}
