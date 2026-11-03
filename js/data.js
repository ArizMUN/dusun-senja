// Data tanaman & alat. Tambah tanaman baru cukup dengan menambah satu baris di CROPS.
// hours = jam game yang dibutuhkan (hanya bertambah saat tanah basah). seed = harga benih, price = harga jual.
const CROPS = {
  wheat:   { n: 'Gandum',  icon: '🌾', hours: 36,  seed: 5,  price: 12,  color: '#d8b84a' },
  carrot:  { n: 'Wortel',  icon: '🥕', hours: 48,  seed: 8,  price: 20,  color: '#e8832a' },
  potato:  { n: 'Kentang', icon: '🥔', hours: 72,  seed: 12, price: 32,  color: '#b08a58' },
  tomato:  { n: 'Tomat',   icon: '🍅', hours: 96,  seed: 18, price: 50,  color: '#d23b2f' },
  pumpkin: { n: 'Labu',    icon: '🎃', hours: 144, seed: 30, price: 110, color: '#e07b16' }
};
const TOOLS = {
  hoe: { n: 'Cangkul',  icon: '⛏️' },
  can: { n: 'Penyiram', icon: '💧' },
  axe: { n: 'Kapak',    icon: '🪓' }
};

// ===== Fase 3: building =====
const BUILD_MARGIN = 2;   // zona bangun = area rumah + margin 2 tile
const MATS = {
  wood:  { n: 'Kayu', icon: '🪵', buy: 4 },   // dari menebang pohon (kapak); nanti juga dari battle/adventure
  stone: { n: 'Batu', icon: '🪨', buy: 6 }    // sementara beli di toko; nanti dari dungeon
};
const PAL = {
  move:   { n: 'Pindah',  icon: '🔄', d: 'ambil bangunan, pasang di tile lain' },
  remove: { n: 'Bongkar', icon: '🗑️', d: 'bahan kembali penuh' }
};
// d / d2 = sprite sebagai daftar kotak [warna, x, y, lebar, tinggi] dalam tile 32x32 (d2 = pintu terbuka)
const FL = ['#b98a55', 0, 0, 32, 32];
const BUILDS = {
  floor_wood:  { n: 'Lantai Kayu',  icon: '🟫', cost: { wood: 1 },  solid: 0, fl: 1, d: [FL, ['#a07445', 0, 8, 32, 1], ['#a07445', 0, 16, 32, 1], ['#a07445', 0, 24, 32, 1]] },
  floor_stone: { n: 'Lantai Batu',  icon: '⬜', cost: { stone: 1 }, solid: 0, fl: 1, d: [['#9aa0a6', 0, 0, 32, 32], ['#848a90', 0, 15, 32, 2], ['#848a90', 15, 0, 2, 32]] },
  wall_wood:   { n: 'Dinding Kayu', icon: '🧱', cost: { wood: 3 },  solid: 1, d: [['#8d5a2b', 0, 0, 32, 32], ['#a8723b', 0, 0, 32, 8], ['#6f4520', 0, 16, 32, 2], ['#6f4520', 15, 8, 2, 8], ['#6f4520', 7, 18, 2, 14]] },
  wall_stone:  { n: 'Dinding Batu', icon: '🪨', cost: { stone: 3 }, solid: 1, d: [['#7d838a', 0, 0, 32, 32], ['#98a0a8', 0, 0, 32, 8], ['#62676d', 0, 16, 32, 2], ['#62676d', 15, 8, 2, 8], ['#62676d', 7, 18, 2, 14]] },
  fence:       { n: 'Pagar',        icon: '🚧', cost: { wood: 2 },  solid: 1, d: [['#a8723b', 3, 6, 5, 22], ['#a8723b', 24, 6, 5, 22], ['#c18a4c', 0, 10, 32, 4], ['#c18a4c', 0, 19, 32, 4]] },
  door:        { n: 'Pintu',        icon: '🚪', cost: { wood: 3 },  solid: 1, d: [FL, ['#7b4a22', 4, 2, 24, 28], ['#5e3716', 6, 4, 20, 2], ['#ffd54a', 22, 16, 3, 3]], d2: [FL, ['#7b4a22', 2, 2, 4, 28]] },
  table:       { n: 'Meja',         icon: '🍽️', cost: { wood: 4 },  solid: 1, d: [FL, ['#c28a4d', 3, 6, 26, 18], ['#8d5a2b', 3, 22, 4, 6], ['#8d5a2b', 25, 22, 4, 6]] },
  chair:       { n: 'Kursi',        icon: '🪑', cost: { wood: 2 },  solid: 0, d: [FL, ['#a0602b', 8, 12, 16, 14], ['#7b4a22', 8, 6, 16, 6]] },
  bed:         { n: 'Tempat Tidur', icon: '🛏️', cost: { wood: 6 },  solid: 1, d: [FL, ['#8d5a2b', 3, 2, 26, 28], ['#4f8fd6', 3, 12, 26, 18], ['#ffffff', 6, 4, 20, 7]] },
  chest:       { n: 'Peti',         icon: '🧰', cost: { wood: 5 },  solid: 1, d: [FL, ['#8d5a2b', 4, 8, 24, 20], ['#a8723b', 4, 8, 24, 7], ['#ffd54a', 14, 14, 4, 5]] }
};

