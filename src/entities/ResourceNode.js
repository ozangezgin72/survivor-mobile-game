import { RESOURCE_NODE_MAX_AMOUNT } from '../config/Constants.js';

/**
 * Haritada sabit duran bir kaynak noktası (maden/ağaç gibi).
 *
 * Kendi başına bir şey YAPMAZ (idle mekanik yok); sadece kendi state'ini (kalan
 * miktar, tükendi mi) tutar. Gerçek toplama mantığı - oyuncunun yakınlığını kontrol
 * etme, extract() çağırma, respawn zamanlamasını yönetme - ResourceSystem'de yaşar.
 * Bu, Minecraft'taki bir maden damarı gibi düşünülebilir: gerçek, tükenebilir bir
 * dünya objesi, sadece süreye bağlı otomatik üretim değil.
 */
export default class ResourceNode {
  constructor(scene, x, y, textureKey) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    this.maxAmount = RESOURCE_NODE_MAX_AMOUNT;
    this.amount = this.maxAmount;
    this.isDepleted = false;
    this.depletedAt = 0;

    this.sprite = scene.add.sprite(x, y, textureKey);
    this.sprite.setDepth(5);
  }

  get fillRatio() {
    return this.amount / this.maxAmount;
  }

  /** @returns {number} gerçekte çıkarılan miktar (istenenden az olabilir, node tükeniyorsa) */
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

    // "Boşaldı" görünümü: soluk ve grileşmiş
    this.sprite.setAlpha(0.3);
    this.sprite.setTint(0x9e9e9e);
  }

  respawn() {
    this.isDepleted = false;
    this.amount = this.maxAmount;
    this.sprite.setAlpha(1);
    this.sprite.clearTint();

    // Sessizce geri gelmesin - küçük bir "pop" ile yenilendiğini belli et
    this.sprite.setScale(0.6);
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 1,
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
