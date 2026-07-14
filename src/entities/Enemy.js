import Phaser from 'phaser';
import { GameEvents } from '../config/Events.js';
import {
  ENEMY_MAX_HEALTH,
  ENEMY_MOVE_SPEED,
  ENEMY_ATTACK_DAMAGE,
  ENEMY_ATTACK_RANGE,
  ENEMY_ATTACK_SPEED,
  ENEMY_GOLD_DROP_MIN,
  ENEMY_GOLD_DROP_MAX,
  ENEMY_CHASE_RANGE,
  ENEMY_WANDER_RADIUS,
  ENEMY_WANDER_SPEED_FACTOR,
  ENEMY_COLLISION_RADIUS,
  WORLD_WIDTH,
  WORLD_HEIGHT,
} from '../config/Constants.js';

/**
 * Düşmanın şu anki davranış durumu. Saldırı hasarı CombatSystem'de uygulanıyor;
 * bu state sadece hareket/animasyon amaçlı (ileride "attack" animasyonu bu değere bakacak).
 */
export const EnemyState = {
  IDLE: 'idle',
  WANDER: 'wander',
  CHASE: 'chase',
  ATTACK: 'attack',
};

/**
 * Düşman karakteri (base class).
 *
 * Basit bir davranış makinesi ile çalışır:
 * - Oyuncu ENEMY_CHASE_RANGE dışındaysa spawn noktası etrafında rastgele gezinir (wander)
 * - Menzil içindeyken ne yapılacağı updateCombatMovement()'ta kararlaştırılır (varsayılan:
 *   attackRange'e girince dur, değilse yaklaş) - bkz. Faz 5 notu
 * - Faz 3: yolu bir Wall tarafından kesiliyorsa hareketi durur ve `blockedBy` set edilir;
 *   CombatSystem bunu görüp önce duvarı kırmaya çalışır (basit blocking, pathfinding yok)
 *
 * Faz 5: src/entities/enemies/ klasöründeki FastEnemy/TankEnemy/RangedEnemy gibi alt tipler
 * bu class'ı extend eder. İki genişletme noktası var:
 *   1) constructor'a farklı bir `config` (health/moveSpeed/attackDamage/vb.) geçirmek - stat
 *      farklılıkları için yeterli (bkz. FastEnemy/TankEnemy)
 *   2) updateCombatMovement()'ı override etmek - davranış farklılıkları için (bkz. RangedEnemy,
 *      oyuncu çok yaklaşınca geri çekilir/kiting yapar)
 * Ayrıca DifficultySystem, spawn anında scaleStats() çağırarak chunk/zaman bazlı zorluk
 * artışını (health/attackDamage çarpanı) tüm alt tiplere ortak şekilde uygular.
 *
 * Performans notu: Enemy bilerek Arcade Physics body kullanmıyor (basit x/y güncellemesi
 * yeterli); menzil kontrolleri de fizik "overlap" değil, düz mesafe (distance) hesabı ile
 * yapılıyor. Bu, çok sayıda düşman için çok daha hafif.
 */
export default class Enemy {
  static textureKey = 'enemy-placeholder';
  static displayName = 'Düşman';