// ===== Fase 4: monster & equipment =====
const ELEMENTS = {   // dipakai penuh di Fase 6 (kelemahan/resistensi)
  api: { n: 'Api', icon: '🔥' }, tanah: { n: 'Tanah', icon: '⛰️' }, air: { n: 'Air', icon: '💧' }, angin: { n: 'Angin', icon: '🌪️' },
  listrik: { n: 'Listrik', icon: '⚡' }, light: { n: 'Light', icon: '✨' }, dark: { n: 'Dark', icon: '🌑' }
};
const RAR = [{ n: 'Biasa', c: '#bdbdbd' }, { n: 'Bagus', c: '#66bb6a' }, { n: 'Langka', c: '#42a5f5' }, { n: 'Epik', c: '#ba68c8' }, { n: 'Legendaris', c: '#ffa726' }];
// st = stat dasar per slot (dikali rarity & level dunia)
const SLOTS = {
  head:  { n: 'Kepala',   icon: '🪖', base: ['Topi', 'Helm', 'Tudung'],              st: { def: 1.6, hp: 3 } },
  body:  { n: 'Badan',    icon: '👕', base: ['Baju', 'Zirah', 'Jubah'],              st: { def: 2.5, hp: 8 } },
  legs:  { n: 'Kaki',     icon: '👢', base: ['Sepatu', 'Sepatu Bot', 'Pelindung Kaki'], st: { def: 1.6, hp: 4 } },
  hands: { n: 'Tangan',   icon: '🗡️', base: ['Pedang', 'Gada', 'Belati'],            st: { atk: 3 } },
  back:  { n: 'Punggung', icon: '🧣', base: ['Jubah', 'Perisai', 'Ransel'],          st: { def: 1, hp: 10 } }
};
const MON = {   // minDay = malam ke berapa mulai muncul
  slime:    { n: 'Slime',    hp: 20, atk: 5,  spd: 40, xp: 5,  r: 9,  col: '#5fc86a', el: 'air',   gold: [1, 3], minDay: 1 },
  wolf:     { n: 'Serigala', hp: 32, atk: 8,  spd: 70, xp: 9,  r: 10, col: '#8a8f98', el: 'tanah', gold: [2, 5], minDay: 2 },
  skeleton: { n: 'Kerangka', hp: 50, atk: 11, spd: 50, xp: 14, r: 10, col: '#e8e4d0', el: 'dark',  gold: [3, 8], minDay: 3 }
};

// ===== Fase 5: boss dungeon =====
MON.golem = { n: 'Golem Batu', hp: 220, atk: 16, spd: 35, xp: 80, r: 16, col: '#7d838a', el: 'tanah', gold: [40, 80], minDay: 99, boss: 1 };

