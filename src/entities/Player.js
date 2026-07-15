import Phaser from 'phaser';
import {
  PLAYER_SPEED,
  PLAYER_MAX_HEALTH,
  PLAYER_ATTACK_DAMAGE,
  PLAYER_ATTACK_RANGE,
  PLAYER_ATTACK_SPEED,
  PLAYER_KILLS_PER_LEVEL,
  PLAYER_LEVEL_UP_HEALTH_BONUS,
  PLAYER_LEVEL_UP_DAMAGE_BONUS,
  PLAYER_SPEED_PER_LEVEL,
} from '../config/Constants.js';
import { GameEvents } from '../config/Events.js';

/**
 * Karakterin bakış/hareket yönü (pusula yönleri).
 * Şu an sadece son hareket yönünü takip etmek için kullanılıyor; animasyon sistemi
 * eklendiğinde (örn. "walk-down", "walk-up-left" animasyonları) bu değer okunacak.
 */
export const Direction = {
  IDLE: 'idle',
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  UP_LEFT: 'up-left',
  UP_RIGHT: 'up-right',
  DOWN_LEFT: 'down-left',
  DOWN_RIGHT: 'down-right',
};

// atan2 sonucunun (derece, 0-360 normalize edilmiş) 45 derecelik dilimlere bölünmüş hali.
// index sırası: 0=sağ, 45=aşağı-sağ, 90=aşağı, ... (Phaser'da y ekseni aşağı doğru pozitiftir)
const DIRECTION_BY_OCTANT = [
  Direction.RIGHT,
  Direction.DOWN_RIGHT,
  Direction.DOWN,
  Direction.DOWN_LEFT,
  Direction.LEFT,
  Direction.UP_LEFT,
  Direction.UP,
  Direction.UP_RIGHT,
];

/**
 * Oyuncu karakteri.
 *
 * Hareket (Faz 1) + savaş (Faz 2) burada birleşiyor. Gerçek saldırı/hasar mantığı
 * kasıtlı olarak burada değil, CombatSystem'de yönetiliyor; Player sadece kendi
 * state'ini (health, cooldown zamanı) tutuyor ve takeDamage/die ile buna izin veriyor.
 * Faz 5: seviye sistemi (öldürme sayısına bağlı otomatik level-up) de burada yaşıyor.
 */
