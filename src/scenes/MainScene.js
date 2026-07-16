import Phaser from 'phaser';
import Player from '../entities/Player.js';
import JoystickController from '../ui/JoystickController.js';
import Minimap from '../ui/Minimap.js';
import HUD from '../ui/HUD.js';
import BuildMenu from '../ui/BuildMenu.js';
import UnlockPrompt from '../ui/UnlockPrompt.js';
import UpgradePrompt from '../ui/UpgradePrompt.js';
import WaveBanner from '../ui/WaveBanner.js';
import EnemySpawner from '../systems/EnemySpawner.js';
import CombatSystem from '../systems/CombatSystem.js';
import GoldSystem from '../systems/GoldSystem.js';
import AudioSystem from '../systems/AudioSystem.js';
import { preloadGameSounds } from '../utils/GameSounds.js';
import BuildingSystem from '../systems/BuildingSystem.js';
import ResourceSystem from '../systems/ResourceSystem.js';
import FogOfWarSystem from '../systems/FogOfWarSystem.js';
import DifficultySystem from '../systems/DifficultySystem.js';
import WaveSystem from '../systems/WaveSystem.js';
import PrestigeSystem from '../systems/PrestigeSystem.js';
import ScoreSystem from '../systems/ScoreSystem.js';
import SaveSystem, { BUILDING_BY_ID, DEFAULT_SAVE_SLOT } from '../systems/SaveSystem.js';
import PrestigePrompt from '../ui/PrestigePrompt.js';
import {
  createGoldTexture,
  createWallTexture,
} from '../utils/PlaceholderTextures.js';
import {
  PAWN_SPRITE,
  LANCER_SPRITE,
  WARRIOR_SPRITE,
  RED_ARCHER_SPRITE,
  loadEnemySpriteSheets,
} from '../utils/EnemySprites.js';
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CHUNK_GRID_COLS,
  CHUNK_GRID_ROWS,
  PLAYER_ATTACK_DAMAGE,
  PLAYER_LEVEL_UP_DAMAGE_BONUS,
  PLAYER_SPRITE_FRAME_SIZE,
  TERRAIN_TILE_SIZE,
  TERRAIN_COLOR_VARIANTS,
  AUTO_SAVE_INTERVAL,
} from '../config/Constants.js';
import { GameEvents } from '../config/Events.js';

const ARCHER_SPRITE_DIR =
  'assets/sprites/Tiny Swords (Free Pack)/Units/Blue Units/Archer';

const TERRAIN_DIR = 'assets/sprites/Tiny Swords (Free Pack)/Terrain/Tileset';

const BUILDINGS_DIR = 'assets/sprites/Tiny Swords (Free Pack)/Buildings/Blue Buildings';

const RESOURCES_DIR = 'assets/sprites/Tiny Swords (Free Pack)/Terrain/Resources';

/**
 * Oyunun ana sahnesi.
 *
 * Faz 1: büyük dünya + kamera takibi + joystick/klavye ile karakter hareketi.
 * Faz 2: düşman spawn (EnemySpawner) + otomatik savaş (CombatSystem) + altın
 * toplama (GoldSystem) + basit HUD.
 * Faz 3: inşa sistemi (BuildingSystem + BuildMenu) + kuleler artık CombatSystem'e
 * dahil + duvarlar düşman hareketini engelliyor + aktif kaynak toplama (ResourceSystem).
 * Faz 4: fog of war / harita genişletme (FogOfWarSystem + UnlockPrompt) + Minimap artık
 * gerçek chunk grid'ini gösteriyor + EnemySpawner/BuildingSystem/ResourceSystem chunk-aware.
 * Faz 5: zorluk artışı + yeni düşman tipleri (DifficultySystem) + dalga sistemi
 * (WaveSystem + WaveBanner) + kaynakla bina yükseltme (UpgradePrompt) + oyuncu seviyesi.
 * Sahne bilerek "ince" tutuluyor; gerçek mantık ayrı sistem/entity dosyalarında yaşıyor.
 */