// ===== Fase 6: skill tree =====
const BRANCH = { atk: { n: 'Attack', icon: '⚔️' }, def: { n: 'Defense', icon: '🛡️' }, mag: { n: 'Magic', icon: '🔮' }, heal: { n: 'Heal', icon: '💚' } };
const ECOL = { api: '#ff7043', tanah: '#a1887f', air: '#4fc3f7', angin: '#b2dfdb', listrik: '#ffee58', light: '#fff9c4', dark: '#7e57c2' };
// fx = bonus pasif. act = skill aktif (kind: slash/shield/heal/bolt, mp, cd detik, pw pengali). req = node yang harus dibuka dulu.
const SK = {
  a1: { b: 'atk', n: 'Tenaga Dasar',   icon: '💪', cost: 1, req: [],     d: '+10% serangan', fx: { atkPct: 0.1 } },
  a2: { b: 'atk', n: 'Tebasan Kritis', icon: '🎯', cost: 1, req: ['a1'], d: '+15% peluang kritikal', fx: { crit: 0.15 } },
  a3: { b: 'atk', n: 'Langkah Cepat', icon: '👟', cost: 1, req: ['a1'], d: '+12% kecepatan gerak', fx: { speedPct: 0.12 } },
  a4: { b: 'atk', n: 'Tebasan Lebar',  icon: '🌀', cost: 2, req: ['a2'], d: 'Serangan area 1.6x · 💙8 · 4 dtk', act: { kind: 'slash', mp: 8, cd: 4, pw: 1.6 } },
  a5: { b: 'atk', n: 'Amukan',         icon: '💢', cost: 2, req: ['a4'], d: '+20% serangan', fx: { atkPct: 0.2 } },
  d1: { b: 'def', n: 'Kulit Baja',     icon: '🛡️', cost: 1, req: [],     d: '+2 pertahanan', fx: { defFlat: 2 } },
  d2: { b: 'def', n: 'Tubuh Kuat',     icon: '❤️', cost: 1, req: ['d1'], d: '+25 HP', fx: { hpFlat: 25 } },
  d3: { b: 'def', n: 'Perisai',        icon: '🔰', cost: 2, req: ['d1'], d: 'Serap damage 30% HP · 💙10 · 12 dtk', act: { kind: 'shield', mp: 10, cd: 12, pw: 0.3 } },
  d4: { b: 'def', n: 'Daya Tahan',     icon: '🧱', cost: 2, req: ['d2'], d: '-10% semua damage diterima', fx: { dmgRed: 0.1 } },
  d5: { b: 'def', n: 'Tubuh Baja',     icon: '🏰', cost: 2, req: ['d4'], d: '+50 HP, +3 pertahanan', fx: { hpFlat: 50, defFlat: 3 } },
  m1: { b: 'mag', n: 'Dasar Sihir',    icon: '🔮', cost: 1, req: [],     d: '+20 mana, +10% kekuatan sihir', fx: { mpFlat: 20, magPct: 0.1 } },
  m9: { b: 'mag', n: 'Penguasaan Sihir', icon: '🌟', cost: 2, req: ['m1'], d: '+30% kekuatan sihir', fx: { magPct: 0.3 } },
  h1: { b: 'heal', n: 'Regenerasi',    icon: '💚', cost: 1, req: [],     d: 'Pulih 1% HP per detik', fx: { regen: 0.01 } },
  h2: { b: 'heal', n: 'Penyembuhan',   icon: '💖', cost: 2, req: ['h1'], d: 'Pulihkan 35% HP · 💙12 · 10 dtk', act: { kind: 'heal', mp: 12, cd: 10, pw: 0.35 } },
  h3: { b: 'heal', n: 'Meditasi',      icon: '🧘', cost: 1, req: ['h1'], d: '+1.5 regen mana per detik', fx: { mpRegen: 1.5 } },
  h4: { b: 'heal', n: 'Berkah Cahaya', icon: '✨', cost: 2, req: ['h2'], d: '+40% efek heal, +1% regen', fx: { healPct: 0.4, regen: 0.01 } }
};
Object.keys(ELEMENTS).forEach(e => {   // 7 sihir elemen di cabang Magic
  SK['m_' + e] = { b: 'mag', n: 'Sihir ' + ELEMENTS[e].n, icon: ELEMENTS[e].icon, cost: 2, req: ['m1'], d: 'Bola ' + ELEMENTS[e].n + ' 1.4x · 💙7 · 1.2 dtk', act: { kind: 'bolt', el: e, mp: 7, cd: 1.2, pw: 1.4 } };
});

