import {
  UPGRADE_EARLY_GROWTH_RATE,
  UPGRADE_EARLY_PHASE_LEVELS,
  UPGRADE_LATE_GROWTH_RATE,
} from '../config/Constants.js';

/**
 * currentLevel → currentLevel+1 yükseltme maliyeti (kaynak).
 *
 * Erken faz (currentLevel < UPGRADE_EARLY_PHASE_LEVELS): baseCost * (1+early)^currentLevel
 * Geç faz: erken fazın son seviyedeki değerinden (1+late)^(currentLevel - earlyLevels) ile devam
 *
 * @param {number} currentLevel - binanın şu anki güç seviyesi
 * @param {number} baseCost - binanın taban yükseltme maliyeti
 * @returns {number}
 */
export function getUpgradeCost(currentLevel, baseCost) {
  if (baseCost <= 0) {
    return 0;
  }

  const level = Math.max(0, currentLevel);
  const earlyFactor = 1 + UPGRADE_EARLY_GROWTH_RATE;
  const lateFactor = 1 + UPGRADE_LATE_GROWTH_RATE;

  let raw;
  if (level < UPGRADE_EARLY_PHASE_LEVELS) {
    raw = baseCost * earlyFactor ** level;
  } else {
    const costAtEarlyEnd = baseCost * earlyFactor ** UPGRADE_EARLY_PHASE_LEVELS;
    raw = costAtEarlyEnd * lateFactor ** (level - UPGRADE_EARLY_PHASE_LEVELS);
  }

  return Math.max(1, Math.round(raw));
}
