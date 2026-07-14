import Phaser from 'phaser';
import './style.css';
import GameConfig from './config/GameConfig.js';
import MenuScene from './scenes/MenuScene.js';
import MainScene from './scenes/MainScene.js';

// Sahneler bilerek GameConfig.js içinde değil burada ekleniyor, böylece config
// dosyası sahnelerden bağımsız/temiz kalıyor ve yeni sahne eklemek tek satır oluyor.
const config = {
  ...GameConfig,
  scene: [MenuScene, MainScene],
};

const game = new Phaser.Game(config);

// Tarayıcı konsolundan hızlıca inceleme yapmak için (örn. game.scene.keys.MainScene.player)
window.game = game;
