// Efek visual ringan: partikel, cincin, debu langkah, dan getaran layar.
const Fx = (() => {
  let ps = [], rs = [], sk = 0, fz = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  return {
    burst(x, y, col, n, spd, up) {
      for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = rnd(0.4, 1) * (spd || 60); ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (up || 0), t: rnd(0.3, 0.6), m: 0.6, c: col, r: rnd(1.2, 2.6), g: 120 }); }
    },
    ring(x, y, col, r) { rs.push({ x, y, c: col, t: 0.35, m: 0.35, r: r || 26 }); },
    dust(x, y) { ps.push({ x: x + rnd(-3, 3), y, vx: rnd(-8, 8), vy: rnd(-10, -3), t: 0.4, m: 0.4, c: 'rgba(205,195,165,', r: rnd(1.5, 3), g: 0, soft: 1 }); },
    shake(a) { sk = Math.max(sk, a); },
    stop(t) { fz = Math.max(fz, t); },   // hit-stop: dunia melambat sesaat saat serangan kritikal / boss kena
    scale() { return fz > 0 ? 0.12 : 1; },
    off() { return sk > 0.2 ? { x: (Math.random() - 0.5) * sk, y: (Math.random() - 0.5) * sk } : { x: 0, y: 0 }; },
    update(dt) {
      sk *= Math.pow(0.001, dt); if (fz > 0) fz -= dt;
      for (const p of ps) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; }
      for (const r of rs) r.t -= dt;
      ps = ps.filter(p => p.t > 0); rs = rs.filter(r => r.t > 0);
      if (ps.length > 300) ps.splice(0, ps.length - 300);
    },
    draw(c) {
      for (const p of ps) {
        const a = Math.max(0, p.t / p.m);
        if (p.soft) c.fillStyle = p.c + (0.35 * a) + ')'; else { c.globalAlpha = a; c.fillStyle = p.c; }
        c.beginPath(); c.arc(p.x, p.y, p.r * (p.soft ? 2 - a : 1), 0, 7); c.fill(); c.globalAlpha = 1;
      }
      for (const r of rs) { const a = r.t / r.m; c.globalAlpha = a; c.strokeStyle = r.c; c.lineWidth = 2; c.beginPath(); c.arc(r.x, r.y, r.r * (1.4 - a * 0.6), 0, 7); c.stroke(); c.globalAlpha = 1; }
    }
  };
})();
