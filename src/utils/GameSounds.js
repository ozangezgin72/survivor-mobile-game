/** Kenney SFX key'leri ve preload yardımcıları */

export const SFX = {
  CLICK: 'sfx-click',
  CONFIRM: 'sfx-confirm',
  COIN: 'sfx-coin-real',
  PLACE: 'sfx-place',
};

const UI_AUDIO_DIR = 'assets/ui audio';
const RPG_AUDIO_DIR = 'assets/audio';

/** MainScene / MenuScene preload'da çağır */
export function preloadGameSounds(scene) {
  scene.load.audio(SFX.CLICK, `${UI_AUDIO_DIR}/click1.ogg`);
  scene.load.audio(SFX.CONFIRM, `${UI_AUDIO_DIR}/switch1.ogg`);
  scene.load.audio(SFX.COIN, `${RPG_AUDIO_DIR}/handleCoins.ogg`);
  scene.load.audio(SFX.PLACE, `${RPG_AUDIO_DIR}/metalClick.ogg`);
}

/**
 * Phaser ses cache'inde varsa çalar (mute / eksik asset güvenli).
 * @param {Phaser.Scene} scene
 * @param {string} key
 * @param {Phaser.Types.Sound.SoundConfig} [config]
 */
export function playSfx(scene, key, config = { volume: 0.45 }) {
  if (!scene?.sound || scene.sound.mute) {
    return;
  }
  if (!scene.cache?.audio?.exists(key)) {
    return;
  }
  scene.sound.play(key, config);
}
