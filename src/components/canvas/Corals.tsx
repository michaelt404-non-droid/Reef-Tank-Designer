import { useCoralStore } from '../../stores/coralStore'
import { CoralMesh } from './CoralMesh'

export function Corals() {
  const corals = useCoralStore((state) => state.corals)

  return (
    <group>
      {corals.map((coral) => (
        <CoralMesh key={coral.id} coral={coral} />
      ))}
    </group>
  )
}
