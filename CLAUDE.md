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

### Memory Leak Prevention (Critical!)
All mesh components MUST dispose geometry and materials on unmount:
```typescript
useEffect(() => {
  return () => {
    geometry.dispose()
    material.dispose()
  }
}, [geometry, material])
```
This pattern is applied to: RockMesh, CoralMesh, FishMesh, EquipmentMesh,
LightFixture, FoodParticles, AlgaeOverlay, CleanupCrewMemberMesh

### Visual Style - Cartoonish/Toon Shading
All meshes use `MeshToonMaterial` for a cohesive cartoonish look:
- **Rocks**: Solid toon material with DoubleSide (no see-through)
- **Fish**: Toon material with vertex colors for patterns (stripes, spots)
- **Corals**: Toon material with slight emissive glow
- **Cleanup Crew**: Toon material with species-specific colors
- **Equipment**: Toon material for consistency

Benefits of toon shading:
- Much faster rendering (no PBR calculations)
- Solid, "full" looking objects (no transmission/translucency)
- Clean, cartoon aesthetic
- Works well on lower-end devices

### Performance Notes
Avoid these expensive effects (cause crashes/jankiness with 3+ objects):
- Post-processing (Bloom, Vignette, ChromaticAberration)
- Materials with `transmission: true` (requires double render)
- MeshPhysicalMaterial with clearcoat, sheen, anisotropy
- Scene fog
- Complex shaders on many objects

Safe performance-friendly enhancements:
- MeshToonMaterial (current style)
- Water surface shader (single plane)
- Environment + ContactShadows from drei

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

### Rock Movement
- Drag on horizontal plane (XZ) for left/right/forward/back movement
- Shift+drag for vertical movement (Y axis)
- Rocks clamped to stay within tank bounds (see `rockBounds.ts`)
- minY accounts for sand bed height (0.12) + rock's halfY

### Coral Placement
- Smart placement snaps corals to rocks in their preferred PAR zone
- Collision detection prevents overlapping corals
- Uses rock surface sampling to find valid positions

### Fish Compatibility
- Defined in `data/fish.ts` per fish type
- Checks: species conflicts, max per tank, min tank size, reef safety
- Report generated in `analyzeTankCompatibility()`

### Fish Behavior System
Fish have realistic swimming behaviors based on their species:

**Swim Zones** - Each fish type prefers a specific depth in the tank:
| Zone | Tank Area | Fish |
|------|-----------|------|
| bottom | 0-25% | Gobies, Blennies |
| lower | 10-45% | Wrasses |
| middle | 30-70% | Clownfish, Angelfish, Cardinalfish |
| upper | 55-90% | Chromis |
| all | 0-100% | Tangs |

**Schooling** - Fish with `schooling: true` (Chromis, Cardinalfish) swim toward their school center when they drift too far (>0.8 units) and wander in smaller radii near the group.

**Pairing** - When exactly 2 Clownfish are in the tank, they pair up and stay within 0.5 units of each other, wandering together.

**Priority System**: Food (when hungry) > Social behavior > Random wandering

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
- [x] Fish swim zones (species-specific depth preferences)
- [x] Fish schooling behavior (Chromis, Cardinalfish)
- [x] Fish pairing behavior (Clownfish mated pairs)
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
- [x] Swim zones - fish stay in species-appropriate depth ranges
- [x] Schooling behavior - Chromis and Cardinalfish school together
- [x] Pairing behavior - Clownfish form mated pairs

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
- [x] Cool white lighting throughout (no color temperature shifts)
- [x] Intensity changes for day/night cycle
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

## Gemini's Updates
- **Switched to GLB Models:** Refactored `FishMesh.tsx` and `CoralMesh.tsx` to stop using procedural geometry and now load external `.glb` models, just like rocks. This resolves the "transparent model" issue and improves visual quality.
- **Updated Data Files:** `src/data/fish.ts` and `src/data/corals.ts` were updated to include a `modelPath` for each entry.
- **Custom Fish Models:** Added a UI feature to the "Fish" library tab to allow users to upload their own `.glb` fish models. This works just like the custom rock import feature.
- **TypeScript Fix:** Resolved a persistent `SyntaxError: Importing binding name 'FishInfo' is not found` by correcting how the `FishInfo` type is exported and imported, ensuring the build process works reliably.
- **Custom Coral Models:** Added ability to upload custom `.glb` coral models (same as fish). Custom models preserve their original textures/materials instead of applying cartoon coloring.
- **Preserve Original Materials:** Custom uploaded GLB files (fish and coral) now keep their original textures instead of having a solid color applied on top.

