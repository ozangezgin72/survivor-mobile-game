import Phaser from 'phaser';
import {
  HIT_FLASH_COLOR,
  HIT_FLASH_DURATION,
  DAMAGE_NUMBER_LIFETIME,
  DAMAGE_NUMBER_RISE_DISTANCE,
} from '../config/Constants.js';

/**
 * Otomatik (tuşsuz) savaş sistemi.
 *
 * - Oyuncu, attackRange'i içindeki EN YAKIN düşmana kendi attackSpeed'ine göre otomatik saldırır
 * - Her düşman da kendi attackRange'i içinde bir hedefi (oyuncu veya yolunu tıkayan bir Wall)
 *   varsa kendi attackSpeed'ine göre saldırır (birden fazla düşman aynı anda yakınsa hepsi
 *   ayrı ayrı vurabilir - kuşatılma cezası)
 * - Faz 3: Kuleler de "saldıran taraf" - menzillerindeki en yakın düşmana oyuncu gibi otomatik
 *   ateş ederler, aynı hit-flash/damage-number/tracer efektlerini kullanırlar (görsel tutarlılık)
 * - Cannon gibi splashRadius > 0 olan binalar, isabet noktasının etrafındaki diğer düşmanlara da hasar verir
 * - Menzil kontrolü bilerek Arcade physics overlap değil, düz mesafe (distance) hesabı;
 *   15-20 birim + bina için fazlasıyla yeterli ve çok daha hafif (bkz. proje performans notları)
 */
export default class CombatSystem {
  constructor(scene, player, enemySpawner, buildingSystem) {
    this.scene = scene;
    this.player = player;
    this.enemySpawner = enemySpawner;
    this.buildingSystem = buildingSystem;
  }

  update(time) {
    const enemies = this.enemySpawner.enemies;

    if (this.player.isAlive) {
      this.updatePlayerAttack(enemies, time);
    }

    this.updateEnemyAttacks(enemies, time);
    this.updateTowerAttacks(enemies, time);
  }

  /** Oyuncu, menzildeki en yakın düşmana otomatik saldırır (tek hedef) */
  updatePlayerAttack(enemies, time) {
    const attackInterval = 1000 / this.player.attackSpeed;

    if (time - this.player.lastAttackTime < attackInterval) {
      return;
    }

    const target = this.findNearestEnemyInRange(enemies, this.player.x, this.player.y, this.player.attackRange);

    if (!target) {
      return;
    }

    this.player.lastAttackTime = time;
    this.player.playAttackAnimation?.(target.x, target.y);
    this.resolveAttack(this.player, target, true);
  }

  /** Menzilindeki bir hedefe (oyuncu veya yolunu tıkayan duvar), her düşman kendi hızında bağımsız saldırır */
  updateEnemyAttacks(enemies, time) {
    for (const enemy of enemies) {
      if (!enemy.isAlive) {
        continue;
      }

      const target = this.resolveEnemyAttackTarget(enemy);

      if (!target) {
        continue;
      }

      const attackInterval = 1000 / enemy.attackSpeed;

      if (time - enemy.lastAttackTime < attackInterval) {
        continue;
      }

      enemy.lastAttackTime = time;
      this.resolveAttack(enemy, target, false);
    }
  }

  /** Düşmanın şu an saldırabileceği hedefi bulur: önce yolunu tıkayan duvar, yoksa menzildeki oyuncu */
  resolveEnemyAttackTarget(enemy) {
    if (enemy.blockedBy && enemy.blockedBy.isAlive) {
      const wallDistance = Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.blockedBy.x, enemy.blockedBy.y);

      if (wallDistance <= enemy.attackRange) {
        return enemy.blockedBy;
      }
    }

    if (this.player.isAlive) {
      const playerDistance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

      if (playerDistance <= enemy.attackRange) {
        return this.player;
      }
    }

