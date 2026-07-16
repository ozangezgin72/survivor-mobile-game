import { RESOURCE_NODE_MAX_AMOUNT } from '../config/Constants.js';

/** Placeholder ile tutarlı ~40px görsel boy */
const NODE_VISUAL_SIZE = 40;

/**
 * tree / rock varyantına göre texture key + scale (Tiny Swords Resources).
 */
export const RESOURCE_NODE_VARIANTS = {
  tree: {
    textureKey: 'resource-node-tree',
    // Tree1 sheet: 192x256 kareler
    scale: NODE_VISUAL_SIZE / 256,
  },
  rock: {
    textureKey: 'resource-node-rock',
    // Gold Stone: 128x128
    scale: NODE_VISUAL_SIZE / 128,
  },
};

/**
 * Haritada sabit duran bir kaynak noktası (maden/ağaç gibi).
 *
 * Kendi başına bir şey YAPMAZ (idle mekanik yok); sadece kendi state'ini (kalan
 * miktar, tükendi mi) tutar. Gerçek toplama mantığı ResourceSystem'de yaşar.
 */
export default class ResourceNode {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {'tree'|'rock'} [variant]
   */
  constructor(scene, x, y, variant = 'rock') {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.variant = variant;

    const config = RESOURCE_NODE_VARIANTS[variant] ?? RESOURCE_NODE_VARIANTS.rock;
    this.baseScale = config.scale;

    this.maxAmount = RESOURCE_NODE_MAX_AMOUNT;
    this.amount = this.maxAmount;
    this.isDepleted = false;
    this.depletedAt = 0;

    this.sprite = scene.add.sprite(x, y, config.textureKey, 0);
    this.sprite.setDepth(5);
    this.sprite.setScale(this.baseScale);
  }

  get fillRatio() {
    return this.amount / this.maxAmount;
  }

  /** @returns {number} gerçekte çıkarılan miktar */
  extract(amount) {
    if (this.isDepleted || amount <= 0) {
      return 0;
    }

    const extracted = Math.min(amount, this.amount);
    this.amount -= extracted;

    if (this.amount <= 0) {
      this.deplete();
    }

    return extracted;
  }

  deplete() {
    this.isDepleted = true;
    this.depletedAt = this.scene.time.now;

    // "Boşaldı" görünümü: soluk ve grileşmiş (gerçek sprite ile de çalışır)
    this.sprite.setAlpha(0.3);
    this.sprite.setTint(0x9e9e9e);
  }

  respawn() {
    this.isDepleted = false;
    this.amount = this.maxAmount;
    this.sprite.setAlpha(1);
    this.sprite.clearTint();

    // Sessizce geri gelmesin - küçük bir "pop" ile yenilendiğini belli et
    this.sprite.setScale(this.baseScale * 0.6);
    this.scene.tweens.add({
      targets: this.sprite,
      scale: this.baseScale,
      duration: 250,
      ease: 'Back.easeOut',
    });
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
