import { GameEvents } from '../config/Events.js';
import { WAVE_WARNING_DURATION } from '../config/Constants.js';

const STATUS_TEXT_Y = 128;
const WARNING_BANNER_Y_RATIO = 230 / 1280;

/**
 * Dalga durumunu gösteren UI: sürekli görünen küçük bir geri sayım/durum metni +
 * "Dalga Geliyor!" uyarı banner'ı + dalga bitince beliren ödül mesajı.
 * Tamamen WaveSystem'in state'ini okuyarak/event'lerini dinleyerek çalışır.
 */
export default class WaveBanner {
  constructor(scene, waveSystem) {
    this.scene = scene;
    this.waveSystem = waveSystem;

    this.handleResize = this.handleResize.bind(this);
    this.createStatusText();
    this.createWarningBanner();

    this.handleWaveWarning = this.handleWaveWarning.bind(this);
    this.handleWaveCompleted = this.handleWaveCompleted.bind(this);
    this.scene.events.on(GameEvents.WAVE_WARNING, this.handleWaveWarning);
    this.scene.events.on(GameEvents.WAVE_COMPLETED, this.handleWaveCompleted);
    this.scene.scale.on('resize', this.handleResize);
  }

  getLayoutPositions() {
    const scaleWidth = this.scene.scale.width;
    const scaleHeight = this.scene.scale.height;

    return {
      centerX: scaleWidth / 2,
      statusY: STATUS_TEXT_Y,
      warningY: scaleHeight * WARNING_BANNER_Y_RATIO,
    };
  }

  createStatusText() {
    const { centerX, statusY } = this.getLayoutPositions();

    this.statusText = this.scene.add.text(centerX, statusY, '', {
      fontSize: '15px',
      color: '#ffab91',
      fontStyle: 'bold',
      backgroundColor: '#00000080',
      padding: { x: 8, y: 4 },
    });
    this.statusText.setOrigin(0.5, 0);
    this.statusText.setScrollFactor(0);
    this.statusText.setDepth(1400);
  }

  createWarningBanner() {
    const { centerX, warningY } = this.getLayoutPositions();

    this.warningBanner = this.scene.add.text(centerX, warningY, '⚠ DALGA GELİYOR! ⚠', {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ff5252',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.warningBanner.setOrigin(0.5, 0.5);
    this.warningBanner.setScrollFactor(0);
    this.warningBanner.setDepth(1401);
    this.warningBanner.setVisible(false);
  }

  repositionForNewScale() {
    const { centerX, statusY, warningY } = this.getLayoutPositions();

    this.statusText.setPosition(centerX, statusY);
    this.warningBanner.setPosition(centerX, warningY);
  }

  handleResize() {
    this.repositionForNewScale();
  }

  update(time) {
    if (this.waveSystem.isWarningActive()) {
      this.statusText.setVisible(false);
      return;
    }

    this.statusText.setVisible(true);

    if (this.waveSystem.isWaveActive()) {
      this.statusText.setText('⚔ DALGA AKTİF ⚔');
      return;
    }

    const seconds = this.waveSystem.getSecondsUntilNextWave(time);
    this.statusText.setText(`Sıradaki dalga: ${seconds}sn`);
  }

  handleWaveWarning(waveNumber) {
    this.warningBanner.setText(`⚠ DALGA ${waveNumber} GELİYOR! ⚠`);
    this.warningBanner.setVisible(true);
    this.warningBanner.setAlpha(1);
    this.warningBanner.setScale(0.6);

    this.scene.tweens.add({
      targets: this.warningBanner,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Uyarı süresince nabız gibi hafifçe büyüyüp küçülsün - dikkat çeksin
    this.pulseTween = this.scene.tweens.add({
      targets: this.warningBanner,
      scale: 1.08,
      duration: 350,
      yoyo: true,
      repeat: -1,
    });

    this.scene.time.delayedCall(WAVE_WARNING_DURATION - 150, () => {
      if (this.pulseTween) {
        this.pulseTween.stop();
        this.pulseTween = null;
      }

      this.scene.tweens.add({
        targets: this.warningBanner,
        alpha: 0,
        duration: 250,
        onComplete: () => this.warningBanner.setVisible(false),
      });
    });
  }

  handleWaveCompleted({ gold, resources }) {
    const { centerX, warningY } = this.getLayoutPositions();

    const text = this.scene.add.text(centerX, warningY, `Dalga tamamlandı!\n+${gold} Altın  +${resources} Kaynak`, {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffd54f',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 5,
    });
    text.setOrigin(0.5, 0.5);
    text.setScrollFactor(0);
    text.setDepth(1401);
    text.setScale(0.7);

    this.scene.tweens.add({
      targets: text,
      scale: 1,
      duration: 250,
      ease: 'Back.easeOut',
    });

    this.scene.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 1200,
      delay: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  destroy() {
    this.scene.events.off(GameEvents.WAVE_WARNING, this.handleWaveWarning);
    this.scene.events.off(GameEvents.WAVE_COMPLETED, this.handleWaveCompleted);
    this.scene.scale.off('resize', this.handleResize);

    if (this.pulseTween) {
      this.pulseTween.stop();
    }
  }
}
