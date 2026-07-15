import { fetchLeaderboard } from '../services/LeaderboardApi.js';

const OVERLAY_DEPTH = 6000;
const PANEL_WIDTH = 520;
const PANEL_HEIGHT = 640;

/**
 * Top 20 skor listesi — MenuScene ve GameOverScreen'den açılabilir.
 */
export default class LeaderboardScreen {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
    this.isVisible = false;
    this.onCloseCallback = null;
  }

  /**
   * @param {() => void} [onClose]
   */
  async show(onClose) {
    if (this.isVisible) {
      return;
    }

    this.isVisible = true;
    this.onCloseCallback = onClose ?? null;

    const scaleWidth = this.scene.scale.width;
    const scaleHeight = this.scene.scale.height;

    const overlay = this.scene.add.rectangle(scaleWidth / 2, scaleHeight / 2, scaleWidth, scaleHeight, 0x000000, 0.78);
    overlay.setScrollFactor(0);
    overlay.setDepth(OVERLAY_DEPTH);
    this.elements.push(overlay);

    const panelX = scaleWidth / 2;
    const panelY = scaleHeight / 2;
    const panel = this.scene.add.rectangle(panelX, panelY, Math.min(PANEL_WIDTH, scaleWidth - 32), PANEL_HEIGHT, 0x1a237e, 0.98);
    panel.setStrokeStyle(2, 0x9fa8da, 1);
    panel.setScrollFactor(0);
    panel.setDepth(OVERLAY_DEPTH + 1);
    this.elements.push(panel);

    const title = this.scene.add.text(panelX, panelY - PANEL_HEIGHT / 2 + 36, 'Liderlik Tablosu', {
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#e8eaf6',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5, 0.5);
    title.setScrollFactor(0);
    title.setDepth(OVERLAY_DEPTH + 2);
    this.elements.push(title);

    const statusText = this.scene.add.text(panelX, panelY - 20, 'Yükleniyor...', {
      fontSize: '16px',
      color: '#c5cae9',
      align: 'center',
      wordWrap: { width: PANEL_WIDTH - 48 },
    });
    statusText.setOrigin(0.5, 0.5);
    statusText.setScrollFactor(0);
    statusText.setDepth(OVERLAY_DEPTH + 2);
    this.elements.push(statusText);

    this.createCloseButton(panelX, panelY + PANEL_HEIGHT / 2 - 40);

    try {
      const data = await fetchLeaderboard();
      const entries = data?.entries ?? [];

      if (entries.length === 0) {
        statusText.setText('Henüz skor yok.\nİlk sen ol!');
        return;
      }

      const lines = entries.map((entry) => {
        const name = entry.playerName ?? 'Anonim';
        const levelSuffix = entry.level != null ? `  Sv.${entry.level}` : '';
        return `${String(entry.rank).padStart(2, ' ')}. ${name}${levelSuffix}  —  ${entry.score}`;
      });

      statusText.setText(lines.join('\n'));
      statusText.setFontSize('15px');
      statusText.setLineSpacing(6);
    } catch (error) {
      console.error('[LeaderboardScreen]', error);
      statusText.setText(`Liste yüklenemedi.\n${error.message || 'Bağlantı hatası'}`);
      statusText.setColor('#ef9a9a');
    }
  }

  createCloseButton(x, y) {
    const background = this.scene.add.rectangle(x, y, 180, 48, 0x424242, 0.95);
    background.setStrokeStyle(2, 0xbdbdbd, 1);
    background.setScrollFactor(0);
    background.setDepth(OVERLAY_DEPTH + 2);
    background.setInteractive({ useHandCursor: true });
    background.on('pointerdown', () => this.hide());
    this.elements.push(background);

    const label = this.scene.add.text(x, y, 'Kapat', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
    });
    label.setOrigin(0.5, 0.5);
    label.setScrollFactor(0);
    label.setDepth(OVERLAY_DEPTH + 3);
    this.elements.push(label);
  }

  hide() {
    if (!this.isVisible) {
      return;
    }

    for (const element of this.elements) {
      element.destroy();
    }

    this.elements = [];
    this.isVisible = false;

    const callback = this.onCloseCallback;
    this.onCloseCallback = null;
    callback?.();
  }

  destroy() {
    this.hide();
  }
}
