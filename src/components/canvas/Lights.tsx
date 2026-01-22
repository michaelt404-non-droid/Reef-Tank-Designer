import { useLightStore } from '../../stores/lightStore'
import { LightFixtureMesh } from './LightFixture'

export function Lights() {
  const lights = useLightStore((state) => state.lights)

  return (
    <group>
      {lights.map((light) => (
        <LightFixtureMesh key={light.id} light={light} />
      ))}
    </group>
  )
}
