// Misi: utama (16 bab, berurutan) dan harian (3 misi, ganti tiap pagi 06:00 game).
// state.qs = penghitung aksi kumulatif, state.q = { m: nomor misi utama, mb: nilai awal penghitung, d: id hari, dl: [misi harian], bn: bonus harian sudah diambil }
const Quest = (() => {
  // k = penghitung yang dipantau ('lv' = level pemain), n = target, r = hadiah (g koin, xp, sp poin skill, mats bahan, gear = kekuatan item)
  const MQ = [
    { t: 'Tanah Warisan', d: 'Garap 3 petak tanah di luar area rumah dengan cangkul ⛏️.', k: 'till', n: 3, r: { g: 30 } },
    { t: 'Benih Harapan', d: 'Tanam 3 benih di tanah yang sudah digarap.', k: 'plant', n: 3, r: { g: 30 } },
    { t: 'Air Kehidupan', d: 'Siram tanamanmu 4 kali 💧. Tanah mengering tiap pagi.', k: 'water', n: 4, r: { g: 30 } },
    { t: 'Panen Pertama', d: 'Tunggu tanamanmu matang, lalu panen 3 kali.', k: 'harvest', n: 3, r: { g: 60, mats: { wood: 5 } } },
    { t: 'Pedagang Muda', d: 'Jual 5 hasil panen lewat 🎒 atau toko desa.', k: 'sell', n: 5, r: { g: 80 } },
    { t: 'Kayu untuk Benteng', d: 'Tebang 6 pohon dengan kapak 🪓.', k: 'chop', n: 6, r: { g: 60, mats: { stone: 5 } } },
    { t: 'Rumahku Istanaku', d: 'Pasang 8 bangunan di area rumah lewat 🔨.', k: 'build', n: 8, r: { g: 100, xp: 30 } },
    { t: 'Tidur Nyenyak', d: 'Pasang tempat tidur 🛏️, lalu tidur di sana saat malam.', k: 'sleep', n: 1, r: { g: 80 } },
    { t: 'Malam Berbahaya', d: 'Kalahkan 6 monster yang berkeliaran.', k: 'kill', n: 6, r: { g: 120, xp: 40, gear: 0 } },
    { t: 'Makin Kuat', d: 'Capai level 5. Jangan lupa buka skill di 🌳.', k: 'lv', n: 5, r: { g: 100, sp: 1 } },
    { t: 'Kenali Tetangga', d: 'Temukan 2 desa baru (lihat 🗺️).', k: 'village', n: 2, r: { g: 150, xp: 60 } },
    { t: 'Pelajari Sihir', d: 'Buka 2 skill di pohon skill 🌳.', k: 'skill', n: 2, r: { g: 100, sp: 1 } },
    { t: 'Ke Dalam Gua', d: 'Masuk ke gua dungeon 🕳️ (lihat panah kuning).', k: 'dungeon', n: 1, r: { g: 150, xp: 80 } },
    { t: 'Harta Karun', d: 'Buka 3 peti di dalam gua.', k: 'chest', n: 3, r: { g: 250, gear: 2 } },
    { t: 'Penakluk Penjaga', d: 'Kalahkan boss penjaga ruangan terdalam gua. Wujudnya mengikuti elemen wilayah.', k: 'boss', n: 1, r: { g: 400, xp: 200, sp: 2, gear: 3 } },
    { t: 'Pemancing Pemula', d: 'Pilih 🎣 di hotbar, hadap air, Aksi, lalu Aksi lagi saat ikan menggigit. Tangkap 3 ikan.', k: 'fish', n: 3, r: { g: 120, xp: 40 } },
    { t: 'Koki Dusun', d: 'Bangun tungku 🍳 di area rumah, lalu masak 2 makanan.', k: 'cook', n: 2, r: { g: 150, xp: 60 } },
    { t: 'Peternak Pemula', d: 'Beli ayam atau sapi di tab Toko 🎒, beri makan, lalu ambil hasilnya 2 kali.', k: 'produce', n: 2, r: { g: 200, xp: 80 } },
    { t: 'Menara Jaga', d: 'Pasang menara jaga 🗼 di area rumah supaya malam lebih aman.', k: 'tower', n: 1, r: { g: 250, gear: 1 } },
    { t: 'Pahlawan Dusun', d: 'Kalahkan 3 boss gua lagi. Dusun menantikan pahlawannya!', k: 'boss', n: 3, r: { g: 1000, xp: 500, sp: 3, gear: 4 } }
  ];
  // pool misi harian: n = target (menurut level), g/x = koin dan XP per satuan
  const DP = [
    { k: 'kill', ic: '⚔️', t: 'Kalahkan {n} monster', n: lv => 4 + Math.floor(lv * 0.7), g: 6, x: 3 },
    { k: 'harvest', ic: '🌾', t: 'Panen {n} tanaman', n: () => 3, g: 14, x: 3 },
    { k: 'water', ic: '💧', t: 'Siram {n} petak tanah', n: () => 5, g: 4, x: 1 },
    { k: 'plant', ic: '🌱', t: 'Tanam {n} benih', n: () => 4, g: 6, x: 1 },
    { k: 'till', ic: '⛏️', t: 'Garap {n} petak tanah', n: () => 5, g: 4, x: 1 },
    { k: 'chop', ic: '🪓', t: 'Tebang {n} pohon', n: () => 6, g: 5, x: 1 },
    { k: 'sell', ic: '🪙', t: 'Jual {n} hasil panen', n: () => 4, g: 6, x: 1 },
    { k: 'build', ic: '🔨', t: 'Pasang {n} bangunan', n: () => 3, g: 6, x: 1 },
    { k: 'cast', ic: '🔮', t: 'Pakai skill aktif {n} kali', n: () => 4, g: 6, x: 2, need: s => s.sk.length > 0 },
    { k: 'chest', ic: '🧰', t: 'Buka {n} peti di gua', n: () => 2, g: 25, x: 8 },
    { k: 'dungeon', ic: '🕳️', t: 'Masuk gua dungeon {n} kali', n: () => 1, g: 40, x: 20 },
    { k: 'fish', ic: '🎣', t: 'Tangkap {n} ikan', n: () => 3, g: 10, x: 2 },
    { k: 'cook', ic: '🍳', t: 'Masak {n} makanan', n: () => 2, g: 12, x: 3, need: s => Object.values(s.build || {}).some(b => b.t === 'stove') },
    { k: 'produce', ic: '🥚', t: 'Ambil hasil ternak {n} kali', n: () => 2, g: 20, x: 5, need: s => !!s.an && s.an.length > 0 }
  ];
  let say = () => {};
  const note = m => setTimeout(() => say(m), 1300);   // tampil setelah toast aksi biasa
  const ens = s => { if (!s.qs) s.qs = {}; if (!s.q) s.q = { m: 0, mb: null, d: -1, dl: [], bn: 0 }; return s.q; };
  const cnt = (s, k) => k === 'lv' ? s.lv : (s.qs[k] || 0);
  function mprog(s) {
    const q = ens(s), m = MQ[q.m]; if (!m) return 0;
    if (m.k === 'lv') return Math.min(m.n, s.lv);
    if (q.mb == null) q.mb = cnt(s, m.k);   // hitung dari saat misi ini aktif
    return Math.max(0, Math.min(m.n, cnt(s, m.k) - q.mb));
  }
  const mdone = s => { const m = MQ[ens(s).m]; return !!m && mprog(s) >= m.n; };
  const dprog = (s, it) => Math.max(0, Math.min(it.n, cnt(s, it.k) - it.b));
  const dtext = it => { const p = DP.find(x => x.k === it.k); return p.ic + ' ' + p.t.replace('{n}', it.n); };

  function tick(s) {   // misi harian baru tiap pagi (06:00)
    const q = ens(s), di = Math.floor((s.t - 6) / 24);
    if (q.d === di) return;
    q.d = di; q.bn = 0;
    const pool = DP.filter(p => !p.need || p.need(s));
    q.dl = pool.map((p, i) => [World.hash(di, i, CFG.SEED + 99), p]).sort((a, b) => a[0] - b[0]).slice(0, 3).map(([, p]) => {
      const n = p.n(s.lv);
      return { k: p.k, n, b: cnt(s, p.k), c: 0, g: Math.round(p.g * n * (1 + s.lv * 0.06)), x: Math.round(p.x * n) };
    });
  }
  function add(s, k, n) {   // dipanggil dari aksi game (bunuh monster, panen, dll.)
    n = n === undefined ? 1 : n; if (!(n > 0)) return;
    const q = ens(s), m = MQ[q.m], was = mdone(s), wd = q.dl.map(i => dprog(s, i) >= i.n);
    s.qs[k] = (s.qs[k] || 0) + n;
    if (m && !was && mdone(s)) note('📜 Misi selesai: ' + m.t + '! Ambil hadiah di 📜');
    q.dl.forEach((i, j) => { if (!wd[j] && dprog(s, i) >= i.n) note('🗓️ Misi harian selesai: ' + dtext(i)); });
  }
  function xp(s, n, out) {
    s.xp += n; out.push('+' + n + '⭐');
    while (s.xp >= 20 * s.lv) { s.xp -= 20 * s.lv; s.lv++; s.sp = (s.sp || 0) + 1; s.hp = Gear.stats(s).hp; out.push('⬆️ Level ' + s.lv + '!'); }
  }
  function reward(s, r, out) {
    if (r.g) { s.gold += r.g; out.push('+' + r.g + '🪙'); }
    if (r.sp) { s.sp = (s.sp || 0) + r.sp; out.push('+' + r.sp + '🔮'); }
    if (r.mats) for (const m in r.mats) { s.inv['mat:' + m] = (s.inv['mat:' + m] || 0) + r.mats[m]; out.push(MATS[m].icon + r.mats[m]); }
    if (r.gear != null) {
      if (s.items.length < 30) { const it = Gear.roll(null, r.gear * 3 + 2 + Math.floor(s.t / 24)); s.items.push(it); out.push('🎁 ' + it.n); }
      else out.push('(tas perlengkapan penuh)');
    }
    if (r.xp) xp(s, r.xp, out);
  }
  function claim(s, w, i) {   // w: 'm' utama, 'd' harian ke-i, 'b' peti bonus harian
    const q = ens(s), out = [];
    if (w === 'm') {
      const m = MQ[q.m]; if (!m || !mdone(s)) return 'Misi belum selesai';
      reward(s, m.r, out); q.m++; q.mb = null;
      return '🎉 ' + m.t + ' selesai! ' + out.join(' ');
    }
    if (w === 'd') {
      const it = q.dl[i]; if (!it || it.c || dprog(s, it) < it.n) return 'Misi belum selesai';
      it.c = 1; reward(s, { g: it.g, xp: it.x }, out);
      return '✅ ' + out.join(' ');
    }
    if (q.bn || !q.dl.length || !q.dl.every(x => x.c)) return 'Selesaikan semua misi harian dulu';
    q.bn = 1; reward(s, { g: 40 + s.lv * 10, mats: { wood: 3, stone: 3 }, gear: 0 }, out);
    return '🎁 Peti harian: ' + out.join(' ');
  }
  function ready(s) {
    const q = ens(s);
    return mdone(s) || q.dl.some(i => !i.c && dprog(s, i) >= i.n) || (q.dl.length > 0 && !q.bn && q.dl.every(i => i.c));
  }
  function track(s) {   // satu baris pelacak di layar
    const q = ens(s), m = MQ[q.m];
    if (m) return mdone(s) ? '📜 Ambil hadiah: ' + m.t : '📜 ' + m.t + ' ' + mprog(s) + '/' + m.n;
    const it = q.dl.find(i => !i.c); return it ? '🗓️ ' + dtext(it) + ' ' + dprog(s, it) + '/' + it.n : '';
  }
  function hint(s) {
    const m = MQ[ens(s).m];
    return m ? 'Misi utama: ' + m.t + '. ' + m.d + ' (' + mprog(s) + '/' + m.n + ')' : 'Semua misi utama sudah kamu selesaikan. Kamu pahlawan dusun!';
  }

  const rt = r => [r.g && '🪙' + r.g, r.xp && '⭐' + r.xp, r.sp && '🔮' + r.sp, r.mats && Object.keys(r.mats).map(m => MATS[m].icon + r.mats[m]).join(''), r.gear != null && '🎁'].filter(Boolean).join(' ');
  const bar = (p, n) => `<div class="qbar"><i style="width:${Math.round(100 * p / n)}%"></i></div>`;
  function html(s, tab) {
    const q = ens(s);
    const tabs = `<div class="tabs"><button data-qt="m" class="${tab === 'm' ? 'on' : ''}">📜 Utama</button><button data-qt="d" class="${tab === 'd' ? 'on' : ''}">🗓️ Harian</button></div>`;
    if (tab === 'd') {
      const rows = q.dl.map((it, i) => {
        const p = dprog(s, it), ok = p >= it.n;
        return `<div class="qc"><div><b>${dtext(it)}</b></div>${bar(p, it.n)}<div class="rw"><span>${p}/${it.n} · ${rt({ g: it.g, xp: it.x })}</span>${it.c ? '✓' : `<button data-qd="${i}" ${ok ? '' : 'disabled'}>Ambil</button>`}</div></div>`;
      }).join('');
      const all = q.dl.length > 0 && q.dl.every(i => i.c);
      return tabs + '<div class="rw" style="font-size:12px;opacity:.8">Misi harian ganti tiap pagi (06:00 game). Selesaikan ketiganya untuk peti bonus.</div>' + rows
        + `<div class="qc"><div class="rw"><span>🎁 <b>Peti Harian</b> · 🪙 bahan dan equipment</span>${q.bn ? '✓' : `<button data-qb="1" ${all ? '' : 'disabled'}>Ambil</button>`}</div></div><button data-x>Tutup</button>`;
    }
    const m = MQ[q.m], p = mprog(s);
    const card = m
      ? `<div class="qc"><div>📜 <b>${m.t}</b> <small>(${q.m + 1}/${MQ.length})</small></div><div style="font-size:13px;margin:4px 0">${m.d}</div>${bar(p, m.n)}<div class="rw"><span>${p}/${m.n} · ${rt(m.r)}</span><button data-qc="1" ${p >= m.n ? '' : 'disabled'}>Ambil</button></div></div>`
      : '<div class="qc">🏆 Semua misi utama selesai! Kamu pahlawan Dusun Senja.</div>';
    const list = MQ.map((x, i) => `<div class="rw" style="opacity:${i < q.m ? 0.55 : i === q.m ? 1 : 0.4};font-size:13px"><span>${i < q.m ? '✓' : i === q.m ? '▶' : '🔒'} ${x.t}</span></div>`).join('');
    return tabs + '<div class="rw" style="font-size:12px;opacity:.85">🧓 “Dusun ini butuh pahlawan, nak. Mulailah dari ladang, lalu taklukkan gua-gua di sekitar.”</div>' + card + '<h3>Perjalanan</h3>' + list + '<button data-x>Tutup</button>';
  }
  return { init: f => { say = f; }, add, tick, claim, ready, hint, track, html };
})();
