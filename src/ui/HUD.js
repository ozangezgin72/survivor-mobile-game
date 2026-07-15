import Phaser from 'phaser';
import { GameEvents } from '../config/Events.js';
import { HUD_MARGIN_X, HUD_MARGIN_Y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, GOLD_ICON_RADIUS, MINIMAP_WIDTH, MINIMAP_MARGIN } from '../config/Constants.js';
import GameOverScreen from './GameOverScreen.js';

/**
 * Ekranın üst kısmındaki basit HUD: can barı + toplam altın sayacı + toplam kaynak sayacı.
 * Tamamen event-driven çalışır (PLAYER_HEALTH_CHANGED / PLAYER_GOLD_CHANGED /
 * PLAYER_RESOURCES_CHANGED); Player'ı her frame "poll" etmek yerine sadece değer
 * değiştiğinde güncellenir.
 */
export default class HUD {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    this.gameOverScreen = new GameOverScreen(scene, player);

    this.createHealthBar();
    this.createGoldCounter();
    this.createResourceCounter();
    this.createPrestigeCounter();
    this.createMuteButton();

    this.handleHealthChanged = this.handleHealthChanged.bind(this);
    this.handleGoldChanged = this.handleGoldChanged.bind(this);
    this.handleResourcesChanged = this.handleResourcesChanged.bind(this);
    this.handlePlayerDied = this.handlePlayerDied.bind(this);
    this.handleLevelUp = this.handleLevelUp.bind(this);
    this.handlePrestigeChanged = this.handlePrestigeChanged.bind(this);

    this.scene.events.on(GameEvents.PLAYER_HEALTH_CHANGED, this.handleHealthChanged);
    this.scene.events.on(GameEvents.PLAYER_GOLD_CHANGED, this.handleGoldChanged);
    this.scene.events.on(GameEvents.PLAYER_RESOURCES_CHANGED, this.handleResourcesChanged);
    this.scene.events.on(GameEvents.PLAYER_DIED, this.handlePlayerDied);
    this.scene.events.on(GameEvents.PLAYER_LEVEL_UP, this.handleLevelUp);
    this.scene.events.on(GameEvents.PRESTIGE_CHANGED, this.handlePrestigeChanged);

