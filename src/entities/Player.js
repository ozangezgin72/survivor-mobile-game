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
  PLAYER_SPRITE_SCALE,
  PLAYER_VISUAL_SIZE,
} from '../config/Constants.js';
import { GameEvents } from '../config/Events.js';

/**
 * Karakterin bakış/hareket yönü (pusula yönleri).
 * flipX için sol/sağ ayrımında kullanılır; Tiny Swords okçu sağa bakar.
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

const LEFT_FACING = new Set([Direction.LEFT, Direction.UP_LEFT, Direction.DOWN_LEFT]);

const ANIM_IDLE = 'player-idle';
const ANIM_RUN = 'player-run';
const ANIM_SHOOT = 'player-shoot';

/**
 * Oyuncu karakteri — Tiny Swords Blue Archer sprite + idle/run/shoot animasyonları.
 */
export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;

    this.speed = this.getSpeedForLevel(1);
    this.direction = Direction.RIGHT;
    this.isMoving = false;
    this.facingLeft = false;
    this.isAttackAnimating = false;

    this.isAlive = true;
    this.maxHealth = PLAYER_MAX_HEALTH;
    this.health = this.maxHealth;
    this.attackDamage = PLAYER_ATTACK_DAMAGE;
    this.attackRange = PLAYER_ATTACK_RANGE;
    this.attackSpeed = PLAYER_ATTACK_SPEED;
    this.lastAttackTime = 0;

    this.gold = 0;
    this.resources = 0;

    this.level = 1;
    this.killCount = 0;
    this.experience = 0;

    Player.createAnimations(scene);
    this.sprite = this.createSprite(x, y);

    this.handleEnemyDied = this.handleEnemyDied.bind(this);
    this.scene.events.on(GameEvents.ENEMY_DIED, this.handleEnemyDied);
  }

  static createAnimations(scene) {
    if (scene.anims.exists(ANIM_IDLE)) {
      return;
    }

    scene.anims.create({
      key: ANIM_IDLE,
      frames: scene.anims.generateFrameNumbers('archer-idle', { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1,
    });

    scene.anims.create({
      key: ANIM_RUN,
      frames: scene.anims.generateFrameNumbers('archer-run', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    scene.anims.create({
      key: ANIM_SHOOT,
      frames: scene.anims.generateFrameNumbers('archer-shoot', { start: 0, end: 7 }),
      frameRate: 12,
      repeat: 0,
    });
  }

  createSprite(x, y) {
    const sprite = this.scene.physics.add.sprite(x, y, 'archer-idle', 0);
    sprite.setCollideWorldBounds(true);
    sprite.setDepth(10);
    sprite.setScale(PLAYER_SPRITE_SCALE);

    // Mantıksal çarpışma ~eski 48px placeholder; texture 192px olduğu için unscaled radius
    const worldRadius = PLAYER_VISUAL_SIZE / 2.4;
    const unscaledRadius = worldRadius / PLAYER_SPRITE_SCALE;
    sprite.body.setCircle(
      unscaledRadius,
      sprite.width / 2 - unscaledRadius,
      sprite.height / 2 - unscaledRadius,
    );

    sprite.play(ANIM_IDLE);
    sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, this.handleAnimationComplete, this);

    return sprite;
  }

  handleAnimationComplete(animation) {
    if (animation.key !== ANIM_SHOOT) {
      return;
    }

    this.isAttackAnimating = false;
    this.refreshMovementAnimation();
  }

  /**
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
    this.updateFacingFromDirection(this.direction);
    this.refreshMovementAnimation();
  }

  stop() {
    this.sprite.body.setVelocity(0, 0);
    this.isMoving = false;
    this.refreshMovementAnimation();
  }

  updateFacingFromDirection(direction) {
    if (direction === Direction.IDLE || direction === Direction.UP || direction === Direction.DOWN) {
      return;
    }

    this.facingLeft = LEFT_FACING.has(direction);
    this.sprite.setFlipX(this.facingLeft);
  }

  /** Hedefe bakacak şekilde flip (saldırı anında) */
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

    const desired = this.isMoving ? ANIM_RUN : ANIM_IDLE;

    if (this.sprite.anims.currentAnim?.key !== desired) {
      this.sprite.play(desired, true);
    }
  }

  /** CombatSystem oyuncu saldırdığında çağırır */
  playAttackAnimation(targetX, targetY) {
    if (!this.isAlive) {
      return;
    }

    this.faceToward(targetX, targetY);
    this.isAttackAnimating = true;
    this.sprite.play(ANIM_SHOOT, true);
  }

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
    this.isAttackAnimating = false;
    this.stop();
    this.sprite.anims.stop();
    this.scene.events.emit(GameEvents.PLAYER_DIED);
  }

  addGold(amount) {
    this.gold += amount;
    this.scene.events.emit(GameEvents.PLAYER_GOLD_CHANGED, this.gold);
  }

  getPrestigePoints() {
    return this.scene.prestigeSystem?.getTotalPrestigePoints?.() ?? 0;
  }

  canAfford(goldAmount) {
    return this.gold + this.getPrestigePoints() >= goldAmount;
  }

  canAffordGoldOnly(goldAmount) {
    return this.gold >= goldAmount;
  }

  needsPrestigeForGold(goldAmount) {
    return goldAmount > 0 && !this.canAffordGoldOnly(goldAmount) && this.canAfford(goldAmount);
  }

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
        this.gold += fromGold;
        this.scene.events.emit(GameEvents.PLAYER_GOLD_CHANGED, this.gold);
        return false;
      }
    }

    return true;
  }

  spendGoldOnly(amount) {
    if (!this.canAffordGoldOnly(amount)) {
      return false;
    }

    this.gold -= amount;
    this.scene.events.emit(GameEvents.PLAYER_GOLD_CHANGED, this.gold);
    return true;
  }

  addResources(amount) {
    this.resources += amount;
    this.scene.events.emit(GameEvents.PLAYER_RESOURCES_CHANGED, this.resources);
  }

  canAffordResources(amount) {
    return this.resources + this.getPrestigePoints() >= amount;
  }

  canAffordResourcesOnly(amount) {
    return this.resources >= amount;
  }

  needsPrestigeForResources(amount) {
    return amount > 0 && !this.canAffordResourcesOnly(amount) && this.canAffordResources(amount);
  }

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

  handleEnemyDied() {
    this.killCount += 1;

    if (this.killCount % PLAYER_KILLS_PER_LEVEL === 0) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level += 1;
    this.maxHealth += PLAYER_LEVEL_UP_HEALTH_BONUS;
    this.health = this.maxHealth;
    this.attackDamage += PLAYER_LEVEL_UP_DAMAGE_BONUS;
    this.speed = this.getSpeedForLevel(this.level);

    this.scene.events.emit(GameEvents.PLAYER_LEVEL_UP, this.level);
    this.scene.events.emit(GameEvents.PLAYER_HEALTH_CHANGED, this.health, this.maxHealth);
  }

  getSpeedForLevel(level) {
    return Math.round(PLAYER_SPEED * (1 + (level - 1) * PLAYER_SPEED_PER_LEVEL));
  }

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
    this.sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE, this.handleAnimationComplete, this);
    this.sprite.destroy();
  }
}
