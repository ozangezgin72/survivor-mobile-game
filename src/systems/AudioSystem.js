import { GameEvents } from '../config/Events.js';
import {
  playDeathSound,
  playLevelUpFanfare,
  playPrestigeFanfare,
  resumeAudioContext,
} from '../utils/PlaceholderSounds.js';
import { playSfx, SFX } from '../utils/GameSounds.js';

/**
 * Oyun olaylarına ses bağlar (Kenney SFX + prosedürel fanfare / ölüm).
 * Susturma HUD'dan kontrol edilir; Phaser SoundManager.mute ile senkron.
 */
export default class AudioSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.muted = false;
    this.lastGold = player.gold;

    this.handleEnemyDied = this.handleEnemyDied.bind(this);
    this.handleGoldChanged = this.handleGoldChanged.bind(this);
    this.handleBuildingPlaced = this.handleBuildingPlaced.bind(this);
    this.handleChunkUnlocked = this.handleChunkUnlocked.bind(this);
    this.handleLevelUp = this.handleLevelUp.bind(this);
    this.handlePrestigeCompleted = this.handlePrestigeCompleted.bind(this);
    this.unlockAudio = this.unlockAudio.bind(this);

    this.scene.events.on(GameEvents.ENEMY_DIED, this.handleEnemyDied);
    this.scene.events.on(GameEvents.PLAYER_GOLD_CHANGED, this.handleGoldChanged);
    this.scene.events.on(GameEvents.BUILDING_PLACED, this.handleBuildingPlaced);
    this.scene.events.on(GameEvents.CHUNK_UNLOCKED, this.handleChunkUnlocked);
    this.scene.events.on(GameEvents.PLAYER_LEVEL_UP, this.handleLevelUp);
    this.scene.events.on(GameEvents.PRESTIGE_COMPLETED, this.handlePrestigeCompleted);

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
    if (this.scene.sound) {
      this.scene.sound.mute = muted;
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
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
      playSfx(this.scene, SFX.COIN, { volume: 0.5 });
    }
    this.lastGold = totalGold;
  }

  handleBuildingPlaced() {
    if (this.muted) {
      return;
    }
    playSfx(this.scene, SFX.PLACE, { volume: 0.45 });
  }

  handleChunkUnlocked() {
    // Kayıt yüklerken toplu unlock → ses spam'ini engelle
    if (this.muted || this.scene.suppressAutoSave) {
      return;
    }
    playSfx(this.scene, SFX.CONFIRM, { volume: 0.4 });
  }

  handleLevelUp() {
    if (this.muted) {
      return;
    }
    playLevelUpFanfare();
  }

  handlePrestigeCompleted() {
    if (this.muted) {
      return;
    }
    playPrestigeFanfare();
  }

  destroy() {
    this.scene.events.off(GameEvents.ENEMY_DIED, this.handleEnemyDied);
    this.scene.events.off(GameEvents.PLAYER_GOLD_CHANGED, this.handleGoldChanged);
    this.scene.events.off(GameEvents.BUILDING_PLACED, this.handleBuildingPlaced);
    this.scene.events.off(GameEvents.CHUNK_UNLOCKED, this.handleChunkUnlocked);
    this.scene.events.off(GameEvents.PLAYER_LEVEL_UP, this.handleLevelUp);
    this.scene.events.off(GameEvents.PRESTIGE_COMPLETED, this.handlePrestigeCompleted);
    this.scene.input.off('pointerdown', this.unlockAudio);
    this.scene.input.keyboard?.off('keydown', this.unlockAudio);
  }
}
