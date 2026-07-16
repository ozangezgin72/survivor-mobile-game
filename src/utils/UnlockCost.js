import {
  CHUNK_UNLOCK_BASE_COST,
  CHUNK_UNLOCK_COST_MULTIPLIER,
} from '../config/Constants.js';

/**
 * Ücretli açılmış chunk sayısına göre sıradaki unlock maliyeti.
 * Her ücretli açılışta bir öncekinin %20 fazlası (CHUNK_UNLOCK_COST_MULTIPLIER).
 *
 * FogOfWarSystem.getUnlockCost() bu formülü kullanır.
 *
 * @param {number} unlockedCount - şimdiye kadar ücretli açılan chunk sayısı
 * @returns {number}
 */
export function getUnlockCost(unlockedCount) {
  return Math.round(CHUNK_UNLOCK_BASE_COST * CHUNK_UNLOCK_COST_MULTIPLIER ** unlockedCount);
}