export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;

    // --- Hareket state'i ---
    this.speed = this.getSpeedForLevel(1);
    this.direction = Direction.IDLE;
    this.isMoving = false;

    // --- Faz 2: Savaş sistemi ---
    this.isAlive = true;
    this.maxHealth = PLAYER_MAX_HEALTH;
    this.health = this.maxHealth;
    this.attackDamage = PLAYER_ATTACK_DAMAGE;
    this.attackRange = PLAYER_ATTACK_RANGE;
    this.attackSpeed = PLAYER_ATTACK_SPEED; // saldırı/saniye
    this.lastAttackTime = 0; // CombatSystem tarafından okunup güncellenir

    // --- Faz 2: Altın (düşman öldürmekten gelir, inşa maliyetlerinde harcanır) ---
    this.gold = 0;

    // --- Faz 3: Kaynak (maden/ağaç node'larından toplanır) - altından ayrı bir para birimi.
    // Şu an için harcanacağı somut bir sistem yok; ileride üst seviye bina/yükseltmelerde
    // kullanılmak üzere şimdiden takip ediliyor.
    this.resources = 0;

    // --- Faz 5: Seviye sistemi - her PLAYER_KILLS_PER_LEVEL öldürmede bir seviye atlanır ---
    this.level = 1;
    this.killCount = 0;
    // TODO(faz-6+): Daha kademeli bir XP eğrisi gerekirse (öldürme başına sabit "1" yerine
    // düşman tipine göre değişen puanlar) bu alan o zaman kullanılabilir.
    this.experience = 0;

    this.sprite = this.createSprite(x, y);

    // Kill sayacı: hangi düşman öldüyse (oyuncu mu kule mi öldürdü ayrımı yapmadan,
    // basitlik için) ENEMY_DIED event'i sayılır. bkz. handleEnemyDied.
    this.handleEnemyDied = this.handleEnemyDied.bind(this);
    this.scene.events.on(GameEvents.ENEMY_DIED, this.handleEnemyDied);
  }

  createSprite(x, y) {
    const sprite = this.scene.physics.add.sprite(x, y, 'player-placeholder');
    sprite.setCollideWorldBounds(true);
    sprite.setDepth(10);

    // Placeholder texture bir daire olduğu için fiziksel gövdeyi de daireye göre ortala
    const radius = sprite.width / 2.4;
    sprite.body.setCircle(radius, sprite.width / 2 - radius, sprite.height / 2 - radius);

    return sprite;
  }

  /**
   * Karakteri verilen yön vektörüne göre sabit hızda hareket ettirir.
   * Vektör normalize edilmemiş olabilir (örn. joystick force'u); burada normalize edilir,
   * bu sayede "hız sabit olsun" gereksinimi joystick ne kadar itilirse itilsin korunur.
   *
   * @param {{x: number, y: number}} moveVector
   */
  move(moveVector) {
    if (!this.isAlive) {
      this.stop();
      return;
    }

    const length = Math.hypot(moveVector.x, moveVector.y);

    if (length < 0.01) {
      this.stop();
      return;
    }

    const normalizedX = moveVector.x / length;
    const normalizedY = moveVector.y / length;

    this.sprite.body.setVelocity(normalizedX * this.speed, normalizedY * this.speed);
    this.isMoving = true;
    this.direction = Player.vectorToDirection(normalizedX, normalizedY);
  }

  /** Karakteri anında durdurur (parmak kaldırıldığında / tuş bırakıldığında çağrılır) */
  stop() {
    this.sprite.body.setVelocity(0, 0);
    this.isMoving = false;
    this.direction = Direction.IDLE;
  }

  /** CombatSystem tarafından çağrılır; düşman hasarını uygular ve HUD'ı bilgilendirir */
  takeDamage(amount) {
    if (!this.isAlive) {
      return;
    }

    this.health = Math.max(0, this.health - amount);
    this.scene.events.emit(GameEvents.PLAYER_HEALTH_CHANGED, this.health, this.maxHealth);

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    if (!this.isAlive) {
      return;
    }

    this.isAlive = false;
    this.stop();
    this.scene.events.emit(GameEvents.PLAYER_DIED);
  }

  /** GoldSystem (düşman öldürme) tarafından çağrılır */
  addGold(amount) {
    this.gold += amount;
    this.scene.events.emit(GameEvents.PLAYER_GOLD_CHANGED, this.gold);
  }

  getPrestigePoints() {
    return this.scene.prestigeSystem?.getTotalPrestigePoints?.() ?? 0;
  }

  /** Altın + prestij toplamı maliyeti karşılıyor mu (bina kurma) */
  canAfford(goldAmount) {
    return this.gold + this.getPrestigePoints() >= goldAmount;
  }

  /** Sadece altın yeterli mi (prestij kullanılmadan) */
  canAffordGoldOnly(goldAmount) {
    return this.gold >= goldAmount;
  }

  /** Altın yetmiyor ama prestij ile tamamlanabilir */
  needsPrestigeForGold(goldAmount) {
    return goldAmount > 0 && !this.canAffordGoldOnly(goldAmount) && this.canAfford(goldAmount);
  }

  /**
   * Önce altından, yetmezse prestijden düşer (bina kurma).
   * Prestij harcanacaksa UI zaten mor uyarı göstermeli (BuildMenu onayı).
   */
  spendGold(amount) {
    if (!this.canAfford(amount)) {
      return false;
    }

    const fromGold = Math.min(this.gold, amount);
    const fromPrestige = amount - fromGold;

    if (fromGold > 0) {
      this.gold -= fromGold;
      this.scene.events.emit(GameEvents.PLAYER_GOLD_CHANGED, this.gold);
    }

    if (fromPrestige > 0) {
      const paid = this.scene.prestigeSystem?.spendPrestigePoints(fromPrestige);
      if (!paid) {
        // Prestij düşüşü başarısızsa altını geri ver (atomik tutarlılık)
        this.gold += fromGold;
        this.scene.events.emit(GameEvents.PLAYER_GOLD_CHANGED, this.gold);
        return false;
      }
    }

    return true;
  }

  /** Chunk açma vb. — prestij kullanılmaz, sadece altın */
  spendGoldOnly(amount) {
    if (!this.canAffordGoldOnly(amount)) {
      return false;
    }

    this.gold -= amount;
    this.scene.events.emit(GameEvents.PLAYER_GOLD_CHANGED, this.gold);
    return true;
  }

  /** ResourceSystem (kaynak node'undan toplama) tarafından çağrılır */
  addResources(amount) {
    this.resources += amount;
    this.scene.events.emit(GameEvents.PLAYER_RESOURCES_CHANGED, this.resources);
  }

  /** Kaynak + prestij toplamı (yükseltme) */
  canAffordResources(amount) {
    return this.resources + this.getPrestigePoints() >= amount;
  }

  canAffordResourcesOnly(amount) {
    return this.resources >= amount;
  }

  needsPrestigeForResources(amount) {
    return amount > 0 && !this.canAffordResourcesOnly(amount) && this.canAffordResources(amount);
  }

  /** Önce kaynak, yetmezse prestij */
  spendResources(amount) {
    if (!this.canAffordResources(amount)) {
      return false;
    }

    const fromResources = Math.min(this.resources, amount);
    const fromPrestige = amount - fromResources;

    if (fromResources > 0) {
      this.resources -= fromResources;
      this.scene.events.emit(GameEvents.PLAYER_RESOURCES_CHANGED, this.resources);
    }

    if (fromPrestige > 0) {
      const paid = this.scene.prestigeSystem?.spendPrestigePoints(fromPrestige);
      if (!paid) {
        this.resources += fromResources;
        this.scene.events.emit(GameEvents.PLAYER_RESOURCES_CHANGED, this.resources);
        return false;
      }
    }

    return true;
  }

  /**
   * Her düşman ölümünde (kim öldürdüğüne bakılmaksızın - oyuncu ya da bir kule) çağrılır.
   * Basitlik için "kimin attığı kurşun öldürdü" ayrımı yapılmıyor; her ölüm oyuncunun
   * ilerlemesine katkı sağlıyor.
   */
  handleEnemyDied() {
    this.killCount += 1;

    if (this.killCount % PLAYER_KILLS_PER_LEVEL === 0) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level += 1;
    this.maxHealth += PLAYER_LEVEL_UP_HEALTH_BONUS;
    this.health = this.maxHealth; // seviye atlamak küçük bir ödül gibi hissettirsin - can da tam dolsun
    this.attackDamage += PLAYER_LEVEL_UP_DAMAGE_BONUS;
    this.speed = this.getSpeedForLevel(this.level);

    this.scene.events.emit(GameEvents.PLAYER_LEVEL_UP, this.level);
    this.scene.events.emit(GameEvents.PLAYER_HEALTH_CHANGED, this.health, this.maxHealth);
  }

  /** Seviyeye göre hareket hızı: her seviye temel hıza +PLAYER_SPEED_PER_LEVEL oranında ekler */
  getSpeedForLevel(level) {
    return Math.round(PLAYER_SPEED * (1 + (level - 1) * PLAYER_SPEED_PER_LEVEL));
  }

  /** Normalize edilmiş bir (x, y) vektörünü 8 yönlü pusula değerine çevirir */
  static vectorToDirection(x, y) {
    if (Math.abs(x) < 0.01 && Math.abs(y) < 0.01) {
      return Direction.IDLE;
    }

    const angleDeg = Phaser.Math.RadToDeg(Math.atan2(y, x));
    const normalizedAngle = (angleDeg + 360) % 360;
    const octantIndex = Math.round(normalizedAngle / 45) % 8;

    return DIRECTION_BY_OCTANT[octantIndex];
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  destroy() {
    this.scene.events.off(GameEvents.ENEMY_DIED, this.handleEnemyDied);
    this.sprite.destroy();
  }
}
