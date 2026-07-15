import ArcherTower from '../entities/buildings/ArcherTower.js';
import Cannon from '../entities/buildings/Cannon.js';
import MissileTower from '../entities/buildings/MissileTower.js';
import Wall from '../entities/buildings/Wall.js';
import ResourceExtractor from '../entities/buildings/ResourceExtractor.js';
import { GameEvents } from '../config/Events.js';
import {
  GAME_WIDTH,
  BUILD_MENU_HEIGHT,
  BUILD_MENU_BOTTOM_MARGIN,
  BUILD_MENU_BUTTON_SIZE,
  BUILD_MENU_BUTTON_GAP,
  BUILD_GHOST_ALPHA,
  BUILD_GHOST_VALID_COLOR,
  BUILD_GHOST_INVALID_COLOR,
  BUILD_PREVIEW_DISTANCE,
  MINIMAP_WIDTH,
  MINIMAP_HEIGHT,
  MINIMAP_MARGIN,
  HUD_MARGIN_X,
  HEALTH_BAR_WIDTH,
  HUD_TOP_ZONE_HEIGHT,
  UNLOCK_PROMPT_WIDTH,
  UNLOCK_PROMPT_HEIGHT,
  UNLOCK_PROMPT_BOTTOM_GAP,
} from '../config/Constants.js';

// BuildMenu bu sırayla butonları oluşturur; yeni bir bina eklemek için buraya
// bir satır eklemek yeterli (her class kendi id/displayName/icon/cost/textureKey'ini taşır)
const BUILDING_CLASSES = [ArcherTower, Cannon, MissileTower, Wall, ResourceExtractor];

/**
 * Ekranın altında basit bir inşa menüsü (mobile-friendly).
 *
 * Akış: butona bas -> bina "silahlanır" (armed) ve haritada oyuncunun önünde yarı
 * saydam bir hayalet belirir (ve parmak/imleç hareket etmediği sürece oyuncuyu takip
 * eder) -> parmağı haritada gezdirirken hayalet onu takip eder (mavi=geçerli,
 * kırmızı=geçersiz konum) -> haritaya dokununca INSTANT_BUILD ile anında yerleştirilir,
 * hiçbir bekleme yoktur (bkz. BuildingSystem.placeBuilding).
 */
export default class BuildMenu {
  constructor(scene, player, buildingSystem) {
    this.scene = scene;
    this.player = player;
    this.buildingSystem = buildingSystem;

    this.armedBuildingClass = null;
    this.ghostSprite = null;
    this.hasManuallyPositioned = false;
    this.buttons = [];
    this.lastDisplayedPowerLevel = null;
    this.prestigeArmConfirmClass = null;

    this.createBar();
    this.createButtons();
    this.setupPlacementInput();

    this.handleResize = this.handleResize.bind(this);
    this.scene.scale.on('resize', this.handleResize);

    this.handleGoldChanged = this.handleGoldChanged.bind(this);
    this.handlePrestigeChanged = this.handlePrestigeChanged.bind(this);
    this.scene.events.on(GameEvents.PLAYER_GOLD_CHANGED, this.handleGoldChanged);
    this.scene.events.on(GameEvents.PRESTIGE_CHANGED, this.handlePrestigeChanged);
  }

  /**
   * Hayalet henüz elle konumlandırılmadıysa oyuncuyu takip eder.
   * Chunk gücüne göre buton maliyetlerini oyuncu konumu değiştikçe günceller.
   */
  update() {
    this.refreshDynamicCostsIfNeeded();

    if (!this.armedBuildingClass || this.hasManuallyPositioned || !this.ghostSprite) {
      return;
    }

    const angle = this.getPlayerFacingAngle();
    const x = this.player.x + Math.cos(angle) * BUILD_PREVIEW_DISTANCE;
    const y = this.player.y + Math.sin(angle) * BUILD_PREVIEW_DISTANCE;

    this.ghostSprite.setPosition(x, y);
    this.updateGhostValidity(x, y);
  }

  /** Oyuncu başka bir chunk'a geçince menü fiyatlarını yeniler */
  refreshDynamicCostsIfNeeded() {
    const powerLevel = this.buildingSystem.getPowerLevelAt(this.player.x, this.player.y);

    if (powerLevel === this.lastDisplayedPowerLevel) {
      return;
    }

    this.lastDisplayedPowerLevel = powerLevel;
    this.refreshAllButtonStates();
  }

