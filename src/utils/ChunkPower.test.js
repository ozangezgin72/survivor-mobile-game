import { describe, expect, it } from 'vitest';
import { getChunkPowerLevel, getCenterChunkCoords } from './ChunkPower.js';
import { CHUNK_GRID_COLS, CHUNK_GRID_ROWS } from '../config/Constants.js';

describe('getChunkPowerLevel', () => {
  it('merkez chunk power 0 verir', () => {
    const { col, row } = getCenterChunkCoords();
    expect(col).toBe(Math.floor(CHUNK_GRID_COLS / 2));
    expect(row).toBe(Math.floor(CHUNK_GRID_ROWS / 2));
    expect(getChunkPowerLevel(col, row)).toBe(0);
  });

  it('merkeze bitişik chunk power 1 verir', () => {
    const { col, row } = getCenterChunkCoords();
    expect(getChunkPowerLevel(col + 1, row)).toBe(1);
    expect(getChunkPowerLevel(col, row - 1)).toBe(1);
    expect(getChunkPowerLevel(col + 1, row + 1)).toBe(1);
  });

  it('köşe chunk\'lar simetrik (eşit) power verir', () => {
    const lastCol = CHUNK_GRID_COLS - 1;
    const lastRow = CHUNK_GRID_ROWS - 1;

    const corners = [
      getChunkPowerLevel(0, 0),
      getChunkPowerLevel(lastCol, 0),
      getChunkPowerLevel(0, lastRow),
      getChunkPowerLevel(lastCol, lastRow),
    ];

    expect(new Set(corners).size).toBe(1);
    // 9x9 merkez (4,4) → köşe Chebyshev = 4
    expect(corners[0]).toBe(4);
  });
});
