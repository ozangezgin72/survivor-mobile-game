// Oyunun tüm "sihirli sayıları" burada toplanıyor, böylece dengeleme/tuning
// için tek bir dosyaya bakmak yeterli oluyor.

// --- Ekran / mantıksal çözünürlük ---
// Phaser.Scale.FIT bu boyutu cihazın ekranına en-boy oranını koruyarak sığdırır.
export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

// --- Oyun dünyası ---
// Şimdilik düz renkli/tekrarlı doku ile dolu, gerçek tilemap ileride gelecek.
export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 4000;

// --- Oyuncu hareketi ---
export const PLAYER_SPEED = 220; // piksel/saniye - joystick ne kadar itilirse itilsin hız sabit
export const PLAYER_SPEED_PER_LEVEL = 0.03; // her seviye atlayınca temel hıza +%3 (seviye 10'da ~%27)

// --- Sanal joystick (rex virtual joystick plugin) ---
export const JOYSTICK_RADIUS = 70;
export const JOYSTICK_MARGIN_X = 60;
export const JOYSTICK_MARGIN_Y = 60;
export const JOYSTICK_FORCE_MIN = 16; // bu değerin altındaki ufak titremeler hareket saymaz (deadzone)

// --- Minimap placeholder ---
export const MINIMAP_WIDTH = 160;
export const MINIMAP_HEIGHT = 160;
export const MINIMAP_MARGIN = 24;

// --- Oyuncu savaş sistemi (Faz 2) ---
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_ATTACK_DAMAGE = 10;
export const PLAYER_ATTACK_RANGE = 160; // menzilli otomatik saldırı - düşmanlardan daha uzak
export const PLAYER_ATTACK_SPEED = 2; // saldırı/saniye

// --- Düşman ayarları (Faz 2) ---
export const ENEMY_MAX_HEALTH = 30;
export const ENEMY_MOVE_SPEED = 90;
export const ENEMY_ATTACK_DAMAGE = 5;
export const ENEMY_ATTACK_RANGE = 42; // yakın dövüş
export const ENEMY_ATTACK_SPEED = 1; // saldırı/saniye
export const ENEMY_GOLD_DROP_MIN = 3;
export const ENEMY_GOLD_DROP_MAX = 7;
export const ENEMY_CHASE_RANGE = 300; // oyuncuyu fark edip kovalamaya başlama menzili
export const ENEMY_WANDER_RADIUS = 80; // idle gezinme yarıçapı (spawn noktası etrafında)
export const ENEMY_WANDER_SPEED_FACTOR = 0.4; // gezinirken kovalamaya göre daha yavaş hareket eder

// --- Düşman spawn sistemi (Faz 2) ---
export const INITIAL_ENEMY_COUNT = 12; // oyun başlar başlamaz hemen spawn olacak düşman sayısı (üst sınır)
export const MAX_ENEMY_COUNT = 18; // haritada aynı anda en fazla bulunacak düşman sayısı (genel tavan)
// Faz 4: Gerçek tavan, açılan chunk sayısına göre ölçeklenir (bkz. EnemySpawner.getMaxEnemyCount).
// Sadece 1 chunk açıkken 18 düşmanın hepsi o küçük 800x800 alana sıkışıp anında kuşatma
// yapmasın diye; harita büyüdükçe (daha fazla chunk açıldıkça) düşman tavanı da büyür.
export const ENEMY_COUNT_PER_CHUNK = 3;
export const ENEMY_SPAWN_INTERVAL = 1500; // ms - yeni düşman spawn aralığı (biri ölünce akış devam eder)
// Ekranın görünen alanının yarı-köşegeninden (~734px) büyük tutuldu, böylece
// düşmanlar oyuncunun gözünün önünde aniden belirmez, hep ekranın hemen dışında spawn olur
export const ENEMY_SPAWN_MIN_DISTANCE = 760;
export const ENEMY_SPAWN_MAX_DISTANCE = 1000;

// --- Altın drop ve toplama (Faz 2) ---
export const GOLD_PICKUP_RANGE = 160;
export const GOLD_MAGNET_RANGE = 300; // bu menzil içinde altın oyuncuya doğru yavaşça sürüklenir
export const GOLD_MAGNET_SPEED = 200; // manyetik sürüklenme hızı (px/s) - toplama tween'inden daha yavaş
export const GOLD_COLLECT_SPEED = 700; // altın oyuncuya uçarken kullanılan referans hız (px/s)