  // --- Bar ve butonlar ---

  createBar() {
    const scaleWidth = this.scene.scale.width;
    const scaleHeight = this.scene.scale.height;
    this.barTopY = scaleHeight - BUILD_MENU_BOTTOM_MARGIN - BUILD_MENU_HEIGHT;

    this.barBackground = this.scene.add.rectangle(0, this.barTopY, scaleWidth, BUILD_MENU_HEIGHT, 0x000000, 0.55);
    this.barBackground.setOrigin(0, 0);
    this.barBackground.setScrollFactor(0);
    this.barBackground.setDepth(1000);
  }

  createButtons() {
    const scaleWidth = this.scene.scale.width;
    const totalWidth =
      BUILDING_CLASSES.length * BUILD_MENU_BUTTON_SIZE + (BUILDING_CLASSES.length - 1) * BUILD_MENU_BUTTON_GAP;
    const startX = (scaleWidth - totalWidth) / 2;

    BUILDING_CLASSES.forEach((BuildingClass, index) => {
      const x = startX + index * (BUILD_MENU_BUTTON_SIZE + BUILD_MENU_BUTTON_GAP);
      const y = this.barTopY + (BUILD_MENU_HEIGHT - BUILD_MENU_BUTTON_SIZE) / 2;

      this.buttons.push(this.createButton(BuildingClass, x, y));
    });
  }

  /** Masaüstünde pencere yeniden boyutlandırıldığında bar ve butonları günceller */
  repositionForNewScale() {
    const scaleWidth = this.scene.scale.width;
    const scaleHeight = this.scene.scale.height;

    this.barTopY = scaleHeight - BUILD_MENU_BOTTOM_MARGIN - BUILD_MENU_HEIGHT;
    this.barBackground.setSize(scaleWidth, BUILD_MENU_HEIGHT);
    this.barBackground.setPosition(0, this.barTopY);

    const totalWidth =
      BUILDING_CLASSES.length * BUILD_MENU_BUTTON_SIZE + (BUILDING_CLASSES.length - 1) * BUILD_MENU_BUTTON_GAP;
    const startX = (scaleWidth - totalWidth) / 2;

    this.buttons.forEach((button, index) => {
      const x = startX + index * (BUILD_MENU_BUTTON_SIZE + BUILD_MENU_BUTTON_GAP);
      const y = this.barTopY + (BUILD_MENU_HEIGHT - BUILD_MENU_BUTTON_SIZE) / 2;
      const centerX = x + BUILD_MENU_BUTTON_SIZE / 2;

      button.background.setPosition(x, y);
      button.icon.setPosition(centerX, y + BUILD_MENU_BUTTON_SIZE * 0.36);
      button.costText.setPosition(centerX, y + BUILD_MENU_BUTTON_SIZE * 0.78);
    });
  }

  handleResize() {
    this.repositionForNewScale();
  }

  createButton(BuildingClass, x, y) {
    const background = this.scene.add.rectangle(x, y, BUILD_MENU_BUTTON_SIZE, BUILD_MENU_BUTTON_SIZE, 0x263238, 0.9);
    background.setOrigin(0, 0);
    background.setStrokeStyle(2, 0xffffff, 0.8);
    background.setScrollFactor(0);
    background.setDepth(1001);
    background.setInteractive({ useHandCursor: true });
    background.on('pointerdown', () => this.handleButtonTap(BuildingClass));

    const centerX = x + BUILD_MENU_BUTTON_SIZE / 2;

    const icon = this.scene.add.text(centerX, y + BUILD_MENU_BUTTON_SIZE * 0.36, BuildingClass.icon, {
      fontSize: '24px',
    });
    icon.setOrigin(0.5, 0.5);
    icon.setScrollFactor(0);
    icon.setDepth(1002);

    const costText = this.scene.add.text(centerX, y + BUILD_MENU_BUTTON_SIZE * 0.78, `${BuildingClass.cost}`, {
      fontSize: '13px',
      color: '#ffd54f',
      fontStyle: 'bold',
    });
    costText.setOrigin(0.5, 0.5);
    costText.setScrollFactor(0);
    costText.setDepth(1002);

    const button = { BuildingClass, background, icon, costText };
    this.refreshButtonState(button);

    return button;
  }