export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  init(data = {}) {
    // scene.start/restart('MainScene', { loadedSaveData, slotKey, prestigeBanner }) ile gelir
    this.loadedSaveData = data.loadedSaveData ?? null;
    this.currentSlotKey = data.slotKey ?? DEFAULT_SAVE_SLOT;
    this.prestigeBannerData = data.prestigeBanner ?? null;
  }

  preload() {
    const frame = { frameWidth: PLAYER_SPRITE_FRAME_SIZE, frameHeight: PLAYER_SPRITE_FRAME_SIZE };

    this.load.spritesheet('archer-idle', `${ARCHER_SPRITE_DIR}/Archer_Idle.png`, frame);
    this.load.spritesheet('archer-run', `${ARCHER_SPRITE_DIR}/Archer_Run.png`, frame);
    this.load.spritesheet('archer-shoot', `${ARCHER_SPRITE_DIR}/Archer_Shoot.png`, frame);
    // Arrow 64x64 tek kare — ileride projectile için; şimdilik yükleniyor
    this.load.spritesheet('arrow', `${ARCHER_SPRITE_DIR}/Arrow.png`, {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Tiny Swords terrain: 576x384, 64x64 kareler (9x6) — 5 renk varyantı
    const tileFrame = { frameWidth: TERRAIN_TILE_SIZE, frameHeight: TERRAIN_TILE_SIZE };
    for (let i = 1; i <= TERRAIN_COLOR_VARIANTS; i += 1) {
      this.load.spritesheet(`terrain-color${i}`, `${TERRAIN_DIR}/Tilemap_color${i}.png`, tileFrame);
    }

    // Tiny Swords Red Units — 4 düşman tipi
    loadEnemySpriteSheets(this, PAWN_SPRITE);
    loadEnemySpriteSheets(this, LANCER_SPRITE);
    loadEnemySpriteSheets(this, WARRIOR_SPRITE);
    loadEnemySpriteSheets(this, RED_ARCHER_SPRITE);

    // Tiny Swords Blue Buildings — statik PNG (Wall için uygun sprite yok → placeholder)
    this.load.image('archer-tower', `${BUILDINGS_DIR}/Tower.png`);
    this.load.image('cannon', `${BUILDINGS_DIR}/Barracks.png`);
    this.load.image('missile-tower', `${BUILDINGS_DIR}/Castle.png`);
    this.load.image('resource-extractor', `${BUILDINGS_DIR}/House1.png`);

    // Tiny Swords Resources — ağaç (sheet, idle frame 0) + taş (Gold Stone)
    this.load.spritesheet('resource-node-tree', `${RESOURCES_DIR}/Wood/Trees/Tree1.png`, {
      frameWidth: 192,
      frameHeight: 256,
    });
    this.load.image(
      'resource-node-rock',
      `${RESOURCES_DIR}/Gold/Gold Stones/Gold Stone 1.png`,
    );

    // Kenney UI + RPG Audio
    preloadGameSounds(this);
  }

  create() {
    this.createPlaceholderTextures();
    this.createWorld();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();

    // Kurulum sırası önemli: ResourceSystem, FogOfWarSystem'in ilk chunk'ı doldurması için
    // önceden var olmalı; BuildingSystem <-> FogOfWarSystem dairesel bağımlılığı ise
    // fogOfWarSystem'in gecikmeli atanmasıyla kırılıyor (bkz. BuildingSystem.js üstü not).
    this.buildingSystem = new BuildingSystem(this, this.player);
    this.resourceSystem = new ResourceSystem(this, this.player, this.buildingSystem);
    this.fogOfWarSystem = new FogOfWarSystem(this, this.player, this.resourceSystem);
    this.buildingSystem.fogOfWarSystem = this.fogOfWarSystem;

    this.difficultySystem = new DifficultySystem(this, this.fogOfWarSystem);
    this.enemySpawner = new EnemySpawner(this, this.player, this.fogOfWarSystem, this.difficultySystem);
    this.waveSystem = new WaveSystem(this, this.player, this.enemySpawner);
    this.combatSystem = new CombatSystem(this, this.player, this.enemySpawner, this.buildingSystem);
    this.goldSystem = new GoldSystem(this, this.player);
    this.audioSystem = new AudioSystem(this, this.player);
    this.saveSystem = new SaveSystem();
    this.prestigePrompt = new PrestigePrompt(this, null);
    this.prestigeSystem = new PrestigeSystem(this, this.prestigePrompt);
    this.prestigePrompt.prestigeSystem = this.prestigeSystem;
    this.scoreSystem = new ScoreSystem(this);

    this.minimap = new Minimap(this, this.player, this.fogOfWarSystem, this.enemySpawner);
    this.hud = new HUD(this, this.player);
    this.buildMenu = new BuildMenu(this, this.player, this.buildingSystem);
    this.unlockPrompt = new UnlockPrompt(this, this.player, this.fogOfWarSystem);
    this.upgradePrompt = new UpgradePrompt(this, this.player, this.buildingSystem);
    this.waveBanner = new WaveBanner(this, this.waveSystem);

    this.createDebugOverlay();
    this.setupAutoSave();

    if (this.loadedSaveData) {
      // Yükleme sırasında unlockChunk/restore tetiklenen event'ler gereksiz kayıt yazmasın
      this.suppressAutoSave = true;
      this.applySaveData(this.loadedSaveData);
      this.loadedSaveData = null;
      this.suppressAutoSave = false;
      this.audioSystem.syncFromPlayer();
      // Kayıt zaten tam haritaysa prestij prompt'unu bir kez tetikle
      this.fogOfWarSystem.checkMapFullyUnlocked();
    }

    if (this.prestigeBannerData) {
      const { gain, total } = this.prestigeBannerData;
      this.prestigeBannerData = null;
      this.events.emit(GameEvents.PRESTIGE_COMPLETED, { gain, total });
      this.prestigePrompt.showCompletionBanner(gain, total);
    }
  }

  /**
   * Otomatik kayıt: chunk açma, bina yerleştirme/yükseltme, ve periyodik (30sn).
   * Ölümde kayıt SİLİNMEZ — son başarılı auto-save'ten "DEVAM ET" ile dönülebilir.
   */
  setupAutoSave() {
    this.suppressAutoSave = false;
    this.handleAutoSave = this.handleAutoSave.bind(this);

    this.events.on(GameEvents.CHUNK_UNLOCKED, this.handleAutoSave);
    this.events.on(GameEvents.BUILDING_PLACED, this.handleAutoSave);
    this.events.on(GameEvents.BUILDING_UPGRADED, this.handleAutoSave);

    this.autoSaveTimer = this.time.addEvent({
      delay: AUTO_SAVE_INTERVAL,
      loop: true,
      callback: () => {
        if (this.player.isAlive) {
          this.handleAutoSave();
        }
      },
    });
  }

  handleAutoSave() {
    if (this.suppressAutoSave || !this.saveSystem) {
      return;
    }

    this.saveSystem.saveToSlot(this, this.currentSlotKey);
  }

  /**
   * Kayıttan devam: player/chunk/bina durumunu geri yükler.
   * Düşmanlar, dalga ve kaynak node tükenme durumu bilinçli olarak kaydedilmez —
   * FogOfWar unlock sırasında node'lar yeniden doldurulur, düşmanlar spawner ile gelir.
   */
  applySaveData(saveData) {
    if (!saveData?.player) {
      return;
    }

    const { player: savedPlayer } = saveData;

    this.player.sprite.setPosition(savedPlayer.x, savedPlayer.y);
    this.player.level = savedPlayer.level ?? 1;
    this.player.killCount = savedPlayer.killCount ?? 0;
    this.player.maxHealth = savedPlayer.maxHealth ?? this.player.maxHealth;
    this.player.health = savedPlayer.health ?? this.player.maxHealth;
    this.player.gold = savedPlayer.gold ?? 0;
    this.player.resources = savedPlayer.resources ?? 0;
    this.player.attackDamage = PLAYER_ATTACK_DAMAGE + (this.player.level - 1) * PLAYER_LEVEL_UP_DAMAGE_BONUS;
    this.player.speed = this.player.getSpeedForLevel(this.player.level);
    this.player.isAlive = this.player.health > 0;

    this.fogOfWarSystem.lastValidX = savedPlayer.x;
    this.fogOfWarSystem.lastValidY = savedPlayer.y;
    this.fogOfWarSystem.unlockedCount = saveData.unlockedCount ?? 0;

    if (Array.isArray(saveData.chunks)) {
      for (const chunkData of saveData.chunks) {
        if (!chunkData.isUnlocked) {
          continue;
        }

        const chunk = this.fogOfWarSystem.grid[chunkData.row]?.[chunkData.col];

        if (!chunk || chunk.isUnlocked) {
          continue; // merkez chunk zaten unlockInitialChunk ile açık + populate edilmiş
        }

        this.fogOfWarSystem.unlockChunk(chunk);
      }
    }

    if (Array.isArray(saveData.buildings)) {
      for (const buildingData of saveData.buildings) {
        const BuildingClass = BUILDING_BY_ID[buildingData.type];

        if (!BuildingClass) {
          continue;
        }

        this.buildingSystem.restoreBuilding(BuildingClass, buildingData.x, buildingData.y, {
          health: buildingData.health,
          currentPowerLevel: buildingData.currentPowerLevel ?? buildingData.upgradeLevel,
        });
      }
    }

    this.events.emit(GameEvents.PLAYER_HEALTH_CHANGED, this.player.health, this.player.maxHealth);
    this.events.emit(GameEvents.PLAYER_GOLD_CHANGED, this.player.gold);
    this.events.emit(GameEvents.PLAYER_RESOURCES_CHANGED, this.player.resources);

    this.minimap.drawChunks();
    this.minimap.updatePlayerDot();
    this.enemySpawner.refreshLivingEnemyStatsIfNeeded(true);
  }

  update(time, delta) {
    // Sekme focus kaybı / frame hitch sonrası aşırı büyük delta, hız/mesafe hesaplarını
    // bozmasın diye üst sınır (≈30 FPS altı tek kare).
    const clampedDelta = Math.min(delta, 33);

    const moveVector = this.resolveMoveVector();
    this.player.move(moveVector);

    // Oyuncunun sis içine adım atmasını engelle - fiziksel hareketten hemen sonra çağrılmalı
    this.fogOfWarSystem.update(time, clampedDelta);

    const walls = this.buildingSystem.getWalls();
    this.enemySpawner.update(time, clampedDelta, walls);
    this.waveSystem.update(time, clampedDelta);
    this.combatSystem.update(time, clampedDelta);
    this.goldSystem.update(time, clampedDelta);
    this.resourceSystem.update(time, clampedDelta);
    this.buildingSystem.update(time, clampedDelta);
    this.buildMenu.update(time, clampedDelta);
    this.unlockPrompt.update(time, clampedDelta);
    this.upgradePrompt.update(time, clampedDelta);
    this.waveBanner.update(time, clampedDelta);
    this.minimap.update(time, clampedDelta);

    this.updateDebugOverlay();
  }

  // --- Kurulum adımları ---

  createPlaceholderTextures() {
    // Zemin/düşman/kule/kaynak node: Tiny Swords (preload)
    // Wall: Decorations'da çit/duvar yok → placeholder kalır
    createGoldTexture(this);
    createWallTexture(this);
  }

  createWorld() {
    // Fizik dünyasının sınırları: karakter (collideWorldBounds: true ile) bu alanın dışına çıkamaz
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Zemin artık FogOfWarSystem → Chunk.renderGroundTexture() ile chunk-bazlı çiziliyor
    // (power seviyesine göre Tilemap_color1..5). Tek büyük tileSprite yok.

    // Dünyanın bittiği yeri gözle görülür kılan kırmızı çerçeve
    this.worldBorder = this.add.rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.worldBorder.setOrigin(0, 0);
    this.worldBorder.setStrokeStyle(8, 0xff3b3b, 0.9);
    this.worldBorder.setDepth(1);
  }

  createPlayer() {
    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
  }

  setupCamera() {
    const camera = this.cameras.main;

    // Kamera haritanın dışına çıkamaz
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Anında takip — düşük lerp (örn. 0.1) duruştan harekete geçerken kameranın
    // kademeli yetişmesi "spin-up" (yavaş başlayıp hızlanma) hissi yaratıyordu.
    camera.startFollow(this.player.sprite, true, 1, 1);
  }

  setupInput() {
    // Klavye (WASD + ok tuşları) - geliştirme/test kolaylığı için, asıl hedef touch joystick
    this.cursorKeys = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Mobil dokunmatik sanal joystick - asıl kontrol yöntemi
    this.joystickController = new JoystickController(this);
  }

  // --- Update yardımcıları ---

  /** Joystick basılıysa onu, değilse klavyeyi kullanarak hareket vektörünü döndürür */
  resolveMoveVector() {
    if (this.joystickController.isActive()) {
      return this.joystickController.getVector();
    }

    return this.getKeyboardVector();
  }

  getKeyboardVector() {
    const vector = { x: 0, y: 0 };

    if (this.cursorKeys.left.isDown || this.wasdKeys.left.isDown) vector.x -= 1;
    if (this.cursorKeys.right.isDown || this.wasdKeys.right.isDown) vector.x += 1;
    if (this.cursorKeys.up.isDown || this.wasdKeys.up.isDown) vector.y -= 1;
    if (this.cursorKeys.down.isDown || this.wasdKeys.down.isDown) vector.y += 1;

    return vector;
  }

  // --- Geliştirme amaçlı debug overlay ---
  // NOT: Bu sadece test/doğrulama içindir, ileride kaldırılabilir. HUD (sağlık/altın/kaynak)
  // bloğunun altına (y: 116) konumlandırıldı ki üst üste binmesin.

  createDebugOverlay() {
    this.debugText = this.add.text(24, 116, '', {
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 6, y: 4 },
    });
    this.debugText.setScrollFactor(0);
    this.debugText.setDepth(2000);
  }

  updateDebugOverlay() {
    const inputSource = this.joystickController.isActive() ? 'joystick' : 'keyboard';
    const gatheringInfo = this.resourceSystem.isGathering ? 'toplanıyor' : '-';
    const unlockedChunks = this.fogOfWarSystem.chunks.filter((chunk) => chunk.isUnlocked).length;
    const totalChunks = CHUNK_GRID_COLS * CHUNK_GRID_ROWS;
    const difficultyMultiplier = this.difficultySystem.getStatMultiplier().toFixed(2);
    const wavePhase = this.waveSystem.isWaveActive() ? 'AKTİF' : this.waveSystem.isWarningActive() ? 'UYARI' : 'bekleniyor';

    this.debugText.setText(
      [
        `pos: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
        `dir: ${this.player.direction} moving: ${this.player.isMoving} (${inputSource})`,
        `enemies: ${this.enemySpawner.enemies.length}/${this.enemySpawner.getMaxEnemyCount()}  buildings: ${this.buildingSystem.buildings.length}`,
        `kaynak: ${gatheringInfo}  chunks: ${unlockedChunks}/${totalChunks}`,
        `zorluk: x${difficultyMultiplier}  dalga: ${wavePhase}  öldürme: ${this.player.killCount}`,
      ].join('\n'),
    );
  }
}
