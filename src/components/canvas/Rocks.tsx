import { useRockStore } from '../../stores/rockStore'
import { RockMesh } from './RockMesh'

export function Rocks() {
  const rocks = useRockStore((state) => state.rocks)

  return (
    <group>
      {rocks.map((rock) => (
        <RockMesh key={rock.id} rock={rock} />
      ))}
    </group>
  )
}
