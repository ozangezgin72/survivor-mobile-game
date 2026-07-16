import Building from './Building.js';
import {
  ARCHER_TOWER_COST,
  ARCHER_TOWER_HEALTH,
  ARCHER_TOWER_DAMAGE,
  ARCHER_TOWER_RANGE,
  ARCHER_TOWER_ATTACK_SPEED,
  ARCHER_TOWER_UPGRADE_COST,
} from '../../config/Constants.js';

/** Okçu kulesi: düşük hasar ama hızlı saldırı, orta-uzun menzil. En ucuz kule. */
export default class ArcherTower extends Building {
  // BuildMenu bu static alanları okuyup butonları/yerleştirmeyi generic şekilde kurar
  static id = 'archer-tower';
  static displayName = 'Okçu Kulesi';
  static icon = '🏹';
  static cost = ARCHER_TOWER_COST;
  static textureKey = 'archer-tower';

  constructor(scene, x, y) {
    super(scene, x, y, {
      name: ArcherTower.displayName,
      cost: ArcherTower.cost,
      health: ARCHER_TOWER_HEALTH,
      attackDamage: ARCHER_TOWER_DAMAGE,
      attackRange: ARCHER_TOWER_RANGE,
      attackSpeed: ARCHER_TOWER_ATTACK_SPEED,
      textureKey: ArcherTower.textureKey,
      // Tower.png 128x256 → görsel ~56px yükseklik
      spriteScale: 56 / 256,
      upgradeCost: ARCHER_TOWER_UPGRADE_COST,
    });
  }
}
