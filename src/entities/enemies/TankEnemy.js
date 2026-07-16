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
import { WARRIOR_SPRITE } from '../../utils/EnemySprites.js';

/**
 * Tank düşman → Tiny Swords Red Warrior.
 */
export default class TankEnemy extends Enemy {
  static spriteConfig = WARRIOR_SPRITE;
  static textureKey = WARRIOR_SPRITE.idleTexture;
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
    });
  }
}
