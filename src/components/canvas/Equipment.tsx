import { useEquipmentStore } from '../../stores/equipmentStore'
import { EquipmentMesh } from './EquipmentMesh'

export function Equipment() {
  const equipment = useEquipmentStore((state) => state.equipment)

  return (
    <>
      {equipment.map((eq) => (
        <EquipmentMesh key={eq.id} equipment={eq} />
      ))}
    </>
  )
}