    this.handleResize = this.handleResize.bind(this);
    this.scene.scale.on('resize', this.handleResize);
  }

  createHealthBar() {
    this.healthBarBg = this.scene.add.rectangle(
      HUD_MARGIN_X,
      HUD_MARGIN_Y,
      HEALTH_BAR_WIDTH,
      HEALTH_BAR_HEIGHT,
      0x000000,
      0.5,
    );
    this.healthBarBg.setOrigin(0, 0);
    this.healthBarBg.setStrokeStyle(2, 0xffffff, 0.8);
    this.healthBarBg.setScrollFactor(0);
    this.healthBarBg.setDepth(1000);

    this.healthBarFill = this.scene.add.rectangle(
      HUD_MARGIN_X + 2,
      HUD_MARGIN_Y + 2,
      HEALTH_BAR_WIDTH - 4,
      HEALTH_BAR_HEIGHT - 4,
      0x4caf50,
    );
    this.healthBarFill.setOrigin(0, 0);
    this.healthBarFill.setScrollFactor(0);
    this.healthBarFill.setDepth(1001);

    this.healthText = this.scene.add.text(
      HUD_MARGIN_X + HEALTH_BAR_WIDTH / 2,
      HUD_MARGIN_Y + HEALTH_BAR_HEIGHT / 2,
      `Sv.${this.player.level}  ${this.player.health}/${this.player.maxHealth}`,
      { fontSize: '13px', color: '#ffffff', fontStyle: 'bold' },
    );
    this.healthText.setOrigin(0.5, 0.5);
    this.healthText.setScrollFactor(0);
    this.healthText.setDepth(1002);
  }

  createGoldCounter() {
    const x = HUD_MARGIN_X + GOLD_ICON_RADIUS;
    const y = HUD_MARGIN_Y + HEALTH_BAR_HEIGHT + 20;

    this.goldIcon = this.scene.add.circle(x, y, GOLD_ICON_RADIUS, 0xffd54f);
    this.goldIcon.setStrokeStyle(2, 0xf9a825, 1);
    this.goldIcon.setScrollFactor(0);
    this.goldIcon.setDepth(1000);

    this.goldText = this.scene.add.text(x + GOLD_ICON_RADIUS + 8, y, `${this.player.gold}`, {
      fontSize: '18px',
      color: '#ffd54f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.goldText.setOrigin(0, 0.5);
    this.goldText.setScrollFactor(0);
    this.goldText.setDepth(1000);
  }

  createResourceCounter() {
    const x = HUD_MARGIN_X + GOLD_ICON_RADIUS;
    const y = HUD_MARGIN_Y + HEALTH_BAR_HEIGHT + 20 + 28;

    // Kaynak ikonu için basit yeşilimsi bir kare (altın = daire/sarı, kaynak = kare/yeşil ayrımı)
    this.resourceIcon = this.scene.add.rectangle(x, y, GOLD_ICON_RADIUS * 1.8, GOLD_ICON_RADIUS * 1.8, 0x8bc34a);
    this.resourceIcon.setStrokeStyle(2, 0x558b2f, 1);
    this.resourceIcon.setScrollFactor(0);
    this.resourceIcon.setDepth(1000);

    this.resourceText = this.scene.add.text(x + GOLD_ICON_RADIUS + 8, y, `${Math.floor(this.player.resources)}`, {
      fontSize: '18px',
      color: '#aed581',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.resourceText.setOrigin(0, 0.5);
    this.resourceText.setScrollFactor(0);
    this.resourceText.setDepth(1000);
  }

  /** Kalıcı prestij bakiyesi — kaynak sayacının altında, mor elmas ikon */
  createPrestigeCounter() {
    const x = HUD_MARGIN_X + GOLD_ICON_RADIUS;
    const y = HUD_MARGIN_Y + HEALTH_BAR_HEIGHT + 20 + 28 + 28;
    const size = GOLD_ICON_RADIUS * 1.6;

    this.prestigeIcon = this.scene.add.polygon(
      x,
      y,
      [0, -size, size * 0.7, 0, 0, size, -size * 0.7, 0],
      0x7e57c2,
    );
    this.prestigeIcon.setStrokeStyle(2, 0xb39ddb, 1);
    this.prestigeIcon.setScrollFactor(0);
    this.prestigeIcon.setDepth(1000);

    const points = this.scene.prestigeSystem?.getTotalPrestigePoints?.() ?? 0;
    this.prestigeText = this.scene.add.text(x + GOLD_ICON_RADIUS + 8, y, `${points}`, {
      fontSize: '18px',
      color: '#b39ddb',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.prestigeText.setOrigin(0, 0.5);
    this.prestigeText.setScrollFactor(0);
    this.prestigeText.setDepth(1000);
  }

  refreshPrestigeDisplay(totalPoints) {
    if (!this.prestigeText) {
      return;
    }
    const points =
      totalPoints != null ? totalPoints : (this.scene.prestigeSystem?.getTotalPrestigePoints?.() ?? 0);
    this.prestigeText.setText(`${points}`);
  }

  handlePrestigeChanged(totalPoints) {
    this.refreshPrestigeDisplay(totalPoints);
  }

  /** Minimap'in solunda küçük ses aç/kapa butonu */
  createMuteButton() {
    const size = 36;
    const x = this.scene.scale.width - MINIMAP_MARGIN - MINIMAP_WIDTH - size - 12;
    const y = HUD_MARGIN_Y + size / 2;

    this.muteButtonBg = this.scene.add.rectangle(x, y, size, size, 0x000000, 0.55);
    this.muteButtonBg.setStrokeStyle(2, 0xffffff, 0.75);
    this.muteButtonBg.setScrollFactor(0);
    this.muteButtonBg.setDepth(1000);
    this.muteButtonBg.setInteractive({ useHandCursor: true });

    this.muteButtonText = this.scene.add.text(x, y, 'Ses', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.muteButtonText.setOrigin(0.5, 0.5);
    this.muteButtonText.setScrollFactor(0);
    this.muteButtonText.setDepth(1001);

    this.muteButtonBg.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
      const audio = this.scene.audioSystem;
      if (!audio) {
        return;
      }
      const muted = audio.toggleMute();
      this.refreshMuteButton(muted);
    });

    this.refreshMuteButton(this.scene.audioSystem?.muted ?? false);
  }

  refreshMuteButton(muted) {
    if (!this.muteButtonText || !this.muteButtonBg) {
      return;
    }
    this.muteButtonText.setText(muted ? 'Kapalı' : 'Ses');
    this.muteButtonText.setColor(muted ? '#ef9a9a' : '#ffffff');
    this.muteButtonBg.setFillStyle(muted ? 0x4a1515 : 0x000000, 0.55);
  }

  handleHealthChanged(currentHealth, maxHealth) {
    const ratio = Phaser.Math.Clamp(currentHealth / maxHealth, 0, 1);

    this.healthBarFill.width = (HEALTH_BAR_WIDTH - 4) * ratio;
    this.healthText.setText(`Sv.${this.player.level}  ${Math.ceil(currentHealth)}/${maxHealth}`);

    // Can azaldıkça yeşil -> turuncu -> kırmızıya kayan basit ama etkili bir uyarı
    const color = ratio > 0.5 ? 0x4caf50 : ratio > 0.25 ? 0xffa726 : 0xef5350;
    this.healthBarFill.setFillStyle(color);
  }

  handleGoldChanged(totalGold) {
    this.goldText.setText(`${totalGold}`);
  }

  handleResourcesChanged(totalResources) {
    this.resourceText.setText(`${Math.floor(totalResources)}`);
  }

  /** Faz 5: seviye atlayınca kısa süreli, ortada belirip yükselerek kaybolan bir "LEVEL UP!" efekti */
  handleLevelUp(level) {
    const text = this.scene.add.text(this.scene.scale.width / 2, 340, `LEVEL UP!\nSeviye ${level}`, {
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#4fc3f7',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 6,
    });
    text.setOrigin(0.5, 0.5);
    text.setScrollFactor(0);
    text.setDepth(3000);
    text.setScale(0.5);

    this.scene.tweens.add({
      targets: text,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    this.scene.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 1000,
      delay: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  handlePlayerDied() {
    this.gameOverScreen.show();
  }

  handleResize() {
    if (this.muteButtonBg && this.muteButtonText) {
      const size = 36;
      const x = this.scene.scale.width - MINIMAP_MARGIN - MINIMAP_WIDTH - size - 12;
      const y = HUD_MARGIN_Y + size / 2;
      this.muteButtonBg.setPosition(x, y);
      this.muteButtonText.setPosition(x, y);
    }
    this.gameOverScreen.repositionForNewScale();
  }

  destroy() {
    this.scene.scale.off('resize', this.handleResize);
    this.scene.events.off(GameEvents.PLAYER_HEALTH_CHANGED, this.handleHealthChanged);
    this.scene.events.off(GameEvents.PLAYER_GOLD_CHANGED, this.handleGoldChanged);
    this.scene.events.off(GameEvents.PLAYER_RESOURCES_CHANGED, this.handleResourcesChanged);
    this.scene.events.off(GameEvents.PLAYER_DIED, this.handlePlayerDied);
    this.scene.events.off(GameEvents.PLAYER_LEVEL_UP, this.handleLevelUp);
    this.scene.events.off(GameEvents.PRESTIGE_CHANGED, this.handlePrestigeChanged);
    this.muteButtonBg?.destroy();
    this.muteButtonText?.destroy();
    this.prestigeIcon?.destroy();
    this.prestigeText?.destroy();
    this.gameOverScreen.destroy();
  }
}
