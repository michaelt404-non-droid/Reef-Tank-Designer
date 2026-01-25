import { useSimulationStore } from '../../stores/simulationStore'
import { CleanupCrewMemberMesh } from './CleanupCrewMemberMesh'

export function CleanupCrew() {
  const cleanupCrew = useSimulationStore((state) => state.cleanupCrew)

  return (
    <group>
      {cleanupCrew.map((member) => (
        <CleanupCrewMemberMesh key={member.id} member={member} />
      ))}
    </group>
  )
}
