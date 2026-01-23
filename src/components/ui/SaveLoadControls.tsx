import { useState, useRef } from 'react'
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  deleteFromLocalStorage,
  getLocalStorageSaves,
  exportToFile,
  importFromFile,
} from '../../utils/saveLoad'

// Helper to get saves list
function getSavesList(): Record<string, { name: string; timestamp: number }> {
  const allSaves = getLocalStorageSaves()
  const savesList: Record<string, { name: string; timestamp: number }> = {}
  for (const [name, data] of Object.entries(allSaves)) {
    savesList[name] = { name: data.name, timestamp: data.timestamp }
  }
  return savesList
}

export function SaveLoadControls() {
  // Initialize saves from localStorage directly
  const [saves, setSaves] = useState<Record<string, { name: string; timestamp: number }>>(getSavesList)
  const [saveName, setSaveName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refreshSaves = () => {
    setSaves(getSavesList())
  }

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSave = () => {
    if (!saveName.trim()) {
      showMessage('Please enter a name', 'error')
      return
    }
    const success = saveToLocalStorage(saveName.trim())
    if (success) {
      showMessage('Saved!', 'success')
      setSaveName('')
      setShowSaveInput(false)
      refreshSaves()
    } else {
      showMessage('Failed to save', 'error')
    }
  }

  const handleLoad = (name: string) => {
    const success = loadFromLocalStorage(name)
    if (success) {
      showMessage('Loaded!', 'success')
    } else {
      showMessage('Failed to load', 'error')
    }
  }

  const handleDelete = (name: string) => {
    if (confirm(`Delete "${name}"?`)) {
      deleteFromLocalStorage(name)
      refreshSaves()
      showMessage('Deleted', 'success')
    }
  }

  const handleExport = (name: string) => {
    exportToFile(name)
    showMessage('Exported!', 'success')
  }

  const handleExportCurrent = () => {
    const name = saveName.trim() || `reef-tank-${Date.now()}`
    exportToFile(name)
    showMessage('Exported!', 'success')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const success = await importFromFile(file)
    if (success) {
      showMessage('Imported!', 'success')
    } else {
      showMessage('Failed to import', 'error')
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const saveNames = Object.keys(saves)

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-emerald-400">Save / Load</h2>

      {/* Message */}
      {message && (
        <div
          className={`px-3 py-2 rounded text-sm ${
            message.type === 'success'
              ? 'bg-green-900/50 text-green-300'
              : 'bg-red-900/50 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Save Section */}
      {showSaveInput ? (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Save name..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveInput(false)
                setSaveName('')
              }}
              className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowSaveInput(true)}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm"
        >
          Save Design
        </button>
      )}

      {/* Saved Designs List */}
      {saveNames.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-xs text-gray-500 uppercase">Saved Designs</h3>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {saveNames.map((name) => (
              <div
                key={name}
                className="flex items-center gap-1 p-2 bg-gray-700/50 rounded text-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate">{name}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(saves[name].timestamp)}
                  </div>
                </div>
                <button
                  onClick={() => handleLoad(name)}
                  className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs"
                  title="Load"
                >
                  Load
                </button>
                <button
                  onClick={() => handleExport(name)}
                  className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs"
                  title="Export"
                >
                  Export
                </button>
                <button
                  onClick={() => handleDelete(name)}
                  className="px-2 py-1 bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded text-xs"
                  title="Delete"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import/Export */}
      <div className="flex gap-2">
        <button
          onClick={handleExportCurrent}
          className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
        >
          Export to File
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
        >
          Import File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".reef,.json"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      <p className="text-xs text-gray-500">
        Saves are stored in your browser. Export to keep a backup file.
      </p>
    </div>
  )
}
