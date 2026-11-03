// Konfigurasi & data dasar. Tambah tile/tanaman/item baru di file data terpisah pada fase berikutnya.
// Kecepatan waktu: lama 1 hari game dalam menit nyata. Bisa diganti pemain di menu ⚙️ (tersimpan).
const SPEEDS = { fast: 10, normal: 20, slow: 40 };
const CFG = {
  TILE: 32, W: 128, H: 128, SEED: 20260101,
  SPD: 'normal',
  DAY_SEC: 1200,       // detik nyata untuk 1 hari game (diisi dari SPD di bawah)
  START_HOUR: 7,
  SPEED: 110,          // px per detik
  VIEW_TILES: 12,      // jumlah tile terlihat di sisi layar terpendek
  SAVE_KEY: 'dusun_senja_save_v1',
  HOME: { x: 27, y: 28, w: 10, h: 8 },  // area rumah (untuk fase Building)
  // id: 0 rumput, 1 air, 2 pasir, 3 pohon
  TILES: [
    { n: 'rumput', solid: 0 },
    { n: 'air',    solid: 1 },
    { n: 'pasir',  solid: 0 },
    { n: 'pohon',  solid: 1 },
    { n: 'gua',    solid: 1 },   // 4: pintu masuk dungeon (dunia)
    { n: 'lantai', solid: 0 },   // 5-8: tile dalam dungeon
    { n: 'dinding', solid: 1 },
    { n: 'portal', solid: 1 },
    { n: 'peti',   solid: 1 },
    { n: 'rumah',  solid: 1 },   // 9-11: bangunan desa
    { n: 'toko',   solid: 1 },
    { n: 'npc',    solid: 1 }
  ]
};
try { const k = localStorage.getItem('dusun_senja_speed'); if (SPEEDS[k]) CFG.SPD = k; } catch (e) {}
CFG.DAY_SEC = SPEEDS[CFG.SPD] * 60;
