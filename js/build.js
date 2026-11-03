// Logika building dengan DUA LAPIS:
//   state.floor = { "x,y": { t: idLantai } }            -> lapisan lantai (lantai kayu/batu/keramik)
//   state.build = { "x,y": { t: idBangunan, o: 0|1 } }  -> lapisan objek (dinding, kasur, meja, peti, dll)
// Objek boleh dipasang di atas lantai ATAU di atas rumput. Tabrakan (solid) hanya dihitung dari lapisan objek.
const Build = (() => {
  const T = CFG.TILE, W = CFG.W;
  const zone = (tx, ty) => { const h = CFG.HOME, m = BUILD_MARGIN; return tx >= h.x - m && tx < h.x + h.w + m && ty >= h.y - m && ty < h.y + h.h + m; };
  const overlap = (s, tx, ty) => Math.abs(s.x - (tx * T + T / 2)) < T / 2 + 8 && Math.abs(s.y - (ty * T + T / 2)) < T / 2 + 8;
  const afford = (s, t) => Object.keys(BUILDS[t].cost).every(m => (s.inv['mat:' + m] || 0) >= BUILDS[t].cost[m]);
  const spill = (s, b) => { if (b.i) for (const id in b.i) s.inv[id] = (s.inv[id] || 0) + b.i[id]; if (b.g) b.g.forEach(it => s.items.push(it)); };
  const give = (s, t) => { for (const m in BUILDS[t].cost) s.inv['mat:' + m] = (s.inv['mat:' + m] || 0) + BUILDS[t].cost[m]; };
  const isFloor = t => !!(BUILDS[t] && BUILDS[t].fl);
  const layer = (s, t) => isFloor(t) ? s.floor : s.build;
  // '' = boleh dipasang, selain itu = alasan penolakan
  function check(s, map, tx, ty, t) {
    if (!zone(tx, ty)) return 'Bangun hanya di area rumah (garis putus-putus)';
    const k = tx + ',' + ty;
    if (map[ty * W + tx] !== 0 || s.farm[k]) return 'Tile sudah terisi';
    if (isFloor(t)) { if (s.floor[k]) return 'Sudah ada lantai'; return ''; }   // lantai boleh di bawah perabot
    if (s.build[k]) return 'Tile sudah terisi';
    if (BUILDS[t].solid && overlap(s, tx, ty)) return 'Ada kamu di situ';
    return '';
  }
  function act(s, map, tx, ty) {   // aksi saat mode bangun
    const k = tx + ',' + ty, b = s.build[k], fl = s.floor[k], sel = s.bsel;
    if (s.carry) { const r = check(s, map, tx, ty, s.carry.t); if (r) return r; layer(s, s.carry.t)[k] = s.carry; s.carry = null; return ''; }
    if (sel === 'move' || sel === 'remove') {
      const tgt = b || fl;   // objek diangkat dulu, baru lantai di bawahnya
      if (!tgt) return 'Tidak ada bangunan di sini';
      delete (b ? s.build : s.floor)[k];
      if (sel === 'move') s.carry = tgt; else { give(s, tgt.t); spill(s, tgt); }
      return '';
    }
    if (!BUILDS[sel]) return '';
    const r = check(s, map, tx, ty, sel); if (r) return r;
    if (!afford(s, sel)) return 'Bahan kurang 🪵🪨';
    for (const m in BUILDS[sel].cost) s.inv['mat:' + m] -= BUILDS[sel].cost[m];
    layer(s, sel)[k] = { t: sel, o: 0 }; Quest.add(s, 'build', 1); if (sel === 'tower') Quest.add(s, 'tower', 1);
    return '';
  }
  function use(s, tx, ty) {   // aksi di luar mode bangun: buka/tutup pintu
    const b = s.build[tx + ',' + ty];
    if (b.t !== 'door') return 'Ada bangunan di sini';
    if (b.o) { if (overlap(s, tx, ty)) return 'Ada yang menghalangi'; b.o = 0; } else b.o = 1;
    return '';
  }
  function chop(s, map, tx, ty) {   // kapak: tebang pohon jadi kayu
    const i = ty * W + tx;
    if (tx < 0 || ty < 0 || tx >= W || ty >= CFG.H || map[i] !== 3) return 'Tidak ada pohon';
    map[i] = 0; s.chopped.push(i); Quest.add(s, 'chop', 1);
    const n = 2 + (World.hash(tx, ty, 5) > 0.5 ? 1 : 0);
    s.inv['mat:wood'] = (s.inv['mat:wood'] || 0) + n;
    return '+' + n + ' 🪵';
  }
  function toggle(s) { if (s.dg) return; s.bm = !s.bm; if (!s.bm && s.carry) { give(s, s.carry.t); s.carry = null; } }
  const solid = (s, tx, ty) => { const b = s.build[tx + ',' + ty]; return !!b && !!BUILDS[b.t].solid && !b.o; };
  const maxhp = t => Object.keys(BUILDS[t].cost).reduce((a, m) => a + BUILDS[t].cost[m] * (m === 'stone' ? 25 : 14), 0);
  function damage(s, tx, ty, d) {   // return true jika bangunan hancur (lantai tidak ikut rusak)
    const k = tx + ',' + ty, b = s.build[k]; if (!b) return false;
    b.h = (b.h == null ? maxhp(b.t) : b.h) - d;
    if (b.h <= 0) { delete s.build[k]; spill(s, b); return true; }
    return false;
  }
  // migrasi save lama: lantai yang dulu ada di s.build dipindah ke s.floor
  function migrate(s) {
    s.floor = s.floor || {};
    for (const k in s.build) if (BUILDS[s.build[k].t] && BUILDS[s.build[k].t].fl) { s.floor[k] = s.build[k]; delete s.build[k]; }
  }
  return { check, afford, act, use, chop, toggle, solid, damage, migrate, isFloor };
})();
