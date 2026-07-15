import LeaderboardScreen from './LeaderboardScreen.js';
import { submitScore, sanitizePlayerNameInput } from '../services/LeaderboardApi.js';

const OVERLAY_DEPTH = 4000;
const BUTTON_WIDTH = 280;
const BUTTON_HEIGHT = 48;
const BUTTON_GAP = 12;

/**
 * Oyuncu öldüğünde gösterilen oyun sonu ekranı: performans özeti + skor gönderme + liderlik.
 */
export default class GameOverScreen {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.isVisible = false;
    this.scoreSubmitted = false;
    this.isSubmitting = false;
    this.leaderboardScreen = new LeaderboardScreen(scene);

    this.overlay = null;
    this.titleText = null;
    this.statsText = null;
    this.submitStatusText = null;
    this.buttons = [];

    this.handleResize = this.handleResize.bind(this);
    this.scene.scale.on('resize', this.handleResize);
  }

  show() {
    if (this.isVisible) {
      return;
    }

    this.isVisible = true;
    this.scoreSubmitted = false;
    this.isSubmitting = false;

    const scaleWidth = this.scene.scale.width;
    const scaleHeight = this.scene.scale.height;

    this.overlay = this.scene.add.rectangle(scaleWidth / 2, scaleHeight / 2, scaleWidth, scaleHeight, 0x000000, 0.72);
    this.overlay.setScrollFactor(0);
    this.overlay.setDepth(OVERLAY_DEPTH);

    this.titleText = this.scene.add.text(scaleWidth / 2, scaleHeight * 0.16, 'GAME OVER', {
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#ff5252',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.titleText.setOrigin(0.5, 0.5);
    this.titleText.setScrollFactor(0);
    this.titleText.setDepth(OVERLAY_DEPTH + 1);

    this.statsText = this.scene.add.text(scaleWidth / 2, scaleHeight * 0.32, this.buildStatsText(), {
      fontSize: '18px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 6,
    });
    this.statsText.setOrigin(0.5, 0.5);
    this.statsText.setScrollFactor(0);
    this.statsText.setDepth(OVERLAY_DEPTH + 1);

    this.submitStatusText = this.scene.add.text(scaleWidth / 2, scaleHeight * 0.44, '', {
      fontSize: '14px',
      color: '#b39ddb',
      align: 'center',
      wordWrap: { width: scaleWidth - 80 },
    });
    this.submitStatusText.setOrigin(0.5, 0.5);
    this.submitStatusText.setScrollFactor(0);
    this.submitStatusText.setDepth(OVERLAY_DEPTH + 1);

    this.createButton(0.5, 'SKORU GÖNDER', 0x4527a0, 0xb39ddb, () => this.handleSubmitScore());
    this.createButton(0.5 + (BUTTON_HEIGHT + BUTTON_GAP) / scaleHeight, 'SIRALAMAYI GÖR', 0x283593, 0x9fa8da, () =>
      this.openLeaderboard(),
    );
    this.createButton(0.5 + ((BUTTON_HEIGHT + BUTTON_GAP) * 2) / scaleHeight, 'TEKRAR OYNA', 0x1b5e20, 0xaed581, () => {
      this.scene.scene.restart({ slotKey: this.scene.currentSlotKey });
    });
    this.createButton(0.5 + ((BUTTON_HEIGHT + BUTTON_GAP) * 3) / scaleHeight, 'ANA MENÜYE DÖN', 0x424242, 0xbdbdbd, () => {
      this.scene.scene.start('MenuScene');
    });
  }

  buildStatsText() {
    const level = this.player.level ?? 1;
    const kills = this.player.killCount ?? 0;
    const gold = this.player.gold ?? 0;
    const survivalTime = this.formatSurvivalTime(this.scene.time.now);
    const { finalScore, roundScore, prestigeMultiplier } = this.scene.scoreSystem?.calculateFinalScore?.() ?? {
      finalScore: 0,
      roundScore: 0,
      prestigeMultiplier: 1,
    };

    const lines = [
      'Performans Özeti',
      '',
      `Skor: ${finalScore}`,
      `Seviye: ${level}`,
      `Öldürme: ${kills}`,
      `Altın: ${gold}`,
      `Hayatta kalma: ${survivalTime}`,
    ];

    if (prestigeMultiplier > 1) {
      lines.push(`Prestij çarpanı: x${prestigeMultiplier.toFixed(1)} (ham: ${roundScore})`);
    }

    return lines.join('\n');
  }

  getScorePayload() {
    const { finalScore } = this.scene.scoreSystem?.calculateFinalScore?.() ?? { finalScore: 0 };

    return {
      score: finalScore,
      level: this.player.level ?? 1,
      prestigeCount: this.scene.prestigeSystem?.getTotalPrestigeCount?.() ?? 0,
    };
  }

  async handleSubmitScore() {
    if (this.scoreSubmitted || this.isSubmitting) {
      return;
    }

    const rawName = window.prompt('Skor tablosu için adını gir (en fazla 20 karakter):', '');
    if (rawName == null) {
      return;
    }

    const playerName = sanitizePlayerNameInput(rawName);
    if (!playerName) {
      this.setSubmitStatus('Geçerli bir isim gir.', true);
      return;
    }

    const { score, level, prestigeCount } = this.getScorePayload();

    this.isSubmitting = true;
    this.setSubmitStatus('Gönderiliyor...', false);
    this.setSubmitButtonLabel('GÖNDERİLİYOR...');

    try {
      await submitScore({ playerName, score, level, prestigeCount });
      this.scoreSubmitted = true;
      this.setSubmitStatus('Gönderildi!', false);
      this.setSubmitButtonLabel('GÖNDERİLDİ!', true);
    } catch (error) {
      console.error('[GameOverScreen] submit failed', error);
      this.setSubmitStatus(error.message || 'Skor gönderilemedi.', true);
      this.setSubmitButtonLabel('SKORU GÖNDER');
    } finally {
      this.isSubmitting = false;
    }
  }

  setSubmitStatus(message, isError) {
    if (!this.submitStatusText) {
      return;
    }

    this.submitStatusText.setText(message);
    this.submitStatusText.setColor(isError ? '#ef9a9a' : '#b39ddb');
  }

  setSubmitButtonLabel(label, disabled = false) {
    const submitButton = this.buttons[0];
    if (!submitButton) {
      return;
    }

    submitButton.text.setText(label);
    submitButton.disabled = disabled;

    if (disabled) {
      submitButton.background.setFillStyle(0x37474f, 0.95);
      submitButton.background.disableInteractive();
    }
  }

  openLeaderboard() {
    this.leaderboardScreen.show();
  }

  formatSurvivalTime(elapsedMs) {
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  createButton(yRatio, label, fillColor, strokeColor, onClick) {
    const scaleWidth = this.scene.scale.width;
    const scaleHeight = this.scene.scale.height;
    const x = scaleWidth / 2;
    const y = scaleHeight * yRatio;

    const background = this.scene.add.rectangle(x, y, BUTTON_WIDTH, BUTTON_HEIGHT, fillColor, 0.95);
    background.setStrokeStyle(2, strokeColor, 1);
    background.setScrollFactor(0);
    background.setDepth(OVERLAY_DEPTH + 1);
    background.setInteractive({ useHandCursor: true });

    const text = this.scene.add.text(x, y, label, {
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#ffffff',
    });
    text.setOrigin(0.5, 0.5);
    text.setScrollFactor(0);
    text.setDepth(OVERLAY_DEPTH + 2);

    background.on('pointerdown', () => {
      const button = this.buttons.find((entry) => entry.background === background);
      if (button?.disabled) {
        return;
      }
      onClick();
    });

    this.buttons.push({ background, text, yRatio, disabled: false });
  }

  repositionForNewScale() {
    if (!this.isVisible) {
      return;
    }

    const scaleWidth = this.scene.scale.width;
    const scaleHeight = this.scene.scale.height;

    this.overlay.setPosition(scaleWidth / 2, scaleHeight / 2);
    this.overlay.setSize(scaleWidth, scaleHeight);

    this.titleText.setPosition(scaleWidth / 2, scaleHeight * 0.16);
    this.statsText.setPosition(scaleWidth / 2, scaleHeight * 0.32);
    this.submitStatusText.setPosition(scaleWidth / 2, scaleHeight * 0.44);

    this.buttons.forEach((button, index) => {
      const y = scaleHeight * (0.5 + (index * (BUTTON_HEIGHT + BUTTON_GAP)) / scaleHeight);
      button.yRatio = 0.5 + (index * (BUTTON_HEIGHT + BUTTON_GAP)) / scaleHeight;
      button.background.setPosition(scaleWidth / 2, y);
      button.text.setPosition(scaleWidth / 2, y);
    });
  }

  handleResize() {
    this.repositionForNewScale();
  }

  destroy() {
    this.scene.scale.off('resize', this.handleResize);
    this.leaderboardScreen.destroy();

    if (this.overlay) {
      this.overlay.destroy();
    }

    if (this.titleText) {
      this.titleText.destroy();
    }

    if (this.statsText) {
      this.statsText.destroy();
    }

    if (this.submitStatusText) {
      this.submitStatusText.destroy();
    }

    for (const button of this.buttons) {
      button.background.destroy();
      button.text.destroy();
    }

    this.overlay = null;
    this.titleText = null;
    this.statsText = null;
    this.submitStatusText = null;
    this.buttons = [];
    this.isVisible = false;
  }
}
