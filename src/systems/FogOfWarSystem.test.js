import { describe, expect, it } from 'vitest';
import { getUnlockCost } from '../utils/UnlockCost.js';
import {
  CHUNK_UNLOCK_BASE_COST,
  CHUNK_UNLOCK_COST_MULTIPLIER,
} from '../config/Constants.js';

/**
 * FogOfWarSystem.getUnlockCost() → UnlockCost.getUnlockCost(unlockedCount)
 * (Phaser bağımlılığı olmadan saf formül test edilir)
 */
describe('FogOfWarSystem.getUnlockCost (UnlockCost)', () => {
  it('ilk ücretli chunk taban maliyeti döner', () => {
    expect(getUnlockCost(0)).toBe(CHUNK_UNLOCK_BASE_COST);
  });

  it('her seferinde ~%20 artar', () => {
    expect(getUnlockCost(0)).toBe(100);
    expect(getUnlockCost(1)).toBe(120);
    expect(getUnlockCost(2)).toBe(144);
    expect(getUnlockCost(3)).toBe(173);
  });

  it('çarpan 1.2 ile uyumludur', () => {
    expect(CHUNK_UNLOCK_COST_MULTIPLIER).toBe(1.2);

    for (let n = 0; n < 8; n += 1) {
      const expected = Math.round(CHUNK_UNLOCK_BASE_COST * CHUNK_UNLOCK_COST_MULTIPLIER ** n);
      expect(getUnlockCost(n)).toBe(expected);
    }
  });
});
