/**
 * Düşman ölünce yere düşen altın/kaynak objesi.
 *
 * Süreye bağlı kaybolmaz; oyuncu toplama menziline girene kadar yerde kalır
 * (GoldSystem toplama mesafesini ve "oyuncuya uçma" animasyonunu yönetir).
 */
export default class Gold {
  constructor(scene, x, y, amount) {
    this.scene = scene;
    this.amount = amount;

    // isFlying: toplanma tween'i başladı mı (aynı altının iki kere toplanmaya başlamasını önler)
    this.isFlying = false;
    // isCollected: tween tamamlandı, oyuncunun altınına eklendi, temizlenmeyi bekliyor
    this.isCollected = false;

    this.sprite = scene.add.sprite(x, y, 'gold-placeholder');
    this.sprite.setDepth(7);

    // Yere "sekerek" düşme hissi için küçük bir spawn tween'i
    this.sprite.setScale(0);
    scene.tweens.add({
      targets: this.sprite,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
