import Enemy from '../Enemy.js';
import {
  TANK_ENEMY_HEALTH,
  TANK_ENEMY_MOVE_SPEED,
  TANK_ENEMY_ATTACK_DAMAGE,
  TANK_ENEMY_ATTACK_SPEED,
  TANK_ENEMY_GOLD_DROP_MIN,
  TANK_ENEMY_GOLD_DROP_MAX,
  ENEMY_ATTACK_RANGE,
} from '../../config/Constants.js';

/**
 * Tank düşman: yüksek can, yavaş hız, yüksek hasar. Sadece stat farkı var, davranışı
 * base Enemy'den aynen devralınıyor - "yavaş ama dayanıklı" bir varyant.
 */
export default class TankEnemy extends Enemy {
  static textureKey = 'tank-enemy-placeholder';
  static displayName = 'Tank Düşman';

  constructor(scene, x, y) {
    super(scene, x, y, {
      health: TANK_ENEMY_HEALTH,
      moveSpeed: TANK_ENEMY_MOVE_SPEED,
      attackDamage: TANK_ENEMY_ATTACK_DAMAGE,
      attackRange: ENEMY_ATTACK_RANGE,
      attackSpeed: TANK_ENEMY_ATTACK_SPEED,
      goldDropMin: TANK_ENEMY_GOLD_DROP_MIN,
      goldDropMax: TANK_ENEMY_GOLD_DROP_MAX,
      textureKey: TankEnemy.textureKey,
    });
  }
}
