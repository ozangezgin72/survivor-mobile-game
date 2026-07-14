import Phaser from 'phaser';
import SaveSystem from '../systems/SaveSystem.js';

const PANEL_DEPTH = 5000;
const SLOT_HEIGHT = 100;
const SLOT_GAP = 12;

/**
 * Oyun açılışında gösterilen ana menü + 3 slotlu kayıt seçim paneli.
 *
 * Tek "OYNA" butonu: slot paneli açar.
 * Dolu slot → Yükle (+ Sil, çift tık onay)
 * Boş slot → Yeni Oyun
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.saveSystem = new SaveSystem();
    this.slotPanelElements = [];
    this.slotPanelOpen = false;
    this.pendingDeleteSlotKey = null;

    this.handleResize = this.handleResize.bind(this);
    this.scale.on('resize', this.handleResize);

    this.background = this.add.rectangle(0, 0, 0, 0, 0x101820);

    this.titleText = this.add.text(0, 0, 'SURVIVOR\nKINGDOM', {
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#ffd54f',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.titleText.setOrigin(0.5, 0.5);

    this.createPlayButton();
    this.repositionForNewScale();
  }

  createPlayButton() {
    const buttonWidth = 280;
    const buttonHeight = 72;

    this.playButtonBackground = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x1b5e20, 0.95);
    this.playButtonBackground.setStrokeStyle(3, 0xaed581, 1);
    this.playButtonBackground.setInteractive({ useHandCursor: true });

    this.playButtonLabel = this.add.text(0, 0, 'OYNA', {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffffff',
    });
    this.playButtonLabel.setOrigin(0.5, 0.5);

    this.playButtonBackground.on('pointerover', () => this.playButtonBackground.setFillStyle(0x2e7d32, 0.95));
    this.playButtonBackground.on('pointerout', () => this.playButtonBackground.setFillStyle(0x1b5e20, 0.95));
    this.playButtonBackground.on('pointerdown', () => this.openSlotPanel());
  }

  setPlayButtonVisible(visible) {
    this.playButtonBackground.setVisible(visible);
    this.playButtonLabel.setVisible(visible);
  }

  openSlotPanel() {
    this.destroySlotPanelElementsOnly();
    this.slotPanelOpen = true;
    this.pendingDeleteSlotKey = null;
    this.setPlayButtonVisible(false);
    this.buildSlotPanel();
  }

  rebuildSlotPanelKeepingPending() {
    const pendingDelete = this.pendingDeleteSlotKey;
    this.destroySlotPanelElementsOnly();
    this.slotPanelOpen = true;
    this.pendingDeleteSlotKey = pendingDelete;
    this.setPlayButtonVisible(false);
    this.buildSlotPanel();
  }

  closeSlotPanel() {
    this.destroySlotPanelElementsOnly();
    this.slotPanelOpen = false;
    this.pendingDeleteSlotKey = null;
    this.setPlayButtonVisible(true);
    this.repositionForNewScale();
  }

  destroySlotPanelElementsOnly() {
    for (const element of this.slotPanelElements) {
      element.destroy();
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

    const overlay = this.add.rectangle(scaleWidth / 2, scaleHeight / 2, scaleWidth, scaleHeight, 0x000000, 0.65);
    overlay.setDepth(PANEL_DEPTH);
    overlay.setInteractive();
    this.slotPanelElements.push(overlay);

    const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a2332, 0.98);
    panel.setStrokeStyle(2, 0x90caf9, 1);
    panel.setDepth(PANEL_DEPTH + 1);
    this.slotPanelElements.push(panel);

    const title = this.add.text(panelX, panelY - panelHeight / 2 + 28, 'Slot Seç', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff',
    });
    title.setOrigin(0.5, 0.5);
    title.setDepth(PANEL_DEPTH + 2);
    this.slotPanelElements.push(title);

    const slots = this.saveSystem.getAllSlotsInfo();
    const slotsTop = panelY - panelHeight / 2 + 70;

    slots.forEach((slotInfo, index) => {
      this.createSlotRow(slotInfo, panelX, slotsTop + index * (SLOT_HEIGHT + SLOT_GAP), panelWidth - 40);
    });

    const backButton = this.add.rectangle(panelX, panelY + panelHeight / 2 - 36, 160, 44, 0x424242, 0.95);
    backButton.setStrokeStyle(2, 0xbdbdbd, 1);
    backButton.setDepth(PANEL_DEPTH + 2);
    backButton.setInteractive({ useHandCursor: true });
    backButton.on('pointerdown', () => this.closeSlotPanel());
    this.slotPanelElements.push(backButton);

    const backLabel = this.add.text(panelX, panelY + panelHeight / 2 - 36, 'Geri', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
    });
    backLabel.setOrigin(0.5, 0.5);
    backLabel.setDepth(PANEL_DEPTH + 3);
    this.slotPanelElements.push(backLabel);
  }

  createSlotRow(slotInfo, centerX, y, width) {
    const row = this.add.rectangle(centerX, y, width, SLOT_HEIGHT, 0x263238, 0.95);
    row.setStrokeStyle(2, 0x546e7a, 1);
    row.setDepth(PANEL_DEPTH + 2);
    this.slotPanelElements.push(row);

    const summary = slotInfo.empty
      ? `Slot ${slotInfo.slotIndex}: Boş Slot`
      : `Slot ${slotInfo.slotIndex}: Seviye ${slotInfo.level} — ${slotInfo.gold} altın\n${this.formatSavedAt(slotInfo.savedAt)}`;

    const summaryText = this.add.text(centerX - width / 2 + 16, y, summary, {
      fontSize: '15px',
      color: '#ffffff',
      lineSpacing: 4,
    });
    summaryText.setOrigin(0, 0.5);
    summaryText.setDepth(PANEL_DEPTH + 3);
    this.slotPanelElements.push(summaryText);

    if (slotInfo.empty) {
      this.createSmallButton(centerX + width / 2 - 150, y, 120, 40, 'Yeni Oyun', 0x1b5e20, 0xaed581, () => {
        this.startNewGameInSlot(slotInfo.slotKey);
      });
      return;
    }

    this.createSmallButton(centerX + width / 2 - 150, y - 18, 120, 36, 'Yükle', 0x1b5e20, 0xaed581, () => {
      this.loadSlot(slotInfo.slotKey);
    });
    this.createDeleteButton(centerX + width / 2 - 150, y + 22, 120, 36, slotInfo.slotKey);
  }

  createDeleteButton(x, y, width, height, slotKey) {
    const isPending = this.pendingDeleteSlotKey === slotKey;
    const label = isPending ? 'Emin misin?' : 'Sil';
    const fill = isPending ? 0xb71c1c : 0x5d4037;

    this.createSmallButton(x, y, width, height, label, fill, 0xef9a9a, () => {
      if (this.pendingDeleteSlotKey === slotKey) {
        this.saveSystem.deleteSlot(slotKey);
        this.openSlotPanel();
        return;
      }

      this.pendingDeleteSlotKey = slotKey;
      this.rebuildSlotPanelKeepingPending();
    });
  }

  createSmallButton(x, y, width, height, label, fillColor, strokeColor, onClick) {
    const background = this.add.rectangle(x, y, width, height, fillColor, 0.95);
    background.setStrokeStyle(2, strokeColor, 1);
    background.setDepth(PANEL_DEPTH + 3);
    background.setInteractive({ useHandCursor: true });
    background.on('pointerdown', onClick);
    this.slotPanelElements.push(background);

    const text = this.add.text(x, y, label, {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
    });
    text.setOrigin(0.5, 0.5);
    text.setDepth(PANEL_DEPTH + 4);
    this.slotPanelElements.push(text);
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

    this.background.setPosition(scaleWidth / 2, scaleHeight / 2);
    this.background.setSize(scaleWidth, scaleHeight);
    this.titleText.setPosition(scaleWidth / 2, scaleHeight * 0.32);

    if (this.slotPanelOpen) {
      this.rebuildSlotPanelKeepingPending();
      return;
    }

    this.playButtonBackground.setPosition(scaleWidth / 2, scaleHeight * 0.55);
    this.playButtonLabel.setPosition(scaleWidth / 2, scaleHeight * 0.55);
  }

  handleResize() {
    this.repositionForNewScale();
  }

  shutdown() {
    this.scale.off('resize', this.handleResize);
  }
}
