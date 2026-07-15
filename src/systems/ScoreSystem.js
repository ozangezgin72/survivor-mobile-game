/**
 * Mevcut oyun durumundan Final Skor hesaplar (leaderboard için hazırlık).
 * Bu adımda skor kaydedilmez / gönderilmez — sadece hesaplanır.
 */
export default class ScoreSystem {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * @param {Phaser.Scene} [scene]
   * @returns {{ roundScore: number, prestigeMultiplier: number, finalScore: number }}
   */
  calculateFinalScore(scene = this.scene) {
    const player = scene.player;
    const buildings = scene.buildingSystem?.buildings ?? [];
    const chunks = scene.fogOfWarSystem?.chunks ?? [];

    const unlockedChunkCount = chunks.filter((chunk) => chunk.isUnlocked).length;
    const buildingPowerSum = buildings.reduce(
      (sum, building) => sum + (building.currentPowerLevel ?? 0),
      0,
    );

    const roundScore =
      (player?.level ?? 1) * 100 +
      (player?.killCount ?? 0) * 5 +
      unlockedChunkCount * 200 +
      buildingPowerSum * 50;

    const prestigeCount = scene.prestigeSystem?.getTotalPrestigeCount?.() ?? 0;
    const prestigeMultiplier = 1 + prestigeCount * 0.5;
    const finalScore = Math.round(roundScore * prestigeMultiplier);

    return { roundScore, prestigeMultiplier, finalScore };
  }
}
