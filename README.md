# Survivor Mobile Game

Hyper-casual mobil strateji/aksiyon oyunu — **Faz 1: İskelet + Hareket Sistemi**

Phaser 3 + Vite ile kurulmuş, mobile-first (dikey ekran) bir top-down oyun temeli.
Bu fazda sadece proje iskeleti, büyük harita, kamera takibi ve joystick/klavye ile
karakter hareketi var. Savaş, düşman, inşa sistemleri ve gerçek pixel-art sprite'lar
**henüz eklenmedi** — bunlar sonraki fazlarda ayrı promptlarla gelecek.

## Kullanılan teknolojiler

| Paket | Versiyon | Amaç |
|---|---|---|
| [Phaser](https://phaser.io/) | 3.90.x | Oyun motoru (Phaser **3**, Phaser 4 değil) |
| [Vite](https://vite.dev/) | 8.1.x | Build tool / dev server |
| [phaser3-rex-plugins](https://rexrainbow.github.io/phaser3-rex-notes/) | 1.80.x | Sanal joystick (virtual joystick) eklentisi |

## Kurulum

Node.js 20.19+ (veya 22.12+) kurulu olmalı. Bu ortamda Node.js **24.18.0 LTS**
kurulup doğrulandı.

```bash
# 1. Bağımlılıkları kur
npm install

# 2. Geliştirme sunucusunu başlat
npm run dev
```

Terminalde çıkan `http://localhost:5173/` adresini tarayıcıda aç. Vite hot-reload
ile çalışır; kodda değişiklik yaptığında sayfa otomatik güncellenir.

### Telefonundan test etme

Bilgisayar ve telefon aynı Wi-Fi ağındaysa:

```bash
npm run dev:host
```

Terminalde çıkan `Network: http://<bilgisayarının-ip'si>:5173/` adresini telefonun
tarayıcısında aç. Dokunmatik joystick gerçek anlamda ancak bu şekilde test edilebilir
(masaüstü tarayıcıda fare ile joystick'i sürükleyerek de test edebilirsin, ama gerçek
touch davranışı telefonda görülür).

### Production build (ileride gerekirse)

```bash
npm run build      # dist/ klasörüne optimize edilmiş build alır
npm run preview     # build'i lokal olarak önizler
```

## Klasör yapısı

```
survivor-mobile-game/
├── index.html                     # Vite giriş noktası
├── vite.config.js                 # Dev server ayarları (host: true -> mobil test)
├── package.json
├── public/
│   └── assets/
│       ├── sprites/                # Gerçek pixel-art sprite'lar buraya gelecek
│       └── tilemaps/                # Gerçek tilemap (Tiled JSON vb.) buraya gelecek
└── src/
    ├── main.js                     # Phaser.Game oluşturulur, sahneler eklenir
    ├── style.css                   # Mobil tam ekran + touch-action ayarları
    ├── config/
    │   ├── Constants.js             # Tüm "sihirli sayılar" (dünya boyutu, hız, vb.)
    │   └── GameConfig.js            # Phaser motor config'i (Scale.FIT, physics, plugin)
    ├── entities/
    │   └── Player.js                # Oyuncu class'ı: hareket + savaş/ekonomi placeholder'ları
    ├── scenes/
    │   └── MainScene.js             # Ana sahne: harita, kamera, input, minimap
    ├── ui/
    │   ├── JoystickController.js    # rex virtual joystick sarmalayıcısı
    │   └── Minimap.js               # Minimap placeholder (köşede boş kutu)
    └── utils/
        └── PlaceholderTextures.js   # Zemin + karakter için koddan üretilen basit texture'lar
```

`src/ui/` ve `src/utils/` klasörleri, istenen `src/scenes` / `src/entities` / `src/config`
yapısına ek olarak modülerliği artırmak için eklendi.

## Şu an ne var, ne yok

**Var:**
- 4000x4000 piksel'lik büyük oyun dünyası (tekrar eden basit doku ile)
- Karakteri merkezde tutan, dünya dışına çıkmayan kamera takibi
- Sol-alt köşede sanal joystick (rex plugin) + WASD/ok tuşları (test için)
- Karakterin 8 yöne sabit hızda hareketi (`Player.direction` ile yön takibi)
- Sağ-üst köşede boş minimap kutusu (placeholder)
- Ekranın sol-üstünde geliştirme amaçlı debug metni (pozisyon/yön/hareket durumu)

**Henüz yok (sonraki fazlarda gelecek):**
- Savaş sistemi, düşman spawn, otomatik saldırı
- Altın toplama, seviye/yükseltme sistemi
- İnşa sistemi
- Gerçek pixel-art sprite'lar ve animasyonlar (tilemap + karakter)
- Gerçek minimap içeriği (şu an sadece boş kutu)

## Genişletmeye hazır noktalar

- `Player.js` içinde `health`, `maxHealth`, `attackDamage`, `attackRange`, `attackSpeed`,
  `gold`, `level`, `experience` property'leri placeholder olarak duruyor; savaş/ekonomi
  sistemleri bunları kullanmaya hazır.
- `Player.direction` (`idle`, `up`, `down`, `left`, `right`, `up-left`, `up-right`,
  `down-left`, `down-right`) her frame güncelleniyor; animasyon sistemi eklendiğinde
  bu değere göre doğru animasyon seçilebilir.
- `GameConfig.js`'de `input.activePointers: 3` ayarlı; joystick + ileride eklenecek
  bir saldırı butonu gibi ikinci bir dokunuşu aynı anda desteklemeye hazır.
- `MainScene.js` içindeki `createWorld()` fonksiyonu, düz renkli `ground-tile` texture'ını
  gerçek bir Tiled tilemap (`public/assets/tilemaps/`) ile değiştirmeye hazır bir yapıda.

## Kontroller

- **Mobil / dokunmatik:** Ekranın sol-alt köşesindeki joystick'e bas, sürükle, yönünde
  karakter sabit hızda hareket eder; parmağı kaldırınca durur.
- **Klavye (geliştirme için):** `WASD` veya ok tuşları. Çapraz hareket için iki tuşa
  birlikte bas (örn. `W` + `D` -> yukarı-sağ).
