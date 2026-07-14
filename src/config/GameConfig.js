import Phaser from 'phaser';
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';
import { GAME_WIDTH, GAME_HEIGHT } from './Constants.js';
import { isMobileDevice } from '../utils/DeviceDetector.js';

const isMobile = isMobileDevice();

const gameWidth = isMobile ? GAME_WIDTH : window.innerWidth;
const gameHeight = isMobile ? GAME_HEIGHT : window.innerHeight;

const scaleConfig = isMobile
  ? {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    }
  : {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: window.innerWidth,
      height: window.innerHeight,
    };

// Phaser motorunun temel ayarları burada toplanıyor.
// Sahne listesi (scene) bilerek buraya eklenmedi; main.js sahneleri import edip
// bu config'e ekliyor. Böylece GameConfig.js sahnelerden bağımsız/temiz kalıyor.
const GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: gameWidth,
  height: gameHeight,
  backgroundColor: '#101820',

  scale: scaleConfig,

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // top-down oyun, yerçekimi yok
      debug: false,
    },
  },

  // Joystick + ileride eklenecek dokunmatik butonlar (örn. saldırı butonu) için
  // birden fazla eş zamanlı dokunuşa izin ver
  input: {
    activePointers: 3,
  },

  // rex virtual joystick plugin'i global plugin olarak kaydediliyor
  plugins: {
    global: [
      {
        key: 'rexVirtualJoystick',
        plugin: VirtualJoystickPlugin,
        start: true,
      },
    ],
  },
};

export default GameConfig;
