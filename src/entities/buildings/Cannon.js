import Building from './Building.js';
import {
  CANNON_COST,
  CANNON_HEALTH,
  CANNON_DAMAGE,
  CANNON_RANGE,
  CANNON_ATTACK_SPEED,
  CANNON_SPLASH_RADIUS,
  CANNON_UPGRADE_COST,
} from '../../config/Constants.js';

/** Top: yavaş saldırır ama yüksek hasar verir ve isabet noktasının etrafına alan (splash) hasarı verir. */
export default class Cannon extends Building {
  static id = 'cannon';
  static displayName = 'Top';
  static icon = '💣';
  static cost = CANNON_COST;
  static textureKey = 'cannon-placeholder';

  constructor(scene, x, y) {
    super(scene, x, y, {
      name: Cannon.displayName,
      cost: Cannon.cost,
      health: CANNON_HEALTH,
      attackDamage: CANNON_DAMAGE,
      attackRange: CANNON_RANGE,
      attackSpeed: CANNON_ATTACK_SPEED,
      splashRadius: CANNON_SPLASH_RADIUS,
      textureKey: Cannon.textureKey,
      upgradeCost: CANNON_UPGRADE_COST,
    });
  }
}