  constructor(scene, x, y, config = {}) {
    this.scene = scene;

    this.spawnX = x;
    this.spawnY = y;

    this.isAlive = true;
    this.maxHealth = config.health ?? ENEMY_MAX_HEALTH;
    this.health = this.maxHealth;
    this.moveSpeed = config.moveSpeed ?? ENEMY_MOVE_SPEED;
    this.attackDamage = config.attackDamage ?? ENEMY_ATTACK_DAMAGE;
    this.attackRange = config.attackRange ?? ENEMY_ATTACK_RANGE;
    this.attackSpeed = config.attackSpeed ?? ENEMY_ATTACK_SPEED; // saldırı/saniye
    // scaleStats() bunları baz alır; böylece zorluk çarpanı tekrar uygulanınca
    // (chunk açılınca / süre ilerleyince) üst üste çarpılmaz, base * multiplier olur.
    this.baseMaxHealth = this.maxHealth;
    this.baseAttackDamage = this.attackDamage;
    this.difficultyMultiplier = 1;
    this.goldDrop = Phaser.Math.Between(
      config.goldDropMin ?? ENEMY_GOLD_DROP_MIN,
      config.goldDropMax ?? ENEMY_GOLD_DROP_MAX,
    );

    this.lastAttackTime = 0; // CombatSystem tarafından okunup güncellenir
    this.state = EnemyState.IDLE;

    this.wanderTargetX = x;
    this.wanderTargetY = y;
    this.nextWanderDecisionTime = 0;

    // Faz 3: yolunu tıkayan bir duvara denk gelince (bkz. moveToward) burada tutulur;
    // CombatSystem bunu görüp önce duvara saldırmayı dener
    this.blockedBy = null;

    this.sprite = this.createSprite(x, y, config.textureKey ?? this.constructor.textureKey);
  }

  createSprite(x, y, textureKey) {
    // Bilerek fizik sprite'ı değil, düz sprite kullanılıyor (bkz. dosya üstü performans notu)
    const sprite = this.scene.add.sprite(x, y, textureKey);
    sprite.setDepth(9);
    return sprite;
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  /**
   * @param {number} time - this.scene.time.now
   * @param {number} delta - son frame'den geçen ms
   * @param {import('./Player.js').default} player
   * @param {import('./buildings/Building.js').default[]} [blockers] - blocksMovement=true olan binalar (Wall)
   */
  update(time, delta, player, blockers) {
    if (!this.isAlive) {
      return;
    }

    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (distanceToPlayer <= ENEMY_CHASE_RANGE) {
      this.updateCombatMovement(distanceToPlayer, player, delta, blockers);
    } else {
      this.state = EnemyState.WANDER;
      this.blockedBy = null;
      this.wander(time, delta, blockers);
    }
  }

  /**
   * Oyuncu kovalama menzili içindeyken ne yapılacağını belirler. Varsayılan davranış:
   * attackRange'e girince dur (CombatSystem hasar mantığını yönetir), değilse yaklaş.
   * Alt sınıflar (örn. RangedEnemy) farklı bir yaklaşma/kaçınma davranışı için bunu override eder.
   */
  updateCombatMovement(distanceToPlayer, player, delta, blockers) {
    if (distanceToPlayer <= this.attackRange) {
      this.state = EnemyState.ATTACK;
      this.blockedBy = null;
    } else {
      this.moveToward(player.x, player.y, this.moveSpeed, delta, blockers);
      // moveToward sırasında bir duvara denk gelmiş olabilir; öyleyse "attack" say
      // (CombatSystem duvara saldırmayı deneyecek)
      this.state = this.blockedBy ? EnemyState.ATTACK : EnemyState.CHASE;
    }
  }

  moveToward(targetX, targetY, speed, delta, blockers) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.moveAtAngle(angle, speed, delta, blockers);
  }

  /** RangedEnemy gibi mesafe koruyan (kiting) tipler için: verilen noktadan uzaklaşan hareket */
  moveAway(awayFromX, awayFromY, speed, delta, blockers) {
    const angle = Phaser.Math.Angle.Between(awayFromX, awayFromY, this.x, this.y);
    this.moveAtAngle(angle, speed, delta, blockers);
  }

