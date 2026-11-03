// Tata letak kontrol yang bisa digeser: joystick, tombol serang, tombol aksi, hotbar, bar skill.
// Posisi disimpan sebagai pecahan layar (titik tengah elemen), terpisah untuk layar landscape dan portrait.
const Layout = (() => {
  const KEY = 'dusun_senja_layout_v1', IDS = ['joy', 'atk', 'act', 'hbw', 'skbar', 'menuc', 'qt'];
  const $ = i => document.getElementById(i), bar = $('layb');
  let data = {}, edit = false, drag = null;
  try { data = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { data = {}; }
  const orient = () => innerWidth >= innerHeight ? 'l' : 'p';
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };

  function apply() {
    const o = data[orient()] || {};
    IDS.forEach(id => {
      const e = $(id), p = o[id]; if (!e) return;
      if (p) { e.style.left = p[0] * 100 + '%'; e.style.top = p[1] * 100 + '%'; e.style.right = e.style.bottom = 'auto'; e.style.transform = 'translate(-50%,-50%)'; }
      else e.style.left = e.style.top = e.style.right = e.style.bottom = e.style.transform = '';
    });
  }
  function set(on) {
    edit = on; drag = null;
    document.body.classList.toggle('lay', on);
    bar.hidden = !on;
  }

  // Saat mode atur aktif, semua sentuhan dicegat di fase capture supaya tombol tidak ikut menyerang/bergerak.
  document.addEventListener('pointerdown', e => {
    if (!edit || e.target.closest('#layb')) return;
    e.stopPropagation(); e.preventDefault();
    const el = e.target.closest('.mv'); if (!el) return;
    const r = el.getBoundingClientRect();
    drag = { id: el.id, pid: e.pointerId, dx: e.clientX - (r.left + r.width / 2), dy: e.clientY - (r.top + r.height / 2) };
  }, true);
  document.addEventListener('pointermove', e => {
    if (!edit || !drag || e.pointerId !== drag.pid) return;
    const fx = Math.max(0.04, Math.min(0.96, (e.clientX - drag.dx) / innerWidth)), fy = Math.max(0.05, Math.min(0.95, (e.clientY - drag.dy) / innerHeight));
    const o = data[orient()] = data[orient()] || {}; o[drag.id] = [+fx.toFixed(4), +fy.toFixed(4)];
    apply();
  });
  const end = e => { if (drag && e.pointerId === drag.pid) { drag = null; save(); } };
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
  $('layd').addEventListener('click', () => set(false));
  $('layr').addEventListener('click', () => { delete data[orient()]; save(); apply(); });
  addEventListener('resize', apply);
  apply();
  return { start: () => set(true), on: () => edit };
})();
