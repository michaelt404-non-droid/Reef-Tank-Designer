import { Scene } from './components/canvas/Scene'
import { Sidebar } from './components/ui/Sidebar'

function App() {
  return (
    <div className="flex h-screen w-screen">
      <Sidebar />
      <main className="flex-1 relative">
        <Scene />
      </main>
    </div>
  )
}

export default App
