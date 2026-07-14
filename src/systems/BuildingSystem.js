import Phaser from 'phaser';
import ResourceExtractor from '../entities/buildings/ResourceExtractor.js';
import { GameEvents } from '../config/Events.js';
import {
  MIN_BUILDING_SPACING,
  BUILD_PLACEMENT_MIN_DISTANCE_FROM_PLAYER,
  BUILDING_UPGRADE_PROMPT_DISTANCE,
  WORLD_WIDTH,
  WORLD_HEIGHT,
} from '../config/Constants.js';
import { getChunkCostMultiplier, getPowerLevelAt } from '../utils/ChunkPower.js';

/**
 * Yerleştirilmiş tüm binaların (kule/duvar/kaynak çıkarma) yaşam döngüsünü ve
 * yerleştirme kurallarını yönetir.
 *
 * INSTANT_BUILD prensibiyle çalışır: placeBuilding() çağrıldığı anda -eğer geçerliyse-
 * altın düşülür ve bina anında sahneye eklenir; hiçbir bekleme/inşaat süresi yoktur.
 *
 * NOT (Faz 4): fogOfWarSystem constructor'da DEĞİL, MainScene tarafından oluşturulduktan
 * sonra dışarıdan atanıyor (this.buildingSystem.fogOfWarSystem = ...). Bunun sebebi:
 * ResourceSystem -> FogOfWarSystem -> (ilk chunk'ı doldurmak için) ResourceSystem, ve
 * BuildingSystem -> FogOfWarSystem bağımlılıkları dairesel bir kurulum sırası yaratıyor;
 * gecikmeli atama bu döngüyü kırmanın en basit yolu.
 *
 * Chunk gücü: yerleştirme konumuna göre maliyet artar; bina statları Building constructor'da
 * aynı powerLevel ile ölçeklenir.
 */
export default class BuildingSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.buildings = [];
    this.fogOfWarSystem = null;
    this.nearestUpgradeableBuilding = null;
  }

  update() {
    this.buildings = this.buildings.filter((building) => building.isAlive);
    this.nearestUpgradeableBuilding = this.findNearestUpgradeableBuilding();
  }

  /** Oyuncuya en yakın, güç yükseltmesi yapılabilir (veya max'ta) bina — UpgradePrompt okur */
  findNearestUpgradeableBuilding() {
    let nearest = null;
    let nearestDistance = BUILDING_UPGRADE_PROMPT_DISTANCE;

    for (const building of this.buildings) {
      if (!building.isAlive || building.baseUpgradeCost <= 0) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, building.x, building.y);

      if (distance <= nearestDistance) {
        nearest = building;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  /** UpgradePrompt tarafından çağrılır. @returns {boolean} yükseltme başarılı oldu mu */
  tryUpgradeNearestBuilding() {
    const building = this.nearestUpgradeableBuilding;
    const maxPower = this.fogOfWarSystem?.getMaxUnlockedPowerLevel?.() ?? 0;

    if (!building || !building.canUpgrade(maxPower)) {
      return false;
    }

    const cost = building.getNextUpgradeCost();
    const paid = this.player.spendResources(cost);

    if (!paid) {
      return false;
    }

    building.upgrade();
    this.scene.events.emit(GameEvents.BUILDING_UPGRADED, building);

    return true;
  }

  getPowerLevelAt(x, y) {
    return getPowerLevelAt(this.fogOfWarSystem, x, y);
  }

  /**
   * Chunk gücüne göre dinamik bina maliyeti.
   * finalCost = baseCost * (1 + powerLevel * CHUNK_POWER_COST_MULTIPLIER_PER_LEVEL)
   */
  getBuildingCostAt(BuildingClass, x, y) {
    const powerLevel = this.getPowerLevelAt(x, y);
    const multiplier = getChunkCostMultiplier(powerLevel);

    return Math.max(1, Math.round(BuildingClass.cost * multiplier));
  }

  /**
   * @param {typeof import('../entities/buildings/Building.js').default} BuildingClass
   * @param {number} [x] - verilmezse oyuncu konumu (menü fiyatı için)
   * @param {number} [y]
   */
  canAfford(BuildingClass, x = this.player.x, y = this.player.y) {
    return this.player.canAfford(this.getBuildingCostAt(BuildingClass, x, y));
  }

  /** Bu dünya koordinatına yerleştirme geçerli mi? (dünya dışı / sisli / oyuncuya çok yakın / bina üstüne bina) */
  isValidPlacement(x, y) {
    if (x < 0 || x > WORLD_WIDTH || y < 0 || y > WORLD_HEIGHT) {
      return false;
    }

    if (this.fogOfWarSystem && !this.fogOfWarSystem.isPositionUnlocked(x, y)) {
      return false; // sis içine / henüz açılmamış bölgeye bina koyulamaz
    }

    const distanceToPlayer = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);

    if (distanceToPlayer < BUILD_PLACEMENT_MIN_DISTANCE_FROM_PLAYER) {
      return false;
    }

    return !this.buildings.some(
      (building) => building.isAlive && Phaser.Math.Distance.Between(x, y, building.x, building.y) < MIN_BUILDING_SPACING,
    );
  }

  /**
   * @param {typeof import('../entities/buildings/Building.js').default} BuildingClass
   * @returns {boolean} yerleştirme başarılı oldu mu (geçersiz konum veya yetersiz altında false döner)
   */
  placeBuilding(BuildingClass, x, y) {
    if (!this.isValidPlacement(x, y)) {
      return false;
    }

    const cost = this.getBuildingCostAt(BuildingClass, x, y);
    const paid = this.player.spendGold(cost);

    if (!paid) {
      return false;
    }

    const building = new BuildingClass(this.scene, x, y);
    this.buildings.push(building);
    this.playPlacementEffect(building);
    this.scene.events.emit(GameEvents.BUILDING_PLACED, building);

    return true;
  }

  /**
   * Kayıttan bina geri yükler: altın harcamaz; currentPowerLevel konum gücünden yüksekse ayarlanır.
   * @param {typeof import('../entities/buildings/Building.js').default} BuildingClass
   * @param {{ health?: number, currentPowerLevel?: number, upgradeLevel?: number }} [options]
   */
  restoreBuilding(BuildingClass, x, y, options = {}) {
    const building = new BuildingClass(this.scene, x, y);
    const targetPower = options.currentPowerLevel ?? options.upgradeLevel ?? building.currentPowerLevel;

    if (targetPower !== building.currentPowerLevel) {
      building.setPowerLevel(targetPower, { fillHealth: true });
    }

    if (typeof options.health === 'number') {
      building.health = Math.min(Math.max(0, options.health), building.maxHealth);
      if (building.health <= 0) {
        building.destroy();
        return null;
      }
    }

    this.buildings.push(building);
    return building;
  }

  /** INSTANT_BUILD: bekleme yok ama tamamen sessiz belirmesin diye çok kısa bir "pop" efekti */
  playPlacementEffect(building) {
    building.sprite.setScale(0);
    this.scene.tweens.add({
      targets: building.sprite,
      scale: 1,
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  getTowers() {
    return this.buildings.filter((building) => building.isAlive && building.attackRange > 0);
  }

  getWalls() {
    return this.buildings.filter((building) => building.isAlive && building.blocksMovement);
  }

  getResourceExtractors() {
    return this.buildings.filter((building) => building.isAlive && building instanceof ResourceExtractor);
  }

  destroy() {
    for (const building of this.buildings) {
      building.destroy();
    }
    this.buildings = [];
  }
}