  handleButtonTap(BuildingClass) {
    if (this.armedBuildingClass === BuildingClass) {
      this.disarm();
      return;
    }

    if (!this.buildingSystem.canAfford(BuildingClass)) {
      return;
    }

    // Prestij kullanılacaksa: 1. dokunuş uyarı, 2. dokunuş silahlan
    if (this.buildingSystem.needsPrestigeForBuilding(BuildingClass)) {
      if (this.prestigeArmConfirmClass !== BuildingClass) {
        this.prestigeArmConfirmClass = BuildingClass;
        this.refreshAllButtonStates();
        return;
      }
      this.prestigeArmConfirmClass = null;
    } else {
      this.prestigeArmConfirmClass = null;
    }

    this.arm(BuildingClass);
  }

  refreshAllButtonStates() {
    this.buttons.forEach((button) => this.refreshButtonState(button));
  }

  /** Yetersiz bakiye -> soluk; prestij gerekiyorsa mor fiyat; seçili -> sarı çerçeve */
  refreshButtonState(button) {
    const cost = this.buildingSystem.getBuildingCostAt(button.BuildingClass, this.player.x, this.player.y);
    const affordable = this.buildingSystem.canAfford(button.BuildingClass, this.player.x, this.player.y);
    const needsPrestige = this.buildingSystem.needsPrestigeForBuilding(
      button.BuildingClass,
      this.player.x,
      this.player.y,
    );
    const awaitingConfirm = this.prestigeArmConfirmClass === button.BuildingClass;
    const armed = this.armedBuildingClass === button.BuildingClass;

    if (needsPrestige) {
      button.costText.setText(awaitingConfirm ? `OK ${cost}★` : `${cost}★`);
      button.costText.setColor('#b39ddb');
    } else {
      button.costText.setText(`${cost}`);
      button.costText.setColor('#ffd54f');
    }

    const alpha = affordable ? 1 : 0.4;
    button.background.setAlpha(alpha);
    button.icon.setAlpha(alpha);
    button.costText.setAlpha(alpha);
    button.background.setFillStyle(needsPrestige ? 0x311b92 : 0x263238, needsPrestige ? 0.95 : 0.9);
    button.background.setStrokeStyle(
      armed || awaitingConfirm ? 3 : 2,
      armed ? 0xffd54f : awaitingConfirm || needsPrestige ? 0xb39ddb : 0xffffff,
      armed || awaitingConfirm ? 1 : 0.8,
    );
  }

  handleGoldChanged() {
    this.prestigeArmConfirmClass = null;
    this.refreshAllButtonStates();
  }

  handlePrestigeChanged() {
    this.prestigeArmConfirmClass = null;
    this.refreshAllButtonStates();
  }

  // --- Hayalet önizleme + yerleştirme ---

  arm(BuildingClass) {
    this.armedBuildingClass = BuildingClass;
    this.hasManuallyPositioned = false;
    this.createGhost(BuildingClass);
    this.refreshAllButtonStates();
  }

  disarm() {
    this.armedBuildingClass = null;
    this.prestigeArmConfirmClass = null;
    this.destroyGhost();
    this.refreshAllButtonStates();
  }

  createGhost(BuildingClass) {
    this.destroyGhost();

    const angle = this.getPlayerFacingAngle();
    const x = this.player.x + Math.cos(angle) * BUILD_PREVIEW_DISTANCE;
    const y = this.player.y + Math.sin(angle) * BUILD_PREVIEW_DISTANCE;

    this.ghostSprite = this.scene.add.sprite(x, y, BuildingClass.textureKey);
    this.ghostSprite.setAlpha(BUILD_GHOST_ALPHA);
    this.ghostSprite.setDepth(1500);
    this.updateGhostValidity(x, y);
  }

  destroyGhost() {
    if (this.ghostSprite) {
      this.ghostSprite.destroy();
      this.ghostSprite = null;
    }
  }

