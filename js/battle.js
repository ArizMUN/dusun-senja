// Pertarungan: monster malam, serangan pemain, drop, XP. Monster tidak disimpan (muncul lagi tiap malam).
const Battle = (() => {
  const T = CFG.TILE;
  let dead = [], spawnW = 0, bolts = [], fl = [], cds = {}, mons = [], env, spawnT = 0, swing = null, atkCd = 0, hurtCd = 0, lastHurt = -99, clock = 0, flash = 0, cur = null;
  const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1));
  const home = () => { const h = CFG.HOME; return { x: (h.x + h.w / 2) * T, y: (h.y + h.h / 2) * T }; };
  const give = (s, id, n) => { s.inv[id] = (s.inv[id] || 0) + n; };
  function init(e) { env = e; reset(); }
  function reset() { mons = []; bolts = []; fl = []; dead = []; flash = 0; }

  function spawn(day) {
    const c = home();
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * 6.283, r = rnd(300, 430), x = c.x + Math.cos(a) * r, y = c.y + Math.sin(a) * r;
      if (x < 40 || y < 40 || x > CFG.W * T - 40 || y > CFG.H * T - 40 || env.hit(x, y)) continue;
      const ks = Object.keys(MON).filter(k => MON[k].minDay <= day), k = ks[Math.floor(Math.random() * ks.length)];
      const sc = 1 + (day - 1) * 0.15, d = MON[k];
      mons.push({ k, x, y, hp: d.hp * sc, mx: d.hp * sc, atk: d.atk * sc, h: 0, f: 0, c: 0, w: 0, ax: 0, ay: 0 }); Fx.burst(x, y - 6, '#7e57c2', 8, 40, 20);
      return;
    }
  }
  function spawnWild(s, dh) {   // monster liar di luar: makin jauh dari rumah makin kuat dan elemen sesuai wilayah
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * 6.283, r = rnd(280, 400), x = s.x + Math.cos(a) * r, y = s.y + Math.sin(a) * r;
      if (x < 40 || y < 40 || x > CFG.W * T - 40 || y > CFG.H * T - 40 || env.hit(x, y) || env.safe(x, y)) continue;
      const ks = Object.keys(MON).filter(k => !MON[k].boss && MON[k].minDay <= 1 + Math.floor(dh / 25)), k = ks[Math.floor(Math.random() * ks.length)];
      const sc = Math.min(3.5, 1 + dh / 50), d = MON[k];
      mons.push({ k, x, y, hp: d.hp * sc, mx: d.hp * sc, atk: d.atk * sc, h: 0, f: 0, c: 0, w: 0, ax: 0, ay: 0, wild: 1, rw: sc, el: World.elAt(Math.floor(x / T), Math.floor(y / T)) }); Fx.burst(x, y - 6, '#b0bec5', 6, 36, 16);
      return;
    }
  }
  function kill(s, m) {
    dead.push({ k: m.k, x: m.x, y: m.y, fc: m.fc, el: m.el, t: 0.5 });   // animasi mati
    Fx.burst(m.x, m.y - 8, MON[m.k].col, 14, 90, 30); Fx.burst(m.x, m.y - 6, '#ffd54a', 4, 50, 60); Fx.ring(m.x, m.y - 6, '#fff', 20); if (MON[m.k].boss) { Fx.shake(9); Fx.stop(0.2); }
    const d = MON[m.k], out = [], g = Math.round(ri(d.gold[0], d.gold[1]) * (m.rw || 1));
    s.gold += g; out.push('+' + g + '🪙');
    if (Math.random() < 0.3) { give(s, 'mat:wood', ri(1, 2)); out.push('🪵'); }
    if (Math.random() < 0.25) { give(s, 'mat:stone', 1); out.push('🪨'); }
    if (Math.random() < 0.12 && s.items.length < 30) { const it = Gear.roll(null, Math.floor(s.t / 24) + (s.dg ? s.dg.lv * 2 : 0) + Math.floor(((m.rw || 1) - 1) * 4)); s.items.push(it); out.push('🎁 ' + it.n); }
    if (d.boss) {   // boss: reward besar
      give(s, 'mat:stone', ri(8, 12)); out.push('🪨');
      for (let i = 0; i < 2 && s.items.length < 30; i++) { const it = Gear.roll(null, Math.floor(s.t / 24) + 4 + (s.dg ? s.dg.lv * 2 : 0)); s.items.push(it); out.push('🎁 ' + it.n); }
      out.push('🏆'); if (env.boss) env.boss();
    }
    s.xp += Math.round(d.xp * (m.rw || 1));
    while (s.xp >= 20 * s.lv) { s.xp -= 20 * s.lv; s.lv++; s.sp = (s.sp || 0) + 1; s.hp = Gear.stats(s).hp; out.push('⬆️ Level ' + s.lv + '!'); Sfx.play('level'); Fx.ring(s.x, s.y - 6, '#ffd54a', 30); Fx.burst(s.x, s.y - 10, '#ffd54a', 18, 100, 40); }
    env.toast(d.n + ' kalah ' + out.join(' '));
    Quest.add(s, 'kill', 1); if (d.boss) Quest.add(s, 'boss', 1);
  }
  function hurt(s, dmg) { if (hurtCd > 0) return; hurtCd = 0.5; lastHurt = clock; flash = 0.25; Sfx.play('hurt'); Fx.shake(5); Fx.burst(s.x, s.y - 8, '#ff5252', 8, 70); if (s.shield > 0) { const a = Math.min(s.shield, dmg); s.shield -= a; dmg -= a; } s.hp -= dmg; }

  function hitMon(s, st, m, base, el) {   // damage dengan elemen, kritikal, dan angka melayang
    const mul = Elem.mult(el, m.el || MON[m.k].el), crit = Math.random() < st.f.crit;
    const d = Math.max(1, Math.round(base * (0.9 + Math.random() * 0.2) * mul * (crit ? 1.7 : 1)));
    m.hp -= d; m.h = 0.15; m.sq = 0.18;
    Fx.burst(m.x, m.y - 8, crit ? '#ffd54a' : (el && ECOL[el]) || '#fff', crit ? 9 : 5, 70); if (crit) { Fx.ring(m.x, m.y - 8, '#ffd54a', 18); Fx.shake(3); Fx.stop(0.05); } Sfx.play(m.hp <= 0 ? 'kill' : 'hit');
    fl.push({ x: m.x, y: m.y - 14, t: 0.7, txt: d + (mul > 1 ? '▲' : mul < 1 ? '▼' : ''), c: crit ? '#ffd54a' : mul > 1 ? '#ff8a65' : mul < 1 ? '#90a4ae' : '#fff', big: crit });
    if (m.hp <= 0) kill(s, m);
  }
  function cast(s, st, id, fx, fy) {   // pakai skill aktif
    const n = SK[id], a = n && n.act; if (!a || cds[id] > 0) return;
    if (s.mp < a.mp) { env.toast('Mana kurang 💙'); return; }
    s.mp -= a.mp; cds[id] = a.cd; Quest.add(s, 'cast', 1); Sfx.play(a.kind === 'heal' || a.kind === 'shield' ? 'heal' : 'cast');
    Fx.ring(s.x, s.y - 6, a.el ? ECOL[a.el] : a.kind === 'heal' ? '#69f0ae' : a.kind === 'shield' ? '#90caf9' : '#fff', 22); if (a.kind === 'heal') Fx.burst(s.x, s.y - 6, '#69f0ae', 10, 40, 40);
    if (a.kind === 'heal') { const h = Math.round(st.hp * a.pw * (1 + st.f.healPct)); s.hp = Math.min(st.hp, s.hp + h); fl.push({ x: s.x, y: s.y - 20, t: 0.9, txt: '+' + h, c: '#69f0ae' }); }
    else if (a.kind === 'shield') { s.shield = Math.round(st.hp * a.pw); s.shT = 8; env.toast('Perisai aktif 🔰'); }
    else if (a.kind === 'slash') {
      swing = { t: 0.2, t0: 0.2, big: 1, fx, fy, x: s.x, y: s.y, el: s.equip.hands && s.equip.hands.el };
      for (const m of mons) if (Math.hypot(m.x - s.x, m.y - s.y) < 56) hitMon(s, st, m, st.atk * a.pw, s.equip.hands && s.equip.hands.el);
      mons = mons.filter(m => m.hp > 0);
    } else {   // bola sihir, auto-aim ke monster terdekat
      let tx = fx, ty = fy, bd = 260;
      for (const m of mons) { const d = Math.hypot(m.x - s.x, m.y - s.y); if (d < bd) { bd = d; tx = (m.x - s.x) / d; ty = (m.y - s.y) / d; } }
      bolts.push({ x: s.x + tx * 12, y: s.y + ty * 12, vx: tx * 260, vy: ty * 260, el: a.el, dmg: st.atk * a.pw * (1 + st.f.magPct), life: 1.2 });
    }
  }
  function attack(s, st, fx, fy) {
    if (atkCd > 0) return null;
    atkCd = 0.4; Sfx.play('swing');
    let best = null, bd = 75;   // auto-aim ke monster terdekat (nyaman di HP)
    for (const m of mons) { const d = Math.hypot(m.x - s.x, m.y - s.y); if (d < bd) { bd = d; best = m; } }
    if (best) { const dx = best.x - s.x, dy = best.y - s.y; if (Math.abs(dx) > Math.abs(dy)) { fx = Math.sign(dx); fy = 0; } else { fx = 0; fy = Math.sign(dy); } }
    swing = { t: 0.15, t0: 0.15, fx, fy, x: s.x, y: s.y, el: s.equip.hands && s.equip.hands.el };
    const cx = s.x + fx * 20, cy = s.y + fy * 20;
    for (const m of mons) {
      if (Math.hypot(m.x - cx, m.y - cy) > 30) continue;
      hitMon(s, st, m, st.atk, s.equip.hands && s.equip.hands.el);
      if (!env.hit(m.x + fx * 12, m.y)) m.x += fx * 12;
      if (!env.hit(m.x, m.y + fy * 12)) m.y += fy * 12;
    }
    mons = mons.filter(m => m.hp > 0);
    return { fx, fy };
  }

  function update(s, dt, st, dark) {
    cur = s; clock += dt; atkCd -= dt; hurtCd -= dt; flash -= dt;
    if (swing && (swing.t -= dt) <= 0) swing = null;
    const day = Math.floor(s.t / 24) + 1;
    if (!s.dg && dark > 0.5) {
      spawnT -= dt;
      if (spawnT <= 0 && mons.length < Math.min(16, 3 + Math.floor(day * 1.5))) { spawnT = 2.5; spawn(day); }
    } else if (!s.dg && dark === 0 && mons.length) mons = mons.filter(m => m.wild);
    if (!s.dg) {   // monster liar: muncul jika jauh dari rumah (>40 tile), makin jauh makin banyak
      const hc = home(), dh = Math.hypot(s.x - hc.x, s.y - hc.y) / T;
      mons = mons.filter(m => !m.wild || Math.hypot(m.x - s.x, m.y - s.y) < 700);
      spawnW -= dt;
      if (dh > 40 && spawnW <= 0 && mons.filter(m => m.wild).length < Math.min(8, 1 + Math.floor((dh - 40) / 20))) { spawnW = 3; spawnWild(s, dh); }
    }   // pagi: monster menghilang
    if (clock - lastHurt > 5 && s.hp < st.hp) s.hp = Math.min(st.hp, s.hp + st.hp * 0.02 * dt);
    s.hp = Math.min(st.hp, s.hp + st.hp * st.f.regen * dt);
    s.mp = Math.min(st.mp, (s.mp == null ? st.mp : s.mp) + (1.5 + st.f.mpRegen) * dt);
    for (const id in cds) if (cds[id] > 0) cds[id] -= dt;
    if (s.shT > 0 && (s.shT -= dt) <= 0) s.shield = 0;
    if (!s.dg && mons.length) for (const k in s.build) {   // menara jaga menembak monster terdekat
      const tb = s.build[k]; if (tb.t !== 'tower') continue;
      if ((tb.cd = (tb.cd || 0) - dt) > 0) continue;
      const [tx, ty] = k.split(',').map(Number), cx = (tx + 0.5) * T, cy = (ty + 0.5) * T;
      let best = null, bd = 160;
      for (const m of mons) { const d = Math.hypot(m.x - cx, m.y - cy); if (d < bd) { bd = d; best = m; } }
      if (best) { tb.cd = 1.5; bolts.push({ x: cx, y: cy - 8, vx: (best.x - cx) / bd * 300, vy: (best.y - cy) / bd * 300, el: null, dmg: 7 + s.lv * 2, life: 0.8, ar: 1 }); Sfx.play('swing'); }
    }
    for (const b of bolts) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (!b.ar && env.hit(b.x, b.y)) b.life = 0;   // panah menara terbang melewati dinding
      for (const m of mons) if (b.life > 0 && m.hp > 0 && Math.hypot(m.x - b.x, m.y - b.y) < MON[m.k].r + 6) { hitMon(s, st, m, b.dmg, b.el); b.life = 0; }
    }
    bolts = bolts.filter(b => b.life > 0); mons = mons.filter(m => m.hp > 0);
    for (const f of fl) { f.t -= dt; f.y -= 22 * dt; }
    fl = fl.filter(f => f.t > 0);
    for (const q of dead) q.t -= dt;
    dead = dead.filter(q => q.t > 0);

    for (const m of mons) {
      const d = MON[m.k], dp = Math.hypot(s.x - m.x, s.y - m.y), c = home();
      m.h -= dt; m.f -= dt; m.c -= dt; m.sq -= dt; m.age = (m.age || 0) + dt;
      if (dp < 420 && Math.random() < dt * (d.boss ? 7 : 2)) Fx.burst(m.x + rnd(-d.r, d.r), m.y - (HH[m.k] || 20) * 0.5, ECOL[m.el || d.el] || '#fff', 1, 10, 26);   // aura elemen
      if (d.boss && Math.random() < dt * 0.9) Fx.ring(m.x, m.y - 10, ECOL[m.el || d.el] || '#fff', d.r + 16);
      if (dp < 260) m.fc = s.x >= m.x ? 1 : -1;   // hadap pemain saat dekat
      const chase = dp < (s.dg ? 170 : 220);
      if ((s.dg || m.wild) && !chase) continue;   // di dungeon monster diam sampai kamu dekat
      const tx = chase ? s.x : c.x, ty = chase ? s.y : c.y;
      let dx = tx - m.x, dy = ty - m.y;
      if (!chase && Math.hypot(dx, dy) < 50 && m.w <= 0) { m.w = 1; m.ax = rnd(-1, 1); m.ay = rnd(-1, 1); }   // sampai rumah: berkeliaran
      if (m.w > 0) { m.w -= dt; dx = m.ax; dy = m.ay; }
      if (dp >= 260 && Math.abs(dx) > 2) m.fc = dx > 0 ? 1 : -1;
      const n = Math.hypot(dx, dy) || 1, vx = dx / n * d.spd * dt, vy = dy / n * d.spd * dt, ox = m.x, oy = m.y;
      if (!env.hit(m.x + vx, m.y)) m.x += vx;
      if (!env.hit(m.x, m.y + vy)) m.y += vy;
      if (Math.hypot(m.x - ox, m.y - oy) < d.spd * dt * 0.3) {   // tersangkut: rusak bangunan di depan, atau geser menyamping
        const ax = Math.abs(vx) > Math.abs(vy);
        const bx = Math.floor((m.x + (ax ? Math.sign(vx) * 12 : 0)) / T), by = Math.floor((m.y + (ax ? 0 : Math.sign(vy) * 12)) / T);
        if (!s.dg && Build.solid(s, bx, by)) { if (m.f <= 0) { m.f = 1; if (Build.damage(s, bx, by, m.atk * 1.5)) env.toast('Bangunanmu rusak! 🧱'); } }
        else if (m.w <= 0) { m.w = 0.7; m.ax = -vy; m.ay = vx; }
      }
      if (dp < 8 + d.r && m.c <= 0) { m.c = 1; hurt(s, Math.max(1, Math.round((m.atk - st.def) * Elem.def(s, m.el || d.el) * (1 - st.f.dmgRed)))); }
    }
  }

  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; };
  const tri = (c, x1, y1, x2, y2, x3, y3) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); c.fill(); };
  // Gambar monster: koordinat lokal, menghadap kanan (di-flip lewat scale), titik (0,0) = tengah kaki
  const ART = {
    slime(c, m, d, col, F, t) {
      const sq = Math.sin(t * 5 + m.x), rx = d.r + 1 + sq * 0.9, ry = d.r * 0.75 - sq * 0.9, fc = m.fc || 1;
      c.fillStyle = F(shade(col, 0.7)); c.beginPath(); c.ellipse(0, 3 - ry, rx, ry, 0, 0, 7); c.fill();
      c.fillStyle = F(col); c.beginPath(); c.ellipse(0, 2 - ry, rx - 1.2, ry - 1.8, 0, 0, 7); c.fill();
      c.fillStyle = F(shade(col, 1.35)); c.beginPath(); c.ellipse(-rx * 0.4, -ry * 1.1, 2.8, 1.5, -0.5, 0, 7); c.fill();   // kilau
      c.fillStyle = F(shade(col, 0.85)); c.beginPath(); c.arc(-3, 0, 1.6, 0, 7); c.arc(4, -1, 1.2, 0, 7); c.fill();   // gelembung dalam tubuh
      c.fillStyle = '#fff'; c.beginPath(); c.arc(-3 + fc, -ry - 0.5, 2.6, 0, 7); c.arc(3.5 + fc, -ry - 0.5, 2.6, 0, 7); c.fill();
      c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(-2.4 + fc * 1.3, -ry - 0.2, 1.2, 0, 7); c.arc(4.1 + fc * 1.3, -ry - 0.2, 1.2, 0, 7); c.fill();
      c.strokeStyle = '#1b1b1b'; c.lineWidth = 1; c.beginPath(); c.arc(0.5 + fc, -ry + 3.4, 2, 0.15, Math.PI - 0.15); c.stroke();   // mulut
    },
    wolf(c, m, d, col, F, t) {
      const sw = Math.sin(t * 10 + m.x), dk = F(shade(col, 0.6)), lt = F(shade(col, 1.3));
      c.strokeStyle = dk; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-9, -7); c.quadraticCurveTo(-15, -8 + sw, -16, -14); c.stroke();   // ekor
      c.fillStyle = dk; c.fillRect(-8 + sw * 2, -3, 3, 8); c.fillRect(-3 - sw * 2, -3, 3, 8); c.fillRect(3 + sw * 2, -3, 3, 8); c.fillRect(7 - sw * 2, -3, 3, 8);
      c.fillStyle = F(col); c.beginPath(); c.ellipse(0, -6, 11, 6.5, 0, 0, 7); c.fill();
      c.fillStyle = lt; c.beginPath(); c.ellipse(1, -3, 8, 3, 0, 0, 7); c.fill();
      c.fillStyle = dk; for (let i = 0; i < 4; i++) tri(c, -7 + i * 4, -11, -5 + i * 4, -15, -3 + i * 4, -11);   // surai punggung
      c.fillStyle = F(col); c.beginPath(); c.ellipse(11, -10, 6, 5, -0.2, 0, 7); c.fill();
      c.fillStyle = lt; c.beginPath(); c.ellipse(16, -8, 4.5, 2.8, 0.1, 0, 7); c.fill();
      c.fillStyle = dk; tri(c, 8, -13, 9.5, -19, 12, -13); tri(c, 12, -13, 14.5, -18, 15, -12);   // telinga
      c.fillStyle = '#111'; c.fillRect(19, -10, 2.5, 2.5);
      c.fillStyle = m.h > 0 ? '#fff' : '#ffeb3b'; c.fillRect(12, -12, 3, 2.4); c.fillStyle = '#b71c1c'; c.fillRect(13.6, -12, 1.2, 2.4);
      c.fillStyle = '#fff'; tri(c, 16, -6, 17.2, -6, 16.6, -3.6); tri(c, 18.5, -6, 19.7, -6, 19.1, -3.6);   // taring
    },
    skeleton(c, m, d, col, F, t) {
      const sw = Math.sin(t * 7 + m.x), bone = F(col), dk = F(shade(col, 0.55));
      c.fillStyle = bone; c.fillRect(-4, -1 - (sw > 0 ? 1 : 0), 2.6, 9); c.fillRect(1.5, -1 - (sw < 0 ? 1 : 0), 2.6, 9);   // kaki
      c.fillRect(-5, -2, 10, 2.5);   // panggul
      c.fillRect(-1.2, -14, 2.6, 13);   // tulang belakang
      c.fillStyle = dk; for (let i = 0; i < 3; i++) c.fillRect(-6, -13 + i * 3.6, 12, 1.4);   // rusuk
      c.fillStyle = bone; for (let i = 0; i < 3; i++) c.fillRect(-5.5, -13.6 + i * 3.6, 11, 1.4);
      c.fillRect(-9, -13 + sw, 2.4, 8);   // lengan belakang
      c.fillRect(6.5, -13 - sw, 2.4, 8);   // lengan depan memegang pedang
      c.fillStyle = m.h > 0 ? '#fff' : '#9e9e9e'; c.fillRect(8, -25 - sw, 2.2, 16);   // pedang berkarat
      c.fillStyle = '#6b4423'; c.fillRect(5.5, -10 - sw, 7, 2);
      c.fillStyle = bone; c.beginPath(); c.arc(0, -19, 6, 0, 7); c.fill(); c.fillRect(-4, -16, 8, 4);   // tengkorak dan rahang
      c.fillStyle = '#111'; c.fillRect(-4.2, -21, 3.2, 3.6); c.fillRect(1.2, -21, 3.2, 3.6); c.fillRect(-0.8, -17, 1.6, 1.6);
      c.fillStyle = m.h > 0 ? '#fff' : '#ff5252'; c.fillRect(-3.2, -20, 1.4, 1.4); c.fillRect(2.2, -20, 1.4, 1.4);   // mata menyala
      c.fillStyle = dk; for (let i = 0; i < 4; i++) c.fillRect(-3 + i * 2, -14.6, 0.8, 2);   // gigi
    },
    golem(c, m, d, col, F, t) {
      const sw = Math.sin(t * 3 + m.x), st = F(col), dk = F(shade(col, 0.6)), lt = F(shade(col, 1.3)), ec = m.h > 0 ? '#fff' : (ECOL[m.el || d.el] || '#ffb74d');
      c.fillStyle = dk; c.fillRect(-12, 0 + sw * 0.8, 9, 12); c.fillRect(3, 0 - sw * 0.8, 9, 12);   // kaki
      c.fillStyle = dk; c.fillRect(-25, -16 + sw * 1.5, 8, 20); c.fillRect(17, -16 - sw * 1.5, 8, 20);   // lengan
      c.fillStyle = st; c.beginPath(); c.arc(-21, 5 + sw * 1.5, 6, 0, 7); c.arc(21, 5 - sw * 1.5, 6, 0, 7); c.fill();   // kepalan
      c.fillStyle = st; c.fillRect(-15, -22, 30, 26); c.fillStyle = lt; c.fillRect(-15, -22, 30, 5);
      c.fillStyle = dk; c.fillRect(-9, -13, 1.6, 9); c.fillRect(6, -18, 1.6, 8); c.fillRect(-4, 0, 8, 1.6);   // retakan
      c.fillStyle = st; c.beginPath(); c.arc(-18, -20, 8, 0, 7); c.arc(18, -20, 8, 0, 7); c.fill();   // bahu batu
      c.fillStyle = m.h > 0 ? '#fff' : '#5a8f3a'; c.fillRect(-23, -26, 7, 3); c.fillRect(15, -26, 8, 3);   // lumut
      c.globalAlpha = 0.45 + 0.25 * Math.sin(t * 4); c.fillStyle = ec; c.beginPath(); c.arc(0, -10, 7.5, 0, 7); c.fill(); c.globalAlpha = 1;   // inti elemen
      c.fillStyle = ec; c.beginPath(); c.arc(0, -10, 4, 0, 7); c.fill(); c.fillStyle = '#fff9'; c.beginPath(); c.arc(-1, -11, 1.5, 0, 7); c.fill();
      c.fillStyle = st; c.fillRect(-8, -35, 16, 14); c.fillStyle = lt; c.fillRect(-8, -35, 16, 3);   // kepala
      c.fillStyle = dk; c.fillRect(-8, -30, 16, 2);
      c.fillStyle = ec; c.fillRect(-5.5, -28, 3.4, 3); c.fillRect(2.1, -28, 3.4, 3);   // mata menyala
    },
    drake(c, m, d, col, F, t) {   // Naga Api
      const sw = Math.sin(t * 3 + m.x), dk = F(shade(col, 0.6)), lt = F(shade(col, 1.35)), ec = m.h > 0 ? '#fff' : '#ffd54a';
      c.strokeStyle = dk; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-12, -8); c.quadraticCurveTo(-22, -3 + sw * 3, -27, -14 + sw * 2); c.stroke();
      c.fillStyle = dk; tri(c, -4, -16, -16, -36 - sw * 4, 5, -22); tri(c, 1, -18, -6, -40 - sw * 4, 11, -22);   // sayap
      c.fillRect(-9, -4, 5, 9); c.fillRect(3, -4, 5, 9);
      c.fillStyle = F(col); c.beginPath(); c.ellipse(0, -11, 15, 9, 0, 0, 7); c.fill();
      c.fillStyle = lt; c.beginPath(); c.ellipse(2, -7, 11, 4, 0, 0, 7); c.fill();
      c.fillStyle = dk; for (let i = 0; i < 5; i++) tri(c, -10 + i * 5, -19, -8 + i * 5, -25, -6 + i * 5, -19);
      c.fillStyle = F(col); c.beginPath(); c.ellipse(13, -17, 6, 8, -0.4, 0, 7); c.fill(); c.beginPath(); c.ellipse(19, -25, 7, 5, -0.15, 0, 7); c.fill();
      c.fillStyle = lt; c.beginPath(); c.ellipse(25, -23, 4, 3, 0, 0, 7); c.fill();
      c.fillStyle = dk; tri(c, 15, -29, 14, -38, 20, -29); tri(c, 20, -29, 22, -37, 25, -28);   // tanduk
      c.fillStyle = ec; c.fillRect(20, -28, 3, 2.4);
      c.globalAlpha = 0.65; c.fillStyle = '#ff7043'; c.beginPath(); c.arc(29 + sw, -22, 3 + Math.abs(sw) * 2.5, 0, 7); c.fill(); c.globalAlpha = 1;   // api napas
    },
    wraith(c, m, d, col, F, t) {   // Hantu Penguasa
      const fl = Math.sin(t * 2 + m.x) * 2, dk = F(shade(col, 0.55)), ec = m.h > 0 ? '#fff' : '#ff4081';
      c.strokeStyle = '#cfd8dc'; c.lineWidth = 2; c.beginPath(); c.moveTo(12, -4 + fl); c.lineTo(16, -36 + fl); c.stroke();   // gagang sabit
      c.strokeStyle = m.h > 0 ? '#fff' : '#eceff1'; c.lineWidth = 3; c.beginPath(); c.arc(10, -36 + fl, 7, Math.PI * 1.05, Math.PI * 1.8); c.stroke();
      c.fillStyle = F(col); c.beginPath(); c.moveTo(-9, -30 + fl); c.quadraticCurveTo(-17, -10 + fl, -14, 0 + fl);
      for (let i = 1; i <= 6; i++) c.lineTo(-14 + i * 4.7, (i % 2 ? -4 : 2) + fl);
      c.quadraticCurveTo(17, -10 + fl, 9, -30 + fl); c.closePath(); c.fill();
      c.fillStyle = dk; c.beginPath(); c.arc(0, -28 + fl, 9, 0, 7); c.fill();   // tudung
      c.fillStyle = '#08040e'; c.beginPath(); c.ellipse(0, -27 + fl, 5.5, 6, 0, 0, 7); c.fill();
      c.fillStyle = ec; c.fillRect(-3.8, -28 + fl, 2.6, 2.6); c.fillRect(1.2, -28 + fl, 2.6, 2.6);
      c.globalAlpha = 0.35; c.fillStyle = '#b39ddb'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-9 + i * 6, -6 + fl - Math.sin(t * 3 + i) * 3, 2.2, 0, 7); c.fill(); } c.globalAlpha = 1;
    },
    thunder(c, m, d, col, F, t) {   // Elang Petir
      const fl = Math.sin(t * 2 + m.x) * 2, wf = Math.sin(t * 9 + m.x), dk = F(shade(col, 0.65)), ec = m.h > 0 ? '#fff' : '#e040fb';
      c.fillStyle = dk; tri(c, -3, -17 + fl, -22, -34 - wf * 9 + fl, 4, -12 + fl); tri(c, 2, -17 + fl, -10, -40 - wf * 9 + fl, 10, -12 + fl);   // sayap mengepak
      c.fillStyle = F(col); for (let i = 0; i < 3; i++) tri(c, -10 - i * 2, -12 + fl + i * 3, -20 - i * 3, -8 + fl + i * 4, -8, -6 + fl + i * 3);   // ekor
      c.beginPath(); c.ellipse(0, -14 + fl, 11, 7, -0.15, 0, 7); c.fill();
      c.fillStyle = F(shade(col, 1.3)); c.beginPath(); c.ellipse(2, -11 + fl, 7, 3.4, -0.15, 0, 7); c.fill();
      c.fillStyle = F(col); c.beginPath(); c.arc(11, -21 + fl, 5.5, 0, 7); c.fill();
      c.fillStyle = '#ff9800'; tri(c, 15, -23 + fl, 23, -20 + fl, 15, -18 + fl);   // paruh
      c.fillStyle = ec; c.fillRect(11.5, -23 + fl, 2.6, 2.4);
      c.fillStyle = dk; c.fillRect(-3, -8 + fl, 2, 6); c.fillRect(3, -8 + fl, 2, 6);   // cakar
      if (m.h <= 0 && Math.sin(t * 17 + m.x) > 0.2) { c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-16, -30); c.lineTo(-12, -24); c.lineTo(-16, -20); c.lineTo(-11, -13); c.moveTo(16, -10); c.lineTo(20, -5); c.lineTo(15, -2); c.stroke(); }   // percikan petir
    },
    turtle(c, m, d, col, F, t) {   // Kura-kura Karang
      const sw = Math.sin(t * 2.5 + m.x), dk = F(shade(col, 0.6)), lt = F(shade(col, 1.35));
      c.fillStyle = dk; c.fillRect(-14, -3, 7, 8 + sw * 0.8); c.fillRect(-4, -3, 7, 8 - sw * 0.8); c.fillRect(6, -3, 7, 8 + sw * 0.8);
      c.fillStyle = F(col); c.beginPath(); c.ellipse(15, -10 + sw * 0.5, 7, 6, 0, 0, 7); c.fill();   // kepala
      c.fillStyle = m.h > 0 ? '#fff' : '#111'; c.fillRect(17, -13 + sw * 0.5, 2, 2.2);
      c.fillStyle = dk; c.beginPath(); c.ellipse(0, -9, 17, 11, 0, 0, 7); c.fill();   // cangkang
      c.fillStyle = F(col); c.beginPath(); c.ellipse(0, -10, 15, 9.5, 0, 0, 7); c.fill();
      c.strokeStyle = dk; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-14, -9); c.lineTo(14, -9); c.moveTo(-5, -19); c.lineTo(-5, -1); c.moveTo(5, -19); c.lineTo(5, -1); c.stroke();
      c.fillStyle = lt; tri(c, -9, -17, -6, -26, -3, -17); tri(c, 2, -18, 6, -29, 9, -18); tri(c, 8, -15, 11, -22, 13, -14);   // kristal karang
      c.fillStyle = m.h > 0 ? '#fff' : '#4fc3f7'; c.fillRect(-1, -4, 2, 3 + Math.abs(sw) * 2);   // tetesan
    }
  };
  const HH = { slime: 12, wolf: 20, skeleton: 28, golem: 40, drake: 42, wraith: 38, thunder: 36, turtle: 30 };   // tinggi gambar untuk ikon elemen dan bar HP
  function draw(c) {
    for (const q of dead) {   // monster mati: mengecil, memutih, memudar
      const d = MON[q.k], a = q.t / 0.5, col = q.el && ECOL[q.el] ? ECOL[q.el] : d.col;
      c.save(); c.globalAlpha = a; c.translate(q.x, q.y + d.r * 0.55 - (1 - a) * 6); c.scale((q.fc || 1) * (0.5 + 0.5 * a) * (1 + (1 - a) * 0.3), 0.5 + 0.5 * a);
      if (ART[q.k]) ART[q.k](c, { x: q.x, h: 1, c: 0, fc: q.fc || 1, k: q.k, el: q.el }, d, col, () => '#fff', clock);
      else { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, -d.r * 0.5, d.r, d.r * 0.85, 0, 0, 7); c.fill(); }
      c.restore();
    }
    for (const m of mons) {
      const d = MON[m.k], hh = HH[m.k] || d.r + 6, col = m.el && m.el !== d.el && ECOL[m.el] ? ECOL[m.el] : d.col, F = v => m.h > 0 ? '#fff' : v;
      c.fillStyle = '#0004'; c.beginPath(); c.ellipse(m.x, m.y + d.r * 0.8, d.r + 1, 3, 0, 0, 7); c.fill();
      const pop = Math.min(1, (m.age || 1) / 0.3), sq = m.sq > 0 ? m.sq / 0.18 : 0, lg = m.c > 0.75 ? (m.c - 0.75) / 0.25 : 0, pp = 0.4 + 0.6 * pop;   // muncul membesar, penyok saat kena, menerjang saat menyerang
      c.save(); c.translate(m.x + (m.fc || 1) * lg * 4, m.y + d.r * 0.55 + Math.sin(clock * 6 + m.x) * 0.5); c.scale((m.fc || 1) * (1 + 0.18 * sq) * pp, (1 - 0.18 * sq) * pp * (1 + 0.08 * Math.sin(pop * 3.14)));
      if (ART[m.k]) ART[m.k](c, m, d, col, F, clock);
      else { c.fillStyle = F(col); c.beginPath(); c.ellipse(0, -d.r * 0.5, d.r, d.r * 0.85, 0, 0, 7); c.fill(); }
      c.restore();
      c.fillStyle = '#fff'; c.font = '10px system-ui'; c.textAlign = 'center'; if (m.el || d.el) c.fillText(ELEMENTS[m.el || d.el].icon, m.x, m.y + d.r * 0.55 - hh - 6);
      if (cur && m.c <= 0) { const dpp = Math.hypot(cur.x - m.x, cur.y - m.y); if (dpp < d.r + 30) { c.fillStyle = '#ff5252'; c.font = 'bold 13px system-ui'; c.textAlign = 'center'; c.strokeStyle = '#000b'; c.lineWidth = 3; const ey = m.y + d.r * 0.55 - hh - 16 - Math.abs(Math.sin(clock * 10)) * 2; c.strokeText('!', m.x, ey); c.fillText('!', m.x, ey); } }   // peringatan: sebentar lagi menyerang
      if (m.hp < m.mx) { const bw = Math.max(20, d.r * 2 + 4), by = m.y + d.r * 0.55 - hh - 4; c.fillStyle = '#000a'; c.fillRect(m.x - bw / 2, by, bw, 3); c.fillStyle = '#e53935'; c.fillRect(m.x - bw / 2, by, bw * m.hp / m.mx, 3); }
    }
    for (const b of bolts) { if (b.ar) { c.strokeStyle = '#e8e0c8'; c.lineWidth = 2; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - b.vx * 0.04, b.y - b.vy * 0.04); c.stroke(); c.fillStyle = '#b0453a'; c.fillRect(b.x - 1.5, b.y - 1.5, 3, 3); continue; }
      c.fillStyle = ECOL[b.el] || '#fff'; c.globalAlpha = 0.25; c.beginPath(); c.arc(b.x - b.vx * 0.04, b.y - b.vy * 0.04, 6, 0, 7); c.fill(); c.globalAlpha = 0.5; c.beginPath(); c.arc(b.x - b.vx * 0.02, b.y - b.vy * 0.02, 5.5, 0, 7); c.fill(); c.globalAlpha = 1;
      c.beginPath(); c.arc(b.x, b.y, 5, 0, 7); c.fill(); c.fillStyle = '#fff8'; c.beginPath(); c.arc(b.x, b.y, 2, 0, 7); c.fill(); }
    c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = '#000c'; c.lineJoin = 'round';
    for (const f of fl) { c.globalAlpha = Math.min(1, f.t * 2); c.font = (f.big ? 'bold 16px' : 'bold 11px') + ' system-ui'; c.fillStyle = f.c; c.strokeText(f.txt, f.x, f.y); c.fillText(f.txt, f.x, f.y); }
    c.globalAlpha = 1;
    if (swing) {
      const a = Math.atan2(swing.fy, swing.fx), p = 1 - swing.t / (swing.t0 || 0.2), r = swing.big ? 34 : 17, a0 = a - 1.3, a1 = a0 + 2.6 * Math.min(1, p * 1.4), sx = swing.x + swing.fx * 14, sy = swing.y + swing.fy * 14;   // sabetan bulan sabit
      c.lineCap = 'round'; const sc = swing.el && ECOL[swing.el] ? ECOL[swing.el] : '#aad7ff'; c.globalAlpha = 0.4 * (1 - p); c.strokeStyle = sc; c.lineWidth = 10; c.beginPath(); c.arc(sx, sy, r, a0, a1); c.stroke(); c.globalAlpha = 1;
      c.strokeStyle = 'rgba(255,255,255,' + (1 - p) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(sx, sy, r, a0 + (a1 - a0) * 0.35, a1); c.stroke(); c.fillStyle = sc; c.globalAlpha = 1 - p; c.beginPath(); c.arc(sx + Math.cos(a1) * r, sy + Math.sin(a1) * r, 2.6, 0, 7); c.fill(); c.globalAlpha = 1; c.lineCap = 'butt';
    }
  }
  function fx(c, w, h) {
    const bo = mons.find(m => MON[m.k].boss && m.hp > 0);
    if (bo) {   // bar HP boss di atas layar
      const d = MON[bo.k], bw = Math.min(w * 0.55, 320), bx = (w - bw) / 2, by = 56, col = ECOL[bo.el || d.el] || '#e53935', t = d.n + ' ' + ELEMENTS[bo.el || d.el].icon;
      c.fillStyle = '#000b'; c.fillRect(bx - 2, by - 2, bw + 4, 14); c.fillStyle = '#3a1010'; c.fillRect(bx, by, bw, 10); c.fillStyle = col; c.fillRect(bx, by, bw * Math.max(0, bo.hp) / bo.mx, 10); c.fillStyle = '#ffffff44'; c.fillRect(bx, by, bw * Math.max(0, bo.hp) / bo.mx, 3);
      c.font = 'bold 12px system-ui'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = '#000c'; c.fillStyle = '#fff'; c.strokeText(t, w / 2, by - 6); c.fillText(t, w / 2, by - 6);
    }
    if (flash > 0) { c.fillStyle = 'rgba(220,30,30,' + Math.min(0.4, flash * 1.2) + ')'; c.fillRect(0, 0, w, h); } }
  function set(a) { mons = a; }
  return { init, reset, set, attack, cast, cd: id => cds[id] || 0, update, draw, fx, swingP: () => swing ? Math.max(0, Math.min(1, 1 - swing.t / (swing.t0 || 0.2))) : -1, blink: () => hurtCd > 0 ? (Math.floor(clock * 22) % 2 ? 0.35 : 1) : 1 };
})();
