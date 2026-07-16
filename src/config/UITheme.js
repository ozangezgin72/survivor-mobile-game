/**
 * Sıcak tonlu flat modern mobil UI tema token'ları.
 * Clash of Clans / Candy Crush esintili — tüm ekranlarda tutarlı kullanım için.
 */

export const UI_COLOR_PRIMARY = 0xf5a623;
export const UI_COLOR_PRIMARY_DARK = 0xc17f0f;
export const UI_COLOR_BROWN = 0x8b4513;
export const UI_COLOR_BG_DARK = 0x2c1810;
export const UI_COLOR_BG_MID = 0x4a2c1a;
export const UI_COLOR_CREAM = 0xffe8b8;
export const UI_COLOR_TEXT_DARK = 0x4a2511;
export const UI_COLOR_SUCCESS = 0x27ae60;
export const UI_COLOR_SUCCESS_DARK = 0x1e8449;
export const UI_COLOR_DANGER = 0xc0392b;
export const UI_COLOR_DANGER_DARK = 0x922b21;

/** Phaser 0xRRGGBB → CSS #rrggbb */
export function colorToCss(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/**
 * Dikey gradient texture (arka plan için).
 * @returns {string} texture key
 */
export function ensureVerticalGradientTexture(scene, key, width, height, topColor, bottomColor) {
  const w = Math.max(2, Math.ceil(width));
  const h = Math.max(2, Math.ceil(height));

  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }

  const canvasTexture = scene.textures.createCanvas(key, w, h);
  const ctx = canvasTexture.getContext();
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, colorToCss(topColor));
  gradient.addColorStop(1, colorToCss(bottomColor));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  canvasTexture.refresh();

  return key;
}
