// Sprite buatan sendiri (Canvas 2D): lantai, perabot/bangunan, dan karakter pemain.
// Semua digambar dengan kode (tanpa file gambar), jadi ringan dan aman untuk Cloudflare free tier.
const Sprites = (() => {
  const T = 32;
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; };
  const R = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const E = (c, col, x, y, rx, ry) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); };
  const hash = (x, y, s) => World.hash(x, y, s);

  // ===== LANTAI (lapisan bawah) =====
  // nb = bitmask tetangga yang juga lantai: 1 atas, 2 kanan, 4 bawah, 8 kiri. Sisi tanpa tetangga diberi tepi.
  const FLOOR = {
    floor_wood(c, h, tx, ty) {
      R(c, '#b98a55', 0, 0, T, T);
      for (let i = 0; i < 4; i++) {
        const tint = hash(tx, ty * 4 + i, 3);
        R(c, tint > 0.5 ? '#c19460' : '#b08050', 0, i * 8, T, 7);
        R(c, '#8f6a3d', 0, i * 8 + 7, T, 1);
        const off = ((tint * 23) | 0) % 20 + 4;   // sambungan papan acak
        R(c, '#8f6a3d', off, i * 8, 1, 7);
        R(c, '#6f4f2a', off + 2, i * 8 + 3, 1, 1);
      }
      R(c, '#ffffff14', 0, 0, T, 1);
    },
    floor_stone(c, h, tx, ty) {
      R(c, '#9aa0a6', 0, 0, T, T);
      R(c, '#a9afb5', 1, 1, 14, 14); R(c, '#8f959b', 17, 1, 14, 14); R(c, '#8f959b', 1, 17, 14, 14); R(c, '#a9afb5', 17, 17, 14, 14);
      R(c, '#7a8086', 0, 15, T, 2); R(c, '#7a8086', 15, 0, 2, T);
      R(c, '#ffffff22', 2, 2, 12, 1); R(c, '#ffffff22', 18, 18, 12, 1);
      if (h > 0.6) R(c, '#6d7379', 4 + ((h * 31) % 1) * 20, 4 + ((h * 53) % 1) * 20, 5, 1);   // retakan kecil
    },
    floor_tile(c, h, tx, ty) {
      R(c, '#e8e2d0', 0, 0, T, T);
      R(c, '#cfc7ad', 0, 0, 16, 16); R(c, '#cfc7ad', 16, 16, 16, 16);
      R(c, '#b7af95', 0, 15, T, 1); R(c, '#b7af95', 15, 0, 1, T);
      R(c, '#ffffff55', 1, 1, 6, 1); R(c, '#ffffff55', 17, 17, 6, 1);
    }
  };
  function floor(c, t, px, py, tx, ty, nb) {
    const f = FLOOR[t]; if (!f) return false;
    c.save(); c.translate(px, py); f(c, hash(tx, ty, 8), tx, ty);
    if (!(nb & 1)) { R(c, '#00000038', 0, 0, T, 2); R(c, '#ffffff30', 0, 2, T, 1); }
    if (!(nb & 4)) { R(c, '#0000004a', 0, T - 3, T, 3); }
    if (!(nb & 8)) { R(c, '#00000030', 0, 0, 2, T); }
    if (!(nb & 2)) { R(c, '#00000030', T - 2, 0, 2, T); }
    c.restore(); return true;
  }

  // ===== PERABOT / BANGUNAN (lapisan objek) =====
  // n = {n,e,s,w}: tetangga sejenis (dinding/pagar/pintu) agar sambungan terlihat menyatu. a = waktu animasi. night = 0..1
  const wallLike = { wall_wood: 1, wall_stone: 1, door: 1, fence: 1 };
  const shadow = (c, w) => E(c, '#0000003a', 16, 29, w || 12, 3.5);
  const OBJ = {
    wall_wood(c, b, n) {
      R(c, '#7a4a22', 0, 0, T, T); R(c, '#8d5a2b', 0, 0, T, T - 3);
      for (let i = 0; i < 4; i++) { R(c, '#6f4520', i * 8 + 7, 0, 1, T - 3); R(c, '#9c6633', i * 8 + 2, 3, 1, T - 9); }   // papan vertikal + serat
      if (!n.n) { R(c, '#b9854a', 0, 0, T, 7); R(c, '#d09a5a', 0, 0, T, 2); R(c, '#6f4520', 0, 7, T, 1); }
      R(c, '#00000040', 0, T - 3, T, 3);
      if (!n.s) R(c, '#5e3716', 0, T - 3, T, 3);
      for (const x of [3, 27]) { R(c, '#4a2a10', x, 12, 2, 2); R(c, '#4a2a10', x, 22, 2, 2); }
    },
    wall_stone(c, b, n) {
      R(c, '#62676d', 0, 0, T, T); R(c, '#7d838a', 0, 0, T, T - 3);
      for (let r = 0; r < 4; r++) {
        const o = r % 2 ? 8 : 0;
        R(c, '#62676d', 0, r * 8 + 7, T, 1);
        for (let x = o; x < T + 8; x += 16) R(c, '#62676d', x, r * 8, 1, 7);
        R(c, '#8e959c', 1, r * 8 + 1, T - 2, 1);
      }
      if (!n.n) { R(c, '#a3abb3', 0, 0, T, 7); R(c, '#bcc4cc', 0, 0, T, 2); R(c, '#62676d', 0, 7, T, 1); R(c, '#62676d', 10, 0, 1, 7); R(c, '#62676d', 22, 0, 1, 7); }
      R(c, '#00000040', 0, T - 3, T, 3);
    },
    fence(c, b, n) {
      shadow(c, 13);
      const any = n.n || n.e || n.s || n.w, rail = (x, y, w, h) => { R(c, '#a8723b', x, y, w, h); R(c, '#d09a5a', x, y, w, 1); R(c, '#7b4a22', x, y + h - 1, w, 1); };
      if (!any || n.w) rail(0, 11, 17, 4), rail(0, 19, 17, 4);
      if (!any || n.e) rail(15, 11, 17, 4), rail(15, 19, 17, 4);
      if (n.n) rail(14, 0, 4, 18);
      if (n.s) rail(14, 16, 4, 16);
      for (const x of (any ? [14] : [3, 24])) { R(c, '#8d5a2b', x, 6, 5, 22); R(c, '#b9854a', x, 6, 2, 22); R(c, '#c9945a', x - 0.5, 5, 6, 2); R(c, '#5e3716', x + 4, 8, 1, 20); }
    },
    door(c, b, n) {
      R(c, '#5a3a1c', 0, 0, T, 3); R(c, '#5a3a1c', 0, 0, 3, T); R(c, '#5a3a1c', T - 3, 0, 3, T);   // kusen
      if (b.o) { R(c, '#7b4a22', 3, 2, 3, 28); R(c, '#9c6633', 3, 2, 1, 28); R(c, '#0000002a', 6, 3, 4, 26); return; }
      R(c, '#7b4a22', 3, 3, 26, 27); R(c, '#8d5a2b', 5, 5, 10, 11); R(c, '#8d5a2b', 17, 5, 10, 11); R(c, '#8d5a2b', 5, 18, 10, 10); R(c, '#8d5a2b', 17, 18, 10, 10);
      R(c, '#5e3716', 15, 3, 2, 27); R(c, '#9c6633', 5, 5, 10, 1); R(c, '#9c6633', 17, 5, 10, 1);
      R(c, '#ffd54a', 20, 16, 4, 4); R(c, '#fff3b0', 20, 16, 2, 2);
    },
    table(c) {
      shadow(c, 13);
      R(c, '#6f4520', 5, 20, 4, 8); R(c, '#6f4520', 23, 20, 4, 8);
      R(c, '#8d5a2b', 2, 6, 28, 18); R(c, '#c28a4d', 2, 5, 28, 17); R(c, '#d6a263', 3, 6, 26, 2);
      R(c, '#a8723b', 2, 22, 28, 2);
      E(c, '#f4f0e6', 11, 13, 4.5, 3); E(c, '#d9d2c0', 11, 13, 2.5, 1.5);   // piring
      R(c, '#7aa6d6', 21, 9, 4, 5); R(c, '#9bbfe6', 21, 9, 4, 1.5);   // cangkir
    },
    chair(c) {
      shadow(c, 9);
      R(c, '#6f4520', 9, 20, 3, 8); R(c, '#6f4520', 20, 20, 3, 8);
      R(c, '#7b4a22', 8, 4, 16, 9); R(c, '#9c6633', 8, 4, 16, 2); R(c, '#5e3716', 10, 7, 12, 1);
      R(c, '#a0602b', 8, 13, 16, 9); R(c, '#c0392b', 9, 13, 14, 6); R(c, '#e57373', 10, 13, 12, 1.5);
    },
    bed(c, b, n, a) {
      shadow(c, 14);
      R(c, '#6f4520', 3, 3, 26, 27); R(c, '#8d5a2b', 3, 2, 26, 4);   // rangka + papan kepala
      R(c, '#a8723b', 3, 2, 26, 1);
      R(c, '#e8edf2', 6, 6, 20, 17);   // kasur
      R(c, '#ffffff', 8, 7, 16, 7); R(c, '#dfe6ee', 8, 12, 16, 2);   // bantal
      R(c, '#3f7fc4', 6, 14, 20, 12); R(c, '#5a9be0', 6, 14, 20, 3); R(c, '#2f69a8', 6, 24, 20, 2);   // selimut
      for (let x = 9; x < 26; x += 5) R(c, '#ffffff33', x, 19, 2, 2);   // motif
      R(c, '#8d5a2b', 3, 28, 26, 3); R(c, '#a8723b', 3, 28, 26, 1);   // papan kaki
    },
    chest(c, b) {
      shadow(c, 12);
      R(c, '#6f4520', 4, 12, 24, 17); R(c, '#8d5a2b', 4, 12, 24, 15);
      R(c, '#a8723b', 4, 7, 24, 8); R(c, '#c28a4d', 4, 7, 24, 2); R(c, '#6f4520', 4, 15, 24, 1);   // tutup
      R(c, '#8a8f96', 7, 7, 3, 21); R(c, '#8a8f96', 22, 7, 3, 21); R(c, '#b4bac2', 7, 7, 1, 21);   // pita besi
      R(c, '#ffd54a', 14, 13, 5, 6); R(c, '#fff3b0', 14, 13, 2, 3); R(c, '#9a7a1a', 15.5, 16, 2, 2);
    },
    stove(c, b, n, a) {
      shadow(c, 13);
      R(c, '#555a60', 21, 0, 6, 9); R(c, '#6b6f75', 21, 0, 2, 9);   // cerobong
      for (let i = 0; i < 3; i++) { const p = (a * 0.7 + i / 3) % 1; c.globalAlpha = (1 - p) * 0.5; E(c, '#d0d4da', 24 + Math.sin(p * 6 + i) * 3, -p * 14, 2.5 + p * 3, 2.5 + p * 3); c.globalAlpha = 1; }   // asap naik
      R(c, '#4f545a', 3, 8, 26, 21); R(c, '#6b6f75', 3, 8, 26, 17); R(c, '#8a8f96', 3, 8, 26, 4);
      R(c, '#22222a', 7, 14, 18, 11);
      const fl = 3 + Math.sin(a * 11) * 1; E(c, '#e65100', 16, 23, 7, fl + 2); E(c, '#ff7043', 16, 22.5, 5, fl + 1); E(c, '#ffd54a', 16, 22, 2.5, fl);   // api
      R(c, '#3a3d42', 5, 27, 22, 2);
      R(c, '#2f3237', 8, 5, 12, 4); R(c, '#454a50', 8, 5, 12, 1);   // panci
    },
    tower(c, b, n, a) {
      shadow(c, 14);
      R(c, '#62676d', 6, 11, 20, 20); R(c, '#7d838a', 6, 11, 20, 17);
      for (let r = 0; r < 3; r++) { R(c, '#62676d', 6, 16 + r * 6, 20, 1); R(c, '#62676d', r % 2 ? 12 : 18, 11 + r * 6, 1, 6); }
      R(c, '#98a0a8', 6, 11, 20, 2);
      R(c, '#1e1c26', 14, 15, 4, 8); R(c, '#2a2833', 12, 25, 8, 6);   // celah panah + pintu
      R(c, '#7b4a22', 3, 5, 26, 7); R(c, '#a8723b', 3, 5, 26, 2);   // dek kayu
      for (let x = 3; x < 29; x += 7) R(c, '#8d5a2b', x, 1, 4, 5);   // pagar atas
      R(c, '#5e3716', 15, -10, 2, 14);   // tiang bendera
      const w = Math.sin(a * 5) * 1.5; c.fillStyle = '#c0392b'; c.beginPath(); c.moveTo(17, -10); c.lineTo(26 + w, -7); c.lineTo(17, -4); c.closePath(); c.fill();
      R(c, '#ffd54a', 18, -8, 3, 2);
    },
    rug(c) {
      R(c, '#7d2a35', 2, 3, 28, 26); R(c, '#b23a48', 3, 2, 26, 27);
      R(c, '#ffd54a', 5, 4, 22, 1); R(c, '#ffd54a', 5, 26, 22, 1);
      R(c, '#e57373', 6, 7, 20, 18); R(c, '#b23a48', 9, 10, 14, 12);
      c.fillStyle = '#ffd54a'; c.beginPath(); c.moveTo(16, 12); c.lineTo(20, 16); c.lineTo(16, 20); c.lineTo(12, 16); c.closePath(); c.fill();
      for (let y = 4; y < 28; y += 3) { R(c, '#f3e3c3', 0, y, 2, 1); R(c, '#f3e3c3', 30, y, 2, 1); }   // rumbai
    },
    shelf(c) {
      shadow(c, 13);
      R(c, '#5e3a1c', 2, 0, 28, 30); R(c, '#7a4f28', 3, 1, 26, 28); R(c, '#a8723b', 2, 0, 28, 3);
      for (let r = 0; r < 3; r++) {
        const y = 4 + r * 9; R(c, '#3e2410', 4, y + 6, 24, 3);
        const cols = ['#c0392b', '#2e7d32', '#1565c0', '#f9a825', '#8e24aa', '#00897b', '#d84315'];
        let x = 5; for (let i = 0; i < 6; i++) { const w = 3 + (i * r + i) % 2, hh = 5 + (i + r) % 3; R(c, cols[(i + r * 2) % 7], x, y + 6 - hh, w, hh); R(c, '#ffffff30', x, y + 6 - hh, 1, hh); x += w + 1; }
      }
    },
    lamp(c, b, n, a, night) {
      shadow(c, 9);
      R(c, '#3a2a18', 10, 26, 12, 4); R(c, '#5a3a1c', 14, 9, 4, 18); R(c, '#7a5230', 14, 9, 1, 18);
      const fl = 1 + Math.sin(a * 9 + 1) * 0.3;
      if (night > 0.2) { c.globalAlpha = 0.28 * night; E(c, '#ffcf66', 16, 7, 12 * fl, 12 * fl); c.globalAlpha = 1; }
      R(c, '#3a2a18', 9, 2, 14, 3); R(c, '#ffd54a', 10, 4, 12, 9); R(c, '#fff3b0', 12, 6, 8, 5); R(c, '#3a2a18', 10, 12, 12, 2);
      R(c, '#fffbe6', 14, 7, 4, 3);
    },
    pot(c, b, n, a) {
      shadow(c, 9);
      const s = Math.sin(a * 2.2) * 1.2;
      for (const [dx, dy, col] of [[-5, 0, '#2e8b3a'], [5, -1, '#43a047'], [0, -4, '#66bb6a'], [-2, 1, '#388e3c']]) { c.fillStyle = col; c.beginPath(); c.ellipse(16 + dx + s * (dy < -2 ? 1 : 0.5), 11 + dy, 4, 7, dx * 0.08, 0, 7); c.fill(); }
      E(c, '#e91e63', 14 + s, 3, 2.5, 2.5); E(c, '#ffeb3b', 14 + s, 3, 1, 1);
      R(c, '#8d4a12', 8, 17, 16, 3); R(c, '#b5651d', 9, 20, 14, 9); R(c, '#d98a3d', 9, 20, 3, 9); R(c, '#6f3a0e', 9, 27, 14, 2);
    }
  };
  const has = t => !!OBJ[t];
  function build(c, b, px, py, al, n, a, night) {
    const f = OBJ[b.t]; if (!f) return false;
    c.save(); c.globalAlpha = al; c.translate(px, py); f(c, b, n || {}, a || 0, night || 0); c.restore(); return true;
  }

  // ===== PEMAIN =====
  // P = { x, y, e (equip), mv (sedang jalan), a (waktu), fx, fy, sp (progres tebasan -1..1), hurt (berkedip), face }
  function player(c, P) {
    const x = P.x, y = P.y, e = P.e || {}, a = P.a, wv = Math.sin(a * 12), sw = P.mv ? wv : 0, b = P.mv ? -Math.abs(wv) * 1.5 : Math.sin(a * 2) * 0.55;
    const fy = P.fy, fx = P.fx, dr = fy > 0 ? 0 : fy < 0 ? 1 : 2, sd = fx < 0 ? -1 : 1;
    const Rr = (col, ox, oy, w, h) => { c.fillStyle = col; c.fillRect(Math.round(x + ox), Math.round(y + oy), w, h); };
    const rc = k => e[k] ? RAR[e[k].r].c : null, skin = '#f5cba7', skinD = '#e0aa83', hair = '#4a2f1b', hairL = '#6b4529';
    c.save(); c.globalAlpha = P.hurt;
    E(c, '#0000004a', x, y + 9, 8 + (P.mv ? 0 : Math.sin(a * 2) * 0.4), 3);
    if (P.mv && Math.floor(a * 12) % 2 === 0) E(c, '#0000001a', x - sd * 6, y + 9, 3, 1.5);
    // jubah: bergoyang saat jalan
    const cape = rc('back') ? shade(rc('back'), 0.7) : null, fl = P.mv ? Math.sin(a * 9) * 1.5 : Math.sin(a * 2) * 0.5;
    if (cape && dr !== 1) { Rr(cape, dr === 2 ? (sd > 0 ? -9 - fl : 2 + fl) : -7, -8 + b, dr === 2 ? 7 : 14, 15 + Math.abs(fl)); Rr(shade(rc('back'), 0.95), dr === 2 ? (sd > 0 ? -9 - fl : 2 + fl) : -7, -8 + b, dr === 2 ? 7 : 14, 2); }
    // kaki + sepatu
    const l1 = Math.max(0, sw) * -2.5, l2 = Math.max(0, -sw) * -2.5, pc = rc('legs') ? shade(rc('legs'), 0.55) : '#3b4a7a', bc = rc('legs') ? shade(rc('legs'), 0.85) : '#5b3a24';
    if (dr === 2) { const fo = sd > 0 ? -2 : -3; Rr(pc, -2 + sw * 3, 0, 4, 6); Rr(bc, fo + sw * 3, 5 + l1, 5, 3); Rr(shade(pc.startsWith('#') ? pc : '#3b4a7a', 0.8), -2 - sw * 3, 0, 4, 6); Rr(bc, fo - sw * 3, 5 + l2, 5, 3); }
    else { Rr(pc, -5, l1, 4, 6); Rr(bc, -5, 5 + l1, 4, 3); Rr(pc, 1, l2, 4, 6); Rr(bc, 1, 5 + l2, 4, 3); Rr('#ffffff22', -5, 5 + l1, 4, 1); Rr('#ffffff22', 1, 5 + l2, 4, 1); }
    // badan
    const tc = e.body ? '#8d99ae' : '#c0392b', tl = e.body ? '#b8c2d4' : '#e0705c', td = e.body ? '#6c7690' : '#9e2c20';
    Rr(tc, -6, -9 + b, 12, 11); Rr(tl, -6, -9 + b, 12, 3); Rr(td, -6, -2 + b, 12, 2); Rr(td, dr === 2 ? (sd > 0 ? -6 : 4) : 4, -7 + b, 2, 7);
    Rr('#5a3a22', -6, -1 + b, 12, 2); Rr('#ffd54a', -1, -1 + b, 2, 2);
    if (dr === 0) { if (e.body) Rr(rc('body'), -1, -6 + b, 2, 5); else { Rr('#f0e6d0', -3, -9 + b, 6, 2); Rr('#d9ccb0', -1, -7 + b, 2, 2); } }   // kerah / hiasan zirah
    if (cape && dr === 1) { Rr(cape, -7, -8 + b, 14, 15 + Math.abs(fl)); Rr(shade(rc('back'), 0.95), -7, -8 + b, 14, 2); }
    // syal kecil berkibar
    if (!e.body) { const sc = '#f2c14e'; Rr(sc, -5, -10 + b, 10, 2); if (dr !== 1) Rr(sc, sd > 0 && dr === 2 ? -7 - fl * 0.5 : -7, -9 + b, 3, 4 + Math.abs(fl)); }
    // lengan
    const sl = e.body ? '#7d88a0' : '#a82f23', arm = (ox, oy) => { Rr(sl, ox, -8 + b + oy, 3, 6); Rr(skin, ox, -2 + b + oy, 3, 3); };
    let hx, hy;
    if (dr === 2) { const ox = -1.5 - sw * 3; arm(ox, 0); hx = x + ox + 1.5; hy = y - 0.5 + b; }
    else { arm(-9, sw * 2); arm(6, -sw * 2); hx = x + 7.5; hy = y - 0.5 + b - sw * 2; }
    // senjata: ayunan mengikuti progres tebasan
    if (e.hands) {
      const it = e.hands, gada = /^Gada/.test(it.n), len = /^Belati/.test(it.n) ? 7 : gada ? 9 : 11, col = it.el ? ECOL[it.el] : '#dfe6ee';
      c.save();
      if (P.sp >= 0) {
        const ang = Math.atan2(fy, fx), k = Math.min(1, P.sp * 1.3);
        c.translate(x + fx * 5, y - 4 + b + fy * 3); c.rotate(ang + Math.PI / 2 + (-1.5 + 3 * k));
        if (it.el) { c.globalAlpha = 0.5 * P.hurt; E(c, col, 0, -len, 4, 4); c.globalAlpha = P.hurt; }
      } else { c.translate(hx, hy); c.rotate(dr === 2 ? sd * 0.8 : dr === 0 ? 0.3 : -0.3); }
      R(c, gada ? '#8d5a2b' : col, gada ? -2 : -1, -len, gada ? 4 : 2, len);
      if (!gada) R(c, '#ffffffaa', -1, -len, 1, len - 1); else R(c, '#5e3716', -3, -len, 6, 3);
      R(c, RAR[it.r || 0].c, -3, -1, 6, 2); R(c, '#5a3a22', -1, 1, 2, 3);
      c.restore();
    }
    // kepala
    const hyy = y - 14 + b, hr = dr === 2 ? 5.8 : 6.2;
    if (dr === 2) { c.fillStyle = hair; c.beginPath(); c.arc(x - sd * 2.5, hyy + 0.5, 5.5, 0, 7); c.fill(); }
    c.fillStyle = skin; c.beginPath(); c.arc(x + (dr === 2 ? sd * 0.8 : 0), hyy, hr, 0, 7); c.fill();
    c.fillStyle = skinD; c.beginPath(); c.arc(x + (dr === 2 ? sd * 0.8 : 0), hyy + 1.2, hr - 0.8, 0.2, Math.PI - 0.2); c.fill();
    c.fillStyle = skin; c.beginPath(); c.arc(x + (dr === 2 ? sd * 0.8 : 0), hyy - 0.3, hr - 0.5, 0, 7); c.fill();
    c.fillStyle = hair; c.beginPath(); if (dr === 1) c.arc(x, hyy, 6.5, 0, 7); else c.arc(x, hyy - 1, 6.6, Math.PI, 0); c.fill();
    c.fillStyle = hairL; c.beginPath(); c.arc(x - 1.5, hyy - 3.5, 3.2, Math.PI * 1.05, Math.PI * 1.9); c.fill();
    if (dr === 0) { Rr(hair, -7, hyy - y - 1, 2, 5); Rr(hair, 5, hyy - y - 1, 2, 5); Rr(hair, -2, hyy - y - 3, 3, 3); Rr(hair, 1, hyy - y - 4, 2, 3); }   // poni dan jambul
    const blink = Math.sin(a * 0.9 + 1.3) > 0.97 ? 0.5 : 3;
    if (dr === 0) {
      Rr('#2a1d14', -3.5, hyy - y + 0.5 + (3 - blink) / 2, 2, blink); Rr('#2a1d14', 1.5, hyy - y + 0.5 + (3 - blink) / 2, 2, blink);
      if (blink > 1) { Rr('#fff', -3, hyy - y + 0.8, 1, 1); Rr('#fff', 2, hyy - y + 0.8, 1, 1); }
      c.fillStyle = '#f2a0a0aa'; c.beginPath(); c.arc(x - 4.5, hyy + 3, 1.4, 0, 7); c.arc(x + 4.5, hyy + 3, 1.4, 0, 7); c.fill();
      if (P.sp >= 0) { Rr('#8a2a2a', -1, hyy - y + 4, 2, 1.6); } else Rr('#b5655a', -1, hyy - y + 4.2, 2, 1);   // mulut: teriak saat menebas
    } else if (dr === 2) { Rr('#2a1d14', sd * 3 - 1, hyy - y + 0.5 + (3 - blink) / 2, 2, blink); if (blink > 1) Rr('#fff', sd * 3 - (sd > 0 ? 0 : -1), hyy - y + 0.8, 1, 1); }
    // helm
    if (e.head) {
      c.fillStyle = '#9aa5b8'; c.beginPath(); c.arc(x, hyy - 1.5, 7, Math.PI, 0); c.fill();
      c.fillStyle = '#c3cad8'; c.beginPath(); c.arc(x - 1.5, hyy - 3, 4, Math.PI * 1.1, Math.PI * 1.8); c.fill();
      c.fillStyle = rc('head'); c.fillRect(Math.round(x - 7), Math.round(hyy - 2), 14, 2);
      if (dr === 0) { c.fillStyle = '#7d88a0'; c.fillRect(Math.round(x - 1), Math.round(hyy - 1), 2, 4); }
    }
    c.restore();
  }
  return { floor, build, has, player, wallLike, shade };
})();