// --- Savaş görsel efektleri (Faz 2) ---
export const HIT_FLASH_COLOR = 0xffffff;
export const HIT_FLASH_DURATION = 100; // ms
export const DAMAGE_NUMBER_LIFETIME = 700; // ms
export const DAMAGE_NUMBER_RISE_DISTANCE = 40; // piksel

// --- HUD (Faz 2) ---
export const HUD_MARGIN_X = 24;
export const HUD_MARGIN_Y = 24;
export const HEALTH_BAR_WIDTH = 220;
export const HEALTH_BAR_HEIGHT = 22;
export const GOLD_ICON_RADIUS = 10;

// --- Gelecek fazlara hazırlık ---
// Faz 3 inşa sistemi "bekleme süresi yok" prensibiyle çalışıyor: hiçbir inşa/yükseltme
// işlemi timer/bekleme içermez, altın düşülür düşülmez bina anında hazırdır.
export const INSTANT_BUILD = true;

// --- İnşa sistemi genel (Faz 3) ---
export const BUILD_GHOST_ALPHA = 0.55;
export const BUILD_GHOST_VALID_COLOR = 0x4fc3f7;
export const BUILD_GHOST_INVALID_COLOR = 0xff5252;
export const BUILD_PLACEMENT_MIN_DISTANCE_FROM_PLAYER = 40; // oyuncunun tam üstüne bina koyulamaz
export const BUILD_PREVIEW_DISTANCE = 120; // hayalet önizleme, seçilince oyuncunun bu kadar önünde belirir
export const MIN_BUILDING_SPACING = 50; // binalar arası minimum boşluk (üst üste binmesin)

// --- Okçu Kulesi: düşük hasar, hızlı saldırı, orta-uzun menzil ---
export const ARCHER_TOWER_COST = 30;
export const ARCHER_TOWER_HEALTH = 60;
export const ARCHER_TOWER_DAMAGE = 6;
export const ARCHER_TOWER_RANGE = 220;
export const ARCHER_TOWER_ATTACK_SPEED = 3; // saldırı/saniye

// --- Top: yavaş saldırı, yüksek hasar, alan (splash) hasarı, kısa-orta menzil ---
export const CANNON_COST = 55;
export const CANNON_HEALTH = 90;
export const CANNON_DAMAGE = 20;
export const CANNON_RANGE = 170;
export const CANNON_ATTACK_SPEED = 0.8; // saldırı/saniye
export const CANNON_SPLASH_RADIUS = 70;

// --- Füze Kulesi: en yüksek hasar, en yavaş saldırı, en uzun menzil ---
export const MISSILE_TOWER_COST = 90;
export const MISSILE_TOWER_HEALTH = 80;
export const MISSILE_TOWER_DAMAGE = 50;
export const MISSILE_TOWER_RANGE = 340;
export const MISSILE_TOWER_ATTACK_SPEED = 0.4; // saldırı/saniye

// --- Duvar: saldırmaz, sadece düşmanların geçişini engeller ---
export const WALL_COST = 15;
export const WALL_HEALTH = 220;
export const WALL_BLOCK_RADIUS = 16; // düşman hareketi bu yarıçapın içine giremez

// --- Kaynak Çıkarma Binası: idle üretim yapmaz, yakındaki node'ların toplama hızını çarpar ---
export const RESOURCE_EXTRACTOR_COST = 35;
export const RESOURCE_EXTRACTOR_HEALTH = 50;
export const RESOURCE_EXTRACTOR_RADIUS = 150; // bu yarıçaptaki kaynak node'larını etkiler
export const RESOURCE_EXTRACTOR_MULTIPLIER = 2; // toplama hızını 2x yapar

// Düşman gövdesinin yaklaşık yarıçapı - duvar blocking hesabında kullanılır
export const ENEMY_COLLISION_RADIUS = 14;

// --- Kaynak Toplama Noktaları (maden/ağaç gibi sabit dünya objeleri) ---
// NOT (Faz 4): Node'lar artık haritada baştan global olarak dağıtılmıyor; her chunk
// açıldığında FogOfWarSystem, ResourceSystem.addNodesInArea() ile o bölgeye özel
// birkaç node ekliyor (bkz. CHUNK_RESOURCE_NODES_PER_CHUNK). Eski global RESOURCE_NODE_COUNT
// / RESOURCE_NODE_MIN_DISTANCE_FROM_CENTER sabitleri bu yüzden kaldırıldı.
export const RESOURCE_NODE_MAX_AMOUNT = 500;
export const RESOURCE_NODE_GATHER_RANGE = 60; // oyuncu bu mesafedeyken otomatik toplama başlar
export const RESOURCE_NODE_GATHER_RATE = 10; // birim/saniye (temel hız, extractor ile x2)
export const RESOURCE_NODE_RESPAWN_TIME = 20000; // ms - tükenince bu süre sonra yenilenir

