import { useFishStore } from '../../stores/fishStore'
import { FishMesh } from './FishMesh'

export function Fish() {
  const fish = useFishStore((state) => state.fish)

  return (
    <group>
      {fish.map((f) => (
        <FishMesh key={f.id} fish={f} />
      ))}
    </group>
  )
}
