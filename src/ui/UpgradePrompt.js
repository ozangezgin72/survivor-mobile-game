import {
  BUILD_MENU_HEIGHT,
  BUILD_MENU_BOTTOM_MARGIN,
  UNLOCK_PROMPT_WIDTH,
  UNLOCK_PROMPT_HEIGHT,
  UNLOCK_PROMPT_BOTTOM_GAP,
} from '../config/Constants.js';

const AFFORDABLE_COLOR = 0x2e7d32;
const PRESTIGE_COLOR = 0x6a1b9a;
const UNAFFORDABLE_COLOR = 0x424242;

/**
 * Yakındaki bina için güç yükseltme prompt'u.
 * Kaynak yetmezse ama prestij yetiyorsa mor "Prestij ile yükselt" — dokunuş = açık onay.
 * İkinci dokunuş (onay) olmadan prestij harcanmaz: ilk dokunuşta "Onayla" ister.
 */
export default class UpgradePrompt {
  constructor(scene, player, buildingSystem) {
    this.scene = scene;
    this.player = player;
    this.buildingSystem = buildingSystem;
    this.prestigeConfirmBuildingId = null;

    this.handleResize = this.handleResize.bind(this);
    this.createPrompt();
    this.scene.scale.on('resize', this.handleResize);
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
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: UNLOCK_PROMPT_WIDTH - 16 },
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

    if (!building || !building.canUpgrade()) {
      this.prestigeConfirmBuildingId = null;
      this.setVisible(false);
      return;
    }

    if (this.prestigeConfirmBuildingId != null && this.prestigeConfirmBuildingId !== building.id) {
      this.prestigeConfirmBuildingId = null;
    }

    const from = building.currentPowerLevel;
    const to = from + 1;
    const cost = building.getNextUpgradeCost();
    const canPay = this.player.canAffordResources(cost);
    const needsPrestige = this.player.needsPrestigeForResources(cost);
    const awaitingConfirm = needsPrestige && this.prestigeConfirmBuildingId === building.id;

    if (!canPay) {
      this.label.setText(`${building.name}: yetersiz (${cost})`);
      this.background.setFillStyle(UNAFFORDABLE_COLOR, 0.92);
      this.background.setStrokeStyle(2, 0x9e9e9e, 1);
    } else if (needsPrestige) {
      this.label.setText(
        awaitingConfirm
          ? `Onayla: Prestij ile yükselt (${from}→${to}): ${cost}`
          : `Prestij ile yükselt (${from}→${to}): ${cost}`,
      );
      this.background.setFillStyle(PRESTIGE_COLOR, 0.92);
      this.background.setStrokeStyle(2, 0xe1bee7, 1);
    } else {
      this.label.setText(`${building.name} yükselt (${from} → ${to}): ${cost} kaynak`);
      this.background.setFillStyle(AFFORDABLE_COLOR, 0.92);
      this.background.setStrokeStyle(2, 0xa5d6a7, 1);
    }

    this.setVisible(true);
  }

  handleTap() {
    const building = this.buildingSystem.nearestUpgradeableBuilding;

    if (!building || !building.canUpgrade()) {
      return;
    }

    const cost = building.getNextUpgradeCost();
    if (!this.player.canAffordResources(cost)) {
      this.flashDenied();
      return;
    }

    // Prestij kullanılacaksa çift dokunuş onayı
    if (this.player.needsPrestigeForResources(cost)) {
      if (this.prestigeConfirmBuildingId !== building.id) {
        this.prestigeConfirmBuildingId = building.id;
        return;
      }
      this.prestigeConfirmBuildingId = null;
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
