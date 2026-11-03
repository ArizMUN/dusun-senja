// Loop utama: update, kamera, siang/malam, farming, render, save/load.
(() => {
  const { TILE: T, W, H, TILES } = CFG;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d'), clockEl = document.getElementById('clock');
  let state, map, tgt = null, moving = false, face = 1, fx = 0, fy = 1, cam = { x: 0, y: 0 };
  let nightV = 0, sleepT = 0, dead = false, omap, dgd, sc = 1, vw = 0, vh = 0, last = 0, saveAcc = 0, anim = 0, clockTxt = '', lastDi = 0;
  const grass = Array.from({ length: 6 }, (_, i) => `hsl(105,38%,${40 + i * 1.5}%)`);
  const GP = []; for (let hi = 0; hi < 6; hi++) for (let li = 0; li < 6; li++) GP.push(`hsl(${80 + hi * 10},${34 + hi}%,${37 + li * 1.8}%)`);   // kering (kuning) sampai subur (hijau kebiruan)
  const torches = []; let look = null, lookSeed = -1;
  function buildLook() {   // nada rumput per tile: gradasi halus antarwilayah + bercak kecil
    look = new Uint8Array(W * H); lookSeed = state.seed;
    for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
      const a = Math.max(0, Math.min(1, (World.vnoise(tx / 26, ty / 26, state.seed + 5) - 0.5) * 1.7 + 0.5));
      const b = Math.max(0, Math.min(0.99, (World.vnoise(tx / 5, ty / 5, state.seed + 6) - 0.5) * 1.5 + 0.5));
      look[ty * W + tx] = Math.min(5, Math.floor(a * 6)) * 6 + Math.floor(b * 6);
    }
  }
  const fresh = () => ({ v: 2, seed: CFG.SEED, t: CFG.START_HOUR, x: (W / 2) * T, y: (H / 2) * T, gold: 50, inv: { 'seed:wheat': 5, 'seed:carrot': 3, 'mat:wood': 12 }, farm: {}, sel: 'hoe', build: {}, floor: {}, carry: null, chopped: [], bsel: 'wall_wood', bm: false, hp: null, lv: 1, xp: 0, sp: 0, items: [], equip: { hands: { id: 'start', slot: 'hands', r: 0, n: 'Pedang Kayu', atk: 2 } }, dg: null, dgLv: 1, skills: {}, sk: [], an: [], buff: null, qs: {}, q: { m: 0, mb: null, d: -1, dl: [], bn: 0 }, mp: null, dgc: {}, shops: {}, w7: 1, vis: {} });

  function load() {
    try { const s = JSON.parse(localStorage.getItem(CFG.SAVE_KEY)); if (s && s.seed) { const r = Object.assign(fresh(), s); r.v = 2; r.bm = false; Build.migrate(r);
        if (!s.w7) {   // migrasi dunia 64x64 ke 128x128
          r.w7 = 1; r.chopped = r.chopped.map(i => ((i / 64) | 0) * W + (i % 64));
          if (r.dg) { r.x = r.dg.rx; r.y = r.dg.ry; r.dg = null; }
          if (s.dgLv > 1 && !s.dgc) r.dgc = { h: s.dgLv - 1 };
        }
        return r; } } catch (e) {}
    return null;
  }
  function save() { if (window.noSave) return; try { localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(state)); } catch (e) {} }
  function init(s) {
    state = s || fresh();
    map = World.generate(state.seed);
    state.chopped.forEach(i => { map[i] = 0; });
    omap = map; dgd = null; Battle.reset();
    if (state.dg) { dgd = Dungeon.gen(state.dg.seed, state.dg.lv, state.dg.boss, state.dg.el); map = dgd.map; Battle.set(dgd.mons); }   // monster dungeon muncul lagi saat dimuat
    tgt = null; cam.x = state.x - vw / 2; cam.y = state.y - vh / 2;
    lastDi = Math.floor((state.t - 6) / 24);
  }
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    sc = Math.max(1, Math.min(innerWidth, innerHeight) / (CFG.VIEW_TILES * T));
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.setTransform(sc * dpr, 0, 0, sc * dpr, 0, 0);
    vw = innerWidth / sc; vh = innerHeight / sc;
  }
  // batu dekor di rumput = tile tabrakan (hilang kalau tanahnya digarap atau dibangun)
  const rockAt = (tx, ty) => { if (state.dg || map[ty * W + tx] !== 0) return false; const k = tx + ',' + ty; if (state.farm[k] || state.build[k] || state.floor[k]) return false; const h = CFG.HOME; if (tx >= h.x - 2 && tx < h.x + h.w + 2 && ty >= h.y - 2 && ty < h.y + h.h + 2) return false; const h2 = World.hash(tx, ty, 31); return h2 >= 0.07 && h2 < 0.095; };
  const solid = (tx, ty) => tx < 0 || ty < 0 || tx >= W || ty >= H || TILES[map[ty * W + tx]].solid || (!state.dg && (Build.solid(state, tx, ty) || rockAt(tx, ty)));
  function hit(x, y) {
    const r = 8;
    return [[-r, -r], [r, -r], [-r, r], [r, r]].some(([ox, oy]) => solid(Math.floor((x + ox) / T), Math.floor((y + oy) / T)));
  }
  function darkness(h) {
    if (h >= 6 && h < 18) return 0;
    if (h >= 18 && h < 20) return (h - 18) / 2;
    if (h >= 20 || h < 4) return 1;
    return (6 - h) / 2;
  }
  const front = () => ({ x: Math.floor(state.x / T) + fx, y: Math.floor(state.y / T) + fy });

  function update(dt) {
    const st = Gear.stats(state);
    if (state.hp == null || state.hp > st.hp) state.hp = st.hp;
    if (state.mp == null || state.mp > st.mp) state.mp = st.mp;
    if (dead || Layout.on()) { UI.refresh(); return; }
    if (state.buff && state.buff.t > 0 && (state.buff.t -= dt) <= 0) { state.buff = null; UI.toast('Efek makanan habis'); }
    Fish.update(dt, state); Weather.update(state, dt);
    if (!state.dg) Animal.update(state, dt);
    Input.update();
    let x = Input.x, y = Input.y;
    if (Input.num) { UI.pick(Input.num); Input.num = 0; }
    if (Input.bag) { UI.toggle(); Input.bag = 0; }
    if (Input.tree) { UI.toggle('tree'); Input.tree = 0; }
    if (Input.quest) { UI.toggle('quest'); Input.quest = 0; }
    if (Input.map) { UI.toggle('map'); Input.map = 0; }
    if (Input.atk) { Input.atk = 0; if (!UI.isOpen() && !state.bm) { const r = Battle.attack(state, st, fx, fy); if (r) { fx = r.fx; fy = r.fy; } } }
    if (Input.castIdx) { const id = state.sk[Input.castIdx - 1]; Input.castIdx = 0; if (id && !UI.isOpen() && !state.bm) Battle.cast(state, st, id, fx, fy); }
    if (Input.bm) { Input.bm = 0; Build.toggle(state); UI.toast(state.dg ? 'Tidak bisa membangun di gua' : state.bm ? 'Mode bangun 🔨' : 'Mode bangun selesai'); }
    if (x || y) tgt = null;
    if (Input.click) { tgt = { x: cam.x + Input.click.x / sc, y: cam.y + Input.click.y / sc }; Input.click = null; }
    if (!x && !y && tgt) {
      const dx = tgt.x - state.x, dy = tgt.y - state.y, d = Math.hypot(dx, dy);
      if (d < 4) tgt = null; else { x = dx / d; y = dy / d; }
    }
    const ox = state.x, oy = state.y, step = CFG.SPEED * (1 + st.f.speedPct) * dt;
    if (!hit(state.x + x * step, state.y)) state.x += x * step;
    if (!hit(state.x, state.y + y * step)) state.y += y * step;
    moving = Math.hypot(state.x - ox, state.y - oy) > 0.01;
    if (moving && Math.random() < dt * 9) Fx.dust(state.x, state.y + 9);
    if (tgt && !moving) tgt = null;
    if (x || y) {
      if (Math.abs(x) > Math.abs(y)) { fx = x > 0 ? 1 : -1; fy = 0; } else { fx = 0; fy = y > 0 ? 1 : -1; }
      if (x) face = x > 0 ? 1 : -1;
    }
    if (Input.act) {
      Input.act = 0;
      if (!UI.isOpen()) { const f = front(), an = state.dg ? null : Animal.near(state, state.x + fx * 20, state.y + fy * 20), tid = f.x >= 0 && f.y >= 0 && f.x < W && f.y < H ? map[f.y * W + f.x] : 0, has = state.build[f.x + ',' + f.y];
        const m = tid === 4 && !state.dg ? (enterDg(f), '') : tid === 10 && !state.dg ? (UI.shop(villageAt(f)), '') : tid === 11 && !state.dg ? npcTalk(f) : state.dg ? dgAct(f, tid) : state.bm ? Build.act(state, map, f.x, f.y) : an ? Animal.act(state, an) : has ? useB(has, f) : state.sel === 'axe' ? Build.chop(state, map, f.x, f.y) : state.sel === 'rod' ? Fish.act(state, f.x, f.y, tid) : Farm.act(state, map, f.x, f.y, state.sel);
        if (m) UI.toast(m);
        const sn = m && (m[0] === '+' || m[0] === 'P') ? 'coin' : m || state.dg || tid >= 4 ? '' : state.bm ? 'build' : state.sel === 'can' ? 'water' : 'plant';
        if (sn) Sfx.play(sn);
        save(); }
    }

    const dh = dt * 24 / CFG.DAY_SEC;
    if (!state.dg) { state.t += dh; Farm.grow(state, dh); Animal.grow(state, dh); }   // waktu berhenti di dalam dungeon
    Quest.tick(state);
    const di = Math.floor((state.t - 6) / 24);
    if (di !== lastDi) { lastDi = di; Farm.dawn(state); UI.toast('Pagi baru! Tanah mengering, siram lagi ya 💧'); }

    const cx = state.x - vw / 2, cy = state.y - vh / 2, k = Math.min(1, dt * 8);
    cam.x += (cx - cam.x) * k; cam.y += (cy - cam.y) * k;
    if (Math.abs(cx - cam.x) > 500 || Math.abs(cy - cam.y) > 500) { cam.x = cx; cam.y = cy; tgt = null; }   // setelah fast travel
    cam.x = Math.max(0, Math.min(W * T - vw, cam.x));
    cam.y = Math.max(0, Math.min(H * T - vh, cam.y));

    saveAcc += dt; if (saveAcc > 5) { saveAcc = 0; save(); }
    const hr = state.t % 24, d = darkness(hr);
    const wx = state.dg ? { k: 'clear', a: 0 } : Weather.now(state.t);
    Battle.update(state, dt, st, wx.k === 'storm' && wx.a > 0.5 ? Math.max(d, 0.6) : d);   // badai memanggil monster walau siang
    if (state.hp <= 0) die();
    if (!state.dg) for (const v of World.vil()) if (!state.vis[v.id] && Math.hypot(v.x * T - state.x, v.y * T - state.y) < 9 * T) { state.vis[v.id] = 1; Quest.add(state, 'village', 1); UI.toast('Desa baru: ' + v.name + '! 🏘️ Bisa fast travel dari 🗺️', 3500); }
    const txt = `Hari ${Math.floor(state.t / 24) + 1} · ${String(Math.floor(hr)).padStart(2, '0')}:${String(Math.floor((hr % 1) * 60)).padStart(2, '0')} ${d > 0.5 ? '🌙' : d > 0 ? '🌅' : '☀️'}${wx.a > 0.3 ? (wx.k === 'storm' ? '⛈️' : '🌧️') : ''}`;
    if (txt !== clockTxt) { clockTxt = txt; clockEl.textContent = txt; }
    UI.refresh();
  }

  function useB(b, f) {   // interaksi bangunan: kasur, tungku, peti, pintu
    if (b.t === 'bed') return sleep();
    if (b.t === 'stove') { UI.cook(); return ''; }
    if (b.t === 'chest') { UI.chest(f.x + ',' + f.y); return ''; }
    return Build.use(state, f.x, f.y);
  }
  function sleep() {   // tidur di kasur: hanya malam hari, lompat ke pagi, HP dan mana pulih
    const hr = state.t % 24;
    if (darkness(hr) <= 0.5) return 'Belum ngantuk, tunggu malam dulu 🌙';
    const base = Math.floor(state.t / 24) * 24, target = hr >= 12 ? base + 30 : base + 6;
    Farm.grow(state, target - state.t); Animal.grow(state, target - state.t); state.t = target;
    const w = Gear.stats(state); state.hp = w.hp; state.mp = w.mp; state.shield = 0; Battle.reset(); tgt = null;
    sleepT = 1.4; Sfx.play('heal'); Quest.add(state, 'sleep', 1);
    return 'Zzz… selamat pagi! HP dan mana pulih ☀️';
  }
  function enterDg(f) {   // masuk gua: tingkat = tingkat dasar desa + berapa kali bosnya sudah dikalahkan
    const g = World.guas().find(g => g.x === f.x && g.y === f.y) || World.guas()[0], lv = g.base + (state.dgc[g.key] || 0);
    state.dg = { seed: CFG.SEED + lv * 131 + g.idx * 977, lv, key: g.key, el: g.el, opened: {}, boss: 0, rx: state.x, ry: state.y };
    dgd = Dungeon.gen(state.dg.seed, lv, 0, g.el); map = dgd.map; Battle.set(dgd.mons);
    state.x = dgd.start.x; state.y = dgd.start.y; tgt = null; state.bm = false;
    UI.toast(g.name + ' · Tingkat ' + lv + (g.el ? ' ' + ELEMENTS[g.el].icon : '') + ' 🕳️'); Quest.add(state, 'dungeon', 1); save();
  }
  const villageAt = f => World.vil().find(v => Math.abs(v.x - f.x) <= 6 && Math.abs(v.y - f.y) <= 5);
  function npcTalk(f) { const v = villageAt(f); if (v) UI.toast(Village.talk(state, v), 4500); return ''; }
  function drawVil(id, tx, ty, px, py) {   // rumah, toko, dan NPC desa (variasi warna dari posisi)
    ctx.fillStyle = grass[2]; ctx.fillRect(px, py, T, T);
    const h = World.hash(tx, ty, 21), r = (c, x, y, w, hh) => { ctx.fillStyle = c; ctx.fillRect(px + x, py + y, w, hh); };
    const tri = (c, x1, y1, x2, y2, x3, y3) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(px + x1, py + y1); ctx.lineTo(px + x2, py + y2); ctx.lineTo(px + x3, py + y3); ctx.closePath(); ctx.fill(); };
    if (id === 9) {   // rumah
      const roof = ['#b0453a', '#3f6fb5', '#6a8f3a', '#8a5a9e'][Math.floor(h * 4) % 4], wall = ['#c9a26b', '#d8c9a3', '#c4b08a'][Math.floor(h * 7) % 3];
      r('#0003', 3, 29, 28, 3); r(wall, 3, 13, 26, 17); r(shade(wall, 0.85), 3, 26, 26, 4);
      r('#7a5a48', 21, 3, 5, 9); r('#5e4436', 20, 2, 7, 2);   // cerobong
      for (let i = 0; i < 3; i++) { const q = (anim * 0.45 + h * 3 + i / 3) % 1; ctx.globalAlpha = (1 - q) * 0.5; ctx.fillStyle = '#e6e6ea'; ctx.beginPath(); ctx.arc(px + 23.5 + Math.sin(q * 5 + i) * 3, py + 1 - q * 15, 2 + q * 3.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }   // asap
      tri(roof, -1, 15, 16, 1, 33, 15); tri(shade(roof, 0.8), -1, 15, 16, 8, 33, 15);
      r(nightV > 0.4 ? '#ffe08a' : '#8fd3ff', 6, 18, 7, 7); if (nightV > 0.4) { ctx.fillStyle = 'rgba(255,210,120,' + 0.25 * nightV + ')'; ctx.beginPath(); ctx.arc(px + 9.5, py + 21.5, 12, 0, 7); ctx.fill(); } r('#fff8', 9, 18, 1, 7); r('#fff8', 6, 21, 7, 1); r('#6b4423', 5, 25, 9, 2); r('#2e8b3a', 5, 24, 9, 1.5); r(['#ff6f91', '#ffd54a', '#fff', '#b388ff'][Math.floor(h * 9) % 4], 6, 23, 2, 2); r('#ff6f91', 10, 23, 2, 2); r('#fff', 13, 23.5, 1.5, 1.5);   // jendela + kotak bunga
      r('#6b4423', 19, 19, 7, 11); r('#ffd54a', 24, 25, 1.5, 1.5);   // pintu
    } else if (id === 10) {   // toko
      r('#0003', 2, 29, 28, 3); r('#d9b77a', 2, 10, 28, 20);
      for (let i = 0; i < 4; i++) { const c = i % 2 ? '#fff' : '#e53935'; r(c, 1 + i * 7.5, 5, 7.5, 7); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px + 4.7 + i * 7.5, py + 12, 3.7, 0, Math.PI); ctx.fill(); }   // tenda bergaris
      r('#6b4423', 8, 0, 16, 5); ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.arc(px + 16, py + 2.5, 1.9, 0, 7); ctx.fill();   // papan koin
      r('#8fd3ff', 4, 17, 10, 8); r('#c28a4d', 4, 25, 10, 2); r('#e57373', 6, 22, 2.5, 3); r('#ffd54a', 9.5, 22, 2.5, 3);   // etalase
      r('#6b4423', 18, 17, 8, 13); r('#ffd54a', 23, 24, 1.5, 1.5);
    } else {   // NPC: jubah, topi, dan tongkat dengan permata elemen desa
      const b = Math.sin(anim * 2 + h * 6) * 0.8, v = World.vil().find(q => Math.abs(q.x - tx) <= 6 && Math.abs(q.y - ty) <= 5), vr = Math.floor(h * 3) % 3;
      const robe = ['#3f7fbf', '#7b4fa8', '#2e8b57'][vr], gem = v ? ECOL[v.el] : '#ffd54a';
      ctx.fillStyle = '#0004'; ctx.beginPath(); ctx.ellipse(px + 16, py + 28, 9, 3, 0, 0, 7); ctx.fill();
      r('#6b4423', 23, 8 + b, 2, 20); ctx.fillStyle = gem; ctx.beginPath(); ctx.arc(px + 24, py + 7 + b, 3, 0, 7); ctx.fill(); ctx.fillStyle = '#fff9'; ctx.fillRect(px + 23, py + 5.5 + b, 1.2, 1.2);   // tongkat
      tri(robe, 6, 28, 11, 15 + b, 21, 15 + b); tri(robe, 26, 28, 21, 15 + b, 11, 15 + b); r(robe, 7, 22, 18, 6); r(shade(robe, 1.3), 11, 14 + b, 10, 3); r('#d4a24a', 11, 20 + b, 10, 2);
      if (Math.hypot(state.x - px - 16, state.y - py - 16) < 72) { const wv = Math.sin(anim * 10) * 2.5; r(shade(robe, 0.8), 3, 11 + b + wv * 0.4, 4, 8); r('#f5cba7', 2 + wv * 0.3, 8 + b + wv * 0.4, 4, 3); }   // melambai saat kamu dekat
      else { r(shade(robe, 0.8), 6, 17 + b, 4, 8); r('#f5cba7', 6, 24 + b, 4, 3); }   // lengan
      ctx.fillStyle = '#f5cba7'; ctx.beginPath(); ctx.arc(px + 16, py + 10 + b, 6, 0, 7); ctx.fill();
      ctx.fillStyle = '#222'; const bl = Math.sin(anim * 0.8 + h * 9) > 0.96 ? 0.6 : 2.4, ex = Math.max(-1.2, Math.min(1.2, (state.x - px - 16) / 40)); ctx.fillRect(px + 13 + ex, py + 9.5 + b, 1.8, bl); ctx.fillRect(px + 17.5 + ex, py + 9.5 + b, 1.8, bl);
      if (vr === 0) { tri(shade(robe, 0.7), 8, 7 + b, 16, -4 + b, 24, 7 + b); r('#ffd54a', 9, 5.5 + b, 14, 2); }   // topi penyihir
      else if (vr === 1) { ctx.fillStyle = '#e8e8e8'; ctx.beginPath(); ctx.arc(px + 16, py + 6.5 + b, 6.6, Math.PI, 0); ctx.fill(); tri('#e8e8e8', 11, 13 + b, 21, 13 + b, 16, 23 + b); }   // rambut dan jenggot putih
      else { ctx.fillStyle = '#d9b45a'; ctx.beginPath(); ctx.ellipse(px + 16, py + 6 + b, 10, 2.8, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(px + 16, py + 5.5 + b, 5.5, Math.PI, 0); ctx.fill(); }   // topi jerami
      if (!Quest.ready(state) && Math.hypot(state.x - px - 16, state.y - py - 16) < 56) {   // gelembung obrolan
        ctx.fillStyle = '#fffe'; ctx.beginPath(); ctx.ellipse(px + 16, py - 7, 11, 6, 0, 0, 7); ctx.fill(); tri('#fffe', 13, -2, 19, -2, 16, 3);
        ctx.fillStyle = '#555'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(px + 11 + i * 5, py - 7 - Math.max(0, Math.sin(anim * 6 - i * 0.9)) * 2, 1.4, 0, 7); ctx.fill(); }
      }
      if (Quest.ready(state)) { ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd54a'; ctx.strokeStyle = '#000b'; ctx.lineWidth = 3; ctx.strokeText('!', px + 16, py - 4 + Math.sin(anim * 5) * 2); ctx.fillText('!', px + 16, py - 4 + Math.sin(anim * 5) * 2); }
    }
  }
  function drawLabels() {   // nama desa
    ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000b'; ctx.fillStyle = '#fff';
    for (const v of World.vil()) {
      const x = v.x * T + 16, y = (v.y - 5) * T;
      if (x < cam.x - 120 || x > cam.x + vw + 120 || y < cam.y - 40 || y > cam.y + vh + 40) continue;
      const t = v.name + ' ' + ELEMENTS[v.el].icon + ' T' + v.lv; ctx.strokeText(t, x, y); ctx.fillText(t, x, y);
    }
  }
  function exitDg() {
    state.x = state.dg.rx; state.y = state.dg.ry; state.dg = null; map = omap; dgd = null; tgt = null;
    Battle.reset(); UI.toast('Kembali ke dusun ☀️'); save();
  }
  function dgAct(f, tid) {
    if (tid === 7) { exitDg(); return ''; }
    if (tid === 8) { const i = f.y * W + f.x; if (state.dg.opened[i]) return 'Peti sudah kosong'; state.dg.opened[i] = 1; Quest.add(state, 'chest', 1); return Dungeon.loot(state, state.dg.lv); }
    return '';
  }
  function drawSp(id, tx, ty, px, py) {   // tile khusus: gua (4), lantai/dinding/portal/peti dungeon (5-8)
    if (id === 4) {
      ctx.fillStyle = grass[2]; ctx.fillRect(px, py, T, T); ctx.fillStyle = '#6b7078'; ctx.fillRect(px + 1, py + 3, 30, 28);
      ctx.fillStyle = '#15131a'; ctx.fillRect(px + 9, py + 14, 14, 17); ctx.beginPath(); ctx.arc(px + 16, py + 14, 7, Math.PI, 0); ctx.fill(); return;
    }
    if (id >= 9) { drawVil(id, tx, ty, px, py); return; }
    ctx.fillStyle = id === 6 ? '#1b1a22' : (tx + ty) % 2 ? '#3a3640' : '#35313b'; ctx.fillRect(px, py, T, T);
    const dh = World.hash(tx, ty, 17), tint = state.dg && state.dg.el ? ECOL[state.dg.el] : null;
    if (id !== 6 && tint) { ctx.fillStyle = tint + '1c'; ctx.fillRect(px, py, T, T); }
    if (id === 5 && dh > 0.82) { ctx.fillStyle = '#ffffff10'; ctx.fillRect(px + ((dh * 7) % 1) * 20, py + 6 + ((dh * 13) % 1) * 18, 9, 1.5); }
    if (id === 6) {
      ctx.fillStyle = '#2a2833'; ctx.fillRect(px, py, T, 5); ctx.fillStyle = '#23212b'; ctx.fillRect(px + ((dh * 20) | 0), py + 10, 8, 2);
      if (map[(ty + 1) * W + tx] === 5 && dh < 0.14) {   // obor dinding
        ctx.fillStyle = '#5a4630'; ctx.fillRect(px + 14, py + 14, 4, 10);
        const fl = 4 + Math.sin(anim * 9 + tx * 3) * 1.2;
        ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.arc(px + 16, py + 12, fl, 0, 7); ctx.fill(); ctx.fillStyle = '#ffe082'; ctx.beginPath(); ctx.arc(px + 16, py + 13, fl * 0.5, 0, 7); ctx.fill();
        torches.push(px + 16, py + 26);
      }
    }
    else if (id === 7) { const r = 9 + Math.sin(anim * 3) * 2; ctx.fillStyle = '#7e57c2'; ctx.beginPath(); ctx.arc(px + 16, py + 16, r + 3, 0, 7); ctx.fill(); ctx.fillStyle = '#d1c4e9'; ctx.beginPath(); ctx.arc(px + 16, py + 16, r - 3, 0, 7); ctx.fill(); }
    else if (id === 8) {
      const o = state.dg && state.dg.opened[ty * W + tx];
      ctx.fillStyle = o ? '#5d3d1a' : '#8d5a2b'; ctx.fillRect(px + 6, py + 10, 20, 16); ctx.fillStyle = o ? '#3e2a12' : '#a8723b'; ctx.fillRect(px + 6, py + 10, 20, 6);
      if (!o) { ctx.fillStyle = '#ffd54a'; ctx.fillRect(px + 14, py + 15, 4, 4); }
    }
  }
  function drawClouds(cx, cy) {   // bayangan awan yang melayang pelan di siang hari
    const d = state.dg ? 1 : darkness(state.t % 24); if (d > 0.4) return;
    ctx.fillStyle = 'rgba(8,28,48,' + 0.075 * (1 - d * 2.2) + ')';
    for (let i = 0; i < 22; i++) {
      const x = ((i * 811 + anim * 9) % (W * T + 600)) - 300 - cx, y = (i * 373) % (H * T) - cy, rx = 140 + (i % 3) * 35;
      if (x < -250 || x > vw + 250 || y < -140 || y > vh + 140) continue;
      ctx.beginPath(); ctx.ellipse(x, y, rx, 58, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + rx * 0.45, y - 14, rx * 0.6, 44, 0, 0, 7); ctx.fill();
    }
  }
  function drawAmbient(cx, cy, d) {   // vinyet halus + kunang-kunang di malam hari
    const g = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.45, vw / 2, vh / 2, Math.hypot(vw, vh) * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
    if (state.dg || d < 0.5) return;
    for (let i = 0; i < 12; i++) {
      const x = state.x - cx + Math.sin(i * 2.1 + anim * 0.6) * 210, y = state.y - cy + Math.cos(i * 1.3 + anim * 0.5) * 150, a = 0.4 + 0.6 * Math.abs(Math.sin(anim * 1.7 + i));
      ctx.fillStyle = 'rgba(255,240,120,' + 0.18 * a + ')'; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,250,170,' + a + ')'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 7); ctx.fill();
    }
  }
  function drawArrow(cx, cy) {   // panah penunjuk arah gua saat di luar layar
    const e = World.ent(); if (state.dg || !e) return;
    const ex = e.x * T + 16 - cx, ey = e.y * T + 16 - cy;
    if (ex >= 0 && ey >= 0 && ex <= vw && ey <= vh) return;
    const a = Math.atan2(ey - vh / 2, ex - vw / 2), r = Math.min(vw, vh) / 2 - 24;
    ctx.save(); ctx.translate(vw / 2 + Math.cos(a) * r, vh / 2 + Math.sin(a) * r); ctx.rotate(a);
    ctx.fillStyle = '#ffd54acc'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-8, -8); ctx.lineTo(-8, 8); ctx.fill(); ctx.restore();
  }
  const wl = (x, y) => { const q = state.build[x + ',' + y]; return !!q && !!Sprites.wallLike[q.t]; };
  function drawFloor(fl, tx, ty, px, py, al) {   // lapisan lantai; tepi muncul di sisi yang tidak bersambung
    const f = (x, y) => !!state.floor[x + ',' + y];
    const nb = (f(tx, ty - 1) ? 1 : 0) | (f(tx + 1, ty) ? 2 : 0) | (f(tx, ty + 1) ? 4 : 0) | (f(tx - 1, ty) ? 8 : 0);
    ctx.globalAlpha = al;
    if (!Sprites.floor(ctx, fl.t, px, py, tx, ty, al < 1 ? 15 : nb)) for (const [c, x, y, w, h] of BUILDS[fl.t].d) { ctx.fillStyle = c; ctx.fillRect(px + x, py + y, w, h); }
    ctx.globalAlpha = 1;
  }
  function drawB(b, px, py, al, tx, ty) {   // lapisan objek: sprite detail dari sprites.js (cadangan: kotak warna dari BUILDS)
    const d = BUILDS[b.t];
    if (d.fl) { drawFloor(b, tx || 0, ty || 0, px, py, al); return; }
    const nb = Sprites.wallLike[b.t] ? { n: wl(tx, ty - 1), e: wl(tx + 1, ty), s: wl(tx, ty + 1), w: wl(tx - 1, ty) } : {};
    if (Sprites.build(ctx, b, px, py, al, nb, anim, nightV)) return;
    const ops = b.o && d.d2 ? d.d2 : d.d;
    ctx.globalAlpha = al;
    for (const [c, x, y, w, h] of ops) { ctx.fillStyle = c; ctx.fillRect(px + x, py + y, w, h); }
    ctx.globalAlpha = 1;
  }
  function drawFarm(f, px, py) {
    ctx.fillStyle = f.w ? '#4a3220' : '#7a5632'; ctx.fillRect(px + 1, py + 1, T - 2, T - 2);
    if (!f.c) return;
    const c = CROPS[f.c], r = f.g / c.hours, cx = px + 16;
    ctx.fillStyle = '#4caf50';
    if (r >= 1) {
      ctx.fillRect(cx - 1, py + 8, 2, 10);
      ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(cx, py + 20, 8, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffffff77'; ctx.fillRect(cx - 4, py + 16, 3, 3);
    } else {
      const h = r < 0.33 ? 5 : r < 0.66 ? 10 : 15;
      ctx.fillRect(cx - 1, py + 26 - h, 2, h);
      ctx.fillRect(cx - 6, py + 26 - h, 5, 3); ctx.fillRect(cx + 1, py + 23 - h, 5, 3);
    }
  }
  function drawTree(tx, ty) {
    const px = tx * T, py = ty * T, h = World.hash(tx, ty, 21), dry = look[ty * W + tx] < 12;
    const sw = Math.sin(anim * 1.4 + tx * 0.8 + ty * 0.3) * 1.2, k = 0.9 + h * 0.25;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(px + 16, py + 29, 13 * k, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#5a3a1c'; ctx.fillRect(px + 13, py + 16, 6, 14); ctx.fillStyle = '#7a5230'; ctx.fillRect(px + 13, py + 16, 2, 14);
    if (h < 0.4) {   // pinus
      const c1 = dry ? '#3a6b3a' : '#1f6b45', c2 = dry ? '#4d8a47' : '#2f8c5a';
      for (let i = 0; i < 3; i++) {
        const w = (15 - i * 3.5) * k, y = py + 20 - i * 8;
        ctx.fillStyle = i % 2 ? c2 : c1; ctx.beginPath(); ctx.moveTo(px + 16 + sw * (i + 1) * 0.3, y - 10); ctx.lineTo(px + 16 - w, y + 2); ctx.lineTo(px + 16 + w, y + 2); ctx.fill();
      }
    } else {   // pohon bulat; di wilayah kering berwarna musim gugur
      const pal = dry ? (h > 0.7 ? ['#c8742a', '#e8a040'] : ['#9a8a2a', '#c4b43c']) : (h > 0.7 ? ['#2f8a4a', '#58b865'] : ['#2f7a3a', '#4aa04a']);
      ctx.fillStyle = pal[0];
      ctx.beginPath(); ctx.arc(px + 16 + sw, py + 12, 14 * k, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 8 + sw, py + 17, 8 * k, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 24 + sw, py + 17, 8 * k, 0, 7); ctx.fill();
      ctx.fillStyle = pal[1]; ctx.beginPath(); ctx.arc(px + 11 + sw, py + 8, 7 * k, 0, 7); ctx.fill();
    }
  }
  function drawDecor(tx, ty, px, py, h) {   // rumput tinggi bergoyang, bunga, batu, semak berbuah, jamur
    const h2 = World.hash(tx, ty, 31);
    if (h > 0.62) {
      const sw = Math.sin(anim * 2 + tx * 0.9 + ty * 0.5) * 1.6, bx = px + 6 + h2 * 18, by = py + 14 + ((h * 71) % 1) * 12;
      ctx.strokeStyle = '#3f8a35'; ctx.lineWidth = 1.6; ctx.beginPath();
      ctx.moveTo(bx - 2, by); ctx.lineTo(bx - 3 + sw, by - 6); ctx.moveTo(bx, by); ctx.lineTo(bx + sw, by - 8); ctx.moveTo(bx + 2, by); ctx.lineTo(bx + 3 + sw, by - 5); ctx.stroke();
    }
    if (h2 < 0.07) {
      const c = ['#ff6f91', '#ffd54a', '#ffffff', '#b388ff'][Math.floor(h * 40) % 4], fx = px + 8 + ((h * 13) % 1) * 16, fy = py + 8 + ((h * 29) % 1) * 16;
      ctx.fillStyle = '#3f8a35'; ctx.fillRect(fx - 0.5, fy, 1.5, 5); ctx.fillStyle = c;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(fx + Math.cos(i * 1.57) * 2.2, fy + Math.sin(i * 1.57) * 2.2, 1.7, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.arc(fx, fy, 1.4, 0, 7); ctx.fill();
    } else if (h2 < 0.095) {
      ctx.fillStyle = '#0003'; ctx.beginPath(); ctx.ellipse(px + 17, py + 25, 8, 3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#8d9299'; ctx.beginPath(); ctx.ellipse(px + 16, py + 22, 7, 5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#b4b9c0'; ctx.beginPath(); ctx.ellipse(px + 14, py + 20, 3.5, 2.2, 0, 0, 7); ctx.fill();
    } else if (h2 < 0.118) {
      ctx.fillStyle = '#0003'; ctx.beginPath(); ctx.ellipse(px + 16, py + 26, 10, 3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#2f7a3a'; ctx.beginPath(); ctx.arc(px + 12, py + 21, 8, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(px + 21, py + 21, 7, 0, 7); ctx.fill();
      ctx.fillStyle = '#4aa04a'; ctx.beginPath(); ctx.arc(px + 15, py + 17, 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#e53935'; ctx.fillRect(px + 10, py + 20, 2, 2); ctx.fillRect(px + 20, py + 22, 2, 2); ctx.fillRect(px + 16, py + 18, 2, 2);
    } else if (h2 < 0.128) {
      ctx.fillStyle = '#f1e6d0'; ctx.fillRect(px + 15, py + 21, 3, 5); ctx.fillStyle = '#d84a3a'; ctx.beginPath(); ctx.arc(px + 16.5, py + 21, 5, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(px + 14, py + 19, 1.5, 1.5);
    }
  }
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k))); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; };
  function drawPlayer() {   // karakter chibi: detail ada di sprites.js (arah hadap, ayun jalan, tebasan senjata, kedip, jubah)
    Sprites.player(ctx, { x: state.x, y: state.y, e: state.equip || {}, mv: moving, a: anim, fx, fy, sp: Battle.swingP(), hurt: Battle.blink() });
  }

  function draw() {
    const cx = Math.round(cam.x * sc) / sc, cy = Math.round(cam.y * sc) / sc;
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, vw, vh);
    nightV = state.dg ? 0 : darkness(state.t % 24);
    const so = Fx.off();
    ctx.save(); ctx.translate(-cx + so.x, -cy + so.y);
    const x0 = Math.max(0, Math.floor(cx / T)), x1 = Math.min(W - 1, Math.floor((cx + vw) / T));
    const y0 = Math.max(0, Math.floor(cy / T)), y1 = Math.min(H - 1, Math.floor((cy + vh) / T));
    const H1 = CFG.HOME, mt = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? 1 : map[y * W + x];
    if (!look || lookSeed !== state.seed) buildLook();
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const id = map[ty * W + tx], px = tx * T, py = ty * T, h = World.hash(tx, ty, 9);
      if (id >= 4) drawSp(id, tx, ty, px, py);
      else if (id === 1) {   // air: tepi lebih terang + buih pantai, tengah lebih gelap, gelombang
        const up = mt(tx, ty - 1) !== 1, dn = mt(tx, ty + 1) !== 1, lf = mt(tx - 1, ty) !== 1, rt = mt(tx + 1, ty) !== 1, edge = up || dn || lf || rt;
        ctx.fillStyle = edge ? '#4a8bd6' : h > 0.5 ? '#3b78c4' : '#3470bb'; ctx.fillRect(px, py, T, T);
        ctx.fillStyle = '#ffffff30'; ctx.fillRect(px + 4 + h * 10, py + 10 + Math.sin(anim * 2 + tx + ty) * 4, 12, 2); ctx.fillRect(px + 14 - h * 8, py + 22 + Math.sin(anim * 1.7 + tx * 2) * 3, 8, 1.5);
        if (edge) {
          ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.2 * Math.sin(anim * 2.5 + tx + ty)) + ')';
          if (up) ctx.fillRect(px, py, T, 3); if (dn) ctx.fillRect(px, py + T - 3, T, 3); if (lf) ctx.fillRect(px, py, 3, T); if (rt) ctx.fillRect(px + T - 3, py, 3, T);
        }
      } else if (id === 2) {   // pasir
        ctx.fillStyle = h > 0.5 ? '#d9c58a' : '#d2bd80'; ctx.fillRect(px, py, T, T);
        ctx.fillStyle = '#c4ae70'; ctx.fillRect(px + h * 24, py + ((h * 97) % 1) * 24, 3, 3);
        ctx.fillStyle = '#e8d9a6'; ctx.fillRect(px + ((h * 31) % 1) * 22, py + ((h * 59) % 1) * 22, 6, 1.5);
      } else {   // rumput bernuansa + dekorasi
        ctx.fillStyle = GP[look[ty * W + tx]]; ctx.fillRect(px, py, T, T);
        const f = state.farm[tx + ',' + ty], bl = state.build[tx + ',' + ty], fl = state.floor[tx + ',' + ty];
        if (fl) drawFloor(fl, tx, ty, px, py, 1);
        if (f) drawFarm(f, px, py);
        if (bl) drawB(bl, px, py, 1, tx, ty);
        if (!f && !bl && !fl && !state.dg && id === 0 && !(tx >= H1.x - 2 && tx < H1.x + H1.w + 2 && ty >= H1.y - 2 && ty < H1.y + H1.h + 2)) drawDecor(tx, ty, px, py, h);
      }
    }
    for (let i = 0; i < torches.length; i += 2) {   // cahaya obor dungeon
      ctx.fillStyle = 'rgba(255,160,60,' + (0.16 + Math.sin(anim * 9 + i) * 0.03) + ')'; ctx.beginPath(); ctx.arc(torches[i], torches[i + 1], 52, 0, 7); ctx.fill();
    }
    torches.length = 0;
    const H0 = CFG.HOME;   // penanda area rumah
    ctx.strokeStyle = '#ffffff88'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
    if (!state.dg) ctx.strokeRect(H0.x * T, H0.y * T, H0.w * T, H0.h * T);
    ctx.setLineDash([]);
    const fr = front();   // sorotan tile target aksi
    if (state.bm) {   // grid zona bangun
      const hz = CFG.HOME, mg = BUILD_MARGIN; ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 1;
      for (let ty = Math.max(y0, hz.y - mg); ty < Math.min(y1 + 1, hz.y + hz.h + mg); ty++)
        for (let tx = Math.max(x0, hz.x - mg); tx < Math.min(x1 + 1, hz.x + hz.w + mg); tx++) ctx.strokeRect(tx * T + 0.5, ty * T + 0.5, T - 1, T - 1);
    }
    if (fr.x >= 0 && fr.y >= 0 && fr.x < W && fr.y < H) {   // sorotan + preview (hijau = bisa, merah = tidak)
      const px = fr.x * T, py = fr.y * T, t = state.carry ? state.carry.t : BUILDS[state.bsel] ? state.bsel : null;
      let ok = true;
      if (state.bm && t) {
        ok = !Build.check(state, map, fr.x, fr.y, t) && (!!state.carry || Build.afford(state, t));
        drawB({ t, o: 0 }, px, py, 0.6, fr.x, fr.y); ctx.fillStyle = ok ? '#4caf5066' : '#f4433666'; ctx.fillRect(px, py, T, T);
      }
      ctx.strokeStyle = ok ? '#ffeb3b' : '#f44336'; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
    }
    const pr = Math.floor(state.y / T);
    const trees = (a, b) => { for (let ty = Math.max(a, y0); ty <= Math.min(b, y1); ty++) for (let tx = x0; tx <= x1; tx++) if (map[ty * W + tx] === 3) drawTree(tx, ty); };
    trees(y0, pr); drawLabels(); if (!state.dg) Animal.draw(ctx, state); Battle.draw(ctx); drawPlayer(); Fx.draw(ctx); Fish.draw(ctx, state); trees(pr + 1, y1 + 1);
    ctx.restore();
    drawClouds(cx, cy);

    const hh = state.t % 24;
    if (!state.dg && ((hh >= 17 && hh < 19.5) || (hh >= 5 && hh < 7))) { ctx.fillStyle = 'rgba(255,140,60,0.12)'; ctx.fillRect(0, 0, vw, vh); }   // semburat senja/fajar
    const d = state.dg ? 0.85 : darkness(state.t % 24);
    if (d > 0) {   // malam: gelap, area sekitar pemain tetap terang
      const px = state.x - cx, py = state.y - cy, g = ctx.createRadialGradient(px, py, 30, px, py, 230);
      g.addColorStop(0, 'rgba(10,12,50,' + d * 0.25 + ')'); g.addColorStop(1, 'rgba(10,12,50,' + d * 0.72 + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
    }
    if (d > 0 && !state.dg) {   // cahaya hangat lampu
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const k in state.build) {
        if (state.build[k].t !== 'lamp') continue;
        const [lx, ly] = k.split(',').map(Number), sx = lx * T + 16 - cx, sy = ly * T + 7 - cy;
        if (sx < -100 || sy < -100 || sx > vw + 100 || sy > vh + 100) continue;
        const fl = 1 + Math.sin(anim * 9 + lx) * 0.04, g = ctx.createRadialGradient(sx, sy, 3, sx, sy, 96 * fl);
        g.addColorStop(0, 'rgba(255,196,96,' + 0.42 * d + ')'); g.addColorStop(1, 'rgba(255,196,96,0)');
        ctx.fillStyle = g; ctx.fillRect(sx - 100, sy - 100, 200, 200);
      }
      ctx.restore();
    }
    if (!state.dg) Weather.draw(ctx, vw, vh);
    drawAmbient(cx, cy, d);
    drawArrow(cx, cy);
  }

  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; anim += dt;
    Fx.update(dt);
    update(dt * Fx.scale()); draw(); Battle.fx(ctx, vw, vh);
    if (sleepT > 0) { sleepT -= dt; ctx.fillStyle = 'rgba(0,0,12,' + Math.max(0, Math.min(1, sleepT * 1.5, (1.4 - sleepT) * 4)) + ')'; ctx.fillRect(0, 0, vw, vh); }
    requestAnimationFrame(frame);
  }
  document.getElementById('reset').onclick = () => {
    if (confirm('Mulai dari awal? Progres lama akan terhapus.')) { try { localStorage.removeItem(CFG.SAVE_KEY); } catch (e) {} init(null); }
  };
  function die() { Sfx.play('death'); dead = true; document.getElementById('dead').hidden = false; }
  document.getElementById('wake').onclick = () => {   // pingsan: bangun di depan rumah pagi hari, koin berkurang 10%
    const h = CFG.HOME;
    if (state.dg) { state.dg = null; map = omap; dgd = null; }
    state.gold = Math.floor(state.gold * 0.9);
    state.t = Math.floor(state.t / 24) * 24 + 7 + (state.t % 24 >= 7 ? 24 : 0);
    state.x = (h.x - 3) * T + 16; state.y = (h.y + 4) * T + 16;
    const w = Gear.stats(state); state.hp = w.hp; state.mp = w.mp; state.shield = 0; Battle.reset(); dead = false; tgt = null;
    document.getElementById('dead').hidden = true; save();
  };
  addEventListener('resize', resize);
  addEventListener('pagehide', () => save());
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  UI.init(() => state); Quest.init(m => UI.toast(m, 3200)); Fish.init(m => UI.toast(m, 2500)); Weather.init(m => UI.toast(m, 3000));
  Animal.init({ hit });
  Battle.init({ hit, safe: (x, y) => World.vil().some(v => Math.hypot(v.x * T + 16 - x, v.y * T + 16 - y) < 9 * T), toast: m => UI.toast(m), boss: () => { if (state.dg && !state.dg.boss) { state.dg.boss = 1; const k = state.dg.key || 'h'; state.dgc[k] = (state.dgc[k] || 0) + 1; } } });
  resize(); init(load()); requestAnimationFrame(frame);
})();
