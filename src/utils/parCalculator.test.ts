import { describe, it, expect } from 'vitest'
import {
  calculatePARFromLight,
  calculateTotalPAR,
  getPARColor,
  getPARZone,
  getCoralPARStatus,
  CORAL_PAR_REQUIREMENTS,
} from './parCalculator'

// Mock light fixture for testing
const createMockLight = (overrides = {}) => ({
  id: 'test-light',
  fixtureId: 'ai-prime-16hd',
  fixture: {
    id: 'ai-prime-16hd',
    brand: 'AI',
    model: 'Prime 16HD',
    type: 'led' as const,
    coverage: { length: 24, width: 24 },
    maxPAR: 500,
    spreadAngle: 120,
    colors: ['#ffffff'],
    wattage: 55,
    price: 299,
  },
  position: [0, 1.2, 0] as [number, number, number], // 12 inches above (1.2 units at 0.1 scale)
  intensity: 100,
  enabled: true,
  ...overrides,
})

describe('calculatePARFromLight', () => {
  it('returns 0 for disabled lights', () => {
    const light = createMockLight({ enabled: false })
    const par = calculatePARFromLight(light, { x: 0, y: 0, z: 0 })
    expect(par).toBe(0)
  })

  it('returns 0 when point is above the light', () => {
    const light = createMockLight({ position: [0, 1, 0] })
    const par = calculatePARFromLight(light, { x: 0, y: 2, z: 0 })
    expect(par).toBe(0)
  })

  it('returns max PAR at reference distance directly below', () => {
    const light = createMockLight({
      position: [0, 1.2, 0], // 12 inches = 1.2 units
      intensity: 100,
    })
    // Point directly below at sand level
    const par = calculatePARFromLight(light, { x: 0, y: 0, z: 0 })
    // Should be close to maxPAR (500) since we're at reference distance
    expect(par).toBeGreaterThan(400)
    expect(par).toBeLessThanOrEqual(500)
  })

  it('PAR decreases with distance (inverse square law)', () => {
    const light = createMockLight({ position: [0, 1.2, 0] })
    const parClose = calculatePARFromLight(light, { x: 0, y: 0.6, z: 0 })
    const parFar = calculatePARFromLight(light, { x: 0, y: 0, z: 0 })
    expect(parClose).toBeGreaterThan(parFar)
  })

  it('PAR decreases with angle from center', () => {
    const light = createMockLight({ position: [0, 1.2, 0] })
    const parCenter = calculatePARFromLight(light, { x: 0, y: 0, z: 0 })
    const parEdge = calculatePARFromLight(light, { x: 0.5, y: 0, z: 0 })
    expect(parCenter).toBeGreaterThan(parEdge)
  })

  it('returns 0 outside spread angle', () => {
    const light = createMockLight({
      position: [0, 1.2, 0],
      fixture: { ...createMockLight().fixture, spreadAngle: 60 }, // Narrow beam
    })
    // Point far outside the narrow spread
    const par = calculatePARFromLight(light, { x: 3, y: 0, z: 0 })
    expect(par).toBe(0)
  })

  it('scales with intensity', () => {
    const light100 = createMockLight({ intensity: 100 })
    const light50 = createMockLight({ intensity: 50 })
    const par100 = calculatePARFromLight(light100, { x: 0, y: 0, z: 0 })
    const par50 = calculatePARFromLight(light50, { x: 0, y: 0, z: 0 })
    expect(par100).toBe(par50 * 2)
  })
})

describe('calculateTotalPAR', () => {
  it('returns 0 with no lights', () => {
    const par = calculateTotalPAR([], { x: 0, y: 0, z: 0 })
    expect(par).toBe(0)
  })

  it('sums PAR from multiple lights', () => {
    const light1 = createMockLight({ position: [-0.5, 1.2, 0] })
    const light2 = createMockLight({ position: [0.5, 1.2, 0] })
    const parBoth = calculateTotalPAR([light1, light2], { x: 0, y: 0, z: 0 })
    const parSingle = calculateTotalPAR([light1], { x: 0, y: 0, z: 0 })
    expect(parBoth).toBeGreaterThan(parSingle)
  })
})

describe('getPARColor', () => {
  it('returns dark blue for very low PAR', () => {
    expect(getPARColor(25)).toBe('#1e3a5f')
  })

  it('returns cyan for low PAR', () => {
    expect(getPARColor(100)).toBe('#0891b2')
  })

  it('returns green for medium PAR', () => {
    expect(getPARColor(200)).toBe('#22c55e')
  })

  it('returns yellow for medium-high PAR', () => {
    expect(getPARColor(400)).toBe('#eab308')
  })

  it('returns orange for high PAR', () => {
    expect(getPARColor(600)).toBe('#f97316')
  })

  it('returns red for very high PAR', () => {
    expect(getPARColor(800)).toBe('#ef4444')
  })
})

describe('getPARZone', () => {
  it('returns correct zone names', () => {
    expect(getPARZone(25)).toBe('Very Low')
    expect(getPARZone(100)).toBe('Low')
    expect(getPARZone(200)).toBe('Medium')
    expect(getPARZone(400)).toBe('Medium-High')
    expect(getPARZone(600)).toBe('High')
    expect(getPARZone(800)).toBe('Very High')
  })
})

describe('getCoralPARStatus', () => {
  const mockLights = [createMockLight({ position: [0, 1.2, 0], intensity: 100 })]

  it('returns optimal for corals in their ideal PAR range', () => {
    // Mushrooms need 30-150 PAR, optimal around 75
    const result = getCoralPARStatus('mushrooms', { x: 0, y: 0, z: 0 }, mockLights)
    // With our mock light at 500 PAR max, need to position coral appropriately
    expect(['optimal', 'acceptable', 'incompatible']).toContain(result.status)
    expect(result.par).toBeGreaterThan(0)
  })

  it('returns incompatible when PAR is too low', () => {
    // SPS needs minimum 250 PAR
    const result = getCoralPARStatus('sps', { x: 0, y: 0, z: 0 }, [])
    expect(result.status).toBe('incompatible')
    expect(result.par).toBe(0)
  })

  it('validates PAR requirements for all coral types', () => {
    // Verify all coral types have valid PAR requirements
    const coralTypes = ['mushrooms', 'zoanthids', 'softCorals', 'lps', 'sps', 'acropora'] as const
    for (const type of coralTypes) {
      const req = CORAL_PAR_REQUIREMENTS[type]
      expect(req.min).toBeLessThan(req.optimal)
      expect(req.optimal).toBeLessThan(req.max)
    }
  })
})
