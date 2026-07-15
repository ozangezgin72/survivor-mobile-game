const OVERLAY_DEPTH = 4000;
const BUTTON_WIDTH = 280;
const BUTTON_HEIGHT = 56;
const BUTTON_GAP = 16;

/**
 * Oyuncu öldüğünde gösterilen oyun sonu ekranı: performans özeti + tekrar oyna / ana menü.
 */
export default class GameOverScreen {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.isVisible = false;
    this.overlay = null;
    this.titleText = null;
    this.statsText = null;
    this.buttons = [];

    this.handleResize = this.handleResize.bind(this);
    this.scene.scale.on('resize', this.handleResize);
  }

  show() {
    if (this.isVisible) {
      return;
    }

    this.isVisible = true;

    const scaleWidth = this.scene.scale.width;
    const scaleHeight = this.scene.scale.height;

    this.overlay = this.scene.add.rectangle(scaleWidth / 2, scaleHeight / 2, scaleWidth, scaleHeight, 0x000000, 0.72);
    this.overlay.setScrollFactor(0);
    this.overlay.setDepth(OVERLAY_DEPTH);

    this.titleText = this.scene.add.text(scaleWidth / 2, scaleHeight * 0.22, 'GAME OVER', {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ff5252',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.titleText.setOrigin(0.5, 0.5);
    this.titleText.setScrollFactor(0);
    this.titleText.setDepth(OVERLAY_DEPTH + 1);

    this.statsText = this.scene.add.text(scaleWidth / 2, scaleHeight * 0.4, this.buildStatsText(), {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 8,
    });
    this.statsText.setOrigin(0.5, 0.5);
    this.statsText.setScrollFactor(0);
    this.statsText.setDepth(OVERLAY_DEPTH + 1);

    this.createButton(0.58, 'TEKRAR OYNA', 0x1b5e20, 0xaed581, () => {
      // Aynı slota yeni oyun; loadedSaveData olmadan restart
      this.scene.scene.restart({ slotKey: this.scene.currentSlotKey });
    });

    this.createButton(0.58 + (BUTTON_HEIGHT + BUTTON_GAP) / scaleHeight, 'ANA MENÜYE DÖN', 0x424242, 0xbdbdbd, () => {
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
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff',
    });
    text.setOrigin(0.5, 0.5);
    text.setScrollFactor(0);
    text.setDepth(OVERLAY_DEPTH + 2);

    background.on('pointerdown', onClick);

    this.buttons.push({ background, text, yRatio });
  }

  repositionForNewScale() {
    if (!this.isVisible) {
      return;
    }

    const scaleWidth = this.scene.scale.width;
    const scaleHeight = this.scene.scale.height;

    this.overlay.setPosition(scaleWidth / 2, scaleHeight / 2);
    this.overlay.setSize(scaleWidth, scaleHeight);

    this.titleText.setPosition(scaleWidth / 2, scaleHeight * 0.22);
    this.statsText.setPosition(scaleWidth / 2, scaleHeight * 0.4);

    for (const button of this.buttons) {
      const y = scaleHeight * button.yRatio;
      button.background.setPosition(scaleWidth / 2, y);
      button.text.setPosition(scaleWidth / 2, y);
    }
  }

  handleResize() {
    this.repositionForNewScale();
  }

  destroy() {
    this.scene.scale.off('resize', this.handleResize);

    if (this.overlay) {
      this.overlay.destroy();
    }

    if (this.titleText) {
      this.titleText.destroy();
    }

    if (this.statsText) {
      this.statsText.destroy();
    }

    for (const button of this.buttons) {
      button.background.destroy();
      button.text.destroy();
    }

    this.overlay = null;
    this.titleText = null;
    this.statsText = null;
    this.buttons = [];
    this.isVisible = false;
  }
}
