import Phaser from 'phaser';
import { GameEvents } from '../config/Events.js';
import {
  INITIAL_ENEMY_COUNT,
  MAX_ENEMY_COUNT,
  ENEMY_COUNT_PER_CHUNK,
  ENEMY_SPAWN_INTERVAL,
  ENEMY_SPAWN_MIN_DISTANCE,
  ENEMY_SPAWN_MAX_DISTANCE,
  WORLD_WIDTH,
  WORLD_HEIGHT,
} from '../config/Constants.js';

/**
 * Haritada düşman spawn'ını ve yaşam döngüsünü (liste temizliği) yönetir.
 *
 * - Oyun başlar başlamaz (açık alana göre ölçeklenen) bir düşman dalgasıyla haritayı doldurur
 * - Ardından ENEMY_SPAWN_INTERVAL'de bir, güncel tavana ulaşana kadar yeni düşman ekler
 * - Bir düşman ölüp listeden çıkınca (isAlive=false), bir sonraki interval'de otomatik
 *   olarak yerine yeni bir düşman spawn olur -> sürekli akış, boşluk kalmaz
 * - Spawn noktası önce oyuncudan ENEMY_SPAWN_MIN/MAX_DISTANCE arasında (ekranın hemen
 *   dışında, ani belirmeden) denenir; Faz 4: bu noktanın FogOfWarSystem'e göre unlocked
 *   bir chunk'ta olması da şart - sisli/kilitli alanlarda hiç düşman spawn edilmez
 * - Faz 4: Düşman tavanı sabit değil, açılan chunk sayısına göre büyür (bkz. getMaxEnemyCount)
 *   - sadece başlangıç chunk'ı açıkken 18 düşmanın hepsi o küçük alana sıkışıp anında
 *   kuşatma yapmasın diye
 * - Faz 5: Hangi düşman TİPİNİN spawn olacağı (Enemy/FastEnemy/TankEnemy/RangedEnemy) ve
 *   spawn edilen düşmanın health/attackDamage'ının ne kadar ÇARPILACAĞI DifficultySystem'e
 *   devrediliyor (bkz. spawnEnemy). WaveSystem de "dalga" sırasında ekstra düşman eklemek
 *   için doğrudan spawnEnemy()'yi çağırıyor - ayrı bir "wave spawn" metoduna gerek yok.
 */
export default class EnemySpawner {
  constructor(scene, player, fogOfWarSystem, difficultySystem) {
    this.scene = scene;
    this.player = player;
    this.fogOfWarSystem = fogOfWarSystem;
    this.difficultySystem = difficultySystem;
    this.enemies = [];
    this.nextSpawnTime = 0;
    // Canlı düşmanlara zorluk yeniden uygulamak için son bilinen çarpan
    this.lastAppliedMultiplier = 0;

    this.handleChunkUnlocked = this.handleChunkUnlocked.bind(this);
    this.scene.events.on(GameEvents.CHUNK_UNLOCKED, this.handleChunkUnlocked);

    this.spawnInitialWave();
  }

  /** Açık alana göre ölçeklenen, o anki geçerli düşman tavanı (bkz. dosya üstü not) */
  getMaxEnemyCount() {
    const unlockedChunkCount = this.fogOfWarSystem.chunks.filter((chunk) => chunk.isUnlocked).length;
    return Math.min(MAX_ENEMY_COUNT, unlockedChunkCount * ENEMY_COUNT_PER_CHUNK);
  }

  spawnInitialWave() {
    const initialCount = Math.min(INITIAL_ENEMY_COUNT, this.getMaxEnemyCount());

    for (let i = 0; i < initialCount; i += 1) {
      this.spawnEnemy();
    }
  }

  /** @param {import('../entities/buildings/Building.js').default[]} [blockers] - blocksMovement=true olan binalar */
  update(time, delta, blockers) {
    this.removeDeadEnemies();
    // Zaman bazlı zorluk da artsın diye çarpan değişince canlı düşmanları yenile
    this.refreshLivingEnemyStatsIfNeeded();

    for (const enemy of this.enemies) {
      enemy.update(time, delta, this.player, blockers);
    }

    if (time >= this.nextSpawnTime && this.enemies.length < this.getMaxEnemyCount()) {
      this.spawnEnemy();
      this.nextSpawnTime = time + ENEMY_SPAWN_INTERVAL;
    }
  }