  /** moveToward/moveAway'in paylaştığı ortak hareket: blocker kontrolü + dünya sınırı clamp'i */
  moveAtAngle(angle, speed, delta, blockers) {
    const distance = (speed * delta) / 1000;

    let newX = this.sprite.x + Math.cos(angle) * distance;
    let newY = this.sprite.y + Math.sin(angle) * distance;

    const blocker = this.findBlockingBuilding(newX, newY, blockers);

    if (blocker) {
      // Duvara girmeye çalışıyor: hareketi durdur, saldırı hedefi olarak işaretle
      this.blockedBy = blocker;
      newX = this.sprite.x;
      newY = this.sprite.y;
    } else {
      this.blockedBy = null;
    }

    // Dünya sınırlarının dışına gezinerek/kovalayarak çıkmasını önle (kenara yakın spawn'lar için)
    this.sprite.x = Phaser.Math.Clamp(newX, 0, WORLD_WIDTH);
    this.sprite.y = Phaser.Math.Clamp(newY, 0, WORLD_HEIGHT);

    // Gerçek animasyon gelene kadar basit bir yön göstergesi: sprite'ı hareket açısına döndür
    this.sprite.rotation = angle;
  }

  /** Verilen konuma hareket etmek, blocksMovement=true olan bir binaya çarpar mı? */
  findBlockingBuilding(x, y, blockers) {
    if (!blockers || blockers.length === 0) {
      return null;
    }

    for (const building of blockers) {
      if (!building.isAlive) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(x, y, building.x, building.y);

      if (distance < building.blockRadius + ENEMY_COLLISION_RADIUS) {
        return building;
      }
    }

    return null;
  }

  /** Menzil dışındayken spawn noktası etrafında rastgele, robotik olmayan bir gezinme */
  wander(time, delta, blockers) {
    if (time >= this.nextWanderDecisionTime) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const radius = Phaser.Math.FloatBetween(0, ENEMY_WANDER_RADIUS);

      this.wanderTargetX = this.spawnX + Math.cos(angle) * radius;
      this.wanderTargetY = this.spawnY + Math.sin(angle) * radius;

      // Bir süre gezinip bir süre duracak - tamamen sürekli hareket robotik görünür
      this.nextWanderDecisionTime = time + Phaser.Math.Between(1500, 3500);
    }

    const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.wanderTargetX, this.wanderTargetY);

    if (distanceToTarget > 4) {
      this.moveToward(this.wanderTargetX, this.wanderTargetY, this.moveSpeed * ENEMY_WANDER_SPEED_FACTOR, delta, blockers);
    } else {
      this.blockedBy = null;
    }
  }

  /**
   * Faz 5: DifficultySystem çarpanını uygular (spawn anında + canlı düşmanlara yeniden).
   * multiplier=1.3 => base health/attackDamage %30 artar. Base değerler üzerinden hesaplanır;
   * aynı düşmana tekrar çağrılınca üst üste çarpılmaz (idempotent).
   */
  scaleStats(multiplier) {
    const previousMaxHealth = this.maxHealth;
    const healthRatio = previousMaxHealth > 0 ? this.health / previousMaxHealth : 1;

    this.difficultyMultiplier = multiplier;
    this.maxHealth = Math.max(1, Math.round(this.baseMaxHealth * multiplier));
    this.health = Math.max(1, Math.round(this.maxHealth * healthRatio));
    this.attackDamage = Math.max(1, Math.round(this.baseAttackDamage * multiplier));
  }

  /** CombatSystem tarafından çağrılır */
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

    // GoldSystem bu event'i dinleyip aynı noktada altın spawn ediyor; Player de kill sayacını
    // artırıyor (bkz. Player.handleEnemyDied). Enemy, bunların hiçbirinin varlığından
    // haberdar değil (decoupled).
    this.scene.events.emit(GameEvents.ENEMY_DIED, { x: this.x, y: this.y, goldDrop: this.goldDrop });

    this.playDeathEffect();
  }

  /** Küçük bir "pop" efekti: büyüyüp saydamlaşarak kaybolma - abrupt yok olmaktan daha tatmin edici */
  playDeathEffect() {
    this.scene.tweens.add({
      targets: this.sprite,
      scale: this.sprite.scale * 1.4,
      alpha: 0,
      duration: 180,
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