## Session Notes (Jan 25, 2026 - Session 3)

### Completed This Session:
- **Live Rock Bacterial Filtration**: Rocks now simulate beneficial bacteria populations
  - Rock volume determines bacterial capacity
  - With sufficient rock, ammonia and nitrite stay at/near zero
  - Less rock = slower processing, parameters can build up
  - More realistic nitrogen cycle simulation

- **Dead Organism Ammonia Spikes**: Dead fish and corals now produce ammonia
  - Dead fish produce 0.05 ammonia per sim hour
  - Dead corals produce 0.02 ammonia per sim hour
  - Ammonia continues until dead organism is removed
  - Encourages proper tank maintenance

- **Mobile Scroll/Touch Fixes**: Improved touch controls for mobile devices
  - Added `-webkit-overflow-scrolling: touch` for sidebar scroll
  - Added `touch-action: manipulation` for interactive elements
  - Fixed iOS zoom issue on select inputs (font-size: 16px)
  - Improved dropdown/details element touch handling
  - Custom scrollbar styling for visibility

### Files Modified This Session:
- `src/stores/simulationStore.ts` - bacterial capacity from rocks, dead organism ammonia
- `src/index.css` - mobile scroll and touch improvements
- `src/components/ui/Sidebar.tsx` - scrollable-panel class for touch
- `src/components/ui/WaterQualityDisplay.tsx` - touch-friendly dosing dropdown, parameter tooltips

### Phase 8 Completed:
- **Loading Screen** (`LoadingScreen.tsx`) - animated loading screen with fish icon
- **Onboarding Tutorial** (`OnboardingTutorial.tsx`) - 9-step walkthrough for new users
  - Shows on first visit, stored in localStorage
  - "View Tutorial" button in Tank tab to replay
  - Step-by-step cards with progress indicator
- **Tooltip System** (`Tooltip.tsx`) - reusable tooltip and help icon components
- **Help Tooltips Added**:
  - All 12 water parameters with ideal values and explanations
  - Fish status (health, fullness, calmness)
  - Coral status (health, color vibrancy, growth)

### New Files Created:
- `src/components/ui/Tooltip.tsx` - Tooltip and HelpTooltip components
- `src/components/ui/LoadingScreen.tsx` - LoadingScreen and LoadingSpinner
- `src/components/ui/OnboardingTutorial.tsx` - Tutorial system with ShowTutorialButton

### Key Algorithm - Bacterial Filtration:
```
bacterialCapacity = sum(rock.scale * 10) for all rocks
processingEfficiency = min(1, bacterialCapacity / (fishCount + 1) * 5)
ammoniaConsumption = ammonia * (0.1 + processingEfficiency * 0.9) * simHours
nitriteConsumption = nitrite * (0.08 + processingEfficiency * 0.92) * simHours
```

With enough rock (roughly 1 rock per 2 fish), bacteria fully process ammonia/nitrite to zero.

---

## Session Notes (Jan 25, 2026 - Session 2)

