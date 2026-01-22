# Reef Tank Designer - Development Notes

## Project Overview
A 3D reef aquarium planning tool for designing tank layouts with rocks, corals, fish, lighting, and equipment. Includes a **Simulation Mode** where users can feed, clean, and watch their tank grow over time.

## Tech Stack
- React 18 + TypeScript + Vite
- Three.js via React Three Fiber (@react-three/fiber, @react-three/drei)
- Zustand for state management
- Tailwind CSS for UI

## Important Patterns

### Safari Compatibility
Safari has issues with `export type` statements. Avoid exporting types from files - instead, inline type definitions where needed:
```typescript
// BAD - causes Safari errors
export type { CoralType, PlacedCoral }

// GOOD - inline the type in each file that needs it
type CoralType = 'mushrooms' | 'zoanthids' | 'softCorals' | 'lps' | 'sps' | 'acropora'
```

### Store Pattern
All stores use Zustand and follow this pattern:
- Located in `src/stores/`
- Named `use[Entity]Store`
- Include add, remove, update, select, clearAll actions

### 3D Components
- Container components (e.g., `Rocks.tsx`) map store state to mesh components
- Mesh components (e.g., `RockMesh.tsx`) handle geometry and interaction
- Use `useMemo` for geometry/material creation to prevent recreation

### Scale Convention
- Tank dimensions are in inches in the UI
- 3D scene uses `TANK_SCALE = 0.1` to convert inches to scene units
- Equipment sizes are also in inches and scaled similarly

## File Structure
```
src/
├── components/
│   ├── canvas/     # 3D: Tank, Rocks, RockMesh, Corals, CoralMesh, Fish, FishMesh,
│   │               #      Equipment, EquipmentMesh, Lights, LightFixture, PAROverlay,
│   │               #      SimulationController, FoodParticles, AlgaeOverlay, DayNightLighting
│   └── ui/         # UI: Sidebar, TankControls, RockLibrary, RockControls,
│                   #      CoralLibrary, CoralControls, CoralsOverview, FishLibrary,
│                   #      FishControls, FishCompatibility, EquipmentLibrary,
│                   #      EquipmentControls, LightLibrary, LightControls,
│                   #      LightsOverview, AmbientSound, SaveLoadControls,
│                   #      SimulationPanel, TimeDisplay, DifficultySelector,
│                   #      WaterQualityDisplay, FeedingControls, FishStatus,
│                   #      CoralStatus, CleanupCrewControls
├── data/           # corals.ts, fish.ts, equipment.ts, lights.ts
├── stores/         # tankStore, rockStore, coralStore, fishStore, equipmentStore,
│                   # lightStore, uiStore, simulationStore
└── utils/          # parCalculator.ts, rockBounds.ts, saveLoad.ts
```

## Key Systems

### PAR (Photosynthetically Active Radiation)
- Calculated in `parCalculator.ts`
- Each coral type has min/optimal/max PAR requirements
- PAR status: 'optimal' (green), 'acceptable' (yellow), 'incompatible' (red)
- PAR heatmap overlay shows light distribution

### Coral Placement
- Smart placement snaps corals to rocks in their preferred PAR zone
- Collision detection prevents overlapping corals
- Uses rock surface sampling to find valid positions

### Fish Compatibility
- Defined in `data/fish.ts` per fish type
- Checks: species conflicts, max per tank, min tank size, reef safety
- Report generated in `analyzeTankCompatibility()`

### Save/Load
- localStorage for quick saves
- Export/import as .reef JSON files
- Version 2 includes simulation state

### Simulation Mode (Phase 1 Complete)
Toggle between **Design** and **Simulation** modes via sidebar buttons.

#### Time System by Difficulty
| Difficulty | Day Cycle | Night Cycle | Total Day | Speed |
|------------|-----------|-------------|-----------|-------|
| Beginner | 5 min | 1 min | 6 min | ~240x |
| Intermediate | 15 min | 3 min | 18 min | ~80x |
| Expert | 30 min | 7 min | ~37 min | ~39x |

#### Difficulty Features
- **Beginner**: 4 params, nothing dies (30% min health), 50% slower decay, auto-suggested fixes
- **Intermediate**: 8 params, gradual decline (25% min health), normal rates
- **Expert**: 12 params, realistic mortality, 120% decay rates, equipment can fail

#### Water Parameters
All 12 parameters tracked in `simulationStore`:
- Beginner (4): Temperature, Salinity, pH, Nitrate
- Intermediate (+4): Ammonia, Nitrite, Phosphate, Alkalinity
- Expert (+4): Calcium, Magnesium, Potassium, Strontium

