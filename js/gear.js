// Equipment: stat pemain, generator item acak, pasang/lepas/jual.
// state.equip = { head, body, legs, hands, back }, state.items = [item]. item = { id, slot, r (rarity 0-4), n, atk?, def?, hp?, el? }
const Gear = {
  stats(s) {
    let atk = 3 + s.lv, def = 0, hp = 40 + 8 * s.lv;
    for (const k in s.equip) { const it = s.equip[k]; if (it) { atk += it.atk || 0; def += it.def || 0; hp += it.hp || 0; } }
    const f = Skills.fx(s);
    if (s.buff && s.buff.t > 0 && FOOD[s.buff.id]) { const bf = FOOD[s.buff.id].fx; for (const k in bf) f[k] = (f[k] || 0) + bf[k]; }
    return { atk: Math.round(atk * (1 + f.atkPct)), def: def + f.defFlat, hp: hp + f.hpFlat, mp: 20 + 4 * s.lv + f.mpFlat, f };
  },
  roll(slot, pw) {   // pw = kekuatan dunia (hari / jarak), makin besar makin bagus
    const w = [60 - pw * 4, 25, 10 + pw * 2, 4 + pw, 1 + pw * 0.5].map(v => Math.max(1, v));
    let x = Math.random() * w.reduce((a, b) => a + b), r = 0;
    while (r < 4 && x >= w[r]) { x -= w[r]; r++; }
    slot = slot || Object.keys(SLOTS)[Math.floor(Math.random() * 5)];
    const S = SLOTS[slot], m = [1, 1.4, 1.9, 2.6, 3.5][r] * (1 + pw * 0.3);
    const it = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), slot, r };
    for (const k in S.st) it[k] = Math.max(1, Math.round(S.st[k] * m * (0.85 + Math.random() * 0.3)));
    if (r >= 2 && Math.random() < 0.5) it.el = Object.keys(ELEMENTS)[Math.floor(Math.random() * 7)];
    it.n = S.base[Math.floor(Math.random() * S.base.length)] + (it.el ? ' ' + ELEMENTS[it.el].n : '');
    return it;
  },
  equip(s, id) {
    const i = s.items.findIndex(x => x.id === id); if (i < 0) return;
    const it = s.items.splice(i, 1)[0], old = s.equip[it.slot];
    if (old) s.items.push(old);
    s.equip[it.slot] = it;
  },
  unequip(s, slot) { const it = s.equip[slot]; if (it) { s.items.push(it); delete s.equip[slot]; } },
  price(it) { return Math.round(((it.atk || 0) * 3 + (it.def || 0) * 3 + (it.hp || 0)) * (1 + it.r * 0.5)) + 2; },
  sell(s, id) { const i = s.items.findIndex(x => x.id === id); if (i < 0) return; s.gold += this.price(s.items[i]); s.items.splice(i, 1); }
};
