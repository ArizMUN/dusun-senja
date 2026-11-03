// Cuaca per hari game: cerah, hujan (menyiram tanaman otomatis, ikan lebih cepat menggigit), badai (monster muncul walau siang).
const Weather = (() => {
  let cur = { k: 'clear', a: 0 }, last = 'clear', cl = 0, acc = 0, pp = 0, say = () => {};
  const win = day => {
    if (day === 0) return null;   // hari pertama selalu cerah
    const h = World.hash(day, 0, CFG.SEED + 123), k = h < 0.58 ? 'clear' : h < 0.86 ? 'rain' : 'storm';
    if (k === 'clear') return null;
    const st = 6 + World.hash(day, 1, CFG.SEED + 124) * 9;
    return { k, st, en: st + 4 + World.hash(day, 2, CFG.SEED + 125) * 5 };
  };
  function now(t) {
    const hr = t % 24, w = win(Math.floor(t / 24));
    if (!w || hr < w.st || hr > w.en) return { k: 'clear', a: 0 };
    return { k: w.k, a: Math.max(0, Math.min(1, (hr - w.st) / 0.6, (w.en - hr) / 0.6)) };
  }
  function update(s, dt) {
    if (s.dg) { cur = { k: 'clear', a: 0 }; return; }
    cl += dt; cur = now(s.t);
    if (cur.a > 0.3 && last === 'clear') { last = cur.k; say(cur.k === 'storm' ? '⛈️ Badai datang! Monster berkeliaran walau siang' : '🌧️ Hujan turun, tanaman disiram otomatis'); }
    else if (cur.a === 0 && last !== 'clear') { last = 'clear'; say('☀️ Cuaca kembali cerah'); }
    if (cur.k !== 'clear' && cur.a > 0.5 && (acc -= dt) <= 0) { acc = 1; Farm.rain(s); }
    const p = cl % 9; if (cur.k === 'storm' && cur.a > 0.5 && pp < 0.25 && p >= 0.25) Sfx.play('thunder'); pp = p;
  }
  function draw(c, vw, vh) {
    if (cur.k === 'clear' || cur.a <= 0) return;
    const storm = cur.k === 'storm', a = cur.a;
    c.fillStyle = 'rgba(40,60,100,' + (storm ? 0.28 : 0.14) * a + ')'; c.fillRect(0, 0, vw, vh);
    const n = Math.round((storm ? 140 : 80) * a); c.strokeStyle = 'rgba(190,215,255,0.55)'; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i < n; i++) { const x = (i * 53.7 + cl * (storm ? 90 : 30)) % vw, y = (i * 91.3 + cl * 520) % vh; c.moveTo(x, y); c.lineTo(x - (storm ? 5 : 2), y + 9); }
    c.stroke();
    if (storm) { const p = cl % 9, f = p < 0.2 ? 1 - p / 0.2 : p > 0.45 && p < 0.6 ? (1 - (p - 0.45) / 0.15) * 0.6 : 0; if (f > 0) { c.fillStyle = 'rgba(255,255,255,' + 0.5 * f * a + ')'; c.fillRect(0, 0, vw, vh); } }
  }
  return { init: fn => { say = fn; }, now, update, draw, cur: () => cur };
})();
