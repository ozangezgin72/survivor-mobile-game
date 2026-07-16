import { describe, expect, it } from 'vitest';
import { getUpgradeCost } from './UpgradeCost.js';
import {
  UPGRADE_EARLY_GROWTH_RATE,
  UPGRADE_EARLY_PHASE_LEVELS,
  UPGRADE_LATE_GROWTH_RATE,
} from '../config/Constants.js';

const BASE = 100;
const EARLY = 1 + UPGRADE_EARLY_GROWTH_RATE; // 1.28
const LATE = 1 + UPGRADE_LATE_GROWTH_RATE; // 1.09

function expectedCost(level, baseCost = BASE) {
  let raw;
  if (level < UPGRADE_EARLY_PHASE_LEVELS) {
    raw = baseCost * EARLY ** level;
  } else {
    const costAtEarlyEnd = baseCost * EARLY ** UPGRADE_EARLY_PHASE_LEVELS;
    raw = costAtEarlyEnd * LATE ** (level - UPGRADE_EARLY_PHASE_LEVELS);
  }
  return Math.max(1, Math.round(raw));
}

describe('getUpgradeCost', () => {
  it('level 0 returns baseCost', () => {
    expect(getUpgradeCost(0, BASE)).toBe(BASE);
  });

  it('erken fazda her seviye ~%28 artar', () => {
    expect(getUpgradeCost(1, BASE)).toBe(expectedCost(1));
    expect(getUpgradeCost(2, BASE)).toBe(expectedCost(2));
    expect(getUpgradeCost(5, BASE)).toBe(expectedCost(5));
    expect(getUpgradeCost(11, BASE)).toBe(expectedCost(11));

    // Seviye 0→1: round(100 * 1.28) = 128
    expect(getUpgradeCost(1, BASE)).toBe(128);
  });

  it('geç faz eşiğinde (level 12) erken faz sonundan devam eder', () => {
    const atBoundary = getUpgradeCost(UPGRADE_EARLY_PHASE_LEVELS, BASE);
    expect(atBoundary).toBe(expectedCost(12));
    // base * 1.28^12
    expect(atBoundary).toBe(Math.round(BASE * EARLY ** 12));
  });

  it('geç fazda her seviye ~%9 artar', () => {
    const level12 = getUpgradeCost(12, BASE);
    const level13 = getUpgradeCost(13, BASE);
    const level14 = getUpgradeCost(14, BASE);

    expect(level13).toBe(expectedCost(13));
    expect(level14).toBe(expectedCost(14));
    expect(level13).toBe(Math.round(level12 * LATE));
    expect(level14).toBe(Math.round(Math.round(BASE * EARLY ** 12) * LATE ** 2));
  });

  it('baseCost <= 0 ise 0 döner', () => {
    expect(getUpgradeCost(5, 0)).toBe(0);
    expect(getUpgradeCost(5, -10)).toBe(0);
  });
});
