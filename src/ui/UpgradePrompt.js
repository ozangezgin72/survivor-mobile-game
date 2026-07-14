import {
  BUILD_MENU_HEIGHT,
  BUILD_MENU_BOTTOM_MARGIN,
  UNLOCK_PROMPT_WIDTH,
  UNLOCK_PROMPT_HEIGHT,
  UNLOCK_PROMPT_BOTTOM_GAP,
} from '../config/Constants.js';

const AFFORDABLE_COLOR = 0x4a148c;
const UNAFFORDABLE_COLOR = 0x424242;
const MAX_LEVEL_COLOR = 0x37474f;

/**
 * Yakındaki bina için güç yükseltme prompt'u.
 * currentPowerLevel < maxUnlockedPowerLevel ise "Yükselt (X → X+1): N kaynak";
 * aksi halde "Maksimum Seviye" (devre dışı).
 */
export default class UpgradePrompt {
  constructor(scene, player, buildingSystem) {
    this.scene = scene;
    this.player = player;
    this.buildingSystem = buildingSystem;

    this.handleResize = this.handleResize.bind(this);
    this.createPrompt();
    this.scene.scale.on('resize', this.handleResize);
  }

  get fogOfWarSystem() {
    return this.buildingSystem.fogOfWarSystem;
  }

  getPromptPosition() {
    const scaleWidth = this.scene.scale.width;
    const scaleHeight = this.scene.scale.height;
    const barTopY = scaleHeight - BUILD_MENU_BOTTOM_MARGIN - BUILD_MENU_HEIGHT;

    return {
      x: (scaleWidth - UNLOCK_PROMPT_WIDTH) / 2,
      y: barTopY - (UNLOCK_PROMPT_BOTTOM_GAP + UNLOCK_PROMPT_HEIGHT) * 2,
    };
  }

  createPrompt() {
    const { x, y } = this.getPromptPosition();
    this.x = x;
    this.y = y;

    this.background = this.scene.add.rectangle(
      this.x,
      this.y,
      UNLOCK_PROMPT_WIDTH,
      UNLOCK_PROMPT_HEIGHT,
      AFFORDABLE_COLOR,
      0.92,
    );
    this.background.setOrigin(0, 0);
    this.background.setStrokeStyle(2, 0xce93d8, 1);
    this.background.setScrollFactor(0);
    this.background.setDepth(1300);
    this.background.setInteractive({ useHandCursor: true });
    this.background.on('pointerdown', () => this.handleTap());

    this.label = this.scene.add.text(this.x + UNLOCK_PROMPT_WIDTH / 2, this.y + UNLOCK_PROMPT_HEIGHT / 2, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    });
    this.label.setOrigin(0.5, 0.5);
    this.label.setScrollFactor(0);
    this.label.setDepth(1301);

    this.setVisible(false);
  }

  repositionForNewScale() {
    const { x, y } = this.getPromptPosition();
    this.x = x;
    this.y = y;

    this.background.setPosition(this.x, this.y);
    this.label.setPosition(this.x + UNLOCK_PROMPT_WIDTH / 2, this.y + UNLOCK_PROMPT_HEIGHT / 2);
  }

  handleResize() {
    this.repositionForNewScale();
  }

  update() {
    const building = this.buildingSystem.nearestUpgradeableBuilding;

    if (!building) {
      this.setVisible(false);
      return;
    }

    const maxPower = this.fogOfWarSystem?.getMaxUnlockedPowerLevel?.() ?? 0;
    const canUpgrade = building.canUpgrade(maxPower);

    if (!canUpgrade) {
      this.label.setText(`${building.name}: Maksimum Seviye (Güç ${building.currentPowerLevel})`);
      this.background.setFillStyle(MAX_LEVEL_COLOR, 0.92);
      this.setVisible(true);
      return;
    }

    const from = building.currentPowerLevel;
    const to = from + 1;
    const cost = building.getNextUpgradeCost();
    const affordable = this.player.canAffordResources(cost);

    this.label.setText(`${building.name} yükselt (${from} → ${to}): ${cost} kaynak`);
    this.background.setFillStyle(affordable ? AFFORDABLE_COLOR : UNAFFORDABLE_COLOR, 0.92);
    this.setVisible(true);
  }

  handleTap() {
    const building = this.buildingSystem.nearestUpgradeableBuilding;
    const maxPower = this.fogOfWarSystem?.getMaxUnlockedPowerLevel?.() ?? 0;

    if (!building || !building.canUpgrade(maxPower)) {
      return;
    }

    const success = this.buildingSystem.tryUpgradeNearestBuilding();

    if (!success) {
      this.flashDenied();
    }
  }

  flashDenied() {
    this.scene.tweens.add({
      targets: this.background,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 80,
      yoyo: true,
    });
  }

  setVisible(visible) {
    this.background.setVisible(visible);
    this.label.setVisible(visible);
  }

  destroy() {
    this.scene.scale.off('resize', this.handleResize);
    this.background.destroy();
    this.label.destroy();
  }
}
