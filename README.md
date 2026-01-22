# Reef Tank Designer

A 3D reef aquarium planning tool built with React, TypeScript, Three.js, and React Three Fiber.

## Features

### Tank Setup
- Adjustable tank dimensions (length, width, height in inches)
- 3D glass tank visualization with water effect

### Rock System
- 7 procedural rock types: Boulder, Branch, Shelf, Pillar, Rubble, Cave, Arch
- Drag-and-drop positioning (lock camera first)
- Scale, rotation, and color controls
- Rocks are constrained within tank bounds

### Lighting System
- Multiple light fixture presets (AI Hydra, Radion, Kessil, etc.)
- PAR (Photosynthetically Active Radiation) calculation
- PAR heatmap overlay visualization
- Light positioning and intensity controls

### Coral System
- 6 coral categories: Mushrooms, Zoanthids, Soft Corals, LPS, SPS, Acropora
- PAR-aware smart placement (snaps to rocks in preferred light zones)
- Collision detection to prevent overlapping
- Procedural geometry with physical materials (subsurface scattering)
- PAR status indicators (optimal/acceptable/incompatible)

### Fish System
- 8 fish types: Clownfish, Tang, Wrasse, Goby, Blenny, Angelfish, Chromis, Cardinalfish
- Animated swimming behavior with AI-driven movement
- Fish compatibility checker with warnings for:
  - Incompatible species combinations
  - Overcrowding (max per tank limits)
  - Tank size requirements
  - Coral safety (reef-safe warnings)

### Equipment System
- Pumps (return pumps)
- Heaters (100W, 200W, 300W)
- Protein skimmers (nano, medium, large)
- Powerheads and wavemakers
- Auto top-off (ATO) systems
- Sump equipment visibility toggle

### Audio
- Ambient water sounds (procedurally generated)
- Volume control

### Save/Load
- Save designs to browser localStorage
- Export/import as .reef JSON files
- Multiple save slots

## Tech Stack

- **React 18** with TypeScript
- **Three.js** via React Three Fiber
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Vite** for build tooling

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── canvas/          # 3D components (Tank, Rocks, Corals, Fish, etc.)
│   └── ui/              # UI panels (Sidebar, Controls, Libraries)
├── data/                # Static data (corals, fish, equipment, lights)
├── stores/              # Zustand state stores
└── utils/               # Utilities (PAR calculator, bounds, save/load)
```

## Key Files

- `src/stores/` - State management for rocks, corals, fish, lights, equipment
- `src/utils/parCalculator.ts` - PAR calculation and coral compatibility
- `src/utils/saveLoad.ts` - Save/load functionality
- `src/data/fish.ts` - Fish data with compatibility rules
- `src/data/equipment.ts` - Equipment definitions
