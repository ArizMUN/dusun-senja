// Generator dunia procedural berbasis seed (dipakai lagi untuk desa di Fase 7).
const World = (() => {
  function hash(x, y, s) {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + s) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function generate(seed) {
    const { W, H, HOME } = CFG, m = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const n = vnoise(x / 12, y / 12, seed) * 0.65 + vnoise(x / 5, y / 5, seed + 1) * 0.35;
      const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
      let t = 0;
      if (edge < 2 || n < 0.34) t = 1;
      else if (n < 0.39) t = 2;
      else if (hash(x, y, seed + 7) < 0.05 + 0.2 * Math.max(0, vnoise(x / 6, y / 6, seed + 2) - 0.5)) t = 3;
      m[y * W + x] = t;
    }
    // Kosongkan area rumah + margin 3 tile agar selalu rumput
    for (let y = HOME.y - 3; y < HOME.y + HOME.h + 3; y++)
      for (let x = HOME.x - 3; x < HOME.x + HOME.w + 3; x++) m[y * W + x] = 0;
    // Gua dungeon: tile yang terjangkau dari rumah (BFS), sekitar 16 langkah jauhnya
    const dist = new Int16Array(W * H).fill(-1), q = [(HOME.y + 4) * W + HOME.x + 5];
    dist[q[0]] = 0;
    for (let i = 0; i < q.length; i++) {
      const p = q[i], x = p % W, y = (p / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, n = ny * W + nx;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || dist[n] >= 0 || CFG.TILES[m[n]].solid) continue;
        dist[n] = dist[p] + 1; q.push(n);
      }
    }
    ent = null;
    for (let want = 16; want >= 6 && !ent; want--) for (const p of q) {
      if (dist[p] !== want) continue;
      const x = p % W, y = (p / W) | 0;
      if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) continue;
      if ([p - 1, p + 1, p - W, p + W].every(n => dist[n] >= 0)) { m[p] = 4; ent = { x, y }; break; }
    }
    // ===== Desa procedural: satu desa per sel 22x22 (jika lahan cukup & terjangkau dari rumah) =====
    curSeed = seed;
    guas = ent ? [{ x: ent.x, y: ent.y, key: 'h', idx: 0, base: 1, name: 'Gua Bayangan' }] : [];
    vil = [];
    const hc = { x: HOME.x + HOME.w / 2, y: HOME.y + HOME.h / 2 }, C = 22;
    for (let gy = 0; gy < Math.ceil(H / C); gy++) for (let gx = 0; gx < Math.ceil(W / C); gx++) {
      for (let t = 0; t < 3; t++) {
        const cx = gx * C + 6 + Math.floor(hash(gx, gy, seed + 40 + t) * (C - 12)), cy = gy * C + 6 + Math.floor(hash(gx, gy, seed + 50 + t) * (C - 12));
        if (cx < 8 || cy < 6 || cx > W - 14 || cy > H - 6 || Math.hypot(cx - hc.x, cy - hc.y) < 26) continue;
        let ok = 0;
        for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 5; x <= cx + 5; x++) if (dist[y * W + x] >= 0) ok++;
        if (ok < 55) continue;
        for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 5; x <= cx + 5; x++) m[y * W + x] = (x === cx || y === cy) ? 2 : 0;   // jalan pasir silang
        for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx + 6; x <= cx + 10; x++) m[y * W + x] = 0;
        const put = (dx, dy, id) => { m[(cy + dy) * W + cx + dx] = id; };
        put(0, -3, 10);   // toko
        [[-4, -3], [-2, -3], [2, -3], [4, -3], [-4, 2], [-2, 3], [4, 3]].forEach(([dx, dy]) => put(dx, dy, 9));   // rumah
        put(2, 2, 11);    // NPC
        m[cy * W + cx + 8] = 4;   // gua milik desa
        const id = vil.length + 1, dh = Math.hypot(cx - hc.x, cy - hc.y), el = elAt(cx, cy);
        const v = { id, name: nameOf(gx, gy, vil), x: cx, y: cy, dist: dh, lv: 1 + Math.floor(dh / 18), el };
        vil.push(v);
        guas.push({ x: cx + 8, y: cy, key: 'v' + id, idx: id, base: v.lv, name: 'Gua ' + v.name, el });
        break;
      }
    }
    lastMap = m;
    return m;
  }
  let ent = null, vil = [], guas = [], lastMap = null, curSeed = CFG.SEED;
  const VA = ['Sumber', 'Lembah', 'Bukit', 'Karang', 'Embun', 'Cahaya', 'Pasir', 'Rimba', 'Kabut', 'Surya', 'Telaga', 'Ladang'];
  const VB = ['Asri', 'Jaya', 'Mukti', 'Harjo', 'Sari', 'Wangi', 'Reja', 'Makmur', 'Lestari', 'Sentosa'];
  const nameOf = (gx, gy, list) => {   // nama desa unik
    const a = Math.floor(hash(gx, gy, curSeed + 60) * VA.length), b = Math.floor(hash(gx, gy, curSeed + 61) * VB.length);
    let n = '';
    for (let i = 0; i < VB.length; i++) { n = VA[a] + ' ' + VB[(b + i) % VB.length]; if (!list.some(v => v.name === n)) break; }
    return n;
  };
  const elAt = (tx, ty) => Object.keys(ELEMENTS)[Math.floor(hash(Math.floor(tx / 22), Math.floor(ty / 22), curSeed + 70) * 7)];   // elemen wilayah
  return { hash, vnoise, generate, ent: () => ent, vil: () => vil, guas: () => guas, map: () => lastMap, elAt };
})();
