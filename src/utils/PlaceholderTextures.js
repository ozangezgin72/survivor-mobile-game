// Gerçek pixel-art sprite/tile'lar eklenene kadar kullanılacak basit yer tutucu
// (placeholder) texture'ları burada Phaser'ın Graphics API'si ile proceduralden
// (koddan) üretiyoruz. Böylece henüz hiçbir asset dosyasına ihtiyaç kalmıyor.

/**
 * Büyük dünya haritası için tekrar eden basit bir zemin karosu üretir.
 * TileSprite ile kullanılmak üzere tasarlandı; kare kenarındaki ince çizgi
 * karonun tekrarlandığını gözle görülür kılar (gerçek tile'lar gelene kadar).
 */
export function createGroundTexture(scene, key = 'ground-tile', size = 64) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  graphics.fillStyle(0x3a7d44, 1);
  graphics.fillRect(0, 0, size, size);

  graphics.lineStyle(1, 0x2f6438, 1);
  graphics.strokeRect(0, 0, size, size);

  graphics.generateTexture(key, size, size);
  graphics.destroy();

  return key;
}

/**
 * Oyuncu karakteri için basit bir daire placeholder'ı üretir.
 * Üstteki küçük nokta, karakterin "yüzünü" temsil eder; sadece görsel olarak
 * hareket yönünü test ederken faydalı olsun diye eklendi.
 */
export function createPlayerTexture(scene, key = 'player-placeholder', size = 48) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  graphics.fillStyle(0x4fc3f7, 1);
  graphics.fillCircle(size / 2, size / 2, size / 2 - 2);

  graphics.lineStyle(3, 0xffffff, 1);
  graphics.strokeCircle(size / 2, size / 2, size / 2 - 2);

  graphics.fillStyle(0xffffff, 1);
  graphics.fillCircle(size / 2, size / 2 - size * 0.2, 4);

  graphics.generateTexture(key, size, size);
  graphics.destroy();

  return key;
}

/**
 * Düşman için basit bir kare placeholder'ı üretir. Oyuncudan hem renk (kırmızı)
 * hem de şekil (kare vs. daire) olarak ayırt edilebilir olsun diye tasarlandı.
 * Sağdaki küçük üçgen, hareket yönünü (sprite.rotation ile) gösteren basit bir "burun".
 */
export function createEnemyTexture(scene, key = 'enemy-placeholder', size = 44) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  graphics.fillStyle(0xe53935, 1);
  graphics.fillRoundedRect(2, 2, size - 4, size - 4, 6);

  graphics.lineStyle(3, 0xffffff, 1);
  graphics.strokeRoundedRect(2, 2, size - 4, size - 4, 6);

  graphics.fillStyle(0xffffff, 1);
  graphics.fillTriangle(size - 12, size / 2 - 6, size - 12, size / 2 + 6, size - 3, size / 2);

  graphics.generateTexture(key, size, size);
  graphics.destroy();

  return key;
}

/** Altın/kaynak drop'u için basit sarı bir daire placeholder'ı üretir. */
export function createGoldTexture(scene, key = 'gold-placeholder', size = 24) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  graphics.fillStyle(0xffd54f, 1);
  graphics.fillCircle(size / 2, size / 2, size / 2 - 2);

  graphics.lineStyle(2, 0xf9a825, 1);
  graphics.strokeCircle(size / 2, size / 2, size / 2 - 2);

  graphics.fillStyle(0xfff9c4, 1);
  graphics.fillCircle(size / 2 - 4, size / 2 - 4, 2.5);

  graphics.generateTexture(key, size, size);
  graphics.destroy();

  return key;
}

// ============================================================
// Faz 3: İnşa edilebilir binalar + kaynak node'ları
// ============================================================

/** Okçu kulesi: yeşilimsi (doğa temalı), üstünde basit bir "ok ucu" göstergesi. */
export function createArcherTowerTexture(scene, key = 'archer-tower-placeholder', size = 48) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  graphics.fillStyle(0x33691e, 1);
  graphics.fillRoundedRect(8, 6, size - 16, size - 14, 6);
  graphics.lineStyle(3, 0xffffff, 1);
  graphics.strokeRoundedRect(8, 6, size - 16, size - 14, 6);

  graphics.fillStyle(0xdcedc8, 1);
  graphics.fillTriangle(size / 2, 2, size / 2 - 7, 15, size / 2 + 7, 15);

  graphics.generateTexture(key, size, size);
  graphics.destroy();

  return key;
}

/** Top: koyu gri gövde + namlu. */
export function createCannonTexture(scene, key = 'cannon-placeholder', size = 48) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  graphics.fillStyle(0x424242, 1);
  graphics.fillRoundedRect(6, size / 2 - 4, size - 12, size / 2, 6);
  graphics.lineStyle(3, 0xffffff, 1);
  graphics.strokeRoundedRect(6, size / 2 - 4, size - 12, size / 2, 6);

  graphics.fillStyle(0x212121, 1);
  graphics.fillRect(size / 2 - 6, 4, 12, size / 2);
  graphics.lineStyle(2, 0xffffff, 0.8);
  graphics.strokeRect(size / 2 - 6, 4, 12, size / 2);

  graphics.generateTexture(key, size, size);
  graphics.destroy();

  return key;
}

/** Füze kulesi: kırmızı gövde + üstte füze ucu üçgeni. */
export function createMissileTowerTexture(scene, key = 'missile-tower-placeholder', size = 48) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  graphics.fillStyle(0xb71c1c, 1);
  graphics.fillRoundedRect(10, 12, size - 20, size - 18, 4);
  graphics.lineStyle(3, 0xffffff, 1);
  graphics.strokeRoundedRect(10, 12, size - 20, size - 18, 4);

  graphics.fillStyle(0xffab91, 1);
  graphics.fillTriangle(size / 2, 2, size / 2 - 9, 16, size / 2 + 9, 16);

  graphics.generateTexture(key, size, size);
  graphics.destroy();

  return key;
}

