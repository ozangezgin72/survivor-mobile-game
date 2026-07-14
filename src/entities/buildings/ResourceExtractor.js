import Building from './Building.js';
import {
  RESOURCE_EXTRACTOR_COST,
  RESOURCE_EXTRACTOR_HEALTH,
  RESOURCE_EXTRACTOR_RADIUS,
  RESOURCE_EXTRACTOR_MULTIPLIER,
  RESOURCE_EXTRACTOR_UPGRADE_COST,
  RESOURCE_EXTRACTOR_UPGRADE_GATHER_MULTIPLIER,
  RESOURCE_EXTRACTOR_UPGRADE_RADIUS_MULTIPLIER,
} from '../../config/Constants.js';

/**
 * Kaynak çıkarma binası: kendisi idle/otomatik üretim yapmaz (bekleme süresi/idle
 * mekanik yok prensibi). Bunun yerine, etkiRadius'u içindeki kaynak node'larına
 * oyuncu gidip TOPLADIĞINDA toplama hızını gatherMultiplier ile çarpar
 * (bkz. ResourceSystem.getGatherMultiplier). Yani hâlâ aktif oynanış gerektirir.
 */
export default class ResourceExtractor extends Building {
  static id = 'resource-extractor';
  static displayName = 'Kaynak Çıkarma';
  static icon = '⛏️';
  static cost = RESOURCE_EXTRACTOR_COST;
  static textureKey = 'resource-extractor-placeholder';

  constructor(scene, x, y) {
    super(scene, x, y, {
      name: ResourceExtractor.displayName,
      cost: ResourceExtractor.cost,
      health: RESOURCE_EXTRACTOR_HEALTH,
      textureKey: ResourceExtractor.textureKey,
      upgradeCost: RESOURCE_EXTRACTOR_UPGRADE_COST,
    });

    this.effectRadius = RESOURCE_EXTRACTOR_RADIUS;
    this.gatherMultiplier = RESOURCE_EXTRACTOR_MULTIPLIER;
  }

  /**
   * attackDamage/attackRange'i yok, bu yüzden base Building.upgrade()'in yaptığı çarpma
   * bu bina için anlamsız - onun yerine gatherMultiplier ve effectRadius'u büyütüyoruz.
   */
  upgrade() {
    if (!this.canUpgrade()) {
      return false;
    }

    this.level += 1;
    this.gatherMultiplier = Math.round(this.gatherMultiplier * RESOURCE_EXTRACTOR_UPGRADE_GATHER_MULTIPLIER * 100) / 100;
    this.effectRadius = Math.round(this.effectRadius * RESOURCE_EXTRACTOR_UPGRADE_RADIUS_MULTIPLIER);

    this.playUpgradeEffect();

    return true;
  }
}
