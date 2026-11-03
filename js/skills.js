// Skill tree + sistem elemen. state.skills = { id: 1 }, state.sk = [id skill aktif di bar, maks 4], state.sp = skill point.
const Skills = {
  fx(s) {   // total bonus pasif
    const f = { atkPct: 0, crit: 0, speedPct: 0, defFlat: 0, hpFlat: 0, mpFlat: 0, dmgRed: 0, regen: 0, mpRegen: 0, magPct: 0, healPct: 0 };
    for (const id in s.skills) { const n = SK[id]; if (n && n.fx) for (const k in n.fx) f[k] += n.fx[k]; }
    return f;
  },
  learn(s, id) {
    const n = SK[id];
    if (!n || s.skills[id] || s.sp < n.cost || !n.req.every(r => s.skills[r])) return;
    s.sp -= n.cost; s.skills[id] = 1; Quest.add(s, 'skill', 1);
    if (n.act && s.sk.length < 4) s.sk.push(id);   // skill aktif otomatis masuk bar jika masih ada slot
  },
  bar(s, id) { const i = s.sk.indexOf(id); if (i >= 0) s.sk.splice(i, 1); else if (s.sk.length < 4) s.sk.push(id); }
};

// Elemen: api > angin > tanah > listrik > air > api, light <-> dark saling kuat.
const Elem = {
  beats: { api: 'angin', angin: 'tanah', tanah: 'listrik', listrik: 'air', air: 'api', light: 'dark', dark: 'light' },
  mult(a, d) {   // pengali damage penyerang elemen a ke target elemen d
    if (!a || !d) return 1;
    if (this.beats[a] === d) return 1.5;
    if (this.beats[d] === a) return 0.6;
    return a === d ? 0.8 : 1;
  },
  def(s, M) {   // pengali damage monster elemen M ke pemain, dari elemen equipment (resistensi/kelemahan)
    let m = 1;
    for (const k in s.equip) { const e = s.equip[k] && s.equip[k].el; if (e) m *= 1 + (this.mult(M, e) - 1) * 0.3; }
    return m;
  }
};