/** Duvar: kahverengi zemin üstünde basit tuğla deseni. */
export function createWallTexture(scene, key = 'wall-placeholder', size = 40) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  graphics.fillStyle(0x795548, 1);
  graphics.fillRect(1, 1, size - 2, size - 2);

  graphics.lineStyle(2, 0x4e342e, 1);
  graphics.strokeRect(1, 1, size - 2, size - 2);
  graphics.lineBetween(1, size / 2, size - 1, size / 2);
  graphics.lineBetween(size / 2, 1, size / 2, size / 2);
  graphics.lineBetween(size / 4, size / 2, size / 4, size - 1);
  graphics.lineBetween((size / 4) * 3, size / 2, (size / 4) * 3, size - 1);

  graphics.generateTexture(key, size, size);
  graphics.destroy();

  return key;
}

/** Kaynak çıkarma binası: turuncu gövde + basit "dişli" göstergesi. */
export function createResourceExtractorTexture(scene, key = 'resource-extractor-placeholder', size = 48) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  graphics.fillStyle(0xff8f00, 1);
  graphics.fillRoundedRect(4, 4, size - 8, size - 8, 8);
  graphics.lineStyle(3, 0xffffff, 1);
  graphics.strokeRoundedRect(4, 4, size - 8, size - 8, 8);

  graphics.fillStyle(0xffe0b2, 1);
  graphics.fillCircle(size / 2, size / 2, size * 0.2);
  graphics.lineStyle(2, 0xff8f00, 1);
  graphics.strokeCircle(size / 2, size / 2, size * 0.2);

  graphics.generateTexture(key, size, size);
  graphics.destroy();

  return key;
}

// ============================================================
// Faz 5: Yeni düşman tipleri (FastEnemy/TankEnemy/RangedEnemy)
// ============================================================

/** Hızlı düşman: küçük, turuncu, sivri (agile) bir şekil - "hızlı ama zayıf" hissi versin. */
export function createFastEnemyTexture(scene, key = 'fast-enemy-placeholder', size = 34) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  graphics.fillStyle(0xff6f00, 1);
  graphics.fillRoundedRect(2, 2, size - 4, size - 4, 10);

  graphics.lineStyle(2, 0xffffff, 1);
  graphics.strokeRoundedRect(2, 2, size - 4, size - 4, 10);

  graphics.fillStyle(0xffffff, 1);
  graphics.fillTriangle(size - 9, size / 2 - 5, size - 9, size / 2 + 5, size - 2, size / 2);

  graphics.generateTexture(key, size, size);
  graphics.destroy();

  return key;
}

/** Tank düşman: büyük, koyu bordo, kalın kenarlıklı bir şekil - "yavaş ama dayanıklı" hissi versin. */
export function createTankEnemyTexture(scene, key = 'tank-enemy-placeholder', size = 54) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  graphics.fillStyle(0x6d1b1b, 1);
  graphics.fillRoundedRect(2, 2, size - 4, size - 4, 4);

  graphics.lineStyle(4, 0xffffff, 1);
  graphics.strokeRoundedRect(2, 2, size - 4, size - 4, 4);

  graphics.fillStyle(0xffcdd2, 1);
  graphics.fillTriangle(size - 14, size / 2 - 8, size - 14, size / 2 + 8, size - 4, size / 2);

  graphics.generateTexture(key, size, size);
  graphics.destroy();

  return key;
}

/** Menzilli düşman: mor, yuvarlak köşeli - menzilden vuran/kiting yapan tipi ayırt eder. */
export function createRangedEnemyTexture(scene, key = 'ranged-enemy-placeholder', size = 40) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  graphics.fillStyle(0x8e24aa, 1);
  graphics.fillRoundedRect(2, 2, size - 4, size - 4, 14);

  graphics.lineStyle(3, 0xffffff, 1);
  graphics.strokeRoundedRect(2, 2, size - 4, size - 4, 14);

  // Menzilli saldırıyı çağrıştıran küçük bir "elmas uç" göstergesi
  graphics.fillStyle(0xe1bee7, 1);
  graphics.fillTriangle(size - 10, size / 2 - 6, size - 10, size / 2 + 6, size - 2, size / 2);

  graphics.generateTexture(key, size, size);
  graphics.destroy();

  return key;
}

/**
 * Kaynak toplama noktası (maden/ağaç). İki basit varyant üretir ("tree"=yeşil,
 * "rock"=gri) böylece haritadaki 26 node'da biraz görsel çeşitlilik olur.
 */
export function createResourceNodeTexture(scene, key, variant = 'rock', size = 40) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  if (variant === 'tree') {
    graphics.fillStyle(0x2e7d32, 1);
    graphics.fillCircle(size / 2, size / 2, size / 2 - 3);
    graphics.lineStyle(2, 0x1b5e20, 1);
    graphics.strokeCircle(size / 2, size / 2, size / 2 - 3);
  } else {
    graphics.fillStyle(0x757575, 1);
    graphics.fillCircle(size / 2, size / 2, size / 2 - 3);
    graphics.lineStyle(2, 0x424242, 1);
    graphics.strokeCircle(size / 2, size / 2, size / 2 - 3);
  }

  // Kaynak/parıltı işareti - node'un "canlı" (tükenmemiş) olduğunu belirginleştirir
  graphics.fillStyle(0xffffff, 0.85);
  graphics.fillCircle(size / 2 - 5, size / 2 - 5, 3);

  graphics.generateTexture(key, size, size);
  graphics.destroy();

  return key;
}
