import {
  JOYSTICK_RADIUS,
  JOYSTICK_MARGIN_X,
  JOYSTICK_MARGIN_Y,
  JOYSTICK_FORCE_MIN,
} from '../config/Constants.js';

/**
 * Mobil dokunmatik hareket için sanal joystick.
 * "phaser3-rex-plugins" paketinin virtual joystick eklentisini sarmalar (wrap eder).
 *
 * Ekranın sol-alt köşesinde sabit durur: `fixed: true` ayarı base/thumb game object'lerinin
 * scrollFactor'ünü otomatik olarak 0 yapar, böylece kamera haritada gezinse de joystick
 * her zaman ekranın aynı noktasında kalır.
 */
export default class JoystickController {
  constructor(scene) {
    this.scene = scene;
    this.handleResize = this.handleResize.bind(this);
    this.joystick = this.createJoystick();
    this.scene.scale.on('resize', this.handleResize);
  }

  getJoystickPosition() {
    const baseX = JOYSTICK_MARGIN_X + JOYSTICK_RADIUS;
    const baseY = this.scene.scale.height - JOYSTICK_MARGIN_Y - JOYSTICK_RADIUS;

    return { baseX, baseY };
  }

  createJoystick() {
    const { baseX, baseY } = this.getJoystickPosition();

    // Taban (base) ve tutamak (thumb) için basit yarı saydam daireler.
    // Gerçek joystick görseli (pixel art) eklenene kadar bu placeholder yeterli.
    const base = this.scene.add.circle(0, 0, JOYSTICK_RADIUS, 0xffffff, 0.25);
    base.setStrokeStyle(3, 0xffffff, 0.7);

    const thumb = this.scene.add.circle(0, 0, JOYSTICK_RADIUS * 0.5, 0xffffff, 0.55);

    const joystick = this.scene.plugins.get('rexVirtualJoystick').add(this.scene, {
      x: baseX,
      y: baseY,
      radius: JOYSTICK_RADIUS,
      base,
      thumb,
      dir: '8dir',
      forceMin: JOYSTICK_FORCE_MIN,
      fixed: true,
    });

    // UI her zaman en üstte görünsün (oyuncu/dünya elemanlarının üzerinde)
    base.setDepth(1000);
    thumb.setDepth(1001);

    return joystick;
  }

  handleResize() {
    const { baseX, baseY } = this.getJoystickPosition();
    this.joystick.setPosition(baseX, baseY);
  }

  /** Parmak joystick üzerinde basılı ve deadzone dışında mı? */
  isActive() {
    return this.joystick.force > JOYSTICK_FORCE_MIN;
  }

  /**
   * Joystick'in normalize edilmemiş yön vektörü.
   * Normalize işlemi bilerek burada yapılmıyor; Player.move() bunu kendi içinde
   * yapıp sabit hız uyguluyor (joystick ne kadar itilirse itilsin hız değişmiyor).
   */
  getVector() {
    return { x: this.joystick.forceX, y: this.joystick.forceY };
  }

  destroy() {
    this.scene.scale.off('resize', this.handleResize);
    this.joystick.destroy();
  }
}
