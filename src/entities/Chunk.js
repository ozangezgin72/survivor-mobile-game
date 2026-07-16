import Phaser from 'phaser';
import { CHUNK_SIZE, FOG_OVERLAY_COLOR, FOG_OVERLAY_ALPHA, TERRAIN_GRASS_FILL_FRAME } from '../config/Constants.js';
import { getChunkPowerLevel, getTerrainTextureKey } from '../utils/ChunkPower.js';

/**
 * Haritanın mantıksal olarak bölündüğü kare bir "bölge" (chunk).
 *
 * Kendi başına davranış içermez; sadece grid pozisyonunu (col/row), dünya koordinatlarını,
 * kilit durumunu, zemin dokusunu ve sis görselini tutar. Açma/kilitleme kuralları
 * FogOfWarSystem'de yaşar.
 */
export default class Chunk {
  constructor(scene, col, row) {
    this.scene = scene;
    this.col = col;
    this.row = row;

    this.x = col * CHUNK_SIZE;
    this.y = row * CHUNK_SIZE;
    this.centerX = this.x + CHUNK_SIZE / 2;
    this.centerY = this.y + CHUNK_SIZE / 2;

    this.isUnlocked = false;
    this.ground = null;
    this.overlay = null;
    this.lockIcon = null;
  }

  /**
   * Power seviyesine göre Tiny Swords Tilemap_colorN dolgu çimini tileSprite ile çizer.
   * Kilitli chunk'larda da çizilir (sis üstte kaplar); unlock'ta sadece sis kalkar.
   */
  renderGroundTexture() {
    if (this.ground) {
      return;
    }

    const powerLevel = getChunkPowerLevel(this.col, this.row);
    const textureKey = getTerrainTextureKey(powerLevel);

    this.ground = this.scene.add.tileSprite(
      this.x,
      this.y,
      CHUNK_SIZE,
      CHUNK_SIZE,
      textureKey,
      TERRAIN_GRASS_FILL_FRAME,
    );
    this.ground.setOrigin(0, 0);
    this.ground.setDepth(0);
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

  /** Sis kalkar: overlay/kilit ikonu kısa bir fade ile kaybolur (zemin kalır) */
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

  containsPoint(x, y) {
    return x >= this.x && x < this.x + CHUNK_SIZE && y >= this.y && y < this.y + CHUNK_SIZE;
  }

  distanceToPoint(x, y) {
    const clampedX = Phaser.Math.Clamp(x, this.x, this.x + CHUNK_SIZE);
    const clampedY = Phaser.Math.Clamp(y, this.y, this.y + CHUNK_SIZE);
    return Phaser.Math.Distance.Between(x, y, clampedX, clampedY);
  }

  /** Sis görsellerini kaldır (merkez chunk başlangıcı); zemin dokunulmaz */
  clearFogVisualsImmediate() {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
    if (this.lockIcon) {
      this.lockIcon.destroy();
      this.lockIcon = null;
    }
  }

  destroy() {
    if (this.ground) {
      this.ground.destroy();
      this.ground = null;
    }
    this.clearFogVisualsImmediate();
  }
}