// --- İnşa Menüsü UI (Faz 3) ---
export const BUILD_MENU_HEIGHT = 100;
// Sol-alttaki joystick ile çakışmasın diye çubuk ekranın en altından bu kadar yukarıda durur
export const BUILD_MENU_BOTTOM_MARGIN = 210;
export const BUILD_MENU_BUTTON_SIZE = 72;
export const BUILD_MENU_BUTTON_GAP = 14;

// --- HUD genişletmesi (Faz 3) ---
export const RESOURCE_ICON_SIZE = 16;
// BuildMenu'nun "bu dokunuş HUD/can barı/altın/kaynak/debug metni üzerinde mi" kontrolü
// için kabaca üst HUD bloğunun toplam yüksekliği (Faz 5: debug metni 5 satıra çıktı, artırıldı)
export const HUD_TOP_ZONE_HEIGHT = 230;

// --- Fog of War / Harita Genişletme (Faz 4) ---
// Harita mantıksal olarak eşit "chunk"lara bölünüyor: 4000/800 = 5x5 = 25 chunk.
// Sadece oyuncunun spawn olduğu merkez chunk baştan açık (unlocked); gerisi sisli (locked).
export const CHUNK_SIZE = 800;
export const CHUNK_GRID_COLS = WORLD_WIDTH / CHUNK_SIZE;
export const CHUNK_GRID_ROWS = WORLD_HEIGHT / CHUNK_SIZE;

// Bir chunk açmanın maliyeti: BASE * MULTIPLIER^(şimdiye kadar açılan ücretli chunk sayısı).
// Yani her yeni açılan chunk, kendinden ÖNCEKİ açılan chunk'tan %20 daha pahalı olur.
export const CHUNK_UNLOCK_BASE_COST = 100;
export const CHUNK_UNLOCK_COST_MULTIPLIER = 1.2;

// Oyuncu, açılabilir (komşu unlocked) bir chunk'ın sınırına bu kadar yaklaşınca "Bu bölgeyi
// aç" prompt'u belirir
export const CHUNK_UNLOCK_PROMPT_DISTANCE = 150;

// Bir chunk açıldığında o bölgede otomatik oluşturulacak kaynak node sayısı + kenardan
// boşluk (node'lar chunk sınırına yapışık spawn olmasın)
export const CHUNK_RESOURCE_NODES_PER_CHUNK = 4;
export const CHUNK_NODE_EDGE_MARGIN = 60;

// Kilitli chunk'ların sis görünümü
export const FOG_OVERLAY_COLOR = 0x000000;
export const FOG_OVERLAY_ALPHA = 0.78;

// --- "Bu bölgeyi aç" prompt UI (Faz 4) ---
export const UNLOCK_PROMPT_WIDTH = 280;
export const UNLOCK_PROMPT_HEIGHT = 56;
// İnşa menüsü çubuğunun üstünden bu kadar yukarıda durur (çakışmasınlar)
export const UNLOCK_PROMPT_BOTTOM_GAP = 16;

// --- Zorluk artışı (Faz 5) ---
// Düşman health/attackDamage'ı hem açılan chunk sayısına HEM geçen süreye göre kademeli
// artar: multiplier = 1 + chunkSayısı*CHUNK_BONUS + geçenDakika*TIME_BONUS (bkz. DifficultySystem)
export const DIFFICULTY_CHUNK_STAT_BONUS = 0.15; // her açılan chunk düşman stat'larını %15 artırır
export const DIFFICULTY_TIME_STAT_BONUS_PER_MINUTE = 0.05; // her geçen dakika %5 daha ekler

// Hangi düşman tipi kaç chunk açıldığında havuza girer (normal Enemy her zaman havuzda)
export const FAST_ENEMY_UNLOCK_CHUNKS = 3;
export const TANK_ENEMY_UNLOCK_CHUNKS = 5;
export const RANGED_ENEMY_UNLOCK_CHUNKS = 5;

