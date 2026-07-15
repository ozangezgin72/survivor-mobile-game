const OVERLAY_DEPTH = 3500;
const BUTTON_WIDTH = 280;
const BUTTON_HEIGHT = 52;
const BUTTON_GAP = 14;
const BANNER_DEPTH = 3600;

/**
 * Harita tamamen açıldığında gösterilen prestij overlay'i + sıfırlama sonrası banner.
 */
export default class PrestigePrompt {
  constructor(scene, prestigeSystem) {
    this.scene = scene;
    this.prestigeSystem = prestigeSystem;
    this.isVisible = false;
    this.dismissedThisRun = false;
    this.pendingGain = 0;

    this.overlay = null;
    this.panel = null;
    this.titleText = null;
    this.bodyText = null;
    this.buttons = [];

    this.handleResize = this.handleResize.bind(this);
    this.scene.scale.on('resize', this.handleResize);
  }

  show(prestigeGain) {
    if (this.isVisible || this.dismissedThisRun) {
      return;
    }

    this.isVisible = true;
    this.pendingGain = prestigeGain;

    const scaleWidth = this.scene.scale.width;
    const scaleHeight = this.scene.scale.height;

    this.overlay = this.scene.add.rectangle(scaleWidth / 2, scaleHeight / 2, scaleWidth, scaleHeight, 0x000000, 0.7);
    this.overlay.setScrollFactor(0);
    this.overlay.setDepth(OVERLAY_DEPTH);
    this.overlay.setInteractive();

    this.panel = this.scene.add.rectangle(scaleWidth / 2, scaleHeight / 2, Math.min(scaleWidth - 48, 520), 420, 0x1a237e, 0.95);
    this.panel.setStrokeStyle(2, 0x9fa8da, 1);
    this.panel.setScrollFactor(0);
    this.panel.setDepth(OVERLAY_DEPTH + 1);

    this.titleText = this.scene.add.text(scaleWidth / 2, scaleHeight * 0.28, 'Haritayı tamamladın!', {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#e8eaf6',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    });
    this.titleText.setOrigin(0.5, 0.5);
    this.titleText.setScrollFactor(0);
    this.titleText.setDepth(OVERLAY_DEPTH + 2);

    this.bodyText = this.scene.add.text(
      scaleWidth / 2,
      scaleHeight * 0.42,
      this.buildBodyText(prestigeGain),
      {
        fontSize: '15px',
        color: '#c5cae9',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: Math.min(scaleWidth - 96, 440) },
      },
    );
    this.bodyText.setOrigin(0.5, 0.5);
    this.bodyText.setScrollFactor(0);
    this.bodyText.setDepth(OVERLAY_DEPTH + 2);

    this.createButton(0.62, 'Prestij Yap', 0x283593, 0x9fa8da, () => this.handlePrestigeConfirm());
    this.createButton(0.62 + (BUTTON_HEIGHT + BUTTON_GAP) / scaleHeight, 'Daha Sonra', 0x424242, 0xbdbdbd, () =>
      this.handleLater(),
    );
  }

  buildBodyText(prestigeGain) {
    return [
      `Prestij yaparak +${prestigeGain} Prestij Puanı kazanabilirsin.`,
      '',
      'Harita ve ilerlemen sıfırlanır, ama Prestij Puanların kalıcı kalır ve gelecek oyunlarda başlangıç sermayesi olarak kullanılabilir.',
    ].join('\n');
  }

  createButton(yRatio, label, fillColor, strokeColor, onClick) {
    const scaleWidth = this.scene.scale.width;
    const scaleHeight = this.scene.scale.height;
    const x = scaleWidth / 2;
    const y = scaleHeight * yRatio;

    const background = this.scene.add.rectangle(x, y, BUTTON_WIDTH, BUTTON_HEIGHT, fillColor, 0.95);
    background.setStrokeStyle(2, strokeColor, 1);
    background.setScrollFactor(0);
    background.setDepth(OVERLAY_DEPTH + 2);
    background.setInteractive({ useHandCursor: true });
    background.on('pointerdown', onClick);

    const text = this.scene.add.text(x, y, label, {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
    });
    text.setOrigin(0.5, 0.5);
    text.setScrollFactor(0);
    text.setDepth(OVERLAY_DEPTH + 3);

    this.buttons.push({ background, text, yRatio });
  }

  handlePrestigeConfirm() {
    this.prestigeSystem?.performPrestige();
  }

  handleLater() {
    this.dismissedThisRun = true;
    this.hide();
  }

  /**
   * Sıfırlama sonrası kısa bildirim (WaveBanner ödül mesajına benzer).
   */
  showCompletionBanner(gain, total) {
    const centerX = this.scene.scale.width / 2;
    const y = this.scene.scale.height * (230 / 1280);

    const text = this.scene.add.text(
      centerX,
      y,
      `Prestij Tamamlandı!\n+${gain} Prestij Puanı kazandın, toplam: ${total}`,
      {
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#b39ddb',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 5,
      },
    );
    text.setOrigin(0.5, 0.5);
    text.setScrollFactor(0);
    text.setDepth(BANNER_DEPTH);
    text.setScale(0.7);
    text.setAlpha(0);

    this.scene.tweens.add({
      targets: text,
      scale: 1,
      alpha: 1,
      duration: 280,
      ease: 'Back.easeOut',
    });

    this.scene.tweens.add({
      targets: text,
      y: y - 24,
      alpha: 0,
      duration: 700,
      delay: 2200,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  hide() {
    if (!this.isVisible) {
      return;
    }

    this.isVisible = false;
    this.overlay?.destroy();
    this.panel?.destroy();
    this.titleText?.destroy();
    this.bodyText?.destroy();

    for (const button of this.buttons) {
      button.background.destroy();
      button.text.destroy();
    }

    this.overlay = null;
    this.panel = null;
    this.titleText = null;
    this.bodyText = null;
    this.buttons = [];
  }

  repositionForNewScale() {
    if (!this.isVisible) {
      return;
    }

    const scaleWidth = this.scene.scale.width;
    const scaleHeight = this.scene.scale.height;

    this.overlay?.setPosition(scaleWidth / 2, scaleHeight / 2);
    this.overlay?.setSize(scaleWidth, scaleHeight);
    this.panel?.setPosition(scaleWidth / 2, scaleHeight / 2);
    this.panel?.setSize(Math.min(scaleWidth - 48, 520), 420);
    this.titleText?.setPosition(scaleWidth / 2, scaleHeight * 0.28);
    this.bodyText?.setPosition(scaleWidth / 2, scaleHeight * 0.42);
    this.bodyText?.setWordWrapWidth(Math.min(scaleWidth - 96, 440));

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
    this.hide();
  }
}
