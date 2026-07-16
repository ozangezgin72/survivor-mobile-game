import { describe, expect, it } from 'vitest';
import ScoreSystem from './ScoreSystem.js';

function createMockScene({
  level = 1,
  killCount = 0,
  unlockedChunks = 1,
  buildingLevels = [],
  prestigeCount = 0,
} = {}) {
  return {
    player: { level, killCount },
    buildingSystem: {
      buildings: buildingLevels.map((currentPowerLevel) => ({ currentPowerLevel })),
    },
    fogOfWarSystem: {
      chunks: Array.from({ length: unlockedChunks }, () => ({ isUnlocked: true })).concat(
        [{ isUnlocked: false }],
      ),
    },
    prestigeSystem: {
      getTotalPrestigeCount: () => prestigeCount,
    },
  };
}

describe('ScoreSystem.calculateFinalScore', () => {
  it('roundScore formülünü doğru hesaplar', () => {
    const scene = createMockScene({
      level: 2,
      killCount: 10,
      unlockedChunks: 2,
      buildingLevels: [3, 1],
      prestigeCount: 0,
    });

    // 2*100 + 10*5 + 2*200 + (3+1)*50 = 200 + 50 + 400 + 200 = 850
    const { roundScore, prestigeMultiplier, finalScore } = new ScoreSystem(scene).calculateFinalScore();

    expect(roundScore).toBe(850);
    expect(prestigeMultiplier).toBe(1);
    expect(finalScore).toBe(850);
  });

  it('prestij çarpanını doğru uygular (1 + count * 0.5)', () => {
    const scene = createMockScene({
      level: 2,
      killCount: 10,
      unlockedChunks: 2,
      buildingLevels: [3, 1],
      prestigeCount: 2,
    });

    const { roundScore, prestigeMultiplier, finalScore } = new ScoreSystem(scene).calculateFinalScore();

    expect(roundScore).toBe(850);
    expect(prestigeMultiplier).toBe(2);
    expect(finalScore).toBe(1700);
  });

  it('eksik sistemlerde güvenli varsayılanlar kullanır', () => {
    const scene = {
      player: { level: 1, killCount: 0 },
    };

    const result = new ScoreSystem(scene).calculateFinalScore();

    expect(result.roundScore).toBe(100);
    expect(result.prestigeMultiplier).toBe(1);
    expect(result.finalScore).toBe(100);
  });
});
