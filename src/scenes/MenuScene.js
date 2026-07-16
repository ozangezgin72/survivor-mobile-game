import Phaser from 'phaser';
import SaveSystem from '../systems/SaveSystem.js';
import LeaderboardScreen from '../ui/LeaderboardScreen.js';
import { createButton } from '../ui/UIButton.js';
import {
  UI_COLOR_PRIMARY,
  UI_COLOR_PRIMARY_DARK,
  UI_COLOR_BROWN,
  UI_COLOR_BG_DARK,
  UI_COLOR_BG_MID,
  UI_COLOR_CREAM,
  UI_COLOR_TEXT_DARK,
  UI_COLOR_SUCCESS,
  UI_COLOR_SUCCESS_DARK,
  UI_COLOR_DANGER,
  UI_COLOR_DANGER_DARK,
  colorToCss,
  ensureVerticalGradientTexture,
} from '../config/UITheme.js';

const PANEL_DEPTH = 5000;
const SLOT_HEIGHT = 100;
const SLOT_GAP = 12;
const GRADIENT_KEY = 'menu-bg-gradient';

/**
 * Ana menü + 3 slotlu kayıt paneli.
 * Sıcak tonlu flat modern UI (UITheme + UIButton) — önce burada deneniyor.
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.saveSystem = new SaveSystem();
    this.leaderboardScreen = new LeaderboardScreen(this);
    this.slotPanelElements = [];
    this.slotPanelOpen = false;
    this.pendingDeleteSlotKey = null;

    this.handleResize = this.handleResize.bind(this);
    this.scale.on('resize', this.handleResize);

    this.createBackground();
    this.createTitle();
    this.createPlayButton();
    this.createLeaderboardButton();
    this.repositionForNewScale();
  }

  createBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    ensureVerticalGradientTexture(this, GRADIENT_KEY, w, h, UI_COLOR_BG_MID, UI_COLOR_BG_DARK);
    this.background = this.add.image(w / 2, h / 2, GRADIENT_KEY);
    this.background.setDisplaySize(w, h);
    this.background.setDepth(0);
  }

  createTitle() {
    this.titleText = this.add.text(0, 0, 'SURVIVOR\nKINGDOM', {
      fontSize: '58px',
      fontStyle: 'bold',
      color: colorToCss(UI_COLOR_PRIMARY),
      align: 'center',
      stroke: colorToCss(UI_COLOR_BROWN),
      strokeThickness: 10,
      shadow: {
        offsetX: 0,
        offsetY: 6,
        color: '#1a0c06',
        blur: 0,
        stroke: true,
        fill: true,
      },
    });
    this.titleText.setOrigin(0.5, 0.5);
    this.titleText.setDepth(5);
  }

  createPlayButton() {
    this.playButton = createButton(this, 0, 0, 300, 76, 'OYNA', {
      onClick: () => this.openSlotPanel(),
      fillColor: UI_COLOR_PRIMARY,
      shadowColor: UI_COLOR_PRIMARY_DARK,
      fontSize: 34,
      depth: 10,
      shadowOffset: 6,
      cornerRadius: 20,
    });
  }

  createLeaderboardButton() {
    this.leaderboardButton = createButton(this, 0, 0, 300, 60, 'LİDERLİK TABLOSU', {
      onClick: () => this.openLeaderboard(),
      fillColor: UI_COLOR_PRIMARY,
      shadowColor: UI_COLOR_PRIMARY_DARK,
      fontSize: 22,
      depth: 10,
      shadowOffset: 5,
      cornerRadius: 18,
    });
  }

  openLeaderboard() {
    this.leaderboardScreen.show();
  }

  setPlayButtonVisible(visible) {
    this.playButton.setVisible(visible);
  }

  setLeaderboardButtonVisible(visible) {
    this.leaderboardButton.setVisible(visible);
  }

  openSlotPanel() {
    this.destroySlotPanelElementsOnly();
    this.slotPanelOpen = true;
    this.pendingDeleteSlotKey = null;
    this.setPlayButtonVisible(false);
    this.setLeaderboardButtonVisible(false);
    this.buildSlotPanel();
  }

  rebuildSlotPanelKeepingPending() {
    const pendingDelete = this.pendingDeleteSlotKey;
    this.destroySlotPanelElementsOnly();
    this.slotPanelOpen = true;
    this.pendingDeleteSlotKey = pendingDelete;
    this.setPlayButtonVisible(false);
    this.setLeaderboardButtonVisible(false);
    this.buildSlotPanel();
  }

  closeSlotPanel() {
    this.destroySlotPanelElementsOnly();
    this.slotPanelOpen = false;
    this.pendingDeleteSlotKey = null;
    this.setPlayButtonVisible(true);
    this.setLeaderboardButtonVisible(true);
    this.repositionForNewScale();
  }

  destroySlotPanelElementsOnly() {
    for (const element of this.slotPanelElements) {
      if (element?.destroy) {
        element.destroy();
      }
    }
    this.slotPanelElements = [];
  }

  buildSlotPanel() {
    const scaleWidth = this.scale.width;
    const scaleHeight = this.scale.height;
    const panelWidth = Math.min(520, scaleWidth - 40);
    const panelHeight = 420;
    const panelX = scaleWidth / 2;
    const panelY = scaleHeight * 0.55;

    const overlay = this.add.rectangle(scaleWidth / 2, scaleHeight / 2, scaleWidth, scaleHeight, UI_COLOR_BG_DARK, 0.72);
    overlay.setDepth(PANEL_DEPTH);
    overlay.setInteractive();
    this.slotPanelElements.push(overlay);

    const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, UI_COLOR_CREAM, 0.98);
    panel.setStrokeStyle(4, UI_COLOR_BROWN, 1);
    panel.setDepth(PANEL_DEPTH + 1);
    this.slotPanelElements.push(panel);

    const title = this.add.text(panelX, panelY - panelHeight / 2 + 28, 'Slot Seç', {
      fontSize: '24px',
      fontStyle: 'bold',
      color: colorToCss(UI_COLOR_TEXT_DARK),
      stroke: colorToCss(UI_COLOR_CREAM),
      strokeThickness: 2,
    });
    title.setOrigin(0.5, 0.5);
    title.setDepth(PANEL_DEPTH + 2);
    this.slotPanelElements.push(title);

    const slots = this.saveSystem.getAllSlotsInfo();
    const slotsTop = panelY - panelHeight / 2 + 70;

    slots.forEach((slotInfo, index) => {
      this.createSlotRow(slotInfo, panelX, slotsTop + index * (SLOT_HEIGHT + SLOT_GAP), panelWidth - 40);
    });

    const backButton = createButton(this, panelX, panelY + panelHeight / 2 - 36, 160, 44, 'Geri', {
      onClick: () => this.closeSlotPanel(),
      fillColor: UI_COLOR_BROWN,
      shadowColor: 0x5d2e0c,
      fontSize: 18,
      depth: PANEL_DEPTH + 3,
      shadowOffset: 4,
      cornerRadius: 14,
    });
    this.slotPanelElements.push(backButton);
  }

  createSlotRow(slotInfo, centerX, y, width) {
    const row = this.add.rectangle(centerX, y, width, SLOT_HEIGHT, 0xfff6e0, 0.95);
    row.setStrokeStyle(3, UI_COLOR_BROWN, 0.85);
    row.setDepth(PANEL_DEPTH + 2);
    this.slotPanelElements.push(row);

    const summary = slotInfo.empty
      ? `Slot ${slotInfo.slotIndex}: Boş Slot`
      : `Slot ${slotInfo.slotIndex}: Seviye ${slotInfo.level} — ${slotInfo.gold} altın\n${this.formatSavedAt(slotInfo.savedAt)}`;

    const summaryText = this.add.text(centerX - width / 2 + 16, y, summary, {
      fontSize: '15px',
      color: colorToCss(UI_COLOR_TEXT_DARK),
      lineSpacing: 4,
      fontStyle: 'bold',
    });
    summaryText.setOrigin(0, 0.5);
    summaryText.setDepth(PANEL_DEPTH + 3);
    this.slotPanelElements.push(summaryText);

    if (slotInfo.empty) {
      const btn = createButton(this, centerX + width / 2 - 150, y, 120, 40, 'Yeni Oyun', {
        onClick: () => this.startNewGameInSlot(slotInfo.slotKey),
        fillColor: UI_COLOR_SUCCESS,
        shadowColor: UI_COLOR_SUCCESS_DARK,
        fontSize: 14,
        depth: PANEL_DEPTH + 3,
        shadowOffset: 4,
        cornerRadius: 12,
      });
      this.slotPanelElements.push(btn);
      return;
    }

    const loadBtn = createButton(this, centerX + width / 2 - 150, y - 18, 120, 36, 'Yükle', {
      onClick: () => this.loadSlot(slotInfo.slotKey),
      fillColor: UI_COLOR_SUCCESS,
      shadowColor: UI_COLOR_SUCCESS_DARK,
      fontSize: 14,
      depth: PANEL_DEPTH + 3,
      shadowOffset: 4,
      cornerRadius: 12,
    });
    this.slotPanelElements.push(loadBtn);
    this.createDeleteButton(centerX + width / 2 - 150, y + 22, 120, 36, slotInfo.slotKey);
  }

  createDeleteButton(x, y, width, height, slotKey) {
    const isPending = this.pendingDeleteSlotKey === slotKey;
    const label = isPending ? 'Emin misin?' : 'Sil';
    const fill = isPending ? UI_COLOR_DANGER : UI_COLOR_BROWN;
    const shadow = isPending ? UI_COLOR_DANGER_DARK : 0x5d2e0c;

    const btn = createButton(this, x, y, width, height, label, {
      onClick: () => {
        if (this.pendingDeleteSlotKey === slotKey) {
          this.saveSystem.deleteSlot(slotKey);
          this.openSlotPanel();
          return;
        }

        this.pendingDeleteSlotKey = slotKey;
        this.rebuildSlotPanelKeepingPending();
      },
      fillColor: fill,
      shadowColor: shadow,
      fontSize: 14,
      depth: PANEL_DEPTH + 3,
      shadowOffset: 4,
      cornerRadius: 12,
    });
    this.slotPanelElements.push(btn);
  }

  formatSavedAt(savedAt) {
    if (!savedAt) {
      return 'Tarih yok';
    }

    try {
      return new Date(savedAt).toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Tarih yok';
    }
  }

  loadSlot(slotKey) {
    const data = this.saveSystem.loadFromSlot(slotKey);

    if (!data) {
      this.openSlotPanel();
      return;
    }

    this.scene.start('MainScene', { loadedSaveData: data, slotKey });
  }

  startNewGameInSlot(slotKey) {
    this.scene.start('MainScene', { slotKey });
  }

  repositionForNewScale() {
    const scaleWidth = this.scale.width;
    const scaleHeight = this.scale.height;

    ensureVerticalGradientTexture(this, GRADIENT_KEY, scaleWidth, scaleHeight, UI_COLOR_BG_MID, UI_COLOR_BG_DARK);
    this.background.setTexture(GRADIENT_KEY);
    this.background.setPosition(scaleWidth / 2, scaleHeight / 2);
    this.background.setDisplaySize(scaleWidth, scaleHeight);

    this.titleText.setPosition(scaleWidth / 2, scaleHeight * 0.3);

    if (this.slotPanelOpen) {
      this.rebuildSlotPanelKeepingPending();
      return;
    }

    this.playButton.setPosition(scaleWidth / 2, scaleHeight * 0.52);
    this.leaderboardButton.setPosition(scaleWidth / 2, scaleHeight * 0.62);
  }

  handleResize() {
    this.repositionForNewScale();
  }

  shutdown() {
    this.scale.off('resize', this.handleResize);
    this.leaderboardScreen?.destroy();
    this.playButton?.destroy();
    this.leaderboardButton?.destroy();
  }
}
