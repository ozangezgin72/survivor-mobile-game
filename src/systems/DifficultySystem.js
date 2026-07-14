import Phaser from 'phaser';
import Enemy from '../entities/Enemy.js';
import FastEnemy from '../entities/enemies/FastEnemy.js';
import TankEnemy from '../entities/enemies/TankEnemy.js';
import RangedEnemy from '../entities/enemies/RangedEnemy.js';
import {
  DIFFICULTY_CHUNK_STAT_BONUS,
  DIFFICULTY_TIME_STAT_BONUS_PER_MINUTE,
  FAST_ENEMY_UNLOCK_CHUNKS,
  TANK_ENEMY_UNLOCK_CHUNKS,
  RANGED_ENEMY_UNLOCK_CHUNKS,
} from '../config/Constants.js';

/**
 * Zorluk artışını yöneten sistem. İki şeyi kontrol eder:
 *
 * 1) Hangi düşman TİPLERİ şu an spawn havuzunda (açılan chunk sayısına bağlı - bkz.
 *    getAvailableEnemyTypes). EnemySpawner, yeni bir düşman oluştururken buradan rastgele
 *    bir tip seçer.
 * 2) Düşmanların health/attackDamage'ının ne kadar ÇARPILACAĞI (chunk sayısı + geçen süreye
 *    bağlı - bkz. getStatMultiplier). EnemySpawner, her yeni düşmanı oluşturduktan sonra
 *    enemy.scaleStats(multiplier) çağırarak bunu uygular.
 *
 * Zaman bazlı ölçekleme, sahnenin başladığı andan (constructor'ın çalıştığı an) itibaren sayılır.
 */
export default class DifficultySystem {
  constructor(scene, fogOfWarSystem) {
    this.scene = scene;
    this.fogOfWarSystem = fogOfWarSystem;
    this.startTime = scene.time.now;
  }

  getUnlockedChunkCount() {
    return this.fogOfWarSystem.chunks.filter((chunk) => chunk.isUnlocked).length;
  }

  getElapsedMinutes() {
    return (this.scene.time.now - this.startTime) / 60000;
  }

  /** health/attackDamage'a uygulanacak birleşik zorluk çarpanı (1 = değişiklik yok) */
  getStatMultiplier() {
    const chunkBonus = this.getUnlockedChunkCount() * DIFFICULTY_CHUNK_STAT_BONUS;
    const timeBonus = this.getElapsedMinutes() * DIFFICULTY_TIME_STAT_BONUS_PER_MINUTE;

    return 1 + chunkBonus + timeBonus;
  }

  /** Açılan chunk sayısına göre şu an havuzda olan düşman class'ları (normal Enemy her zaman dahil) */
  getAvailableEnemyTypes() {
    const chunkCount = this.getUnlockedChunkCount();
    const types = [Enemy];

    if (chunkCount >= FAST_ENEMY_UNLOCK_CHUNKS) {
      types.push(FastEnemy);
    }

    if (chunkCount >= TANK_ENEMY_UNLOCK_CHUNKS) {
      types.push(TankEnemy);
    }

    if (chunkCount >= RANGED_ENEMY_UNLOCK_CHUNKS) {
      types.push(RangedEnemy);
    }

    return types;
  }

  /** EnemySpawner tarafından her yeni düşman spawn edilirken çağrılır */
  pickRandomEnemyType() {
    const types = this.getAvailableEnemyTypes();
    return types[Phaser.Math.Between(0, types.length - 1)];
  }
}
