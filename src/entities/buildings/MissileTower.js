import Building from './Building.js';
import {
  MISSILE_TOWER_COST,
  MISSILE_TOWER_HEALTH,
  MISSILE_TOWER_DAMAGE,
  MISSILE_TOWER_RANGE,
  MISSILE_TOWER_ATTACK_SPEED,
  MISSILE_TOWER_UPGRADE_COST,
} from '../../config/Constants.js';

/** Füze kulesi: en yüksek hasar, en yavaş saldırı hızı, en uzun menzil. En pahalı kule. */
export default class MissileTower extends Building {
  static id = 'missile-tower';
  static displayName = 'Füze Kulesi';
  static icon = '🚀';
  static cost = MISSILE_TOWER_COST;
  static textureKey = 'missile-tower';

  constructor(scene, x, y) {
    super(scene, x, y, {
      name: MissileTower.displayName,
      cost: MissileTower.cost,
      health: MISSILE_TOWER_HEALTH,
      attackDamage: MISSILE_TOWER_DAMAGE,
      attackRange: MISSILE_TOWER_RANGE,
      attackSpeed: MISSILE_TOWER_ATTACK_SPEED,
      textureKey: MissileTower.textureKey,
      // Castle.png 320x256 — en büyük / en güçlü kule
      spriteScale: 72 / 256,
      upgradeCost: MISSILE_TOWER_UPGRADE_COST,
    });
  }
}