    return null;
  }

  /** Faz 3: Kuleler menzillerindeki en yakın düşmana oyuncu gibi otomatik ateş eder */
  updateTowerAttacks(enemies, time) {
    const towers = this.buildingSystem.getTowers();

    for (const tower of towers) {
      const attackInterval = 1000 / tower.attackSpeed;

      if (time - tower.lastAttackTime < attackInterval) {
        continue;
      }

      const target = this.findNearestEnemyInRange(enemies, tower.x, tower.y, tower.attackRange);

      if (!target) {
        continue;
      }

      tower.lastAttackTime = time;
      this.resolveAttack(tower, target, true);

      if (tower.splashRadius > 0) {
        this.applySplashDamage(tower, target, enemies);
      }
    }
  }

  findNearestEnemyInRange(enemies, x, y, range) {
    let nearest = null;
    let nearestDistance = range;

    for (const enemy of enemies) {
      if (!enemy.isAlive) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);

      if (distance <= nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  /** @param {boolean} isFriendlySide - true: oyuncu veya kule vurdu (sarı hasar + tracer), false: düşman vurdu (kırmızı) */
  resolveAttack(attacker, defender, isFriendlySide) {
    defender.takeDamage(attacker.attackDamage);

    this.showHitEffect(defender);
    this.showDamageNumber(defender.x, defender.y, attacker.attackDamage, isFriendlySide);

    if (isFriendlySide) {
      this.showAttackTracer(attacker, defender);
    }
  }

  /** Cannon gibi alan hasarı veren binalar için: isabet noktasının etrafındaki diğer düşmanlara da hasar */
  applySplashDamage(attacker, primaryTarget, enemies) {
    this.showSplashEffect(primaryTarget.x, primaryTarget.y, attacker.splashRadius);

    for (const enemy of enemies) {
      if (!enemy.isAlive || enemy === primaryTarget) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(primaryTarget.x, primaryTarget.y, enemy.x, enemy.y);

      if (distance <= attacker.splashRadius) {
        enemy.takeDamage(attacker.attackDamage);
        this.showHitEffect(enemy);
        this.showDamageNumber(enemy.x, enemy.y, attacker.attackDamage, true);
      }
    }
  }

  /** Vurulan hedefi kısa süreliğine parlatır (tint flash) */
  showHitEffect(defender) {
    const sprite = defender.sprite;

    if (!sprite || !sprite.active) {
      return;
    }

    sprite.setTintFill(HIT_FLASH_COLOR);

    this.scene.time.delayedCall(HIT_FLASH_DURATION, () => {
      if (sprite && sprite.active) {
        sprite.clearTint();
      }
    });
  }

  /** Vurulan noktanın üstünde yükselip kaybolan hasar sayısı */
  showDamageNumber(x, y, amount, isFriendlySide) {
    // Oyuncu/kulenin verdiği hasar sarı, düşmanın verdiği kırmızı - kimin vurduğu ilk bakışta anlaşılsın
    const color = isFriendlySide ? '#ffee58' : '#ff5252';
    const randomOffsetX = Phaser.Math.Between(-10, 10);

    const text = this.scene.add.text(x, y - 20, `-${amount}`, {
      fontSize: '20px',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    });
    text.setOrigin(0.5, 0.5);
    text.setDepth(2000);

    this.scene.tweens.add({
      targets: text,
      x: x + randomOffsetX,
      y: y - 20 - DAMAGE_NUMBER_RISE_DISTANCE,
      alpha: 0,
      duration: DAMAGE_NUMBER_LIFETIME,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  /** Menzilli saldırıları (oyuncu + kuleler) gösteren, çok kısa süreli bir "zap" çizgisi */
  showAttackTracer(attacker, defender) {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(2, 0x4fc3f7, 0.85);
    graphics.beginPath();
    graphics.moveTo(attacker.x, attacker.y);
    graphics.lineTo(defender.x, defender.y);
    graphics.strokePath();
    graphics.setDepth(11);

    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 120,
      onComplete: () => graphics.destroy(),
    });
  }

  /** Cannon splash'i için kısa süreli genişleyen bir patlama halkası */
  showSplashEffect(x, y, radius) {
    const circle = this.scene.add.circle(x, y, radius, 0xff7043, 0.22);
    circle.setStrokeStyle(2, 0xff7043, 0.8);
    circle.setDepth(11);

    this.scene.tweens.add({
      targets: circle,
      alpha: 0,
      scale: 1.15,
      duration: 220,
      onComplete: () => circle.destroy(),
    });
  }
}
