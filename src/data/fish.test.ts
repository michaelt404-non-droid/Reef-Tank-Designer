import { describe, it, expect } from 'vitest'
import {
  FISH_INFO,
  checkPairCompatibility,
  analyzeTankCompatibility,
  calculateTankGallons,
} from './fish'

describe('FISH_INFO data', () => {
  it('contains all expected fish types', () => {
    const fishIds = FISH_INFO.map(f => f.id)
    expect(fishIds).toContain('clownfish')
    expect(fishIds).toContain('tang')
    expect(fishIds).toContain('wrasse')
    expect(fishIds).toContain('goby')
    expect(fishIds).toContain('blenny')
    expect(fishIds).toContain('angelfish')
    expect(fishIds).toContain('chromis')
    expect(fishIds).toContain('cardinalfish')
  })

  it('all fish have required properties', () => {
    for (const fish of FISH_INFO) {
      expect(fish.id).toBeDefined()
      expect(fish.name).toBeDefined()
      expect(fish.baseSize).toBeGreaterThan(0)
      expect(fish.swimSpeed).toBeGreaterThan(0)
      expect(fish.colors.length).toBeGreaterThan(0)
      expect(fish.minTankSize).toBeGreaterThan(0)
      expect(fish.maxPerTank).toBeGreaterThan(0)
      expect(typeof fish.reefSafe).not.toBe('undefined')
    }
  })

  it('schooling fish have higher maxPerTank', () => {
    const schoolingFish = FISH_INFO.filter(f => f.schooling)
    for (const fish of schoolingFish) {
      expect(fish.maxPerTank).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('checkPairCompatibility', () => {
  it('returns null for fully compatible pairs', () => {
    // Chromis are compatible with everyone
    const result = checkPairCompatibility('chromis', 'goby')
    expect(result).toBeNull()
  })

  it('detects tang-tang incompatibility', () => {
    const result = checkPairCompatibility('tang', 'tang')
    expect(result).not.toBeNull()
    expect(result?.level).toBe('incompatible')
  })

  it('detects angelfish-angelfish incompatibility', () => {
    const result = checkPairCompatibility('angelfish', 'angelfish')
    expect(result).not.toBeNull()
    expect(result?.level).toBe('incompatible')
  })

  it('detects caution level for clownfish pairs', () => {
    const result = checkPairCompatibility('clownfish', 'clownfish')
    expect(result).not.toBeNull()
    expect(result?.level).toBe('caution')
  })

  it('works in both directions', () => {
    const result1 = checkPairCompatibility('tang', 'angelfish')
    const result2 = checkPairCompatibility('angelfish', 'tang')
    // Both should find the same rule
    expect(result1?.level).toBe(result2?.level)
  })
})

describe('analyzeTankCompatibility', () => {
  it('returns empty issues for compatible fish', () => {
    const fish = [
      { fishType: 'chromis' as const },
      { fishType: 'goby' as const },
    ]
    const report = analyzeTankCompatibility(fish, 50, false)
    expect(report.issues.length).toBe(0)
  })

  it('detects incompatible fish pairs', () => {
    const fish = [
      { fishType: 'tang' as const },
      { fishType: 'tang' as const },
    ]
    const report = analyzeTankCompatibility(fish, 100, false)
    expect(report.issues.length).toBeGreaterThan(0)
    expect(report.issues[0].level).toBe('incompatible')
  })

  it('warns when exceeding max per tank', () => {
    const fish = [
      { fishType: 'clownfish' as const },
      { fishType: 'clownfish' as const },
      { fishType: 'clownfish' as const }, // Max is 2
    ]
    const report = analyzeTankCompatibility(fish, 50, false)
    expect(report.warnings.some(w => w.includes('Too many'))).toBe(true)
  })

  it('warns about tank size requirements', () => {
    const fish = [{ fishType: 'tang' as const }] // Needs 75+ gallons
    const report = analyzeTankCompatibility(fish, 30, false)
    expect(report.warnings.some(w => w.includes('gallon tank'))).toBe(true)
  })

  it('warns about coral-nipping fish', () => {
    const fish = [{ fishType: 'angelfish' as const }] // reefSafe: 'caution'
    const report = analyzeTankCompatibility(fish, 75, true)
    expect(report.coralWarnings.length).toBeGreaterThan(0)
    expect(report.coralWarnings[0]).toContain('nip')
  })

  it('no coral warnings when no corals present', () => {
    const fish = [{ fishType: 'angelfish' as const }]
    const report = analyzeTankCompatibility(fish, 75, false)
    expect(report.coralWarnings.length).toBe(0)
  })

  it('sorts issues by severity (incompatible first)', () => {
    const fish = [
      { fishType: 'tang' as const },
      { fishType: 'tang' as const }, // incompatible
      { fishType: 'clownfish' as const },
      { fishType: 'clownfish' as const }, // caution
    ]
    const report = analyzeTankCompatibility(fish, 100, false)
    if (report.issues.length >= 2) {
      expect(report.issues[0].level).toBe('incompatible')
    }
  })
})

describe('calculateTankGallons', () => {
  it('calculates correct volume for standard tanks', () => {
    // 10 gallon: roughly 20" x 10" x 12"
    const tenGallon = calculateTankGallons({ length: 20, width: 10, height: 12 })
    expect(tenGallon).toBeCloseTo(10, -1) // Within 10 gallons

    // 40 gallon breeder: 36" x 18" x 16"
    const fortyBreeder = calculateTankGallons({ length: 36, width: 18, height: 16 })
    expect(fortyBreeder).toBeCloseTo(45, -1) // 36*18*16/231 ≈ 45
  })

  it('returns integer value', () => {
    const result = calculateTankGallons({ length: 25, width: 15, height: 17 })
    expect(Number.isInteger(result)).toBe(true)
  })
})