// ===== Fase 9: memancing, masak, ternak, cuaca, boss elemen =====
TOOLS.rod = { n: 'Pancing', icon: '🎣', d: 'hadap air, Aksi untuk melempar, Aksi lagi saat ikan menggigit' };
const FISH = {   // w = bobot peluang tertangkap
  minnow: { n: 'Ikan Kecil',  icon: '🐟', price: 8,  w: 55 },
  carp:   { n: 'Ikan Mas',    icon: '🐠', price: 18, w: 25 },
  puffer: { n: 'Ikan Buntal', icon: '🐡', price: 30, w: 12 },
  crab:   { n: 'Kepiting',    icon: '🦀', price: 26, w: 8 }
};
const PROD = { egg: { n: 'Telur', icon: '🥚', price: 12 }, milk: { n: 'Susu', icon: '🥛', price: 28 } };
// hrs = jam game sampai menghasilkan (setelah diberi makan), feed = pakan
const ANIMALS = {
  chicken: { n: 'Ayam', icon: '🐔', price: 60,  feed: 'crop:wheat',  prod: 'egg',  hrs: 10, spd: 16 },
  cow:     { n: 'Sapi', icon: '🐄', price: 220, feed: 'crop:carrot', prod: 'milk', hrs: 20, spd: 10 }
};
// rec = bahan, heal = pulih % HP, fx = bonus sementara (kunci sama dengan Skills.fx), dur = detik nyata
const FOOD = {
  bread:   { n: 'Roti',           icon: '🍞', rec: { 'crop:wheat': 3 },                                     heal: 0.2,  fx: { speedPct: 0.1 },            dur: 240, d: '+10% kecepatan gerak' },
  soup:    { n: 'Sup Wortel',     icon: '🍲', rec: { 'crop:carrot': 2, 'crop:potato': 1 },                 heal: 0.3,  fx: { hpFlat: 40 },               dur: 360, d: '+40 HP maks' },
  grilled: { n: 'Ikan Bakar',     icon: '🍢', rec: { 'fish:minnow': 2 },                                   heal: 0.2,  fx: { atkPct: 0.15 },             dur: 300, d: '+15% serangan' },
  stew:    { n: 'Sup Ikan',       icon: '🍜', rec: { 'fish:carp': 1, 'crop:tomato': 1 },                   heal: 0.25, fx: { defFlat: 4 },               dur: 360, d: '+4 pertahanan' },
  omelet:  { n: 'Telur Tomat',    icon: '🍳', rec: { 'crop:tomato': 1, 'prod:egg': 2 },                    heal: 0.3,  fx: { regen: 0.01 },              dur: 300, d: 'Pulih 1% HP per detik' },
  milk:    { n: 'Susu Hangat',    icon: '☕', rec: { 'prod:milk': 1 },                                     heal: 0.15, fx: { mpRegen: 1.5 },             dur: 300, d: '+1.5 mana per detik' },
  crab:    { n: 'Kepiting Rebus', icon: '🦞', rec: { 'fish:crab': 1, 'prod:egg': 1 },                      heal: 0.35, fx: { dmgRed: 0.1 },              dur: 360, d: '-10% damage diterima' },
  pie:     { n: 'Pai Labu',       icon: '🥧', rec: { 'crop:pumpkin': 1, 'crop:wheat': 2, 'prod:milk': 1 }, heal: 0.4,  fx: { atkPct: 0.2, hpFlat: 30 },  dur: 420, d: '+20% serangan, +30 HP' }
};
const SELLT = ['crop', 'fish', 'prod', 'food'];   // jenis item yang bisa dijual
const unit = id => {   // harga jual dasar
  const [t, c] = id.split(':');
  return t === 'crop' ? CROPS[c].price : t === 'fish' ? FISH[c].price : t === 'prod' ? PROD[c].price
    : t === 'food' ? Math.round(Object.keys(FOOD[c].rec).reduce((a, k) => a + unit(k) * FOOD[c].rec[k], 0) * 1.5) + 4 : 0;
};
const itemInfo = id => { const [t, c] = id.split(':'); return t === 'crop' ? CROPS[c] : t === 'fish' ? FISH[c] : t === 'prod' ? PROD[c] : t === 'food' ? FOOD[c] : null; };

