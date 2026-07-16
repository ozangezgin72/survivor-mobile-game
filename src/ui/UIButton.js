import {
  UI_COLOR_PRIMARY,
  UI_COLOR_PRIMARY_DARK,
  UI_COLOR_BROWN,
  colorToCss,
} from '../config/UITheme.js';

let buttonTextureSerial = 0;

/**
 * Yuvarlak köşeli, gölgeli (3D basılabilir) modern mobil buton.
 *
 * @returns {{
 *   container: Phaser.GameObjects.Container,
 *   setPosition: (x: number, y: number) => void,
 *   setVisible: (visible: boolean) => void,
 *   setText: (text: string) => void,
 *   destroy: () => void,
 * }}
 */
export function createButton(scene, x, y, width, height, text, options = {}) {
  const {
    onClick = null,
    fillColor = UI_COLOR_PRIMARY,
    shadowColor = UI_COLOR_PRIMARY_DARK,
    textColor = '#ffffff',
    strokeColor = UI_COLOR_BROWN,
    fontSize = 26,
    depth = 10,
    shadowOffset = 5,
    cornerRadius = 18,
    scrollFactor = null,
  } = options;

  const serial = buttonTextureSerial++;
  const faceKey = `ui-btn-face-${serial}`;
  const shadowKey = `ui-btn-shadow-${serial}`;

  createRoundedRectTexture(scene, faceKey, width, height, fillColor, cornerRadius);
  createRoundedRectTexture(scene, shadowKey, width, height, shadowColor, cornerRadius);

  const container = scene.add.container(x, y);
  container.setDepth(depth);
  if (scrollFactor != null) {
    container.setScrollFactor(scrollFactor);
  }

  const shadow = scene.add.image(0, shadowOffset, shadowKey);
  const face = scene.add.image(0, 0, faceKey);

  const label = scene.add.text(0, -1, text, {
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color: textColor,
    stroke: colorToCss(strokeColor),
    strokeThickness: Math.max(3, Math.round(fontSize / 7)),
    align: 'center',
  });
  label.setOrigin(0.5, 0.5);

  // Hit alanı: gölge yüksekliğini de kapsasın
  const hit = scene.add.zone(0, shadowOffset / 2, width, height + shadowOffset);
  hit.setInteractive({ useHandCursor: true });

  container.add([shadow, face, label, hit]);

  let pressed = false;

  const pressIn = () => {
    pressed = true;
    scene.tweens.add({
      targets: container,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 60,
      ease: 'Quad.easeOut',
    });
  };

  const pressOut = () => {
    if (!pressed) {
      return;
    }
    pressed = false;
    scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 80,
      ease: 'Back.easeOut',
    });
  };

  hit.on('pointerover', () => {
    face.setTint(0xfff0c8);
  });

  hit.on('pointerout', () => {
    face.clearTint();
    pressOut();
  });

  hit.on('pointerdown', (pointer) => {
    pointer?.event?.stopPropagation?.();
    pressIn();
  });

  hit.on('pointerup', (pointer) => {
    pointer?.event?.stopPropagation?.();
    const wasPressed = pressed;
    pressOut();
    if (wasPressed && onClick) {
      onClick();
    }
  });

  return {
    container,
    setPosition(nx, ny) {
      container.setPosition(nx, ny);
    },
    setVisible(visible) {
      container.setVisible(visible);
    },
    setText(nextText) {
      label.setText(nextText);
    },
    destroy() {
      hit.removeAllListeners();
      container.destroy(true);
      if (scene.textures.exists(faceKey)) {
        scene.textures.remove(faceKey);
      }
      if (scene.textures.exists(shadowKey)) {
        scene.textures.remove(shadowKey);
      }
    },
  };
}

function createRoundedRectTexture(scene, key, width, height, color, radius) {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }

  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(color, 1);
  g.fillRoundedRect(0, 0, width, height, radius);
  g.generateTexture(key, width, height);
  g.destroy();
}
