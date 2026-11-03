// Desa: toko (jual panen +bonus jarak, beli equipment stok harian), dialog NPC, dan peta mini dunia.
const Village = {
  mul: v => 1 + Math.min(0.8, v.dist / 100),   // makin jauh dari rumah, makin mahal hasil panen dibeli
  stock(s, v) {   // 3 equipment per hari, kualitas ikut tingkat desa
    const d = Math.floor(s.t / 24), sh = s.shops[v.id];
    if (!sh || sh.d !== d) s.shops[v.id] = { d, items: [0, 1, 2].map(() => Gear.roll(null, v.lv * 2)) };
    return s.shops[v.id].items;
  },
  price: it => Gear.price(it) * 3,
  buy(s, v, id) {
    const l = s.shops[v.id].items, i = l.findIndex(x => x.id === id);
    if (i < 0) return 'Sudah habis';
    const p = this.price(l[i]);
    if (s.gold < p) return 'Koin kurang 🥺';
    if (s.items.length >= 30) return 'Tas perlengkapan penuh';
    s.gold -= p; s.items.push(l.splice(i, 1)[0]);
    return '';
  },
  travel(s, id) {   // fast travel ke rumah (id 0) atau desa yang sudah ditemukan, biaya 15 koin
    if (s.dg) return 'Tidak bisa dari dalam gua';
    const T = CFG.TILE, h = CFG.HOME, v = id ? World.vil().find(x => x.id === id) : null;
    if (id && (!v || !s.vis[id])) return '';
    if (s.gold < 15) return 'Koin kurang 🥺';
    s.gold -= 15;
    if (v) { s.x = v.x * T + 16; s.y = (v.y + 1) * T + 16; } else { s.x = (h.x - 3) * T + 16; s.y = (h.y + 4) * T + 16; }
    return '';
  },
  sell(s, v, id) { const n = s.inv[id] || 0; if (!n || !SELLT.includes(id.split(':')[0])) return; Quest.add(s, 'sell', n); s.gold += Math.round(n * unit(id) * this.mul(v)); delete s.inv[id]; },
  talk(s, v) {
    const e = ELEMENTS[v.el], weak = Object.keys(Elem.beats).find(k => Elem.beats[k] === v.el), w = ELEMENTS[weak];
    const L = [
      `Selamat datang di ${v.name}! Hasil panenmu dihargai +${Math.round((this.mul(v) - 1) * 100)}% di toko kami.`,
      `Gua di dekat sini bertingkat ${v.lv}. Monsternya berelemen ${e.n} ${e.icon}.`,
      `Elemen ${e.n} lemah terhadap ${w.n} ${w.icon}. Ingat itu saat bertarung!`,
      'Makin jauh dari dusunmu, makin ganas monsternya... tapi hadiahnya juga makin besar.',
      '📜 ' + Quest.hint(s)
    ];
    s.tk = (s.tk || 0) + 1;
    if (Quest.ready(s) && s.tk % 2) return '🧑 Ada misi yang sudah selesai! Ambil hadiahmu di 📜.';
    return '🧑 ' + L[(s.tk + v.id) % L.length];
  }
};
const Mini = {   // gambar peta dunia ke canvas
  draw(cv, s) {
    const W = CFG.W, H = CFG.H, m = World.map(), g = cv.getContext('2d'), im = g.createImageData(W, H);
    const C = { 0: [93, 166, 74], 1: [59, 120, 196], 2: [217, 197, 138], 3: [47, 122, 58] };
    for (let i = 0; i < W * H; i++) { const c = C[m[i]] || [120, 124, 130]; im.data.set([c[0], c[1], c[2], 255], i * 4); }
    g.putImageData(im, 0, 0);
    const dot = (x, y, col, r) => { g.fillStyle = col; g.fillRect(x - r, y - r, r * 2 + 1, r * 2 + 1); };
    World.vil().forEach(v => dot(v.x, v.y, '#ffd54a', 2));
    dot(CFG.HOME.x + 5, CFG.HOME.y + 4, '#e53935', 2);
    const T = CFG.TILE, px = s.dg ? s.dg.rx : s.x, py = s.dg ? s.dg.ry : s.y;
    dot(Math.floor(px / T), Math.floor(py / T), '#fff', 1);
  }
};
