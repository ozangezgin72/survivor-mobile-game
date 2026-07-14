import Phaser from 'phaser';
import { CHUNK_SIZE, FOG_OVERLAY_COLOR, FOG_OVERLAY_ALPHA } from '../config/Constants.js';

/**
 * Haritanın mantıksal olarak bölündüğü kare bir "bölge" (chunk).
 *
 * Kendi başına davranış içermez; sadece grid pozisyonunu (col/row), dünya koordinatlarını,
 * kilit durumunu ve sis görselini (overlay + kilit ikonu) tutar. Açma/kilitleme kuralları
 * (komşuluk, maliyet vb.) FogOfWarSystem'de yaşar.
 */
export default class Chunk {
  constructor(scene, col, row) {
    this.scene = scene;
    this.col = col;
    this.row = row;

    // Chunk'ın sol-üst köşesi (dünya koordinatı)
    this.x = col * CHUNK_SIZE;
    this.y = row * CHUNK_SIZE;
    this.centerX = this.x + CHUNK_SIZE / 2;
    this.centerY = this.y + CHUNK_SIZE / 2;

    this.isUnlocked = false;
    this.overlay = null;
    this.lockIcon = null;
  }

  /** Sisli/kilitli görünümü oluşturur: koyu yarı saydam overlay + kilit ikonu placeholder */
  createFogVisuals() {
    this.overlay = this.scene.add.rectangle(this.x, this.y, CHUNK_SIZE, CHUNK_SIZE, FOG_OVERLAY_COLOR, FOG_OVERLAY_ALPHA);
    this.overlay.setOrigin(0, 0);
    // Dünya elemanlarının (zemin, düşman, bina) üstünde ama ekrana sabit UI'ın altında
    this.overlay.setDepth(15);

    this.lockIcon = this.scene.add.text(this.centerX, this.centerY, '🔒', { fontSize: '40px' });
    this.lockIcon.setOrigin(0.5, 0.5);
    this.lockIcon.setAlpha(0.75);
    this.lockIcon.setDepth(16);
  }

  /** Sis kalkar: overlay/kilit ikonu kısa bir fade ile kaybolur */
  unlock() {
    this.isUnlocked = true;

    if (!this.overlay) {
      return;
    }

    const overlay = this.overlay;
    const lockIcon = this.lockIcon;
    this.overlay = null;
    this.lockIcon = null;

    this.scene.tweens.add({
      targets: [overlay, lockIcon],
      alpha: 0,
      duration: 350,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        overlay.destroy();
        lockIcon.destroy();
      },
    });
  }

  /** Bu nokta chunk'ın sınırlarının içinde mi? */
  containsPoint(x, y) {
    return x >= this.x && x < this.x + CHUNK_SIZE && y >= this.y && y < this.y + CHUNK_SIZE;
  }

  /** Verilen noktadan chunk'ın en yakın kenarına olan mesafe (nokta içindeyse 0) */
  distanceToPoint(x, y) {
    const clampedX = Phaser.Math.Clamp(x, this.x, this.x + CHUNK_SIZE);
    const clampedY = Phaser.Math.Clamp(y, this.y, this.y + CHUNK_SIZE);
    return Phaser.Math.Distance.Between(x, y, clampedX, clampedY);
  }

  destroy() {
    if (this.overlay) {
      this.overlay.destroy();
    }
    if (this.lockIcon) {
      this.lockIcon.destroy();
    }
  }
}
