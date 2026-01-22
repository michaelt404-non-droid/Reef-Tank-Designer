# Reef Tank Designer - Project Notes

> **Status**: Phase 3 Complete - Ready for Phase 4 (Coral System)
> **Last Updated**: January 20, 2026

---

## Project Overview

A cross-platform 3D reef tank design application that helps aquarists:
- Design tank layouts with customizable dimensions
- Place and arrange rocks in 3D space
- Simulate lighting PAR values from real light fixtures
- Plan coral placement based on PAR requirements
- Purchase equipment through integrated affiliate links

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **3D Engine**: React Three Fiber (Three.js)
- **State**: Zustand
- **Styling**: TailwindCSS
- **Backend**: Supabase (auth, database, storage) - coming later
- **Payments**: Stripe - coming later
- **Platforms**: Web (PWA) + Desktop (Electron)

---

## Current Progress

### Phase 1: Foundation
- [x] Project initialized with Vite
- [x] React Three Fiber installed
- [x] Basic 3D scene rendering
- [x] Tank renders with custom dimensions
- [x] Orbit controls working (360° view)
- [x] Tank dimension input UI
- [x] Tank presets (10 gal, 40 breeder, etc.)
- [x] Volume calculation

### Phase 2: Rock System
- [x] Procedural rock generation (5 types: boulder, branch, shelf, pillar, rubble)
- [x] Drag-and-drop rock placement with camera lock
- [x] Rock rotation controls (Y rotation + X/Z tilt)
- [x] Rock library panel with add buttons
- [x] Rock selection system
- [x] Height and scale adjustment
- [x] Delete individual rocks / clear all
- [x] **Custom 3D model support** - load .glb rock files

### Phase 3: Lighting & PAR
- [x] Light fixture database (AI, Ecotech, Kessil, Red Sea, budget options)
- [x] PAR calculation algorithm (inverse square law + angle falloff)
- [x] PAR heatmap visualization on tank floor
- [x] Light intensity and height controls
- [x] Light position adjustment (X/Z)
- [x] Multiple light support
- [x] PAR legend showing coral zones

### Phase 4: Coral System (Next)
- [ ] Coral database with PAR requirements
- [ ] Coral placement on rocks
- [ ] PAR compatibility checking

### Phase 5: Backend & Auth
- [ ] Supabase setup
- [ ] User authentication
- [ ] Save/load designs

### Phase 6: Monetization
- [ ] Stripe integration
- [ ] Subscription tiers
- [ ] Affiliate link system

### Phase 7: Cross-Platform
- [ ] PWA configuration
- [ ] Electron desktop build

---

## Your Action Items

### Right Now
**Test the lighting system!** After clearing cache and starting the server:
1. Open http://localhost:5173 in your browser
2. Add a light from the Light Library in the sidebar
3. See the PAR heatmap on the tank floor
4. Adjust intensity, height, and position
5. Add multiple lights to see combined PAR values

### Coming Up (Phase 5 - Backend Setup)
When we reach the backend phase, you'll need to:

1. **Create a Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Save your project URL and anon key

