import { CHUNK_GRID_COLS, CHUNK_GRID_ROWS } from '../config/Constants.js';
import {
  CHUNK_POWER_STAT_MULTIPLIER_PER_LEVEL,
  CHUNK_POWER_COST_MULTIPLIER_PER_LEVEL,
} from '../config/Constants.js';

/**
 * Merkez chunk koordinatı — FogOfWarSystem.unlockInitialChunk ile aynı formül
 * (Math.floor(GRID / 2)), böylece spawn chunk her zaman güç seviyesi 0 olur.
 */
export function getCenterChunkCoords() {
  return {
    col: Math.floor(CHUNK_GRID_COLS / 2),
    row: Math.floor(CHUNK_GRID_ROWS / 2),
  };
}

/**
 * Chunk'ın merkeze Chebyshev mesafesi = güç seviyesi.
 * Bitişik (ortogonal veya çapraz) chunk'lar mesafe 1, bir dış halka 2, ...
 * Merkez chunk → 0.
 *
 * @param {number} col
 * @param {number} row
 * @returns {number}
 */
export function getChunkPowerLevel(col, row) {
  const center = getCenterChunkCoords();
  const dx = Math.abs(col - center.col);
  const dy = Math.abs(row - center.row);

  return Math.max(dx, dy);
}

/** Bina hasar/can/menzil çarpanı: 1 + powerLevel * STAT_MULT */
export function getChunkStatMultiplier(powerLevel) {
  return 1 + powerLevel * CHUNK_POWER_STAT_MULTIPLIER_PER_LEVEL;
}

/** Bina/chunk maliyet çarpanı: 1 + powerLevel * COST_MULT */
export function getChunkCostMultiplier(powerLevel) {
  return 1 + powerLevel * CHUNK_POWER_COST_MULTIPLIER_PER_LEVEL;
}

/**
 * Power seviyesine göre Tilemap_colorN (1–5).
 * Merkez=1 (canlı yeşil), köşe=5 (uzak ton). 4'ten büyük power → 5.
 */
export function getTerrainColorIndex(powerLevel) {
  const clamped = Math.max(0, Math.min(4, Math.floor(powerLevel)));
  return clamped + 1;
}

export function getTerrainTextureKey(powerLevel) {
  return `terrain-color${getTerrainColorIndex(powerLevel)}`;
}

/**
 * Dünya koordinatından güç seviyesi.
 * @param {{ getChunkAt: (x: number, y: number) => { col: number, row: number } | null } | null} fogOfWarSystem
 */
export function getPowerLevelAt(fogOfWarSystem, x, y) {
  if (!fogOfWarSystem) {
    return 0;
  }

  const chunk = fogOfWarSystem.getChunkAt(x, y);

  if (!chunk) {
    return 0;
  }

  return getChunkPowerLevel(chunk.col, chunk.row);
}
