// UI: hotbar, tas + toko benih, toast. Dirender ulang hanya saat data berubah.
const UI = (() => {
  const $ = i => document.getElementById(i), hb = $('hotbar'), pn = $('panel'), gd = $('gold'), ts = $('toast'), hpf = $('hpf'), hpt = $('hpt'), mpf = $('mpf'), mpt = $('mpt'), skb = $('skbar');
  let get, sig = '', skSig = '', open = false, tt, shopV, bagTab = 'gear', qTab = 'm', swallow = 0, chestK = '';
  const slots = s => s.bm ? ['move', 'remove', ...Object.keys(BUILDS)] : ['hoe', 'can', 'axe', 'rod', ...Object.keys(CROPS).map(c => 'seed:' + c).filter(i => s.inv[i] > 0)];
  const info = id => {
    if (TOOLS[id] || PAL[id] || BUILDS[id]) return TOOLS[id] || PAL[id] || BUILDS[id];
    const [t, c] = id.split(':');
    if (t === 'mat') return MATS[c];
    const ii = itemInfo(id); if (ii) return ii;
    return { n: (t === 'seed' ? 'Benih ' : '') + CROPS[c].n, icon: CROPS[c].icon };
  };
  function refresh() {
    const s = get(), sl = slots(s);
    const K = s.bm ? 'bsel' : 'sel'; if (!sl.includes(s[K])) s[K] = sl[0];
    $('qb').classList.toggle('dot', Quest.ready(s));
    const qt = Quest.track(s); if ($('qt').textContent !== qt) $('qt').textContent = qt;
    const g = '🪙 ' + s.gold;
    if (gd.textContent !== g) gd.textContent = g;
    const st = Gear.stats(s), hp = Math.max(0, Math.ceil(s.hp == null ? st.hp : s.hp)), ht = `❤️ ${hp}/${st.hp} · Lv ${s.lv}` + (s.buff && s.buff.t > 0 && FOOD[s.buff.id] ? ' ' + FOOD[s.buff.id].icon + Math.ceil(s.buff.t / 60) + 'm' : '');
    if (hpt.textContent !== ht) { hpt.textContent = ht; hpf.style.width = (100 * hp / st.hp) + '%'; }
    const mp = Math.floor(s.mp == null ? st.mp : s.mp), mt = `💙 ${mp}/${st.mp}`;
    if (mpt.textContent !== mt) { mpt.textContent = mt; mpf.style.width = (100 * mp / st.mp) + '%'; }
    const sks = s.sk.join();   // bar skill aktif
    if (sks !== skSig) { skSig = sks; skb.innerHTML = s.sk.map(id => `<div class="sk" title="${SK[id].n}">${SK[id].icon}<span></span></div>`).join(''); }
    for (let i = 0; i < skb.children.length; i++) { const c = Battle.cd(s.sk[i]); skb.children[i].lastChild.textContent = c > 0 ? Math.ceil(c) : ''; }
    const sg = CFG.SPD + bagTab + qTab + (open === 'quest' ? JSON.stringify([s.q, s.qs]) : '') + (open === 'chest' ? JSON.stringify(s.build[chestK]) : '') + (open === 'cook' ? JSON.stringify(s.buff) : '') + ((s.an || []).length) + JSON.stringify(s.inv) + s.sel + s.bsel + s.bm + !!s.carry + s.gold + open + s.lv + s.xp + s.sp + s.sk.join() + Sfx.on + (open ? JSON.stringify([s.items, s.equip, s.skills, s.shops, s.vis]) : '');
    if (sg === sig) return;
    sig = sg;
    hb.innerHTML = sl.map(id => `<div class="sl ${id === s[K] ? 'on' : ''} ${id.startsWith('seed:') ? 'sd' : ''}" data-id="${id}" title="${info(id).n}">${info(id).icon}${s.inv[id] ? `<b>${s.inv[id]}</b>` : ''}</div>`).join('');
    $('bm').classList.toggle('on', !!s.bm);
    const cur = s[K], fi = info(cur), bd = BUILDS[cur];
    $('binfo').textContent = s.carry ? 'Membawa: ' + BUILDS[s.carry.t].n + ' · pilih tile lalu Aksi' : fi.n + (bd ? ' · ' + Object.keys(bd.cost).map(m => MATS[m].icon + bd.cost[m]).join(' ') : fi.d ? ' · ' + fi.d : '');
    pn.hidden = !open;
    if (!open) return;
    if (open === 'tree') { pn.innerHTML = treeHtml(s); return; }
    if (open === 'cook') { pn.innerHTML = Cook.html(s); return; }
    if (open === 'chest') { pn.innerHTML = chestHtml(s); return; }
    if (open === 'quest') { pn.innerHTML = Quest.html(s, qTab); return; }
    if (open === 'menu') { pn.innerHTML = menuHtml(); return; }
    if (open === 'shop') { pn.innerHTML = shopHtml(s); return; }
    if (open === 'map') { pn.innerHTML = mapHtml(s); Mini.draw($('mapc'), s); return; }
    const rows = Object.keys(s.inv).filter(i => s.inv[i] > 0).map(i => {
      const [t, c] = i.split(':'), f = info(i);
      return `<div class="rw"><span>${f.icon} ${f.n} ×${s.inv[i]}</span>${t === 'food' ? `<button data-eat="${c}">Makan</button>` : ''}${SELLT.includes(t) ? `<button data-sv="${i}">Jual ${unit(i) * s.inv[i]}🪙</button>` : ''}</div>`;
    }).join('') || '<div class="rw">Tas kosong</div>';
    const shop = Object.keys(CROPS).map(c => `<div class="rw"><span>${CROPS[c].icon} Benih ${CROPS[c].n}</span><button data-b="${c}">Beli ${CROPS[c].seed}🪙</button></div>`).join('');
    const tabs = '<div class="tabs">' + [['gear', '🧍 Perlengkapan'], ['inv', '🎒 Tas'], ['shop', '🛒 Toko']].map(([k, n]) => `<button data-tab="${k}" class="${bagTab === k ? 'on' : ''}">${n}</button>`).join('') + '</div>';
    const pets = Object.keys(ANIMALS).map(k => `<div class="rw"><span>${ANIMALS[k].icon} ${ANIMALS[k].n} <small>(pakan ${itemInfo(ANIMALS[k].feed).icon}, hasil ${PROD[ANIMALS[k].prod].icon})</small></span><button data-an="${k}">Beli ${ANIMALS[k].price}🪙</button></div>`).join('') + `<div class="rw" style="font-size:12px;opacity:.8">Hewan: ${(s.an || []).length}/12. Muncul di dekatmu; beri makan dengan Aksi.</div>`;
    const mats = Object.keys(MATS).map(m => `<div class="rw"><span>${MATS[m].icon} ${MATS[m].n}</span><button data-m="${m}">Beli ${MATS[m].buy}🪙</button></div>`).join('');
    const body = bagTab === 'gear' ? `<h3>🧍 Lv ${s.lv} · XP ${s.xp}/${20 * s.lv}</h3>${gearHtml(s)}`
      : bagTab === 'inv' ? `<h3>🎒 Tas · 🪙 ${s.gold}</h3>${rows}`
      : `<h3>🛒 Toko Benih · 🪙 ${s.gold}</h3>${shop}<h3>🧱 Toko Bahan</h3>${mats}<h3>🐾 Hewan Ternak</h3>${pets}`;
    pn.innerHTML = tabs + body + '<button data-x>Tutup</button>';
  }
  const STL = { atk: '⚔️', def: '🛡️', hp: '❤️' };
  const nm = it => `<b style="color:${RAR[it.r].c}">${it.n}</b>`;
  function stats(it, base) {   // base = item terpasang (untuk perbandingan ▲▼)
    return ['atk', 'def', 'hp'].filter(k => it[k] || (base && base[k])).map(k => {
      const d = base ? (it[k] || 0) - (base[k] || 0) : 0;
      return STL[k] + (it[k] || 0) + (d ? ` <i style="color:${d > 0 ? '#7f7' : '#f77'}">${d > 0 ? '▲' : '▼'}${Math.abs(d)}</i>` : '');
    }).join(' ') + (it.el ? ' ' + ELEMENTS[it.el].icon : '');
  }
  function gearHtml(s) {
    const eq = Object.keys(SLOTS).map(k => { const it = s.equip[k]; return `<div class="rw"><span>${SLOTS[k].icon} ${it ? nm(it) + ' ' + stats(it) : '<i style="opacity:.5">' + SLOTS[k].n + ' kosong</i>'}</span>${it ? `<button data-ue="${k}">Lepas</button>` : ''}</div>`; }).join('');
    const bag = s.items.map(it => `<div class="rw"><span>${SLOTS[it.slot].icon} ${nm(it)} ${stats(it, s.equip[it.slot] || {})}</span><button data-eq="${it.id}">Pakai</button><button data-sg="${it.id}">${Gear.price(it)}🪙</button></div>`).join('');
    return eq + (bag ? '<h3>🎽 Perlengkapan di tas (▲▼ vs yang dipakai)</h3>' + bag : '');
  }
  function chestHtml(s) {
    const c = s.build[chestK]; if (!c) { open = false; return ''; }
    c.i = c.i || {}; c.g = c.g || [];
    const ci = Object.keys(c.i).map(i => `<div class="rw"><span>${info(i).icon} ${info(i).n} ×${c.i[i]}</span><button data-co="${i}">Ambil</button></div>`).join('');
    const cg = c.g.map(it => `<div class="rw"><span>${SLOTS[it.slot].icon} ${nm(it)} ${stats(it, s.equip[it.slot] || {})}</span><button data-cgo="${it.id}">Ambil</button></div>`).join('');
    const ti = Object.keys(s.inv).filter(i => s.inv[i] > 0).map(i => `<div class="rw"><span>${info(i).icon} ${info(i).n} ×${s.inv[i]}</span><button data-ci="${i}">Simpan</button></div>`).join('');
    const tg = s.items.map(it => `<div class="rw"><span>${SLOTS[it.slot].icon} ${nm(it)} ${stats(it, s.equip[it.slot] || {})}</span><button data-cgi="${it.id}">Simpan</button></div>`).join('');
    return `<h3>🧰 Isi Peti (${Object.keys(c.i).length}/24 jenis · ${c.g.length}/24 perlengkapan)</h3>${ci + cg || '<div class="rw">Peti kosong</div>'}<h3>🎒 Tas</h3>${ti + tg || '<div class="rw">Tas kosong</div>'}<button data-x>Tutup</button>`;
  }
  function treeHtml(s) {
    let h = `<h3>🌳 Skill · Poin: ${s.sp}</h3><div class="rw" style="font-size:12px;opacity:.8">Maks 4 skill aktif di bar (Z X C V di PC). Elemen: 🔥>🌪️>⛰️>⚡>💧>🔥, ✨↔🌑 saling kuat. Elemen sama = damage berkurang.</div>`;
    for (const b in BRANCH) {
      h += `<h3>${BRANCH[b].icon} ${BRANCH[b].n}</h3>`;
      for (const id in SK) {
        const n = SK[id]; if (n.b !== b) continue;
        const got = s.skills[id], ok = n.req.every(r => s.skills[r]);
        let btn = '';
        if (got) btn = n.act ? `<button data-sb="${id}">${s.sk.includes(id) ? 'Lepas' : 'Pasang'}</button>` : '✓';
        else if (ok) btn = `<button data-sk="${id}" ${s.sp < n.cost ? 'disabled' : ''}>Buka ${n.cost}</button>`;
        h += `<div class="rw" style="opacity:${got || ok ? 1 : 0.45}"><span>${n.icon} <b>${n.n}</b><br><small>${n.d}${!ok && !got ? ' · butuh ' + n.req.map(r => SK[r].n).join(', ') : ''}</small></span>${btn}</div>`;
      }
    }
    return h + '<button data-x>Tutup</button>';
  }
  function shopHtml(s) {
    const v = shopV, items = Village.stock(s, v);
    const crops = Object.keys(s.inv).filter(i => s.inv[i] > 0 && SELLT.includes(i.split(':')[0])).map(i => { const f = itemInfo(i); return `<div class="rw"><span>${f.icon} ${f.n} ×${s.inv[i]}</span><button data-vs="${i}">Jual ${Math.round(s.inv[i] * unit(i) * Village.mul(v))}🪙</button></div>`; }).join('') || '<div class="rw">Tidak ada yang bisa dijual</div>';
    const gear = items.map(it => `<div class="rw"><span>${SLOTS[it.slot].icon} ${nm(it)} ${stats(it, s.equip[it.slot] || {})}</span><button data-vb="${it.id}">${Village.price(it)}🪙</button></div>`).join('') || '<div class="rw">Stok hari ini habis</div>';
    return `<h3>🏪 Toko ${v.name} · 🪙 ${s.gold}</h3><div class="rw" style="font-size:12px">Hasil panen dibeli +${Math.round((Village.mul(v) - 1) * 100)}% dari harga biasa</div><h3>🌾 Jual hasil panen, ikan, ternak, makanan</h3>${crops}<h3>🎽 Equipment dijual (stok harian)</h3>${gear}<button data-x>Tutup</button>`;
  }
  function mapHtml(s) {
    const list = World.vil().slice().sort((a, b) => a.dist - b.dist).map(v => `<div class="rw"><span>${ELEMENTS[v.el].icon} <b>${v.name}</b> · T${v.lv} · ${Math.round(v.dist)} langkah</span>${s.vis[v.id] ? (s.dg ? '' : `<button data-tp="${v.id}">Pergi 15🪙</button>`) : '<small>?</small>'}</div>`).join('');
    return `<h3>🗺️ Peta Dunia</h3><canvas id="mapc" width="${CFG.W}" height="${CFG.H}" style="width:100%;image-rendering:pixelated;border-radius:8px"></canvas><div class="rw" style="font-size:12px">🔴 rumahmu · 🟡 desa · ⚪ kamu</div><h3>🏘️ Desa</h3>${s.dg ? '' : '<div class="rw"><span>🏠 Rumah</span><button data-tp="0">Pulang 15🪙</button></div>'}${list}<button data-x>Tutup</button>`;
  }
  function menuHtml() {
    return `<h3>⚙️ Pengaturan</h3><div class="rw"><span>Suara ${Sfx.on ? '🔊 nyala' : '🔇 mati'}</span><button data-mn="snd">${Sfx.on ? 'Matikan' : 'Nyalakan'}</button></div>
      <div class="rw"><span>⏱️ Kecepatan waktu (lama 1 hari game)</span></div>
      <div class="tabs">${Object.keys(SPEEDS).map(k => `<button data-mn="spd:${k}" class="${CFG.SPD === k ? 'on' : ''}">${{ fast: 'Cepat', normal: 'Normal', slow: 'Santai' }[k]} ${SPEEDS[k]}m</button>`).join('')}</div>
      <div class="rw"><span>Save tersimpan di browser ini. Ekspor untuk cadangan atau pindah perangkat.</span></div>
      <div class="rw"><button data-mn="exp">💾 Ekspor save</button><button data-mn="imp">📂 Impor save</button></div>
      <div class="rw"><span>Mulai dari awal (hapus semua progres)</span><button data-mn="reset">⟲ Reset</button></div>
      <div class="rw"><span>Geser joystick, tombol serang/aksi, hotbar, dan skill sesuai selera.</span><button data-mn="lay">🎛️ Atur tata letak</button></div>
      <h3>📖 Cara main singkat</h3><div style="font-size:12px;line-height:1.5">Pagi: ⛏️ garap, 🌱 tanam, 💧 siram, panen lalu jual di 🎒. Tebang pohon 🪓 untuk kayu, bangun 🔨 dinding dan pagar sebelum malam. Malam: monster datang, serang ⚔️ dan pakai skill. Jelajahi desa lewat 🗺️, masuk gua 🕳️ untuk equipment dan batu, naik level lalu buka 🌳 skill. Pakai elemen yang menang atas monster!</div>
      <input type="file" id="impf" accept=".json,application/json" hidden><button data-x>Tutup</button>`;
  }
  function menuAct(k) {
    if (k === 'snd') Sfx.toggle();
    else if (k.startsWith('spd:')) { const v = k.slice(4); if (SPEEDS[v]) { CFG.SPD = v; CFG.DAY_SEC = SPEEDS[v] * 60; try { localStorage.setItem('dusun_senja_speed', v); } catch (e) {} toast('Waktu: 1 hari game = ' + SPEEDS[v] + ' menit'); } }
    else if (k === 'exp') {
      dispatchEvent(new Event('pagehide'));   // memicu simpan terbaru
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([localStorage.getItem(CFG.SAVE_KEY) || ''], { type: 'application/json' }));
      a.download = 'dusun-senja-save.json'; a.click(); toast('Save diekspor 💾');
    } else if (k === 'imp') $('impf').click();
    else if (k === 'lay') { open = false; Layout.start(); }
    else if (k === 'reset') { open = false; $('reset').click(); }
  }
  function toast(m, ms) {
    ts.textContent = m; ts.classList.add('on');
    clearTimeout(tt); tt = setTimeout(() => ts.classList.remove('on'), ms || 1600);
  }
  document.addEventListener('pointerdown', e => {   // ketuk di luar panel menutup panel (tombol pembuka panel tetap bekerja sebagai toggle)
    if (!open || pn.contains(e.target) || e.target.closest('#bag,#tr,#mapb,#menub,#qb,#qt')) return;
    open = false; swallow = 1; e.stopPropagation(); e.preventDefault(); setTimeout(() => { swallow = 0; }, 400);
  }, true);
  document.addEventListener('click', e => { if (swallow) { swallow = 0; e.stopPropagation(); e.preventDefault(); } }, true);
  addEventListener('keydown', e => { if (e.code === 'Escape' && open) open = false; });
  skb.addEventListener('pointerdown', e => { const d = e.target.closest('.sk'); if (d) Input.castIdx = [...skb.children].indexOf(d) + 1; });
  $('menub').addEventListener('click', () => { open = open === 'menu' ? false : 'menu'; });
  pn.addEventListener('change', e => {   // impor save dari file
    if (e.target.id !== 'impf' || !e.target.files[0]) return;
    e.target.files[0].text().then(t => { try { if (!JSON.parse(t).seed) throw 0; window.noSave = true; localStorage.setItem(CFG.SAVE_KEY, t); location.reload(); } catch (err) { toast('File save tidak valid'); } });
  });
  hb.addEventListener('click', e => { const d = e.target.closest('.sl'); if (d) { const s = get(); s[s.bm ? 'bsel' : 'sel'] = d.dataset.id; } });
  pn.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const s = get();
    if (b.dataset.x !== undefined) open = false;
    else if (b.dataset.tab) bagTab = b.dataset.tab;
    else if (b.dataset.sv) { const id = b.dataset.sv, n = s.inv[id] || 0; if (n && SELLT.includes(id.split(':')[0])) { Quest.add(s, 'sell', n); s.gold += n * unit(id); delete s.inv[id]; Sfx.play('coin'); } }
    else if (b.dataset.eat) { const r = Cook.eat(s, b.dataset.eat); if (r) toast(r, 2500); }
    else if (b.dataset.ck) { const r = Cook.make(s, b.dataset.ck); toast(r); if (r[0] === '+') Sfx.play('build'); }
    else if (b.dataset.an) { const r = Animal.buy(s, b.dataset.an); toast(r, 2500); if (r.indexOf('baru') > 0) Sfx.play('coin'); }
    else if (b.dataset.ci || b.dataset.co) {
      const c = s.build[chestK]; if (!c) return; c.i = c.i || {};
      if (b.dataset.ci) { const id = b.dataset.ci; if (!c.i[id] && Object.keys(c.i).length >= 24) toast('Peti penuh'); else { c.i[id] = (c.i[id] || 0) + (s.inv[id] || 0); delete s.inv[id]; } }
      else { const id = b.dataset.co; s.inv[id] = (s.inv[id] || 0) + (c.i[id] || 0); delete c.i[id]; }
    }
    else if (b.dataset.cgi || b.dataset.cgo) {
      const c = s.build[chestK]; if (!c) return; c.g = c.g || [];
      if (b.dataset.cgi) { const i = s.items.findIndex(x => x.id === b.dataset.cgi); if (i >= 0) { if (c.g.length >= 24) toast('Peti penuh'); else c.g.push(s.items.splice(i, 1)[0]); } }
      else { const i = c.g.findIndex(x => x.id === b.dataset.cgo); if (i >= 0) { if (s.items.length >= 30) toast('Tas perlengkapan penuh'); else s.items.push(c.g.splice(i, 1)[0]); } }
    }
    else if (b.dataset.qt) qTab = b.dataset.qt;
    else if (b.dataset.qc) { const r = Quest.claim(s, 'm'); toast(r, 3000); if (r[0] !== 'M') Sfx.play('coin'); }
    else if (b.dataset.qd) { const r = Quest.claim(s, 'd', +b.dataset.qd); toast(r, 3000); if (r[0] !== 'M') Sfx.play('coin'); }
    else if (b.dataset.qb) { const r = Quest.claim(s, 'b'); toast(r, 3000); if (r[0] !== 'S') Sfx.play('coin'); }
    else if (b.dataset.s) { const id = 'crop:' + b.dataset.s; Quest.add(s, 'sell', s.inv[id] || 0); s.gold += (s.inv[id] || 0) * CROPS[b.dataset.s].price; delete s.inv[id]; }
    else if (b.dataset.mn) menuAct(b.dataset.mn);
    else if (b.dataset.tp !== undefined) { const r = Village.travel(s, +b.dataset.tp); if (r) toast(r); else open = false; }
    else if (b.dataset.vs) { Village.sell(s, shopV, b.dataset.vs); Sfx.play('coin'); }
    else if (b.dataset.vb) { const r = Village.buy(s, shopV, b.dataset.vb); if (r) toast(r); else Sfx.play('coin'); }
    else if (b.dataset.sk) Skills.learn(s, b.dataset.sk);
    else if (b.dataset.sb) Skills.bar(s, b.dataset.sb);
    else if (b.dataset.eq) Gear.equip(s, b.dataset.eq);
    else if (b.dataset.ue) Gear.unequip(s, b.dataset.ue);
    else if (b.dataset.sg) Gear.sell(s, b.dataset.sg);
    else if (b.dataset.m) { const m = MATS[b.dataset.m]; if (s.gold >= m.buy) { s.gold -= m.buy; Farm.add(s, 'mat:' + b.dataset.m, 1); } else toast('Koin kurang 🥺'); }
    else if (b.dataset.b) {
      const c = CROPS[b.dataset.b];
      if (s.gold >= c.seed) { s.gold -= c.seed; Farm.add(s, 'seed:' + b.dataset.b, 1); } else toast('Koin kurang 🥺');
    }
  });
  return {
    init(g) { get = g; }, refresh, toast,
    toggle(w) { w = w || 'bag'; open = open === w ? false : w; },
    isOpen: () => open,
    close() { open = false; },
    shop(v) { shopV = v; open = 'shop'; },
    cook() { open = 'cook'; },
    chest(k) { chestK = k; open = 'chest'; },
    pick(n) { const s = get(), sl = slots(s); if (sl[n - 1]) s[s.bm ? 'bsel' : 'sel'] = sl[n - 1]; }
  };
})();
