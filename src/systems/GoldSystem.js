import Phaser from 'phaser';
import Gold from '../entities/Gold.js';
import { GameEvents } from '../config/Events.js';
import { GOLD_PICKUP_RANGE, GOLD_MAGNET_RANGE, GOLD_MAGNET_SPEED, GOLD_COLLECT_SPEED } from '../config/Constants.js';

/**
 * Altın drop + toplama sistemi.
 *
 * - Bir düşman öldüğünde (ENEMY_DIED event'i) aynı noktada bir Gold objesi spawn eder
 * - Oyuncu GOLD_MAGNET_RANGE içine girince altın yavaşça oyuncuya doğru sürüklenir
 * - GOLD_PICKUP_RANGE içine girince mevcut toplama tween'i devreye girer
 * - Tween bitince player.gold'a eklenir ve PLAYER_GOLD_CHANGED event'i yayınlanır (HUD dinler)
 */
export default class GoldSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.goldItems = [];

    this.handleEnemyDied = this.handleEnemyDied.bind(this);
    this.scene.events.on(GameEvents.ENEMY_DIED, this.handleEnemyDied);
  }

  handleEnemyDied({ x, y, goldDrop }) {
    this.goldItems.push(new Gold(this.scene, x, y, goldDrop));
  }

  update(time, delta) {
    for (const gold of this.goldItems) {
      if (gold.isFlying) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, gold.x, gold.y);

      if (distance <= GOLD_PICKUP_RANGE) {
        this.collectGold(gold);
      } else if (distance <= GOLD_MAGNET_RANGE) {
        this.moveGoldTowardPlayer(gold, delta);
      }
    }

    if (this.goldItems.some((gold) => gold.isCollected)) {
      this.goldItems = this.goldItems.filter((gold) => !gold.isCollected);
    }
  }

  /** Manyetik menzil içindeki altını her frame biraz oyuncuya yaklaştırır */
  moveGoldTowardPlayer(gold, delta) {
    const angle = Phaser.Math.Angle.Between(gold.x, gold.y, this.player.x, this.player.y);
    const moveDistance = (GOLD_MAGNET_SPEED * delta) / 1000;

    gold.sprite.x += Math.cos(angle) * moveDistance;
    gold.sprite.y += Math.sin(angle) * moveDistance;
  }

  /** Altını oyuncunun o anki konumuna doğru kısa bir tween ile "uçurur" */
  collectGold(gold) {
    gold.isFlying = true;

    const targetX = this.player.x;
    const targetY = this.player.y;
    const distance = Phaser.Math.Distance.Between(gold.x, gold.y, targetX, targetY);
    const duration = Phaser.Math.Clamp((distance / GOLD_COLLECT_SPEED) * 1000, 80, 400);

    this.scene.tweens.add({
      targets: gold.sprite,
      x: targetX,
      y: targetY,
      scale: 0.2,
      duration,
      ease: 'Cubic.easeIn',
      onComplete: () => this.finalizeCollection(gold),
    });
  }

  finalizeCollection(gold) {
    gold.isCollected = true;
    this.player.addGold(gold.amount);
    gold.destroy();
  }

  destroy() {
    this.scene.events.off(GameEvents.ENEMY_DIED, this.handleEnemyDied);

    for (const gold of this.goldItems) {
      gold.destroy();
    }
    this.goldItems = [];
  }
}
