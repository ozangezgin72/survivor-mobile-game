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

  /** Oyuncuya en yakın, yükseltilebilir (canUpgrade()=true) binayı bulur - UpgradePrompt bunu okur */
  findNearestUpgradeableBuilding() {
    let nearest = null;
    let nearestDistance = BUILDING_UPGRADE_PROMPT_DISTANCE;

    for (const building of this.buildings) {
      if (!building.canUpgrade()) {
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

    if (!building) {
      return false;
    }

    const paid = this.player.spendResources(building.upgradeCost);

    if (!paid) {
      return false;
    }

    building.upgrade();
    this.scene.events.emit(GameEvents.BUILDING_UPGRADED, building);

    return true;
  }

  /** @param {typeof import('../entities/buildings/Building.js').default} BuildingClass */
  canAfford(BuildingClass) {
    return this.player.canAfford(BuildingClass.cost);
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

    const paid = this.player.spendGold(BuildingClass.cost);

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
   * Kayıttan bina geri yükler: altın harcamaz, isteğe bağlı seviye/can uygular.
   * @param {typeof import('../entities/buildings/Building.js').default} BuildingClass
   * @param {{ health?: number, upgradeLevel?: number }} [options]
   */
  restoreBuilding(BuildingClass, x, y, options = {}) {
    const building = new BuildingClass(this.scene, x, y);
    const targetLevel = options.upgradeLevel ?? 1;

    while (building.level < targetLevel && building.canUpgrade()) {
      building.upgrade();
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
