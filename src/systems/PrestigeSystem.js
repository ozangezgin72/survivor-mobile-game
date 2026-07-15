import {
  PRESTIGE_POINTS_PER_LEVEL,
  PRESTIGE_POINTS_PER_KILL,
  PRESTIGE_POINTS_PER_BUILDING_LEVEL,
  PRESTIGE_STORAGE_KEY,
  PRESTIGE_COUNT_STORAGE_KEY,
} from '../config/Constants.js';
import { GameEvents } from '../config/Events.js';

/**
 * Prestij puanı hesaplama, kalıcı bakiye (localStorage) ve sıfırlama akışı.
 * Prestij sayısı (kaç kez prestij yapıldığı) hiç azalmayan ayrı bir sayaçtır.
 */
export default class PrestigeSystem {
  constructor(scene, prestigePrompt) {
    this.scene = scene;
    this.prestigePrompt = prestigePrompt;
    this.handleMapFullyUnlocked = this.handleMapFullyUnlocked.bind(this);

    this.scene.events.on(GameEvents.MAP_FULLY_UNLOCKED, this.handleMapFullyUnlocked);
  }

  /**
   * Mevcut run'dan kazanılacak prestij puanı.
   * floor(level*2 + kills*0.1 + sum(building.currentPowerLevel)*5)
   */
  calculatePrestigeGain(scene = this.scene) {
    const player = scene.player;
    const buildings = scene.buildingSystem?.buildings ?? [];

    const levelPoints = (player?.level ?? 1) * PRESTIGE_POINTS_PER_LEVEL;
    const killPoints = (player?.killCount ?? 0) * PRESTIGE_POINTS_PER_KILL;
    const buildingPowerSum = buildings.reduce(
      (sum, building) => sum + (building.currentPowerLevel ?? 0),
      0,
    );
    const buildingPoints = buildingPowerSum * PRESTIGE_POINTS_PER_BUILDING_LEVEL;

    return Math.floor(levelPoints + killPoints + buildingPoints);
  }

  getTotalPrestigePoints() {
    try {
      const raw = localStorage.getItem(PRESTIGE_STORAGE_KEY);
      const value = raw == null ? 0 : Number(raw);
      return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    } catch {
      return 0;
    }
  }

  /** Kaç kez "Prestij Yap" yapıldığı — asla azalmaz */
  getTotalPrestigeCount() {
    try {
      const raw = localStorage.getItem(PRESTIGE_COUNT_STORAGE_KEY);
      const value = raw == null ? 0 : Number(raw);
      return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    } catch {
      return 0;
    }
  }

  incrementPrestigeCount() {
    const next = this.getTotalPrestigeCount() + 1;

    try {
      localStorage.setItem(PRESTIGE_COUNT_STORAGE_KEY, String(next));
    } catch {
      // private mode / quota
    }

    return next;
  }

  addPrestigePoints(amount) {
    const gain = Math.max(0, Math.floor(amount));
    const next = this.getTotalPrestigePoints() + gain;

    try {
      localStorage.setItem(PRESTIGE_STORAGE_KEY, String(next));
    } catch {
      // private mode / quota — sessizce yut
    }

    this.scene.events.emit(GameEvents.PRESTIGE_CHANGED, next);
    return next;
  }

  /**
   * Kalıcı prestij bakiyesinden harcar.
   * @returns {boolean}
   */
  spendPrestigePoints(amount) {
    const cost = Math.max(0, Math.floor(amount));
    if (cost <= 0) {
      return true;
    }

    const current = this.getTotalPrestigePoints();
    if (current < cost) {
      return false;
    }

    const next = current - cost;
    try {
      localStorage.setItem(PRESTIGE_STORAGE_KEY, String(next));
    } catch {
      return false;
    }

    this.scene.events.emit(GameEvents.PRESTIGE_CHANGED, next);
    return true;
  }

  /**
   * Prestij Yap: puan ekle, sayaç +1, save slot sil, yeni oyun başlat.
   * @returns {{ gain: number, total: number } | null}
   */
  performPrestige() {
    const gain = this.calculatePrestigeGain();
    const total = this.addPrestigePoints(gain);
    this.incrementPrestigeCount();
    const slotKey = this.scene.currentSlotKey;

    this.scene.saveSystem?.deleteSlot(slotKey);
    this.prestigePrompt?.hide();

    this.scene.scene.restart({
      slotKey,
      prestigeBanner: { gain, total },
    });

    return { gain, total };
  }

  handleMapFullyUnlocked() {
    const gain = this.calculatePrestigeGain();
    this.prestigePrompt?.show(gain);
  }

  destroy() {
    this.scene.events.off(GameEvents.MAP_FULLY_UNLOCKED, this.handleMapFullyUnlocked);
  }
}