  updateGhostValidity(x, y) {
    if (!this.ghostSprite) {
      return;
    }

    const valid = this.buildingSystem.isValidPlacement(x, y);
    this.ghostSprite.setTint(valid ? BUILD_GHOST_VALID_COLOR : BUILD_GHOST_INVALID_COLOR);
  }

  /** Player.direction (Faz 1'den) kullanılarak hayaletin başlangıçta baktığı yön */
  getPlayerFacingAngle() {
    const angleByDirection = {
      up: -Math.PI / 2,
      down: Math.PI / 2,
      left: Math.PI,
      right: 0,
      'up-left': (-3 * Math.PI) / 4,
      'up-right': -Math.PI / 4,
      'down-left': (3 * Math.PI) / 4,
      'down-right': Math.PI / 4,
      idle: Math.PI / 2,
    };

    return angleByDirection[this.player.direction] ?? Math.PI / 2;
  }

  setupPlacementInput() {
    this.scene.input.on('pointermove', (pointer) => this.handlePointerMove(pointer));
    this.scene.input.on('pointerup', (pointer) => this.handlePointerUp(pointer));
  }

  handlePointerMove(pointer) {
    if (!this.armedBuildingClass || this.isPointerOverUI(pointer)) {
      return;
    }

    this.hasManuallyPositioned = true;

    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.ghostSprite.setPosition(worldPoint.x, worldPoint.y);
    this.updateGhostValidity(worldPoint.x, worldPoint.y);
  }

  handlePointerUp(pointer) {
    if (!this.armedBuildingClass || this.isPointerOverUI(pointer)) {
      return;
    }

    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const placed = this.buildingSystem.placeBuilding(this.armedBuildingClass, worldPoint.x, worldPoint.y);

    if (placed) {
      this.disarm();
    } else {
      this.flashGhostInvalid();
    }
  }

  /** Geçersiz bir yere dokununca hayalete küçük bir "titreme" - neden yerleşmediği belli olsun */
  flashGhostInvalid() {
    if (!this.ghostSprite) {
      return;
    }

    this.scene.tweens.add({
      targets: this.ghostSprite,
      scaleX: this.ghostSprite.scaleX * 1.15,
      scaleY: this.ghostSprite.scaleY * 1.15,
      duration: 80,
      yoyo: true,
    });
  }

  /** Build menu barının, joystick'in, minimap'ın ve üst HUD'ın üzerindeki dokunuşları yerleştirme saymaz */
  isPointerOverUI(pointer) {
    if (pointer.y >= this.barTopY) {
      return true; // build menu çubuğu + altındaki joystick bölgesi
    }

    const minimapLeft = GAME_WIDTH - MINIMAP_WIDTH - MINIMAP_MARGIN;
    if (pointer.x >= minimapLeft && pointer.y <= MINIMAP_MARGIN + MINIMAP_HEIGHT) {
      return true; // minimap bölgesi
    }

    if (pointer.x <= HUD_MARGIN_X + HEALTH_BAR_WIDTH && pointer.y <= HUD_TOP_ZONE_HEIGHT) {
      return true; // can barı / altın / kaynak sayaçları + debug metni bölgesi
    }

    // UnlockPrompt + UpgradePrompt üst üste iki ayrı çubuk olarak duruyor (bkz. o dosyalar);
    // ikisini de kapsayan tek bir dikdörtgen kontrolü yeterli
    const promptLeft = (GAME_WIDTH - UNLOCK_PROMPT_WIDTH) / 2;
    const promptBottom = this.barTopY - UNLOCK_PROMPT_BOTTOM_GAP;
    const promptTop = promptBottom - (UNLOCK_PROMPT_BOTTOM_GAP + UNLOCK_PROMPT_HEIGHT) * 2;

    if (pointer.x >= promptLeft && pointer.x <= promptLeft + UNLOCK_PROMPT_WIDTH && pointer.y >= promptTop && pointer.y <= promptBottom) {
      return true; // "Bu bölgeyi aç" / "Yükselt" prompt'ları bölgesi
    }

    return false;
  }

  destroy() {
    this.scene.scale.off('resize', this.handleResize);
    this.scene.events.off(GameEvents.PLAYER_GOLD_CHANGED, this.handleGoldChanged);
    this.scene.events.off(GameEvents.PRESTIGE_CHANGED, this.handlePrestigeChanged);
    this.destroyGhost();
  }
}
