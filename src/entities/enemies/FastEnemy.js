import Enemy from '../Enemy.js';
import {
  FAST_ENEMY_HEALTH,
  FAST_ENEMY_MOVE_SPEED,
  FAST_ENEMY_ATTACK_DAMAGE,
  FAST_ENEMY_ATTACK_SPEED,
  FAST_ENEMY_GOLD_DROP_MIN,
  FAST_ENEMY_GOLD_DROP_MAX,
  ENEMY_ATTACK_RANGE,
} from '../../config/Constants.js';
import { LANCER_SPRITE } from '../../utils/EnemySprites.js';

/**
 * Hızlı düşman → Tiny Swords Red Lancer.
 */
export default class FastEnemy extends Enemy {
  static spriteConfig = LANCER_SPRITE;
  static textureKey = LANCER_SPRITE.idleTexture;
  static displayName = 'Hızlı Düşman';

  constructor(scene, x, y) {
    super(scene, x, y, {
      health: FAST_ENEMY_HEALTH,
      moveSpeed: FAST_ENEMY_MOVE_SPEED,
      attackDamage: FAST_ENEMY_ATTACK_DAMAGE,
      attackRange: ENEMY_ATTACK_RANGE,
      attackSpeed: FAST_ENEMY_ATTACK_SPEED,
      goldDropMin: FAST_ENEMY_GOLD_DROP_MIN,
      goldDropMax: FAST_ENEMY_GOLD_DROP_MAX,
    });
  }
}
