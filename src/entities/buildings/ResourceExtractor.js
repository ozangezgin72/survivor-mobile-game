import Building from './Building.js';
import {
  RESOURCE_EXTRACTOR_COST,
  RESOURCE_EXTRACTOR_HEALTH,
  RESOURCE_EXTRACTOR_RADIUS,
  RESOURCE_EXTRACTOR_MULTIPLIER,
  RESOURCE_EXTRACTOR_UPGRADE_COST,
} from '../../config/Constants.js';
import { getChunkStatMultiplier } from '../../utils/ChunkPower.js';

/**
 * Kaynak çıkarma binası: idle üretim yok; yakındaki node'lardan toplama hızını artırır.
 * Chunk gücü yükseldikçe health + gatherMultiplier + effectRadius ölçeklenir.
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

    this.baseEffectRadius = RESOURCE_EXTRACTOR_RADIUS;
    this.baseGatherMultiplier = RESOURCE_EXTRACTOR_MULTIPLIER;
    this.onPowerLevelApplied(getChunkStatMultiplier(this.currentPowerLevel));
  }

  onPowerLevelApplied(multiplier) {
    if (this.baseEffectRadius == null || this.baseGatherMultiplier == null) {
      return;
    }

    this.effectRadius = Math.max(1, Math.round(this.baseEffectRadius * multiplier));
    this.gatherMultiplier = Math.round(this.baseGatherMultiplier * multiplier * 100) / 100;
  }
}
