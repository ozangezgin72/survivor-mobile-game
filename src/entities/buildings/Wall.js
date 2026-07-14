import Building from './Building.js';
import { WALL_COST, WALL_HEALTH, WALL_BLOCK_RADIUS } from '../../config/Constants.js';

/**
 * Duvar: saldırmaz, sadece düşmanların geçişini engeller (basit çember blocking,
 * bkz. Enemy.moveToward). Yüksek health'i vardır; yolunu tıkayan bir duvara denk
 * gelen düşmanlar onu kırmaya çalışır (bkz. CombatSystem.resolveEnemyAttackTarget).
 */
export default class Wall extends Building {
  static id = 'wall';
  static displayName = 'Duvar';
  static icon = '🧱';
  static cost = WALL_COST;
  static textureKey = 'wall-placeholder';

  constructor(scene, x, y) {
    super(scene, x, y, {
      name: Wall.displayName,
      cost: Wall.cost,
      health: WALL_HEALTH,
      blocksMovement: true,
      blockRadius: WALL_BLOCK_RADIUS,
      textureKey: Wall.textureKey,
    });
  }
}
