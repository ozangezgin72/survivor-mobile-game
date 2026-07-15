import {
  BUILD_MENU_HEIGHT,
  BUILD_MENU_BOTTOM_MARGIN,
  UNLOCK_PROMPT_WIDTH,
  UNLOCK_PROMPT_HEIGHT,
  UNLOCK_PROMPT_BOTTOM_GAP,
} from '../config/Constants.js';

const AFFORDABLE_COLOR = 0x1b5e20;
const UNAFFORDABLE_COLOR = 0x424242;

/**
 * Oyuncu, açılabilir (komşusu unlocked olan) kilitli bir chunk'ın sınırına yaklaşınca
 * ekranda beliren "Bu bölgeyi aç: N altın" butonu.
 *
 * FogOfWarSystem'in her frame belirlediği "en yakın açılabilir chunk" bilgisine göre
 * görünür/gizli olur; INSTANT_BUILD ile tutarlı şekilde dokunulduğu an chunk açılır,
 * bekleme yoktur. İnşa menüsü çubuğunun hemen üstünde durur.
 */
export default class UnlockPrompt {
  constructor(scene, player, fogOfWarSystem) {
    this.scene = scene;
    this.player = player;
    this.fogOfWarSystem = fogOfWarSystem;

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
      y: barTopY - UNLOCK_PROMPT_BOTTOM_GAP - UNLOCK_PROMPT_HEIGHT,
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
    this.background.setStrokeStyle(2, 0xaed581, 1);
    this.background.setScrollFactor(0);
    this.background.setDepth(1300);
    this.background.setInteractive({ useHandCursor: true });
    this.background.on('pointerdown', () => this.handleTap());

    this.label = this.scene.add.text(this.x + UNLOCK_PROMPT_WIDTH / 2, this.y + UNLOCK_PROMPT_HEIGHT / 2, '', {
      fontSize: '16px',
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
    const chunk = this.fogOfWarSystem.nearestLockedChunk;

    if (!chunk) {
      this.setVisible(false);
      return;
    }

    const cost = this.fogOfWarSystem.getUnlockCost();
    const affordable = this.player.canAffordGoldOnly(cost);

    this.label.setText(`Bu bölgeyi aç: ${cost} altın`);
    this.background.setFillStyle(affordable ? AFFORDABLE_COLOR : UNAFFORDABLE_COLOR, 0.92);
    this.setVisible(true);
  }

  handleTap() {
    const success = this.fogOfWarSystem.tryUnlockNearestChunk();

    if (!success) {
      this.flashDenied();
    }
  }

  /** Yetersiz altınla dokununca küçük bir "titreme" - neden açılmadığı belli olsun */
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
