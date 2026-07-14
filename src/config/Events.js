// Sahneler/sistemler arasında birbirine sıkı bağlı olmadan (decoupled) haberleşmek
// için kullanılan olay adları. Phaser'ın kendi Scene EventEmitter'ı üzerinden yayılır:
//   this.scene.events.emit(GameEvents.XXX, payload)
//   this.scene.events.on(GameEvents.XXX, handler, context)
//
// Örn. CombatSystem, Enemy'nin öldüğünü bilir ama Gold sınıfından haberi yoktur;
// sadece ENEMY_DIED event'ini yayınlar, GoldSystem bunu dinleyip altın spawn eder.
export const GameEvents = {
  PLAYER_HEALTH_CHANGED: 'player-health-changed',
  PLAYER_DIED: 'player-died',
  PLAYER_GOLD_CHANGED: 'player-gold-changed',
  PLAYER_RESOURCES_CHANGED: 'player-resources-changed',
  PLAYER_LEVEL_UP: 'player-level-up',
  ENEMY_DIED: 'enemy-died',
  CHUNK_UNLOCKED: 'chunk-unlocked',
  BUILDING_PLACED: 'building-placed',
  BUILDING_UPGRADED: 'building-upgraded',
  WAVE_WARNING: 'wave-warning',
  WAVE_STARTED: 'wave-started',
  WAVE_COMPLETED: 'wave-completed',
};