### Completed This Session:
- **Fish Speed**: Reduced fish swim speed by ~50% for more natural movement
- **Removed Caustics**: Removed the caustics shader effect from sand bed
- **Removed Water Volume**: Removed the blue-green water volume overlay
- **Cool White Lighting**: Changed all lighting to cool white (#f5f5ff):
  - DayNightLighting.tsx - removed color temperature shifts
  - LightFixture.tsx - spotlight and LED panel now cool white instead of blue
- **PAR Overlay Auto-Hide**: PAR heatmap automatically hides in simulation mode
- **Fish Schooling Behavior**: Schooling fish (Chromis, Cardinalfish) now swim together
  - Calculate school center and swim toward it when too far (>0.8 units)
  - Wander in smaller radius near school
- **Fish Pairing Behavior**: Clownfish pair up when exactly 2 in tank
  - Stay within 0.5 units of mate
  - Wander together
- **Fish Swim Zones**: Each fish type now has a preferred depth zone
  - bottom (0-25%): Gobies, Blennies
  - lower (10-45%): Wrasses
  - middle (30-70%): Clownfish, Angelfish, Cardinalfish
  - upper (55-90%): Chromis
  - all (0-100%): Tangs
  - Fish spawn in correct zone and stay within it (except when chasing food)

### Files Modified This Session:
- `src/components/canvas/FishMesh.tsx` - speed reduction, schooling, pairing, swim zones
- `src/components/canvas/Tank.tsx` - removed caustics shader, removed water volume
- `src/components/canvas/DayNightLighting.tsx` - cool white lighting only
- `src/components/canvas/LightFixture.tsx` - cool white spotlight/LED
- `src/components/canvas/PAROverlay.tsx` - auto-hide in simulation mode
- `src/data/fish.ts` - added swimZone property to all fish
- `src/stores/fishStore.ts` - spawn fish in correct swim zone

---

## Previous Session Notes (Jan 25, 2026 - Session 1)

### Completed:
- Merged 'powerhead' and 'wavemaker' categories into just 'wavemaker'
- Added equipment scale controls (same as rocks)
- Changed lighting from blue-green tint to white light
- Added custom wavemaker model at `/public/models/equipment/wavemaker.glb`
- Equipment now scales proportionally to tank size
- Equipment stays inside tank bounds (can't go through glass)
- Fixed React hooks error in EquipmentControls (useMemo before early return)
- Removed rock collision for fish (they swim through rocks now)

### Files Modified:
- `src/components/canvas/EquipmentMesh.tsx` - material cloning, bounds
- `src/components/ui/EquipmentControls.tsx` - scale slider, dynamic bounds
- `src/components/ui/EquipmentLibrary.tsx` - wavemaker quick-add
- `src/data/equipment.ts` - merged powerhead into wavemaker
- `src/stores/equipmentStore.ts` - proportional scaling, positioning
- `src/utils/saveLoad.ts` - powerhead migration for old saves

## Future Phases - Deployment & Marketing

### Phase 8: Polish & UX
- [x] Onboarding tutorial / first-time user guide
- [x] Tooltips and help text throughout UI
- [x] Undo/Redo functionality (Ctrl+Z/Ctrl+Y, historyStore)
- [x] Keyboard shortcuts (L=lock camera, WASD=move, Arrows=rotate)
- [x] Better mobile touch controls (scroll, dropdowns, touch-action)
- [x] Loading states and progress indicators
- [ ] Performance optimization for lower-end devices

### Phase 9: Web Deployment
- [ ] Production build optimization
- [ ] PWA (Progressive Web App) setup for offline use
- [ ] Domain and hosting setup
- [ ] SEO optimization
- [ ] Analytics integration
- [ ] Error tracking (Sentry or similar)
- [ ] Social sharing (share tank designs)

### Phase 10: Mobile Apps
- [ ] Capacitor or React Native wrapper
- [ ] iOS App Store submission
- [ ] Google Play Store submission
- [ ] Mobile-specific UI adjustments
- [ ] Touch gesture improvements
- [ ] Push notifications for simulation events

### Phase 11: Monetization & Marketing
- [ ] Freemium model design (free vs premium features)
- [ ] In-app purchases or subscription
- [ ] Payment integration (Stripe)
- [ ] Landing page with features showcase
- [ ] Social media presence
- [ ] YouTube tutorials / demo videos
- [ ] Partnerships with aquarium stores/brands
- [ ] User community / forums

### Phase 12: Advanced Features
- [ ] Cloud save / user accounts
- [ ] Share tank designs publicly
- [ ] Import real equipment specs from manufacturers
- [ ] AR mode (view tank in your space)
- [ ] Cost calculator for equipment/livestock
- [ ] Maintenance schedule reminders
- [ ] Community marketplace for custom models

## Future Improvements / TODO

### GLB Animation Support
Custom uploaded GLB files can contain embedded animations (swim cycles, sway animations, etc.). Currently these are not played. To add support:
1. Use `useAnimations` hook from `@react-three/drei` in `ModelFish` and `ModelCoral` components
2. Detect if the loaded GLB has animations via `gltf.animations`
3. Auto-play the first animation (usually idle/swim loop) for fish
4. For corals, play embedded animation OR fall back to current code-based sway
5. Consider adding UI controls to select which animation to play if multiple exist