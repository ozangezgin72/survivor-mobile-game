import { GameEvents } from '../config/Events.js';
import {
  WAVE_INTERVAL,
  WAVE_WARNING_DURATION,
  WAVE_ENEMY_MULTIPLIER,
  WAVE_DURATION_LIMIT,
  WAVE_GOLD_REWARD,
  WAVE_RESOURCE_REWARD,
} from '../config/Constants.js';

const WavePhase = {
  IDLE: 'idle',
  WARNING: 'warning',
  ACTIVE: 'active',
};

/**
 * Periyodik "dalga" sistemi.
 *
 * Akış: IDLE (normal ambient spawn) -> WAVE_INTERVAL saniyede bir WARNING'e geçer
 * (ekranda "Dalga Geliyor!" banner'ı, WAVE_WARNING_DURATION kadar sürer) -> ACTIVE'e geçer
 * (o anki normal düşman tavanının WAVE_ENEMY_MULTIPLIER katı kadar düşman bir kerede
 * ekstra spawn edilir) -> tüm dalga düşmanları ölünce VEYA WAVE_DURATION_LIMIT dolunca
 * tamamlanır (bonus altın/kaynak ödülü) -> IDLE'a döner, sayaç sıfırlanır.
 *
 * Not: ACTIVE sırasında ambient spawn otomatik olarak durur, çünkü EnemySpawner.update()
 * zaten "enemies.length < getMaxEnemyCount()" kontrolü yapıyor ve dalga enemies.length'i
 * bu tavanın çok üzerine çıkarıyor - ekstra bir "duraklat" mantığına gerek yok.
 */
export default class WaveSystem {
  constructor(scene, player, enemySpawner) {
    this.scene = scene;
    this.player = player;
    this.enemySpawner = enemySpawner;

    this.phase = WavePhase.IDLE;
    this.waveNumber = 0;
    this.nextWaveTime = WAVE_INTERVAL; // ilk dalga WAVE_INTERVAL sonra tetiklenir
    this.warningEndsAt = 0;
    this.waveEndsAt = 0;
    this.waveEnemies = [];
  }

  update(time) {
    if (!this.player.isAlive) {
      return; // oyuncu öldüyse dalga akışını duraklat (GAME OVER'da anlamsız olur)
    }

    if (this.phase === WavePhase.IDLE && time >= this.nextWaveTime) {
      this.startWarning();
    } else if (this.phase === WavePhase.WARNING && time >= this.warningEndsAt) {
      this.startWave(time);
    } else if (this.phase === WavePhase.ACTIVE) {
      this.checkWaveCompletion(time);
    }
  }

  startWarning() {
    this.phase = WavePhase.WARNING;
    this.warningEndsAt = this.scene.time.now + WAVE_WARNING_DURATION;
    this.waveNumber += 1;

    this.scene.events.emit(GameEvents.WAVE_WARNING, this.waveNumber);
  }

  startWave(time) {
    this.phase = WavePhase.ACTIVE;
    this.waveEndsAt = time + WAVE_DURATION_LIMIT;
    this.waveEnemies = [];

    const spawnCount = Math.round(this.enemySpawner.getMaxEnemyCount() * WAVE_ENEMY_MULTIPLIER);

    for (let i = 0; i < spawnCount; i += 1) {
      const enemy = this.enemySpawner.spawnEnemy();

      if (enemy) {
        this.waveEnemies.push(enemy);
      }
    }

    this.scene.events.emit(GameEvents.WAVE_STARTED, this.waveNumber);
  }

  checkWaveCompletion(time) {
    const allDead = this.waveEnemies.length > 0 && this.waveEnemies.every((enemy) => !enemy.isAlive);
    const timedOut = time >= this.waveEndsAt;

    if (allDead || timedOut) {
      this.completeWave();
    }
  }

  completeWave() {
    this.phase = WavePhase.IDLE;
    this.nextWaveTime = this.scene.time.now + WAVE_INTERVAL;
    this.waveEnemies = [];

    this.player.addGold(WAVE_GOLD_REWARD);
    this.player.addResources(WAVE_RESOURCE_REWARD);

    this.scene.events.emit(GameEvents.WAVE_COMPLETED, { gold: WAVE_GOLD_REWARD, resources: WAVE_RESOURCE_REWARD });
  }

  isWarningActive() {
    return this.phase === WavePhase.WARNING;
  }

  isWaveActive() {
    return this.phase === WavePhase.ACTIVE;
  }

  /** WaveBanner'ın countdown göstermesi için; sadece IDLE fazdayken anlamlı bir değer döner */
  getSecondsUntilNextWave(time) {
    if (this.phase !== WavePhase.IDLE) {
      return null;
    }

    return Math.max(0, Math.ceil((this.nextWaveTime - time) / 1000));
  }

  destroy() {
    this.waveEnemies = [];
  }
}