  removeDeadEnemies() {
    this.enemies = this.enemies.filter((enemy) => enemy.isAlive);
  }

  handleChunkUnlocked() {
    this.refreshLivingEnemyStatsIfNeeded(true);
  }

  /**
   * Canlı düşmanlara güncel zorluk çarpanını uygular.
   * Önceden sadece spawn anında scaleStats çağrılıyordu; chunk açılınca / süre ilerleyince
   * haritadaki eski düşmanlar zayıf kalıyordu — bu yüzden "zorluk artmıyor" gibi hissediliyordu.
   */
  refreshLivingEnemyStatsIfNeeded(force = false) {
    const multiplier = this.difficultySystem.getStatMultiplier();

    if (!force && Math.abs(multiplier - this.lastAppliedMultiplier) < 0.01) {
      return;
    }

    this.lastAppliedMultiplier = multiplier;

    for (const enemy of this.enemies) {
      if (enemy.isAlive) {
        enemy.scaleStats(multiplier);
      }
    }
  }

  /** @returns {import('../entities/Enemy.js').default|null} spawn edilen düşman (WaveSystem canlılığını takip etmek için kullanır) */
  spawnEnemy() {
    const position = this.getSpawnPosition();

    if (!position) {
      return null; // dünyanın çok küçük/köşe olduğu durumlar için güvenlik, pratikte olmaz
    }

    const EnemyClass = this.difficultySystem.pickRandomEnemyType();
    const enemy = new EnemyClass(this.scene, position.x, position.y);
    const multiplier = this.difficultySystem.getStatMultiplier();
    enemy.scaleStats(multiplier);
    this.lastAppliedMultiplier = multiplier;

    this.enemies.push(enemy);

    return enemy;
  }

  /**
   * Önce oyuncudan ENEMY_SPAWN_MIN/MAX_DISTANCE arasında (ekranın hemen dışında) bir nokta
   * dener; bu, unlocked alan küçükse (örn. sadece başlangıç chunk'ı açıkken) hiç uygun nokta
   * bulamayabilir - bu durumda unlocked alan içinde herhangi bir geçerli noktaya düşer.
   */
  getSpawnPosition() {
    const maxAttempts = 15;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(ENEMY_SPAWN_MIN_DISTANCE, ENEMY_SPAWN_MAX_DISTANCE);

      const x = this.player.x + Math.cos(angle) * distance;
      const y = this.player.y + Math.sin(angle) * distance;

      if (this.isValidSpawnPosition(x, y)) {
        return { x, y };
      }
    }

    return this.getFallbackSpawnPosition();
  }

  isValidSpawnPosition(x, y) {
    if (x < 0 || x > WORLD_WIDTH || y < 0 || y > WORLD_HEIGHT) {
      return false;
    }

    return this.fogOfWarSystem.isPositionUnlocked(x, y);
  }

  /**
   * İdeal (ekran dışı) mesafede uygun nokta bulunamadıysa (örn. sadece küçük bir başlangıç
   * chunk'ı açıkken), unlocked alan içinde rastgele bir nokta dener. Oyuncunun tam üstüne
   * (ani ölüme yol açacak bir kuşatmaya) düşmemesi için en azından FALLBACK_MIN_DISTANCE kadar
   * uzak bir nokta arar; hiç bulamazsa denenenler arasında oyuncudan EN UZAK olanı kullanır.
   */
  getFallbackSpawnPosition() {
    const maxAttempts = 20;
    const fallbackMinDistance = 150;

    let farthestCandidate = null;
    let farthestDistance = -1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const x = Phaser.Math.Between(0, WORLD_WIDTH);
      const y = Phaser.Math.Between(0, WORLD_HEIGHT);

      if (!this.fogOfWarSystem.isPositionUnlocked(x, y)) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);

      if (distance >= fallbackMinDistance) {
        return { x, y };
      }

      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthestCandidate = { x, y };
      }
    }

    return farthestCandidate;
  }

  destroy() {
    this.scene.events.off(GameEvents.CHUNK_UNLOCKED, this.handleChunkUnlocked);

    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies = [];
  }
}
