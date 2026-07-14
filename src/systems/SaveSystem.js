import ArcherTower from '../entities/buildings/ArcherTower.js';
import Cannon from '../entities/buildings/Cannon.js';
import MissileTower from '../entities/buildings/MissileTower.js';
import Wall from '../entities/buildings/Wall.js';
import ResourceExtractor from '../entities/buildings/ResourceExtractor.js';

/** Standart 3 kayıt slotu */
export const SAVE_SLOT_KEYS = ['save-slot-1', 'save-slot-2', 'save-slot-3'];
export const DEFAULT_SAVE_SLOT = SAVE_SLOT_KEYS[0];

/** BuildingClass.id -> class eşlemesi (yüklemede type alanından class bulmak için) */
export const BUILDING_BY_ID = {
  [ArcherTower.id]: ArcherTower,
  [Cannon.id]: Cannon,
  [MissileTower.id]: MissileTower,
  [Wall.id]: Wall,
  [ResourceExtractor.id]: ResourceExtractor,
};

/**
 * 3 slotlu kaydetme/yükleme (localStorage).
 *
 * Bilinçli olarak kaydedilmeyenler: düşmanlar, dalga durumu, kaynak node tükenme durumu.
 * Yüklemede bu alanlar sıfırdan (dolu kaynaklar + yeniden spawn düşmanlar) başlar.
 */
export default class SaveSystem {
  /**
   * MainScene durumunu kaydedilebilir bir JSON objesine çevirir.
   * @param {import('../scenes/MainScene.js').default} scene
   */
  serialize(scene) {
    const { player, fogOfWarSystem, buildingSystem } = scene;

    return {
      player: {
        x: player.x,
        y: player.y,
        health: player.health,
        maxHealth: player.maxHealth,
        level: player.level,
        killCount: player.killCount,
        gold: player.gold,
        resources: player.resources,
      },
      chunks: fogOfWarSystem.chunks.map((chunk) => ({
        col: chunk.col,
        row: chunk.row,
        isUnlocked: chunk.isUnlocked,
      })),
      unlockedCount: fogOfWarSystem.unlockedCount,
      buildings: buildingSystem.buildings
        .filter((building) => building.isAlive)
        .map((building) => ({
          type: building.constructor.id,
          x: building.x,
          y: building.y,
          health: building.health,
          upgradeLevel: building.level,
        })),
      savedAt: Date.now(),
    };
  }

  /**
   * @param {import('../scenes/MainScene.js').default} scene
   * @param {string} [slotKey]
   * @returns {object} kaydedilen veri
   */
  saveToSlot(scene, slotKey = DEFAULT_SAVE_SLOT) {
    const data = this.serialize(scene);
    localStorage.setItem(slotKey, JSON.stringify(data));
    return data;
  }

  /**
   * @param {string} [slotKey]
   * @returns {object|null}
   */
  loadFromSlot(slotKey = DEFAULT_SAVE_SLOT) {
    const raw = localStorage.getItem(slotKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn('SaveSystem: kayıt okunamadı, siliniyor.', error);
      this.deleteSlot(slotKey);
      return null;
    }
  }

  /**
   * @param {string} [slotKey]
   * @returns {boolean}
   */
  hasSave(slotKey = DEFAULT_SAVE_SLOT) {
    return localStorage.getItem(slotKey) !== null;
  }

  /** En az bir slotta kayıt var mı? */
  hasAnySave() {
    return SAVE_SLOT_KEYS.some((slotKey) => this.hasSave(slotKey));
  }

  /**
   * @param {string} [slotKey]
   */
  deleteSlot(slotKey = DEFAULT_SAVE_SLOT) {
    localStorage.removeItem(slotKey);
  }

  /**
   * 3 slotun özet bilgisini döner (menü slot seçim ekranı için).
   * Dolu slot: { slotKey, slotIndex, empty: false, savedAt, level, gold }
   * Boş slot: { slotKey, slotIndex, empty: true }
   * @returns {Array<object>}
   */
  getAllSlotsInfo() {
    return SAVE_SLOT_KEYS.map((slotKey, index) => {
      const data = this.loadFromSlot(slotKey);

      if (!data) {
        return {
          slotKey,
          slotIndex: index + 1,
          empty: true,
        };
      }

      return {
        slotKey,
        slotIndex: index + 1,
        empty: false,
        savedAt: data.savedAt ?? null,
        level: data.player?.level ?? 1,
        gold: data.player?.gold ?? 0,
      };
    });
  }
}
