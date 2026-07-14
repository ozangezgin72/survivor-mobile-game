import Chunk from '../entities/Chunk.js';
import { GameEvents } from '../config/Events.js';
import {
  CHUNK_SIZE,
  CHUNK_GRID_COLS,
  CHUNK_GRID_ROWS,
  CHUNK_UNLOCK_BASE_COST,
  CHUNK_UNLOCK_COST_MULTIPLIER,
  CHUNK_UNLOCK_PROMPT_DISTANCE,
  CHUNK_RESOURCE_NODES_PER_CHUNK,
  CHUNK_NODE_EDGE_MARGIN,
} from '../config/Constants.js';

/**
 * Fog of War / harita genişletme sistemi.
 *
 * Harita CHUNK_SIZE x CHUNK_SIZE'lık kare bölgelere (chunk) bölünür (4000/800 -> 5x5 = 25
 * chunk). Başta sadece oyuncunun spawn olduğu merkez chunk açık (unlocked); gerisi sisli
 * (locked). Sadece açık bir chunk'a BİTİŞİK olan chunk'lar açılabilir - bu, haritanın
 * rastgele uzak bir köşeden değil, organik olarak (komşu komşu) büyümesini sağlar.
 *
 * Chunk açma maliyeti global bir eğri izler: her yeni ücretli chunk, kendinden önce
 * açılanın %20 daha pahalısıdır (bkz. CHUNK_UNLOCK_COST_MULTIPLIER).
 */
export default class FogOfWarSystem {
  constructor(scene, player, resourceSystem) {
    this.scene = scene;
    this.player = player;
    this.resourceSystem = resourceSystem;

    this.chunks = [];
    this.grid = []; // grid[row][col]
    this.unlockedCount = 0; // şimdiye kadar ÜCRETLİ açılan chunk sayısı (maliyet eğrisi için)
    this.nearestLockedChunk = null;

    // Oyuncunun sis içine girmesini önlemek için son geçerli (unlocked) konum
    this.lastValidX = player.x;
    this.lastValidY = player.y;

    this.createGrid();
    this.unlockInitialChunk();
  }

  createGrid() {
    for (let row = 0; row < CHUNK_GRID_ROWS; row += 1) {
      const rowChunks = [];

      for (let col = 0; col < CHUNK_GRID_COLS; col += 1) {
        const chunk = new Chunk(this.scene, col, row);
        chunk.createFogVisuals();
        rowChunks.push(chunk);
        this.chunks.push(chunk);
      }

      this.grid.push(rowChunks);
    }
  }

  /** Oyuncunun spawn olduğu merkez chunk ücretsiz ve baştan açık */
  unlockInitialChunk() {
    const centerCol = Math.floor(CHUNK_GRID_COLS / 2);
    const centerRow = Math.floor(CHUNK_GRID_ROWS / 2);
    const centerChunk = this.grid[centerRow][centerCol];

    centerChunk.isUnlocked = true;
    centerChunk.destroy(); // görsel sisi (overlay/kilit ikonu) anında kaldır, tween'e gerek yok
    centerChunk.overlay = null;
    centerChunk.lockIcon = null;

    this.populateChunk(centerChunk);
  }

  update() {
    // Oyuncunun sis içine adım atmasını engelle (bkz. enforcePlayerBounds)
    this.enforcePlayerBounds();
    this.nearestLockedChunk = this.findNearestUnlockableChunk();
  }

  /** Oyuncu unlocked bir bölgedeyse konumunu kaydeder; sisin içindeyse son geçerli noktaya geri iter */
  enforcePlayerBounds() {
    if (this.isPositionUnlocked(this.player.x, this.player.y)) {
      this.lastValidX = this.player.x;
      this.lastValidY = this.player.y;
      return;
    }

    this.player.sprite.x = this.lastValidX;
    this.player.sprite.y = this.lastValidY;
    this.player.sprite.body.setVelocity(0, 0);
  }

  /** Oyuncuya en yakın, açılabilir (komşusu unlocked olan) kilitli chunk'ı bulur */
  findNearestUnlockableChunk() {
    let nearest = null;
    let nearestDistance = CHUNK_UNLOCK_PROMPT_DISTANCE;

    for (const chunk of this.chunks) {
      if (chunk.isUnlocked || !this.isAdjacentToUnlocked(chunk)) {
        continue;
      }

      const distance = chunk.distanceToPoint(this.player.x, this.player.y);

      if (distance <= nearestDistance) {
        nearest = chunk;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  isAdjacentToUnlocked(chunk) {
    return this.getNeighbors(chunk).some((neighbor) => neighbor.isUnlocked);
  }

  getNeighbors(chunk) {
    const offsets = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];
    const neighbors = [];

    for (const [deltaCol, deltaRow] of offsets) {
      const col = chunk.col + deltaCol;
      const row = chunk.row + deltaRow;

      if (col >= 0 && col < CHUNK_GRID_COLS && row >= 0 && row < CHUNK_GRID_ROWS) {
        neighbors.push(this.grid[row][col]);
      }
    }

    return neighbors;
  }

  /** Sıradaki chunk'ı açmanın maliyeti - her ücretli açılışta bir öncekinden %20 artar */
  getUnlockCost() {
    return Math.round(CHUNK_UNLOCK_BASE_COST * CHUNK_UNLOCK_COST_MULTIPLIER ** this.unlockedCount);
  }

  /** UnlockPrompt tarafından çağrılır. @returns {boolean} açma başarılı oldu mu */
  tryUnlockNearestChunk() {
    if (!this.nearestLockedChunk) {
      return false;
    }

    const paid = this.player.spendGold(this.getUnlockCost());

    if (!paid) {
      return false;
    }

    this.unlockChunk(this.nearestLockedChunk);
    this.unlockedCount += 1;

    return true;
  }

  unlockChunk(chunk) {
    chunk.unlock();
    this.populateChunk(chunk);
    this.scene.events.emit(GameEvents.CHUNK_UNLOCKED, chunk);
  }

  /** Yeni açılan bir chunk'a birkaç kaynak node'u ekler (performans: sadece unlocked alanlarda obje var) */
  populateChunk(chunk) {
    const minX = chunk.x + CHUNK_NODE_EDGE_MARGIN;
    const maxX = chunk.x + CHUNK_SIZE - CHUNK_NODE_EDGE_MARGIN;
    const minY = chunk.y + CHUNK_NODE_EDGE_MARGIN;
    const maxY = chunk.y + CHUNK_SIZE - CHUNK_NODE_EDGE_MARGIN;

    this.resourceSystem.addNodesInArea(minX, minY, maxX, maxY, CHUNK_RESOURCE_NODES_PER_CHUNK);
  }

  getChunkAt(x, y) {
    const col = Math.floor(x / CHUNK_SIZE);
    const row = Math.floor(y / CHUNK_SIZE);

    if (row < 0 || row >= CHUNK_GRID_ROWS || col < 0 || col >= CHUNK_GRID_COLS) {
      return null;
    }

    return this.grid[row][col];
  }

  /** EnemySpawner/BuildingSystem tarafından çağrılır: bu dünya noktası sisin dışında (erişilebilir) mi? */
  isPositionUnlocked(x, y) {
    const chunk = this.getChunkAt(x, y);
    return Boolean(chunk && chunk.isUnlocked);
  }

  destroy() {
    for (const chunk of this.chunks) {
      chunk.destroy();
    }
    this.chunks = [];
    this.grid = [];
  }
}
