import { GameEvents } from '../config/Events.js';
import {
  MINIMAP_WIDTH,
  MINIMAP_HEIGHT,
  MINIMAP_MARGIN,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CHUNK_GRID_COLS,
  CHUNK_GRID_ROWS,
} from '../config/Constants.js';

const LOCKED_CELL_COLOR = 0x1a1a1a;
const UNLOCKED_CELL_COLOR = 0x3a7d44;
const ENEMY_DOT_COLOR = 0xff5252;
const ENEMY_DOT_RADIUS = 2;

/**
 * Minimap (Faz 4'te gerçek işlevine kavuştu).
 *
 * Chunk grid'ini küçültülmüş kareler olarak çizer: unlocked chunk'lar açık yeşil,
 * locked chunk'lar koyu/kilitli görünür. Oyuncunun konumu küçük bir mavi nokta ile,
 * canlı düşmanlar ise her frame yeniden çizilen küçük kırmızı noktalarla gösterilir.
 * Grid, chunk durumu her değiştiğinde (CHUNK_UNLOCKED event'i) yeniden çiziliyor;
 * oyuncu/düşman noktaları ise her frame güncelleniyor.
 */
export default class Minimap {
  constructor(scene, player, fogOfWarSystem, enemySpawner) {
    this.scene = scene;
    this.player = player;
    this.fogOfWarSystem = fogOfWarSystem;
    this.enemySpawner = enemySpawner;

    this.cellWidth = MINIMAP_WIDTH / CHUNK_GRID_COLS;
    this.cellHeight = MINIMAP_HEIGHT / CHUNK_GRID_ROWS;

    const { x, y } = this.getMinimapPosition();
    this.x = x;
    this.y = y;

    this.background = scene.add.rectangle(this.x, this.y, MINIMAP_WIDTH, MINIMAP_HEIGHT, 0x000000, 0.5);
    this.background.setOrigin(0, 0);
    this.background.setStrokeStyle(2, 0xffffff, 0.8);
    this.background.setScrollFactor(0);
    this.background.setDepth(1000);

    this.gridGraphics = scene.add.graphics();
    this.gridGraphics.setScrollFactor(0);
    this.gridGraphics.setDepth(1001);

    // Düşman noktaları oyuncu noktasının altında kalsın (oyuncu her zaman üstte görünsün)
    this.enemyDotsGraphics = scene.add.graphics();
    this.enemyDotsGraphics.setScrollFactor(0);
    this.enemyDotsGraphics.setDepth(1001);

    this.playerDot = scene.add.circle(this.x, this.y, 4, 0x4fc3f7);
    this.playerDot.setStrokeStyle(1, 0xffffff, 1);
    this.playerDot.setScrollFactor(0);
    this.playerDot.setDepth(1002);

    this.handleChunkUnlocked = this.handleChunkUnlocked.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.scene.events.on(GameEvents.CHUNK_UNLOCKED, this.handleChunkUnlocked);
    this.scene.scale.on('resize', this.handleResize);

    this.drawChunks();
    this.updatePlayerDot();
    this.updateEnemyDots();
  }

  getMinimapPosition() {
    return {
      x: this.scene.scale.width - MINIMAP_WIDTH - MINIMAP_MARGIN,
      y: MINIMAP_MARGIN,
    };
  }

  /** Oyuncu + düşman noktaları her frame güncellenir; chunk grid'i event ile tetiklenir */
  update() {
    this.updatePlayerDot();
    this.updateEnemyDots();
  }

  drawChunks() {
    this.gridGraphics.clear();

    for (const chunk of this.fogOfWarSystem.chunks) {
      const cellX = this.x + chunk.col * this.cellWidth;
      const cellY = this.y + chunk.row * this.cellHeight;

      this.gridGraphics.fillStyle(chunk.isUnlocked ? UNLOCKED_CELL_COLOR : LOCKED_CELL_COLOR, 0.9);
      this.gridGraphics.fillRect(cellX + 1, cellY + 1, this.cellWidth - 2, this.cellHeight - 2);
    }
  }

  updatePlayerDot() {
    const ratioX = this.player.x / WORLD_WIDTH;
    const ratioY = this.player.y / WORLD_HEIGHT;

    this.playerDot.setPosition(this.x + ratioX * MINIMAP_WIDTH, this.y + ratioY * MINIMAP_HEIGHT);
  }

  /** Canlı düşmanları her frame clear + redraw ile küçük kırmızı noktalar olarak çizer */
  updateEnemyDots() {
    this.enemyDotsGraphics.clear();
    this.enemyDotsGraphics.fillStyle(ENEMY_DOT_COLOR, 1);

    for (const enemy of this.enemySpawner.enemies) {
      if (!enemy.isAlive) {
        continue;
      }

      const ratioX = enemy.x / WORLD_WIDTH;
      const ratioY = enemy.y / WORLD_HEIGHT;
      const dotX = this.x + ratioX * MINIMAP_WIDTH;
      const dotY = this.y + ratioY * MINIMAP_HEIGHT;

      this.enemyDotsGraphics.fillCircle(dotX, dotY, ENEMY_DOT_RADIUS);
    }
  }

  repositionForNewScale() {
    const { x, y } = this.getMinimapPosition();
    this.x = x;
    this.y = y;

    this.background.setPosition(this.x, this.y);
    this.drawChunks();
    this.updatePlayerDot();
    this.updateEnemyDots();
  }

  handleChunkUnlocked() {
    this.drawChunks();
  }

  handleResize() {
    this.repositionForNewScale();
  }

  destroy() {
    this.scene.events.off(GameEvents.CHUNK_UNLOCKED, this.handleChunkUnlocked);
    this.scene.scale.off('resize', this.handleResize);
    this.background.destroy();
    this.gridGraphics.destroy();
    this.enemyDotsGraphics.destroy();
    this.playerDot.destroy();
  }
}
