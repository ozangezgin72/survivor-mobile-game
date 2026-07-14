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

/**
 * Hızlı düşman: düşük can, yüksek hız, düşük hasar. Sadece stat farkı var, davranışı
 * (chase/wander/attack) base Enemy'den aynen devralınıyor - "hızlı ama zayıf" bir varyant.
 */
export default class FastEnemy extends Enemy {
  static textureKey = 'fast-enemy-placeholder';
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
      textureKey: FastEnemy.textureKey,
    });
  }
}
