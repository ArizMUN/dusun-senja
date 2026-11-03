// Ternak: ayam dan sapi berkeliaran di sekitar titik asalnya. Beri makan, tunggu, lalu ambil hasilnya.
// state.an = [{ id, k, x, y, hx, hy, f: sudah makan, g: jam menghasilkan, r: siap diambil }]
const Animal = (() => {
  let hit = () => false, clk = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  function buy(s, k) {
    const K = ANIMALS[k]; s.an = s.an || [];
    if (s.dg) return 'Tidak bisa dari dalam gua';
    if (s.an.length >= 12) return 'Kandang penuh (maks 12 hewan)';
    if (s.gold < K.price) return 'Koin kurang 🥺';
    let px = s.x, py = s.y + 22;
    for (const [dx, dy] of [[0, 22], [22, 0], [-22, 0], [0, -22], [28, 28], [-28, 28]]) { if (!hit(s.x + dx, s.y + dy)) { px = s.x + dx; py = s.y + dy; break; } }
    s.gold -= K.price;
    s.an.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), k, x: px, y: py, hx: px, hy: py, f: 0, g: 0, r: 0, dx: 0, dy: 0, w: 0, fc: 1 });
    return K.icon + ' ' + K.n + ' baru! Beri makan lalu tunggu hasilnya';
  }
  function near(s, px, py) {
    let best = null, bd = 26;
    for (const a of s.an || []) { const d = Math.hypot(a.x - px, a.y - py); if (d < bd) { bd = d; best = a; } }
    return best;
  }
  function act(s, a) {
    const K = ANIMALS[a.k], P = PROD[K.prod], fd = itemInfo(K.feed);
    if (a.r) {
      s.inv['prod:' + K.prod] = (s.inv['prod:' + K.prod] || 0) + 1; a.r = 0; a.f = 0; a.g = 0; Quest.add(s, 'produce', 1);
      return '+1 ' + P.icon + ' ' + P.n;
    }
    if (!a.f) {
      if (!(s.inv[K.feed] > 0)) return 'Butuh ' + fd.n + ' ' + fd.icon + ' untuk memberi makan';
      if (--s.inv[K.feed] <= 0) delete s.inv[K.feed];
      a.f = 1; return K.icon + ' makan dengan lahap. Hasilnya siap sekitar ' + K.hrs + ' jam game';
    }
    return K.icon + ' sedang menghasilkan ' + P.icon + ' (sisa ' + Math.max(1, Math.ceil(K.hrs - a.g)) + ' jam)';
  }
  function grow(s, dh) { for (const a of s.an || []) { if (a.f && !a.r) { a.g += dh; if (a.g >= ANIMALS[a.k].hrs) a.r = 1; } } }
  function update(s, dt) {
    clk += dt;
    for (const a of s.an || []) {
      if ((a.w -= dt) <= 0) {
        a.w = rnd(1, 3.5);
        if (Math.random() < 0.4) { a.dx = a.dy = 0; } else { const r = Math.random() * 6.283; a.dx = Math.cos(r); a.dy = Math.sin(r); }
        if (Math.hypot(a.x - a.hx, a.y - a.hy) > 90) { const n = Math.hypot(a.hx - a.x, a.hy - a.y) || 1; a.dx = (a.hx - a.x) / n; a.dy = (a.hy - a.y) / n; }
      }
      if (!a.dx && !a.dy) continue;
      const st = ANIMALS[a.k].spd * dt, nx = a.x + a.dx * st, ny = a.y + a.dy * st;
      if (!hit(nx, a.y)) a.x = nx; else a.w = 0;
      if (!hit(a.x, ny)) a.y = ny; else a.w = 0;
      if (Math.abs(a.dx) > 0.2) a.fc = a.dx > 0 ? 1 : -1;
    }
  }
  function chicken(c, a, mv) {
    const hop = mv ? Math.abs(Math.sin(clk * 12 + a.x)) * 1.5 : 0;
    c.strokeStyle = '#f5a623'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-1.5, -3 - hop); c.lineTo(-1.5, 0); c.moveTo(1.5, -3 - hop); c.lineTo(1.5, 0); c.stroke();
    c.fillStyle = '#f2f2f2'; c.beginPath(); c.ellipse(0, -5 - hop, 5.5, 4.3, 0, 0, 7); c.fill();
    c.fillStyle = '#dcdcdc'; c.beginPath(); c.ellipse(-1, -4.5 - hop, 3, 2.2, -0.3, 0, 7); c.fill();   // sayap
    c.fillStyle = '#f2f2f2'; c.beginPath(); c.moveTo(-5, -6 - hop); c.lineTo(-8.5, -10 - hop); c.lineTo(-4, -3 - hop); c.fill();   // ekor
    c.beginPath(); c.arc(4.5, -9 - hop, 3, 0, 7); c.fill();
    c.fillStyle = '#e53935'; c.beginPath(); c.arc(4, -12 - hop, 1.4, 0, 7); c.arc(5.5, -11.6 - hop, 1.1, 0, 7); c.fill();   // jengger
    c.fillStyle = '#f5a623'; c.beginPath(); c.moveTo(7, -9.5 - hop); c.lineTo(9.5, -8.6 - hop); c.lineTo(7, -7.7 - hop); c.fill();
    c.fillStyle = '#222'; c.fillRect(5, -10 - hop, 1, 1.2);
  }
  function cow(c, a, mv) {
    const sw = mv ? Math.sin(clk * 6 + a.x) : 0;
    c.fillStyle = '#d9d9d9'; c.fillRect(-9 + sw, -5, 3, 7); c.fillRect(-3 - sw, -5, 3, 7); c.fillRect(2 + sw, -5, 3, 7); c.fillRect(7 - sw, -5, 3, 7);
    c.fillStyle = '#f6f6f6'; c.beginPath(); c.ellipse(0, -9, 12, 7, 0, 0, 7); c.fill();
    c.fillStyle = '#2b2b2b'; c.beginPath(); c.ellipse(-4, -11, 4, 3, 0.3, 0, 7); c.ellipse(4, -7, 3, 2.4, 0, 0, 7); c.fill();
    c.fillStyle = '#f4a6b4'; c.beginPath(); c.ellipse(-3, -3, 2.5, 1.6, 0, 0, 7); c.fill();   // ambing
    c.strokeStyle = '#444'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-12, -11); c.quadraticCurveTo(-16, -8 + sw, -14, -3); c.stroke();   // ekor
    c.fillStyle = '#f6f6f6'; c.fillRect(9, -16, 8, 9); c.fillStyle = '#2b2b2b'; c.fillRect(9, -16, 3, 4);
    c.fillStyle = '#f4a6b4'; c.fillRect(14, -11, 4, 4);
    c.fillStyle = '#e8d9a8'; c.fillRect(9, -18, 1.6, 3); c.fillRect(15, -18, 1.6, 3);   // tanduk
    c.fillStyle = '#222'; c.fillRect(13, -14, 1.4, 1.6); c.fillRect(15.5, -12, 0.8, 1);
  }
  function draw(c, s) {
    for (const a of s.an || []) {
      const K = ANIMALS[a.k], mv = a.dx || a.dy;
      c.fillStyle = '#0003'; c.beginPath(); c.ellipse(a.x, a.y + 1, a.k === 'cow' ? 12 : 6, 2.5, 0, 0, 7); c.fill();
      c.save(); c.translate(a.x, a.y); c.scale(a.fc || 1, 1); (a.k === 'cow' ? cow : chicken)(c, a, mv); c.restore();
      const top = a.k === 'cow' ? 24 : 16;
      if (a.r) { c.font = '11px system-ui'; c.textAlign = 'center'; c.fillText(PROD[K.prod].icon, a.x, a.y - top - 2 + Math.sin(clk * 4) * 1.5); }
      else if (!a.f && Math.hypot(a.x - s.x, a.y - s.y) < 90) { c.font = '10px system-ui'; c.textAlign = 'center'; c.fillText(itemInfo(K.feed).icon, a.x, a.y - top - 2); }
    }
  }
  return { init: e => { hit = e.hit; }, buy, near, act, grow, update, draw };
})();
