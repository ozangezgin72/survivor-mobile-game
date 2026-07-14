import { GameEvents } from '../config/Events.js';
import {
  playCoinSound,
  playDeathSound,
  resumeAudioContext,
} from '../utils/PlaceholderSounds.js';

/**
 * Oyun olaylarına prosedürel ses bağlar.
 * Şimdilik: düşman ölümü + altın artışı (toplama). Susturma HUD'dan kontrol edilir.
 */
export default class AudioSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.muted = false;
    this.lastGold = player.gold;

    this.handleEnemyDied = this.handleEnemyDied.bind(this);
    this.handleGoldChanged = this.handleGoldChanged.bind(this);
    this.unlockAudio = this.unlockAudio.bind(this);

    this.scene.events.on(GameEvents.ENEMY_DIED, this.handleEnemyDied);
    this.scene.events.on(GameEvents.PLAYER_GOLD_CHANGED, this.handleGoldChanged);

    // Tarayıcı autoplay: ilk pointer/keyboard etkileşiminde AudioContext'i aç
    this.scene.input.on('pointerdown', this.unlockAudio);
    this.scene.input.keyboard?.on('keydown', this.unlockAudio);
  }

  unlockAudio() {
    resumeAudioContext();
  }

  /** Kayıt yükleme sonrası gereksiz coin sesini engellemek için altın tabanını senkronla */
  syncFromPlayer() {
    this.lastGold = this.player.gold;
  }

  setMuted(muted) {
    this.muted = muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  handleEnemyDied() {
    if (this.muted) {
      return;
    }
    playDeathSound();
  }

  handleGoldChanged(totalGold) {
    if (!this.muted && totalGold > this.lastGold) {
      playCoinSound();
    }
    this.lastGold = totalGold;
  }

  destroy() {
    this.scene.events.off(GameEvents.ENEMY_DIED, this.handleEnemyDied);
    this.scene.events.off(GameEvents.PLAYER_GOLD_CHANGED, this.handleGoldChanged);
    this.scene.input.off('pointerdown', this.unlockAudio);
    this.scene.input.keyboard?.off('keydown', this.unlockAudio);
  }
}