BUILDS.stove = { n: 'Tungku', icon: '🍳', cost: { wood: 3, stone: 4 }, solid: 1, d: [FL, ['#6b6f75', 3, 8, 26, 20], ['#8a8f96', 3, 8, 26, 5], ['#2a2a2e', 8, 14, 16, 9], ['#ff7043', 11, 17, 10, 5], ['#ffd54a', 14, 18, 4, 3], ['#555a60', 22, 2, 5, 7]] };
BUILDS.tower = { n: 'Menara Jaga', icon: '🗼', cost: { wood: 10, stone: 8 }, solid: 1, d: [['#7d838a', 7, 12, 18, 20], ['#98a0a8', 7, 12, 18, 4], ['#62676d', 7, 22, 18, 2], ['#2a2833', 13, 21, 6, 11], ['#8d5a2b', 4, 7, 24, 6], ['#a8723b', 4, 7, 24, 2], ['#b0453a', 8, 1, 16, 7], ['#6f4520', 15, 13, 2, 6]] };

// boss elemen: dipilih sesuai elemen wilayah gua (elemen lain memakai Golem Batu)
MON.drake   = { n: 'Naga Api',        hp: 260, atk: 19, spd: 42, xp: 100, r: 17, col: '#c0392b', el: 'api',     gold: [60, 110], minDay: 99, boss: 1 };
MON.wraith  = { n: 'Hantu Penguasa',  hp: 240, atk: 21, spd: 48, xp: 100, r: 14, col: '#5e35b1', el: 'dark',    gold: [60, 110], minDay: 99, boss: 1 };
MON.thunder = { n: 'Elang Petir',     hp: 230, atk: 20, spd: 55, xp: 100, r: 15, col: '#fdd835', el: 'listrik', gold: [60, 110], minDay: 99, boss: 1 };
MON.turtle  = { n: 'Kura-kura Karang', hp: 300, atk: 15, spd: 30, xp: 100, r: 17, col: '#2a8f86', el: 'air',     gold: [60, 110], minDay: 99, boss: 1 };
const BOSS = { api: 'drake', dark: 'wraith', listrik: 'thunder', air: 'turtle' };

// ===== v1.5: furnitur tambahan (bisa dipasang di atas lantai) =====
BUILDS.rug   = { n: 'Karpet',       icon: '🟥', cost: { wood: 1 },           solid: 0, d: [['#b23a48', 2, 2, 28, 28], ['#e57373', 5, 5, 22, 22], ['#b23a48', 9, 9, 14, 14], ['#ffd54a', 14, 14, 4, 4]] };
BUILDS.shelf = { n: 'Rak Buku',     icon: '📚', cost: { wood: 5 },           solid: 1, d: [['#7a4f28', 3, 3, 26, 26], ['#a8723b', 3, 3, 26, 3], ['#5e3a1c', 5, 11, 22, 2], ['#5e3a1c', 5, 19, 22, 2], ['#c0392b', 6, 5, 4, 6], ['#2e7d32', 11, 5, 4, 6], ['#1565c0', 16, 5, 4, 6], ['#f9a825', 7, 13, 4, 6], ['#8e24aa', 13, 13, 4, 6], ['#00897b', 18, 13, 4, 6]] };
BUILDS.lamp  = { n: 'Lampu',        icon: '🏮', cost: { wood: 2, stone: 1 }, solid: 1, light: 1, d: [['#5a3a1c', 9, 26, 14, 4], ['#6b4423', 14, 10, 4, 17], ['#ffd54a', 10, 3, 12, 10], ['#fff3b0', 13, 6, 6, 5]] };
BUILDS.pot   = { n: 'Pot Tanaman',  icon: '🪴', cost: { wood: 2 },           solid: 1, d: [['#2e8b3a', 9, 6, 6, 12], ['#43a047', 16, 4, 6, 14], ['#66bb6a', 13, 2, 5, 10], ['#e91e63', 12, 2, 3, 3], ['#8d4a12', 9, 17, 14, 3], ['#b5651d', 10, 19, 12, 9]] };

// ===== v1.6: lantai berlapis (lantai di bawah, perabot di atasnya) =====
BUILDS.floor_tile = { n: 'Lantai Keramik', icon: '🔲', cost: { stone: 2 }, solid: 0, fl: 1, d: [['#e8e2d0', 0, 0, 32, 32], ['#c9c1a8', 0, 0, 16, 16], ['#c9c1a8', 16, 16, 16, 16]] };
