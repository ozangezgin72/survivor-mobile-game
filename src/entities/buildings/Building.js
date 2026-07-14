import {
  BUILDING_MAX_LEVEL,
  BUILDING_UPGRADE_DAMAGE_MULTIPLIER,
  BUILDING_UPGRADE_RANGE_MULTIPLIER,
} from '../../config/Constants.js';

let nextBuildingId = 1;

/**
 * Tüm inşa edilebilir yapıların (ArcherTower, Cannon, MissileTower, Wall,
 * ResourceExtractor) ortak base class'ı.
 *
 * Alt sınıflar sadece kendi config değerlerini (health/attackDamage/attackRange/vb.)
 * Constants.js'den okuyup buraya aktarır; sprite oluşturma, hasar alma ve ölme mantığı
 * tek yerde yaşar. Saldırı yeteneği olmayan binalarda (Wall, ResourceExtractor)
 * attackRange varsayılan olarak 0 kalır - CombatSystem bu yüzden onları "saldırgan
 * taraf" olarak değerlendirmez (bkz. CombatSystem.updateBuildingAttacks).
 *
 * Buildings hareket etmediği için Player/Enemy'deki gibi x/y getter+sprite yerine
 * düz property kullanılıyor (yerleştirildikten sonra pozisyonu asla değişmez).
 *
 * Faz 5: level/upgrade() desteği eklendi. `upgradeCost` verilmeyen (0 kalan) binalar
 * (örn. Wall) yükseltilemez - canUpgrade() her zaman false döner. Varsayılan upgrade()
 * attackDamage/attackRange'i çarpar (kuleler için anlamlı); ResourceExtractor kendi
 * upgrade()'ini override ederek gatherMultiplier/effectRadius'u büyütür (bkz. o dosya).
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
    this.maxHealth = config.health;
    this.health = this.maxHealth;

    // Kule alt sınıfları bunları gerçek değerlerle doldurur; Wall/ResourceExtractor 0'da bırakır
    this.attackDamage = config.attackDamage || 0;
    this.attackRange = config.attackRange || 0;
    this.attackSpeed = config.attackSpeed || 0;
    this.splashRadius = config.splashRadius || 0;
    this.lastAttackTime = 0;

    // Sadece Wall true yapar; EnemySpawner/Enemy hareketi bu binaların içinden geçemez
    this.blocksMovement = config.blocksMovement || false;
    this.blockRadius = config.blockRadius || 24;

    // Faz 5: yükseltme. upgradeCost verilmezse (0 kalır) canUpgrade() hep false döner (örn. Wall)
    this.level = 1;
    this.maxLevel = config.maxLevel ?? BUILDING_MAX_LEVEL;
    this.upgradeCost = config.upgradeCost || 0;

    this.sprite = scene.add.sprite(x, y, config.textureKey);
    this.sprite.setDepth(6);
  }

  canUpgrade() {
    return this.isAlive && this.upgradeCost > 0 && this.level < this.maxLevel;
  }

  /**
   * BuildingSystem, oyuncunun kaynağını (resources) düşürdükten SONRA bunu çağırır - yani
   * burada ödeme kontrolü yok, sadece stat iyileştirmesi var. INSTANT_BUILD: çağrıldığı anda
   * uygulanır, bekleme yoktur.
   */
  upgrade() {
    if (!this.canUpgrade()) {
      return false;
    }

    this.level += 1;

    if (this.attackDamage > 0) {
      this.attackDamage = Math.round(this.attackDamage * BUILDING_UPGRADE_DAMAGE_MULTIPLIER);
    }

    if (this.attackRange > 0) {
      this.attackRange = Math.round(this.attackRange * BUILDING_UPGRADE_RANGE_MULTIPLIER);
    }

    this.playUpgradeEffect();

    return true;
  }

  /** Yükseltme anını belli eden kısa bir "büyüyüp küçülme + beyaz flash" efekti */
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

  /** CombatSystem tarafından çağrılır (örn. bir düşman duvara vurunca) */
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
