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
import { PAWN_SPRITE, ensureEnemyAnimations } from '../utils/EnemySprites.js';

export const EnemyState = {
  IDLE: 'idle',
  WANDER: 'wander',
  CHASE: 'chase',
  ATTACK: 'attack',
};

/**
 * Düşman base class — Tiny Swords sprite + idle/run/attack animasyonları.
 * Alt tipler `static spriteConfig` ile farklı sheet kullanır.
 */
export default class Enemy {
  static spriteConfig = PAWN_SPRITE;
  static textureKey = PAWN_SPRITE.idleTexture;
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
    this.attackSpeed = config.attackSpeed ?? ENEMY_ATTACK_SPEED;
    this.baseMaxHealth = this.maxHealth;
    this.baseAttackDamage = this.attackDamage;
    this.difficultyMultiplier = 1;
    this.goldDrop = Phaser.Math.Between(
      config.goldDropMin ?? ENEMY_GOLD_DROP_MIN,
      config.goldDropMax ?? ENEMY_GOLD_DROP_MAX,
    );

    this.lastAttackTime = 0;
    this.state = EnemyState.IDLE;
    this.isMoving = false;
    this.facingLeft = false;
    this.isAttackAnimating = false;

    this.wanderTargetX = x;
    this.wanderTargetY = y;
    this.nextWanderDecisionTime = 0;
    this.blockedBy = null;

    const spriteConfig = this.constructor.spriteConfig ?? PAWN_SPRITE;
    this.spriteConfig = spriteConfig;
    this.animKeys = ensureEnemyAnimations(scene, spriteConfig);
    this.sprite = this.createSprite(x, y, spriteConfig);
  }

  createSprite(x, y, spriteConfig) {
    const sprite = this.scene.add.sprite(x, y, spriteConfig.idleTexture, 0);
    sprite.setDepth(9);

    const scale = spriteConfig.visualSize / spriteConfig.frameHeight;
    sprite.setScale(scale);

    sprite.play(this.animKeys.idle);
    sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, this.handleAnimationComplete, this);

    return sprite;
  }

  handleAnimationComplete(animation) {
    if (animation.key !== this.animKeys.attack) {
      return;
    }

    this.isAttackAnimating = false;
    this.refreshMovementAnimation();
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

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

    this.refreshMovementAnimation();
  }

  updateCombatMovement(distanceToPlayer, player, delta, blockers) {
    if (distanceToPlayer <= this.attackRange) {
      this.state = EnemyState.ATTACK;
      this.blockedBy = null;
      this.isMoving = false;
      this.faceToward(player.x, player.y);
    } else {
      this.moveToward(player.x, player.y, this.moveSpeed, delta, blockers);
      this.state = this.blockedBy ? EnemyState.ATTACK : EnemyState.CHASE;
    }
  }

  moveToward(targetX, targetY, speed, delta, blockers) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.moveAtAngle(angle, speed, delta, blockers);
  }

  moveAway(awayFromX, awayFromY, speed, delta, blockers) {
    const angle = Phaser.Math.Angle.Between(awayFromX, awayFromY, this.x, this.y);
    this.moveAtAngle(angle, speed, delta, blockers);
  }

  moveAtAngle(angle, speed, delta, blockers) {
    const distance = (speed * delta) / 1000;

    let newX = this.sprite.x + Math.cos(angle) * distance;
    let newY = this.sprite.y + Math.sin(angle) * distance;

    const blocker = this.findBlockingBuilding(newX, newY, blockers);

    if (blocker) {
      this.blockedBy = blocker;
      this.isMoving = false;
      newX = this.sprite.x;
      newY = this.sprite.y;
    } else {
      this.blockedBy = null;
      this.isMoving = distance > 0.01;
    }

    this.sprite.x = Phaser.Math.Clamp(newX, 0, WORLD_WIDTH);
    this.sprite.y = Phaser.Math.Clamp(newY, 0, WORLD_HEIGHT);

    this.updateFacingFromAngle(angle);
  }

  updateFacingFromAngle(angle) {
    // cos < 0 → sola bakıyor
    const faceLeft = Math.cos(angle) < -0.05;
    const faceRight = Math.cos(angle) > 0.05;

    if (faceLeft) {
      this.facingLeft = true;
    } else if (faceRight) {
      this.facingLeft = false;
    }

    this.sprite.setFlipX(this.facingLeft);
  }

  faceToward(targetX, targetY) {
    if (targetX < this.x) {
      this.facingLeft = true;
    } else if (targetX > this.x) {
      this.facingLeft = false;
    }

    this.sprite.setFlipX(this.facingLeft);
  }

  refreshMovementAnimation() {
    if (!this.isAlive || this.isAttackAnimating) {
      return;
    }

    const desired = this.isMoving ? this.animKeys.run : this.animKeys.idle;

    if (this.sprite.anims.currentAnim?.key !== desired) {
      this.sprite.play(desired, true);
    }
  }

  /** CombatSystem saldırı anında çağırır */
  playAttackAnimation(targetX, targetY) {
    if (!this.isAlive) {
      return;
    }

    this.faceToward(targetX, targetY);
    this.isAttackAnimating = true;
    this.sprite.play(this.animKeys.attack, true);
  }

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

  wander(time, delta, blockers) {
    if (time >= this.nextWanderDecisionTime) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const radius = Phaser.Math.FloatBetween(0, ENEMY_WANDER_RADIUS);

      this.wanderTargetX = this.spawnX + Math.cos(angle) * radius;
      this.wanderTargetY = this.spawnY + Math.sin(angle) * radius;
      this.nextWanderDecisionTime = time + Phaser.Math.Between(1500, 3500);
    }

    const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.wanderTargetX, this.wanderTargetY);

    if (distanceToTarget > 4) {
      this.moveToward(this.wanderTargetX, this.wanderTargetY, this.moveSpeed * ENEMY_WANDER_SPEED_FACTOR, delta, blockers);
    } else {
      this.blockedBy = null;
      this.isMoving = false;
    }
  }

  scaleStats(multiplier) {
    const previousMaxHealth = this.maxHealth;
    const healthRatio = previousMaxHealth > 0 ? this.health / previousMaxHealth : 1;

    this.difficultyMultiplier = multiplier;
    this.maxHealth = Math.max(1, Math.round(this.baseMaxHealth * multiplier));
    this.health = Math.max(1, Math.round(this.maxHealth * healthRatio));
    this.attackDamage = Math.max(1, Math.round(this.baseAttackDamage * multiplier));
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
    this.isAttackAnimating = false;
    this.scene.events.emit(GameEvents.ENEMY_DIED, { x: this.x, y: this.y, goldDrop: this.goldDrop });
    this.playDeathEffect();
  }

  playDeathEffect() {
    this.sprite.anims.stop();
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
      this.sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE, this.handleAnimationComplete, this);
      this.sprite.destroy();
    }
  }
}
