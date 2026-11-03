// Masak di tungku 🍳 dan makan. state.buff = { id, t } (t = detik nyata tersisa), efeknya dibaca di Gear.stats.
const Cook = {
  can(s, id) { const r = FOOD[id].rec; return Object.keys(r).every(k => (s.inv[k] || 0) >= r[k]); },
  make(s, id) {
    if (!FOOD[id] || !this.can(s, id)) return 'Bahan kurang';
    const r = FOOD[id].rec;
    for (const k in r) { s.inv[k] -= r[k]; if (s.inv[k] <= 0) delete s.inv[k]; }
    s.inv['food:' + id] = (s.inv['food:' + id] || 0) + 1; Quest.add(s, 'cook', 1);
    return '+1 ' + FOOD[id].icon + ' ' + FOOD[id].n;
  },
  eat(s, id) {
    const F = FOOD[id]; if (!F || !(s.inv['food:' + id] > 0)) return '';
    if (--s.inv['food:' + id] <= 0) delete s.inv['food:' + id];
    s.buff = { id, t: F.dur };
    const st = Gear.stats(s); s.hp = Math.min(st.hp, (s.hp == null ? st.hp : s.hp) + st.hp * F.heal);
    Sfx.play('heal');
    return 'Nyam! ' + F.icon + ' ' + F.d + ' (' + Math.round(F.dur / 60) + ' menit)';
  },
  html(s) {
    const rows = Object.keys(FOOD).map(id => {
      const F = FOOD[id], ok = this.can(s, id);
      const need = Object.keys(F.rec).map(k => { const have = s.inv[k] || 0, i = itemInfo(k); return `<span style="color:${have >= F.rec[k] ? '#8f8' : '#f88'}">${i.icon}${have}/${F.rec[k]}</span>`; }).join(' ');
      return `<div class="rw"><span>${F.icon} <b>${F.n}</b><br><small>${need} · ${F.d}</small></span><button data-ck="${id}" ${ok ? '' : 'disabled'}>Masak</button></div>`;
    }).join('');
    const b = s.buff && s.buff.t > 0 ? `<div class="rw" style="font-size:12px">Efek aktif: ${FOOD[s.buff.id].icon} ${FOOD[s.buff.id].n} (${Math.ceil(s.buff.t / 60)} menit)</div>` : '';
    return `<h3>🍳 Tungku</h3>${b}<div class="rw" style="font-size:12px;opacity:.8">Makanan dimakan dari 🎒 Tas, memberi pulih HP dan efek sementara. Hanya satu efek aktif.</div>${rows}<button data-x>Tutup</button>`;
  }
};
