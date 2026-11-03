// Dungeon procedural (berbasis seed + tingkat). Tile: 5 lantai, 6 dinding, 7 portal keluar, 8 peti.
const Dungeon = (() => {
  const W = CFG.W, H = CFG.H, T = CFG.TILE;
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const mk = (k, x, y, sc, el) => { const d = MON[k]; return { k, x: (x + 0.5) * T, y: (y + 0.5) * T, hp: d.hp * sc, mx: d.hp * sc, atk: d.atk * sc, h: 0, f: 0, c: 0, w: 0, ax: 0, ay: 0, el }; };

  function gen(seed, lv, noBoss, el) {
    const R = rng(seed), ri = (a, b) => a + Math.floor(R() * (b - a + 1)), m = new Uint8Array(W * H).fill(6), rooms = [];
    for (let t = 0; t < 300 && rooms.length < 8; t++) {
      const w = ri(6, 10), h = ri(6, 9), x = ri(3, 40 - w), y = ri(3, 40 - h);
      if (rooms.some(r => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y)) continue;
      rooms.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
    }
    const carve = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y * W + x] = 5; };
    rooms.forEach(r => carve(r.x, r.y, r.x + r.w - 1, r.y + r.h - 1));
    for (let i = 1; i < rooms.length; i++) {   // lorong selebar 2 tile
      const a = rooms[i - 1], b = rooms[i];
      carve(Math.min(a.cx, b.cx), a.cy, Math.max(a.cx, b.cx) + 1, a.cy + 1);
      carve(b.cx, Math.min(a.cy, b.cy), b.cx + 1, Math.max(a.cy, b.cy) + 1);
    }
    const s0 = rooms[0], boss = rooms[rooms.length - 1], sc = 1 + (lv - 1) * 0.25 + 0.2, mons = [];
    m[s0.cy * W + s0.cx] = 7;   // portal keluar
    const ks = Object.keys(MON).filter(k => !MON[k].boss && MON[k].minDay <= lv + 1);
    for (let i = 1; i < rooms.length; i++) {
      const r = rooms[i];
      if (i < rooms.length - 1 && R() < 0.7) m[(r.y + 1) * W + r.x + 1] = 8;   // peti di pojok ruangan
      const n = i === rooms.length - 1 ? 2 : ri(2, 3) + (lv >> 1);
      for (let j = 0; j < n; j++) {
        const x = ri(r.x + 1, r.x + r.w - 2), y = ri(r.y + 1, r.y + r.h - 2);
        if (m[y * W + x] === 5) mons.push(mk(ks[ri(0, ks.length - 1)], x, y, sc, el));
      }
    }
    if (!noBoss) mons.push(mk(BOSS[el] || 'golem', boss.cx, boss.cy, 1 + (lv - 1) * 0.3, el));
    return { map: m, start: { x: (s0.cx + 1) * T + T / 2, y: s0.cy * T + T / 2 }, mons };
  }

  function loot(s, lv) {   // isi peti
    const out = [], ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), add = (id, n) => { s.inv[id] = (s.inv[id] || 0) + n; };
    const g = ri(8, 18) * lv, st = ri(2, 5), w = ri(1, 3);
    s.gold += g; add('mat:stone', st); add('mat:wood', w);
    out.push('+' + g + '🪙', '+' + st + '🪨', '+' + w + '🪵');
    if (Math.random() < 0.4 && s.items.length < 30) { const it = Gear.roll(null, lv * 2 + Math.floor(s.t / 24)); s.items.push(it); out.push('🎁 ' + it.n); }
    return 'Peti: ' + out.join(' ');
  }
  return { gen, loot };
})();