2. **Create a Stripe Account**
   - Go to [stripe.com](https://stripe.com)
   - Set up for test mode initially
   - Save your publishable and secret keys

### Coming Up (Phase 7 - Distribution)
When ready to publish:

1. **Domain Name**
   - Purchase a domain for your app
   - Recommended: something like `reeftankdesigner.com` or `reefplanner.app`

2. **Hosting**
   - Vercel (recommended, free tier available)
   - Or Netlify

3. **App Store Accounts** (if submitting Electron app)
   - Apple Developer ($99/year)
   - Microsoft Store (one-time $19)

---

## Affiliate Programs to Join

When ready to add store links, sign up for these affiliate programs:

| Retailer | Program | Commission |
|----------|---------|------------|
| Bulk Reef Supply | Check their website for affiliate info | ~5-8% |
| Marine Depot | Contact directly | Varies |
| Amazon | Amazon Associates | 1-4% |
| Reef Cleaners | Contact directly | Varies |
| AlgaeBarn | Contact directly | Varies |

---

## Subscription Tiers

### Free Tier
- 5 basic procedural rock shapes
- Tank dimension controls with presets
- 360° view and basic controls
- 1 saved design (when backend added)
- Basic coral placement (limited library)

### Pro Tier ($X/month or $Y one-time)
- **Custom 3D rock model imports** (.glb files)
- **Rock cutting/sculpting tool** (future)
- Full light fixture database with PAR maps
- Full coral library with requirements
- Unlimited saved designs
- Export to shopping list
- Priority support

### Revenue Streams
1. Pro subscriptions
2. Affiliate commissions on store links
3. (Optional) Marketplace for user-created rock packs

---

## Development Commands

```bash
# Start development server
cd ~/gemini-terminal/reef-tank-designer
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Project Structure

```
reef-tank-designer/
├── docs/
│   └── ReefTankDesigner.md     # This file!
├── src/
│   ├── components/
│   │   ├── canvas/             # 3D components
│   │   │   ├── Scene.tsx       # Main 3D scene
│   │   │   ├── Tank.tsx        # Tank 3D model
│   │   │   ├── RockMesh.tsx    # Individual rock with drag
│   │   │   ├── Rocks.tsx       # Rock collection renderer
│   │   │   ├── DragPlane.tsx   # Invisible drag surface
│   │   │   ├── LightFixture.tsx # 3D light fixture model
│   │   │   ├── Lights.tsx      # Light collection renderer
│   │   │   └── PAROverlay.tsx  # PAR heatmap visualization
│   │   └── ui/                 # 2D UI components
│   │       ├── Sidebar.tsx     # Left panel
│   │       ├── TankControls.tsx # Dimension controls
│   │       ├── RockLibrary.tsx # Rock type buttons
│   │       ├── RockControls.tsx # Selected rock editing
│   │       ├── LightLibrary.tsx # Light fixture buttons
│   │       ├── LightControls.tsx # Selected light editing
│   │       └── ViewControls.tsx # Camera view buttons
│   ├── stores/
│   │   ├── tankStore.ts        # Tank state (Zustand)
│   │   ├── rockStore.ts        # Rock placement state
│   │   ├── lightStore.ts       # Light placement state
│   │   └── uiStore.ts          # UI state (camera lock, etc.)
│   ├── data/
│   │   └── lights.ts           # Light fixture database
│   ├── utils/
│   │   └── parCalculator.ts    # PAR calculation algorithm
│   ├── App.tsx                 # Main app component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles + Tailwind
├── package.json
└── vite.config.ts
```

---

## Links & Resources

### Documentation
- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Drei Helpers](https://github.com/pmndrs/drei)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [TailwindCSS](https://tailwindcss.com/docs)

### 3D Assets (for later)
- [Sketchfab](https://sketchfab.com) - 3D models (check licenses)
- [Poly Pizza](https://poly.pizza) - Free low-poly models
- [Blender](https://blender.org) - Create custom rock models

### PAR Data Sources
- BRS PAR testing videos on YouTube
- Reef2Reef PAR threads
- Manufacturer spec sheets

---

## Notes & Ideas

### Future Features (Post-MVP)
- [ ] Flow simulation visualization
- [ ] Temperature zones
- [ ] Equipment placement (pumps, heaters, skimmers)
- [ ] Fish compatibility checker
- [ ] Maintenance schedule reminders
- [ ] Community sharing / gallery
- [ ] AR mode (view tank in your room)
- [ ] Export to shopping list

### Questions to Research
- Best PAR falloff formula for accuracy?
- Standard rock densities for volume calculations?
- Common tank dimensions by manufacturer?

---

## Resume Instructions

When resuming development:

1. **Clear Vite cache and start dev server:**
   ```bash
   cd ~/gemini-terminal/reef-tank-designer
   rm -rf node_modules/.vite && npm run dev
   ```

2. **Open in browser:** http://localhost:5173

3. **Next task:** Phase 4 - Coral System
   - Create coral database with PAR requirements
   - Add coral placement on rocks
   - Implement PAR compatibility checking

### Known Issue: Safari TypeScript Imports

Safari has trouble importing TypeScript interfaces between files. The fix is to **inline type definitions** in each file rather than importing them. This has been applied to:
- `parCalculator.ts` - PlacedLight and LightFixtureData inlined
- `RockMesh.tsx` - Rock types inlined
- `LightFixture.tsx` - Light types inlined

If you see "Importing binding name 'X' is not found" errors, inline the type in that file.

---

## Changelog

### January 20, 2026
- Phase 3 complete: Lighting & PAR system
  - 12 light fixtures (AI, Ecotech, Kessil, Red Sea, budget)
  - PAR calculation with inverse square law
  - PAR heatmap visualization on tank floor
  - Light controls (intensity, height, X/Z position)
  - Multiple light support
- Fixed Safari TypeScript import issues (inlined types)

### January 2026
- Project initialized
- Phase 1 complete: 3D tank with dimension controls
- Orbit controls for 360° viewing
- Tank presets and gallon calculator
- Phase 2 complete: Rock placement system
  - 5 rock types (boulder, branch, shelf, pillar, rubble)
  - Click to select, drag to move (with camera lock)
  - Controls for height, scale, rotation
  - Custom 3D model support (.glb files) for Pro tier
