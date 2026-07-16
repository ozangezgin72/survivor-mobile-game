# Survivor Mobile Game

Hyper-casual **survivor + kingdom-building** hibriti: otomatik savaş, harita genişletme, sonsuz bina yükseltmesi, prestij/reset döngüsü ve paylaşılabilir leaderboard.

**Canlı demo:** [https://survivor-mobile-game.vercel.app](https://survivor-mobile-game.vercel.app)

Mobile-first (dikey 720×1280), Phaser 3 + Vite. Masaüstünde de responsive çalışır (klavye + fare ile joystick).

## Özellikler

- **Hareket** — Sanal joystick (mobil) + WASD/ok tuşları (masaüstü); 8 yön, sabit hız
- **Otomatik savaş** — Oyuncu ve kuleler menzildeki en yakın düşmana otomatik ateş eder
- **5 bina tipi** — Okçu kulesi, top, füze kulesi, duvar, kaynak çıkarıcı; kaynakla **sonsuz yükseltme** (erken/geç maliyet eğrisi)
- **4 düşman tipi** — Normal, hızlı, tank, menzilli; chunk/zaman bazlı zorluk ölçeği
- **Dalga sistemi** — Periyodik yoğun dalgalar + ödül
- **Fog of war** — 9×9 chunk haritası (7200×7200); merkezden komşu komşu açılma, artan altın maliyeti
- **Chunk gücü** — Merkeze Chebyshev mesafesine göre bina gücü, maliyet ve zemin rengi (Tiny Swords tile varyantları)
- **Prestij** — Harita tamamlanınca reset; kalıcı prestij puanı (bina için onaylı harcama) + azalmayan prestij sayacı
- **Skor** — Run skoru × prestij çarpanı; Game Over’da gösterilir
- **3 slotlu kayıt** — localStorage; otomatik kayıt (chunk/bina/periyodik)
- **Leaderboard** — Cihaz başına best skor (Redis HASH + sorted set); Vercel Serverless API
- **Görseller** — [Tiny Swords](https://pixelfrog-assets.itch.io/tiny-swords) pixel art (oyuncu okçu animasyonları, chunk zeminleri); diğer birimler hâlâ placeholder
- **Ses** — Web Audio ile prosedürel bipler (ölüm, altın)
- **UI** — Sıcak tonlu modern menü (altın/turuncu butonlar); HUD, minimap, inşa/yükselt/aç prompt’ları

## Teknoloji yığını

| Katman | Teknoloji |
|--------|-----------|
| Oyun motoru | [Phaser 3](https://phaser.io/) + [rex Virtual Joystick](https://rexrainbow.github.io/phaser3-rex-notes/) |
| Build | [Vite](https://vite.dev/) |
| Hosting | [Vercel](https://vercel.com/) |
| API | Vercel Serverless Functions (`/api/*`) |
| Leaderboard DB | Redis (`REDIS_URL`) + [ioredis](https://github.com/redis/ioredis) |
| Test | [Vitest](https://vitest.dev/) — birim testleri |

## Kurulum

Node.js 20.19+ (veya 22.12+) önerilir.

```bash
# 1. Bağımlılıkları kur
npm install

# 2. Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda `http://localhost:5173/` aç. Vite hot-reload ile çalışır.

> **Not:** Leaderboard API’leri (`/api/submit-score`, `/api/get-leaderboard`) Vite’ın yerel sunucusunda yok. Tam test için Vercel preview/production veya `vercel dev` kullan; `REDIS_URL` ortam değişkeni gerekir.

### Telefonda test

Bilgisayar ve telefon aynı Wi-Fi’deyse:

```bash
npm run dev:host
```

Terminaldeki `Network: http://<ip>:5173/` adresini telefonda aç.

### Production build

```bash
npm run build      # dist/ klasörüne optimize build
npm run preview    # build’i lokal önizle
```

## Testler

```bash
npm run test         # Vitest ile tüm birim testlerini çalıştırır (tek seferlik)
npm run test:watch   # İzleme modunda çalıştırır (dosya değişince otomatik tekrar çalışır)
```

14 birim testi, kritik oyun mantığını doğruluyor: bina yükseltme maliyet eğrisi (UpgradeCost), chunk güç seviyesi hesaplaması (ChunkPower), skor formülü (ScoreSystem), chunk açma maliyeti (UnlockCost).

## Klasör yapısı

```
survivor-mobile-game/
├── api/                              # Vercel Serverless Functions
│   ├── _redis.js                     # ioredis bağlantı + CORS / sanitize
│   ├── submit-score.js               # POST — cihaz başına best skor
│   └── get-leaderboard.js            # GET — top 20
├── public/
│   └── assets/sprites/               # Tiny Swords (Free Pack) sprite’lar
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.js                       # Phaser.Game + MenuScene / MainScene
    ├── style.css
    ├── config/
    │   ├── Constants.js              # Oyun dengesi, dünya, UI boyutları
    │   ├── Events.js                 # GameEvents isimleri
    │   ├── GameConfig.js             # Phaser config (scale, physics, plugins)
    │   └── UITheme.js                # Menü renk token’ları
    ├── entities/
    │   ├── Player.js                 # Hareket, ekonomi, animasyonlar
    │   ├── Enemy.js / enemies/       # Düşman tipleri
    │   ├── Chunk.js                  # Chunk + zemin tileSprite + sis
    │   ├── Gold.js, ResourceNode.js
    │   └── buildings/                # Archer, Cannon, Missile, Wall, Extractor
    ├── scenes/
    │   ├── MenuScene.js              # Ana menü + slot paneli + leaderboard
    │   └── MainScene.js              # Ana oyun döngüsü
    ├── systems/
    │   ├── CombatSystem.js
    │   ├── BuildingSystem.js
    │   ├── FogOfWarSystem.js
    │   ├── EnemySpawner.js
    │   ├── DifficultySystem.js
    │   ├── WaveSystem.js
    │   ├── GoldSystem.js
    │   ├── ResourceSystem.js
    │   ├── SaveSystem.js
    │   ├── PrestigeSystem.js
    │   ├── ScoreSystem.js
    │   └── AudioSystem.js
    ├── services/
    │   └── LeaderboardApi.js         # Frontend fetch sarmalayıcı
    ├── ui/                           # HUD, BuildMenu, prompt’lar, GameOver, …
    └── utils/                        # ChunkPower, UpgradeCost, DeviceId, textures, …
```

> **Testler:** Birim testleri kaynak dosyalarının yanında yaşar (aynı isim + `.test.js`, örn. `UpgradeCost.test.js`, `ScoreSystem.test.js`).

## Kontroller

| Platform | Hareket |
|----------|---------|
| Mobil | Sol-alt sanal joystick |
| Masaüstü | `WASD` veya ok tuşları (çapraz için iki tuş) |

İnşa: alt menüden bina seç → haritada yerleştir. Chunk açma / bina yükseltme: yakına gelince ekrandaki prompt.

## Skor (özet)

```
roundScore = level×100 + kills×5 + unlockedChunks×200 + Σ(buildingPower)×50
finalScore = round(roundScore × (1 + prestigeCount × 0.5))
```

Leaderboard’da her cihazın yalnızca **en yüksek** skoru tutulur (`device-id` + Redis upsert).

## Lisans / asset

Oyun kodu bu repo’dadır. Pixel art görseller [Tiny Swords (Free Pack)](https://pixelfrog-assets.itch.io/tiny-swords) — Pixel Frog; paketin kendi lisans koşullarına uyulmalıdır.
