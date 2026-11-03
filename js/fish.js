// Memancing: pilih 🎣, hadap air, Aksi untuk melempar, Aksi lagi saat ikan menggigit (sekitar 1 detik).
const Fish = (() => {
  const T = CFG.TILE;
  let f = null, say = () => {}, clk = 0;   // f = { x, y (umpan), ph: 'wait'|'bite', t, sx, sy }
  const rnd = (a, b) => a + Math.random() * (b - a);
  function pick(s) {
    const night = (s.t % 24) >= 19 || (s.t % 24) < 5, wx = Weather.now(s.t).k !== 'clear';
    const w = Object.keys(FISH).map(k => FISH[k].w * (k === 'carp' && wx ? 2 : 1) * ((k === 'puffer' || k === 'crab') && night ? 2 : 1));
    let x = Math.random() * w.reduce((a, b) => a + b), i = 0;
    while (i < w.length - 1 && x >= w[i]) { x -= w[i]; i++; }
    return Object.keys(FISH)[i];
  }
  function act(s, tx, ty, tid) {
    if (f && f.ph === 'bite') {
      const k = pick(s); f = null;
      s.inv['fish:' + k] = (s.inv['fish:' + k] || 0) + 1; Quest.add(s, 'fish', 1);
      return '+1 ' + FISH[k].icon + ' ' + FISH[k].n;
    }
    if (f) { f = null; return 'Terlalu cepat, ikannya kabur 🐟'; }
    if (tid !== 1) return 'Hadapkan ke air untuk memancing 🎣';
    const wx = Weather.now(s.t).k !== 'clear';
    f = { x: tx * T + 16, y: ty * T + 16, ph: 'wait', t: rnd(2.5, 5.5) / (wx ? 1.6 : 1), sx: s.x, sy: s.y };
    return 'Umpan dilempar… sabar ya 🎣';
  }
  function update(dt, s) {
    clk += dt; if (!f) return;
    if (s.dg || s.sel !== 'rod' || Math.hypot(s.x - f.sx, s.y - f.sy) > 20) { f = null; return; }
    if ((f.t -= dt) > 0) return;
    if (f.ph === 'wait') { f.ph = 'bite'; f.t = 1.1; say('🐟 Ikan menggigit! Tekan Aksi!'); Sfx.play('water'); }
    else { f = null; say('Ikannya kabur…'); }
  }
  function draw(c, s) {
    if (!f) return;
    const bite = f.ph === 'bite', bob = bite ? 3 + Math.sin(clk * 40) : Math.sin(clk * 3) * 0.8;
    c.strokeStyle = '#ffffffaa'; c.lineWidth = 1; c.beginPath(); c.moveTo(s.x + 6, s.y - 6); c.quadraticCurveTo((s.x + f.x) / 2, Math.min(s.y, f.y) - 16, f.x, f.y + bob); c.stroke();
    c.strokeStyle = '#ffffff66'; c.beginPath(); c.ellipse(f.x, f.y + 2, 6 + (clk * 6) % 6, 3, 0, 0, 7); c.stroke();
    c.fillStyle = '#e53935'; c.beginPath(); c.arc(f.x, f.y + bob, 3, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillRect(f.x - 3, f.y + bob - 0.5, 6, 1.5);
    if (bite) { c.font = 'bold 14px system-ui'; c.textAlign = 'center'; c.fillStyle = '#ffd54a'; c.strokeStyle = '#000b'; c.lineWidth = 3; c.strokeText('!', f.x, f.y - 10); c.fillText('!', f.x, f.y - 10); }
  }
  return { init: fn => { say = fn; }, act, update, draw, active: () => !!f };
})();