// --- FastEnemy: düşük can, yüksek hız, düşük hasar (hızlı ama zayıf) ---
export const FAST_ENEMY_HEALTH = 15;
export const FAST_ENEMY_MOVE_SPEED = 165;
export const FAST_ENEMY_ATTACK_DAMAGE = 3;
export const FAST_ENEMY_ATTACK_SPEED = 1.4;
export const FAST_ENEMY_GOLD_DROP_MIN = 2;
export const FAST_ENEMY_GOLD_DROP_MAX = 4;

// --- TankEnemy: yüksek can, yavaş hız, yüksek hasar (yavaş ama dayanıklı) ---
export const TANK_ENEMY_HEALTH = 100;
export const TANK_ENEMY_MOVE_SPEED = 50;
export const TANK_ENEMY_ATTACK_DAMAGE = 14;
export const TANK_ENEMY_ATTACK_SPEED = 0.7;
export const TANK_ENEMY_GOLD_DROP_MIN = 9;
export const TANK_ENEMY_GOLD_DROP_MAX = 15;

// --- RangedEnemy: menzilden vurur, yaklaşmaya çalışmaz, çok yaklaşılırsa geri çekilir ---
export const RANGED_ENEMY_HEALTH = 22;
export const RANGED_ENEMY_MOVE_SPEED = 85;
export const RANGED_ENEMY_ATTACK_DAMAGE = 6;
export const RANGED_ENEMY_ATTACK_RANGE = 190;
export const RANGED_ENEMY_ATTACK_SPEED = 0.9;
export const RANGED_ENEMY_RETREAT_DISTANCE = 110; // oyuncu bu mesafeden yakına girerse kaçmaya başlar
export const RANGED_ENEMY_GOLD_DROP_MIN = 4;
export const RANGED_ENEMY_GOLD_DROP_MAX = 7;

// --- Dalga (Wave) sistemi (Faz 5) ---
export const WAVE_INTERVAL = 60000; // ms - dalgalar arası süre
export const WAVE_WARNING_DURATION = 2500; // ms - "Dalga Geliyor!" banner süresi
export const WAVE_ENEMY_MULTIPLIER = 3; // o anki normal tavanın kaç katı düşman aynı anda spawn olur
export const WAVE_DURATION_LIMIT = 45000; // ms - dalga düşmanları bitirilmese de bu süre sonunda dalga zorla biter
export const WAVE_GOLD_REWARD = 40;
export const WAVE_RESOURCE_REWARD = 25;

// --- Otomatik kayıt (SaveSystem) ---
export const AUTO_SAVE_INTERVAL = 30000; // ms - periyodik otomatik kayıt aralığı

// --- Bina yükseltme (Faz 5) - maliyet ALTIN DEĞİL, KAYNAK (resources) ile ödenir ---
export const BUILDING_MAX_LEVEL = 2;
export const BUILDING_UPGRADE_DAMAGE_MULTIPLIER = 1.4; // %40 daha fazla hasar
export const BUILDING_UPGRADE_RANGE_MULTIPLIER = 1.15; // %15 daha fazla menzil
export const RESOURCE_EXTRACTOR_UPGRADE_GATHER_MULTIPLIER = 1.5; // gatherMultiplier'ı %50 artırır (2x -> 3x)
export const RESOURCE_EXTRACTOR_UPGRADE_RADIUS_MULTIPLIER = 1.2; // etki alanını %20 büyütür

export const ARCHER_TOWER_UPGRADE_COST = 40;
export const CANNON_UPGRADE_COST = 70;
export const MISSILE_TOWER_UPGRADE_COST = 110;
export const RESOURCE_EXTRACTOR_UPGRADE_COST = 45;

// Oyuncu, yükseltilebilir bir binaya bu kadar yaklaşınca "Yükselt: N kaynak" prompt'u belirir
export const BUILDING_UPGRADE_PROMPT_DISTANCE = 90;

// --- Oyuncu seviye sistemi (Faz 5) ---
export const PLAYER_KILLS_PER_LEVEL = 20; // her bu kadar düşman öldürmede seviye atlar
export const PLAYER_LEVEL_UP_HEALTH_BONUS = 15; // seviye atlayınca maxHealth'e eklenir (can da dolar)
export const PLAYER_LEVEL_UP_DAMAGE_BONUS = 2; // seviye atlayınca attackDamage'a eklenir
