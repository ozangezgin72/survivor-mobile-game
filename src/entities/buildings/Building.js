import { getChunkStatMultiplier, getChunkCostMultiplier, getPowerLevelAt } from '../../utils/ChunkPower.js';

let nextBuildingId = 1;

/**
 * Tüm inşa edilebilir yapıların ortak base class'ı.
 *
 * Chunk gücü: kurulduğu (veya yükseltildiği) power seviyesine göre health/attackDamage/
 * attackRange = base * (1 + currentPowerLevel * STAT_MULT). Yükseltme, currentPowerLevel'ı
 * +1 artırıp statları base'den yeniden hesaplar; tavan = açılmış chunk'ların max gücü.
 */
export default class Building {
  constructor(scene, x, y, config) {
    this.scene = scene;
    this.id = nextBuildingId++;

    this.x = x;
    this.y = y;

    this.name = config.name;
    this.cost = config.cost;

    this.isAlive = true;

    // Ölçeklenmemiş taban statlar — upgrade/power değişiminde buradan yeniden hesaplanır
    this.baseMaxHealth = config.health;
    this.baseAttackDamage = config.attackDamage || 0;
    this.baseAttackRange = config.attackRange || 0;

    this.attackSpeed = config.attackSpeed || 0;
    this.splashRadius = config.splashRadius || 0;
    this.lastAttackTime = 0;

    this.blocksMovement = config.blocksMovement || false;
    this.blockRadius = config.blockRadius || 24;

    // Taban yükseltme maliyeti (kaynak); 0 = yükseltilemez (örn. Wall)
    this.baseUpgradeCost = config.upgradeCost || 0;

    this.currentPowerLevel = config.powerLevel ?? Building.resolvePowerLevel(scene, x, y);
    // Eski kod uyumu
    this.powerLevel = this.currentPowerLevel;
    this.level = this.currentPowerLevel;

    this.applyChunkPowerScaling({ fillHealth: true });

    this.sprite = scene.add.sprite(x, y, config.textureKey);
    this.sprite.setDepth(6);
  }

  static resolvePowerLevel(scene, x, y) {
    return getPowerLevelAt(scene.fogOfWarSystem, x, y);
  }

  /**
   * currentPowerLevel'a göre health / attackDamage / attackRange'i base'den hesaplar.
   * @param {{ fillHealth?: boolean }} [options]
   */
  applyChunkPowerScaling(options = {}) {
    const fillHealth = options.fillHealth === true;
    const previousMax = this.maxHealth || this.baseMaxHealth;
    const healthRatio = previousMax > 0 && this.health != null ? this.health / previousMax : 1;
    const multiplier = getChunkStatMultiplier(this.currentPowerLevel);

    this.maxHealth = Math.max(1, Math.round(this.baseMaxHealth * multiplier));
    this.health = fillHealth ? this.maxHealth : Math.max(1, Math.round(this.maxHealth * healthRatio));

    this.attackDamage =
      this.baseAttackDamage > 0 ? Math.max(1, Math.round(this.baseAttackDamage * multiplier)) : 0;
    this.attackRange =
      this.baseAttackRange > 0 ? Math.max(1, Math.round(this.baseAttackRange * multiplier)) : 0;

    this.powerLevel = this.currentPowerLevel;
    this.level = this.currentPowerLevel;
    this.onPowerLevelApplied(multiplier);
  }

  /** Alt sınıflar (örn. ResourceExtractor) ekstra statları burada ölçekler */
  onPowerLevelApplied(_multiplier) {}

  /** Bir sonraki power seviyesine yükseltme maliyeti (kaynak) */
  getNextUpgradeCost() {
    if (this.baseUpgradeCost <= 0) {
      return 0;
    }

    return Math.max(1, Math.round(this.baseUpgradeCost * getChunkCostMultiplier(this.currentPowerLevel + 1)));
  }

  /** @deprecated getNextUpgradeCost kullan; UpgradePrompt uyumu için */
  get upgradeCost() {
    return this.getNextUpgradeCost();
  }

  /**
   * @param {number} maxUnlockedPowerLevel - FogOfWarSystem.getMaxUnlockedPowerLevel()
   */
  canUpgrade(maxUnlockedPowerLevel) {
    if (maxUnlockedPowerLevel === undefined) {
      maxUnlockedPowerLevel = this.scene.fogOfWarSystem?.getMaxUnlockedPowerLevel?.() ?? 0;
    }

    return this.isAlive && this.baseUpgradeCost > 0 && this.currentPowerLevel < maxUnlockedPowerLevel;
  }

  /** Kayıt yükleme vb. için tavan kontrolü olmadan güç seviyesi ayarla */
  setPowerLevel(powerLevel, options = {}) {
    this.currentPowerLevel = Math.max(0, powerLevel);
    this.applyChunkPowerScaling({ fillHealth: options.fillHealth === true });
  }

  /**
   * BuildingSystem ödeme yaptıktan sonra çağırır. currentPowerLevel += 1, statlar base'den yenilenir.
   */
  upgrade() {
    const maxUnlocked = this.scene.fogOfWarSystem?.getMaxUnlockedPowerLevel?.() ?? 0;

    if (!this.canUpgrade(maxUnlocked)) {
      return false;
    }

    this.currentPowerLevel += 1;
    this.applyChunkPowerScaling({ fillHealth: false });
    this.playUpgradeEffect();

    return true;
  }

  playUpgradeEffect() {
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.25,
      scaleY: this.sprite.scaleY * 1.25,
      duration: 150,
      yoyo: true,
      ease: 'Cubic.easeOut',
    });

    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.clearTint();
      }
    });
  }

  takeDamage(amount) {
    if (!this.isAlive) {
      return;
    }

    this.health = Math.max(0, this.health - amount);

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    if (!this.isAlive) {
      return;
    }

    this.isAlive = false;

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: this.sprite.scaleX * 0.6,
      scaleY: this.sprite.scaleY * 0.6,
      duration: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => this.sprite.destroy(),
    });
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
