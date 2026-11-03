// Logika farming. state.farm = { "x,y": { c: idTanaman|null, g: jamTumbuh, w: 0|1 (basah) } }
const Farm = {
  add(s, id, n) { s.inv[id] = (s.inv[id] || 0) + n; },
  // Aksi pada tile (tx,ty) dengan item terpilih. Return pesan (string) atau ''.
  act(s, map, tx, ty, sel) {
    const { W, H, HOME: h } = CFG;
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return '';
    const k = tx + ',' + ty, f = s.farm[k];
    if (f && f.c && f.g >= CROPS[f.c].hours) {            // panen otomatis jika matang
      const id = f.c; f.c = null; f.g = 0; f.w = 0;
      this.add(s, 'crop:' + id, 1); Quest.add(s, 'harvest', 1);
      return '+1 ' + CROPS[id].n + ' ' + CROPS[id].icon;
    }
    if (sel === 'hoe') {
      if (f) return 'Sudah digarap';
      if (s.floor && s.floor[k]) return 'Ada lantai di sini';
      if (map[ty * W + tx] !== 0) return 'Hanya bisa di rumput';
      if (tx >= h.x && tx < h.x + h.w && ty >= h.y && ty < h.y + h.h) return 'Area rumah untuk bangunan';
      s.farm[k] = { c: null, g: 0, w: 0 }; Quest.add(s, 'till', 1);
      return '';
    }
    if (sel === 'can') { if (!f) return 'Garap dulu pakai cangkul'; if (!f.w) Quest.add(s, 'water', 1); f.w = 1; return ''; }
    if (sel && sel.startsWith('seed:')) {
      if (!f) return 'Garap dulu pakai cangkul';
      if (f.c) return 'Sudah ada tanaman';
      if (!(s.inv[sel] > 0)) return '';
      if (--s.inv[sel] <= 0) delete s.inv[sel];
      f.c = sel.slice(5); f.g = 0; Quest.add(s, 'plant', 1);
      return '';
    }
    return '';
  },
  grow(s, dh) { for (const k in s.farm) { const f = s.farm[k]; if (f.c && f.w) f.g = Math.min(CROPS[f.c].hours, f.g + dh); } },
  rain(s) { for (const k in s.farm) s.farm[k].w = 1; },   // hujan menyiram semua tanah
  dawn(s) { for (const k in s.farm) s.farm[k].w = 0; }   // tanah mengering tiap pagi (06:00)
};