#### Core Components
- `simulationStore.ts`: Time, water quality, feeding, difficulty state
- `SimulationController.tsx`: useFrame tick loop (no visual)
- `SimulationPanel.tsx`: Main UI with play/pause, reset, maintenance
- `TimeDisplay.tsx`: Day/night progress bar
- `DifficultySelector.tsx`: Mode selection with descriptions
- `WaterQualityDisplay.tsx`: Parameter gauges with status colors
- `FeedingControls.tsx`: Manual feeding with amount slider

#### Maintenance Actions
- Water changes (10%, 25%, 50%) - moves params toward ideal
- Glass cleaning - reduces algae by 40%
- Dosing (expert) - adjust individual parameters

## Completed Features
- [x] Tank dimensions and 3D visualization
- [x] Rock placement (7 types including cave, arch)
- [x] Rock bounds clamping
- [x] Lighting system with PAR calculation
- [x] PAR heatmap overlay
- [x] Coral system with 6 types
- [x] PAR-aware coral placement
- [x] Coral collision detection
- [x] Enhanced coral materials (MeshPhysicalMaterial)
- [x] Fish system with 8 types
- [x] Fish swimming animation
- [x] Fish compatibility checker
- [x] Equipment system (pumps, heaters, skimmers, etc.)
- [x] Ambient water sounds
- [x] Save/Load to localStorage and file
- [x] Color pickers for rocks and corals
- [x] **Simulation Mode - Phase 1: Core Infrastructure**
  - [x] Simulation store with time system
  - [x] Design/Simulation mode toggle
  - [x] 3 difficulty levels (beginner/intermediate/expert)
  - [x] Day/night cycle display
  - [x] Water quality parameters and decay
  - [x] Water change and glass cleaning actions
  - [x] Basic feeding system
  - [x] Save/load simulation state

## Simulation Mode - All Phases Complete

### Phase 1: Core Infrastructure
- [x] Simulation store with time system
- [x] Design/Simulation mode toggle
- [x] 3 difficulty levels (beginner/intermediate/expert)
- [x] Day/night cycle display
- [x] Water quality parameters and decay
- [x] Water change and glass cleaning actions
- [x] Basic feeding system
- [x] Save/load simulation state

### Phase 2: Water Quality (Integrated in Phase 1)
- [x] Water parameter decay algorithms
- [x] Bioload from fish affects ammonia/nitrate

### Phase 3: Fish Simulation
- [x] Extended fishStore with hunger, age, health, growthProgress, stressLevel, lastFed
- [x] Fish swim toward food particles when hungry (detection range scales with hunger)
- [x] Hunger/health affects swim speed
- [x] Visual health indicators (colored dots above fish)
- [x] FishStatus.tsx UI showing average stats and alerts

### Phase 4: Feeding System
- [x] FoodParticles.tsx renders 3D food (pellets, flakes, frozen)
- [x] Click water surface to feed at location
- [x] Fish consume food particles when close enough
- [x] FeedingControls.tsx with amount slider

### Phase 5: Coral Simulation
- [x] Extended coralStore with health, growthProgress, colorIntensity, baseScale
- [x] Coral health affected by PAR and water quality
- [x] Growth over time based on conditions
- [x] Bleaching effect (color fades toward white when stressed)
- [x] CoralStatus.tsx UI with health/growth/color metrics

### Phase 6: Algae & Cleanup Crew
- [x] AlgaeOverlay.tsx - patchy green overlay on tank glass based on algaeLevel
- [x] Cleanup crew data (snails, hermit crabs, emerald crabs, cleaner shrimp, sea cucumbers)
- [x] Nocturnal behavior - some crew more active at night
- [x] CleanupCrewControls.tsx UI for adding/managing crew
- [x] Cleanup crew reduces algae over time

### Phase 7: Day/Night Lighting
- [x] DayNightLighting.tsx - smooth transitions between day and night
- [x] Sunrise/sunset color temperature shifts
- [x] Moonlight effect at night (cool blue fill light)
- [x] Lighting affects coral/algae growth rates

## Key Algorithms (Planned)

### Coral Growth Rate
```
baseRate × PARfactor × waterQualityFactor × healthFactor × difficultyMod
```

### Water Decay Rate
```
bioload × baseFactor × (1 - skimmerEfficiency) × difficultyMod
```

### Fish Hunger
```
hunger += hungerRate × deltaSimHours
health -= starvationPenalty when hunger > threshold
swimSpeed = baseSpeed × (1 - hunger × 0.5)
```

### Algae Growth
```
rate = baseRate × nutrientFactor × lightFactor × (1 - cleanupCrewReduction)
```
