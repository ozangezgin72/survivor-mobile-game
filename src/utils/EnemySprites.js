/**
 * Tiny Swords Red Units → düşman tipi sprite yapılandırması.
 * frameWidth/Height sheet kare boyutu; visualSize eski placeholder görsel boyutu.
 */

export const UNIT_SPRITE_DIR = 'assets/sprites/Tiny Swords (Free Pack)/Units/Red Units';

/** @typedef {{
 *   prefix: string,
 *   idleTexture: string,
 *   runTexture: string,
 *   attackTexture: string,
 *   idleEnd: number,
 *   runEnd: number,
 *   attackEnd: number,
 *   frameWidth: number,
 *   frameHeight: number,
 *   visualSize: number,
 *   idlePath: string,
 *   runPath: string,
 *   attackPath: string,
 *   arrowPath?: string,
 *   arrowTexture?: string,
 * }} EnemySpriteConfig
 */

/** Normal Enemy → Pawn (Idle/Run 192; saldırı = Interact Knife) */
export const PAWN_SPRITE = {
  prefix: 'pawn',
  idleTexture: 'pawn-idle',
  runTexture: 'pawn-run',
  attackTexture: 'pawn-attack',
  idleEnd: 7,
  runEnd: 5,
  attackEnd: 3,
  frameWidth: 192,
  frameHeight: 192,
  visualSize: 44,
  idlePath: `${UNIT_SPRITE_DIR}/Pawn/Pawn_Idle.png`,
  runPath: `${UNIT_SPRITE_DIR}/Pawn/Pawn_Run.png`,
  attackPath: `${UNIT_SPRITE_DIR}/Pawn/Pawn_Interact Knife.png`,
};

/** FastEnemy → Lancer (192×320 sheet) */
export const LANCER_SPRITE = {
  prefix: 'lancer',
  idleTexture: 'lancer-idle',
  runTexture: 'lancer-run',
  attackTexture: 'lancer-attack',
  idleEnd: 19,
  runEnd: 9,
  attackEnd: 4,
  frameWidth: 192,
  frameHeight: 320,
  visualSize: 34,
  idlePath: `${UNIT_SPRITE_DIR}/Lancer/Lancer_Idle.png`,
  runPath: `${UNIT_SPRITE_DIR}/Lancer/Lancer_Run.png`,
  attackPath: `${UNIT_SPRITE_DIR}/Lancer/Lancer_Right_Attack.png`,
};

/** TankEnemy → Warrior */
export const WARRIOR_SPRITE = {
  prefix: 'warrior',
  idleTexture: 'warrior-idle',
  runTexture: 'warrior-run',
  attackTexture: 'warrior-attack',
  idleEnd: 7,
  runEnd: 5,
  attackEnd: 3,
  frameWidth: 192,
  frameHeight: 192,
  visualSize: 54,
  idlePath: `${UNIT_SPRITE_DIR}/Warrior/Warrior_Idle.png`,
  runPath: `${UNIT_SPRITE_DIR}/Warrior/Warrior_Run.png`,
  attackPath: `${UNIT_SPRITE_DIR}/Warrior/Warrior_Attack1.png`,
};

/** RangedEnemy → Red Archer */
export const RED_ARCHER_SPRITE = {
  prefix: 'red-archer',
  idleTexture: 'red-archer-idle',
  runTexture: 'red-archer-run',
  attackTexture: 'red-archer-shoot',
  idleEnd: 5,
  runEnd: 3,
  attackEnd: 7,
  frameWidth: 192,
  frameHeight: 192,
  visualSize: 40,
  idlePath: `${UNIT_SPRITE_DIR}/Archer/Archer_Idle.png`,
  runPath: `${UNIT_SPRITE_DIR}/Archer/Archer_Run.png`,
  attackPath: `${UNIT_SPRITE_DIR}/Archer/Archer_Shoot.png`,
  arrowTexture: 'red-arrow',
  arrowPath: `${UNIT_SPRITE_DIR}/Archer/Arrow.png`,
};

/**
 * @param {Phaser.Scene} scene
 * @param {EnemySpriteConfig} config
 */
export function loadEnemySpriteSheets(scene, config) {
  const frame = { frameWidth: config.frameWidth, frameHeight: config.frameHeight };
  scene.load.spritesheet(config.idleTexture, config.idlePath, frame);
  scene.load.spritesheet(config.runTexture, config.runPath, frame);
  scene.load.spritesheet(config.attackTexture, config.attackPath, frame);

  if (config.arrowTexture && config.arrowPath) {
    scene.load.spritesheet(config.arrowTexture, config.arrowPath, {
      frameWidth: 64,
      frameHeight: 64,
    });
  }
}

/**
 * @param {Phaser.Scene} scene
 * @param {EnemySpriteConfig} config
 */
export function ensureEnemyAnimations(scene, config) {
  const idleKey = `${config.prefix}-idle-anim`;
  if (scene.anims.exists(idleKey)) {
    return {
      idle: idleKey,
      run: `${config.prefix}-run-anim`,
      attack: `${config.prefix}-attack-anim`,
    };
  }

  const runKey = `${config.prefix}-run-anim`;
  const attackKey = `${config.prefix}-attack-anim`;

  scene.anims.create({
    key: idleKey,
    frames: scene.anims.generateFrameNumbers(config.idleTexture, { start: 0, end: config.idleEnd }),
    frameRate: 6,
    repeat: -1,
  });

  scene.anims.create({
    key: runKey,
    frames: scene.anims.generateFrameNumbers(config.runTexture, { start: 0, end: config.runEnd }),
    frameRate: 10,
    repeat: -1,
  });

  scene.anims.create({
    key: attackKey,
    frames: scene.anims.generateFrameNumbers(config.attackTexture, {
      start: 0,
      end: config.attackEnd,
    }),
    frameRate: 12,
    repeat: 0,
  });

  return { idle: idleKey, run: runKey, attack: attackKey };
}
