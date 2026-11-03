// Input: keyboard, joystick virtual, klik mouse, tombol aksi/tas, angka 1-9 untuk hotbar.
const Input = { x: 0, y: 0, click: null, act: 0, bag: 0, bm: 0, atk: 0, tree: 0, map: 0, quest: 0, castIdx: 0, num: 0, k: {} };
(() => {
  const k = Input.k, joy = document.getElementById('joy'), st = document.getElementById('stick');
  let jv = null, pid = null;
  addEventListener('keydown', e => {
    k[e.code] = 1;
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'KeyE') Input.act = 1;
    if (e.code === 'KeyI') Input.bag = 1;
    if (e.code === 'KeyB') Input.bm = 1;
    if (e.code === 'KeyK') Input.tree = 1;
    if (e.code === 'KeyM') Input.map = 1;
    if (e.code === 'KeyQ') Input.quest = 1;
    const ci = ['KeyZ', 'KeyX', 'KeyC', 'KeyV'].indexOf(e.code); if (ci >= 0) Input.castIdx = ci + 1;
    if (/^Digit[1-9]$/.test(e.code)) Input.num = +e.code[5];
  });
  addEventListener('keyup', e => { k[e.code] = 0; });
  addEventListener('blur', () => { for (const c in k) k[c] = 0; });
  function jmove(e) {
    const r = joy.getBoundingClientRect(), R = 40;
    let dx = e.clientX - (r.left + 60), dy = e.clientY - (r.top + 60);
    const m = Math.hypot(dx, dy);
    if (m > R) { dx *= R / m; dy *= R / m; }
    jv = { x: dx / R, y: dy / R };
    st.style.transform = `translate(${dx}px,${dy}px)`;
  }
  joy.addEventListener('pointerdown', e => { pid = e.pointerId; joy.setPointerCapture(pid); jmove(e); });
  joy.addEventListener('pointermove', e => { if (e.pointerId === pid) jmove(e); });
  const jend = e => { if (e.pointerId === pid) { pid = null; jv = null; st.style.transform = ''; } };
  joy.addEventListener('pointerup', jend);
  joy.addEventListener('pointercancel', jend);
  document.getElementById('c').addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') Input.click = { x: e.clientX, y: e.clientY };
  });
  document.getElementById('act').addEventListener('pointerdown', e => { e.preventDefault(); Input.act = 1; });
  let ah = 0; const ab = document.getElementById('atk');
  ab.addEventListener('pointerdown', e => { e.preventDefault(); ah = 1; });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => ab.addEventListener(t, () => { ah = 0; }));
  document.getElementById('bag').addEventListener('click', () => { Input.bag = 1; });
  document.getElementById('bm').addEventListener('click', () => { Input.bm = 1; });
  document.getElementById('tr').addEventListener('click', () => { Input.tree = 1; });
  document.getElementById('mapb').addEventListener('click', () => { Input.map = 1; });
  document.getElementById('qb').addEventListener('click', () => { Input.quest = 1; });
  document.getElementById('qt').addEventListener('click', () => { Input.quest = 1; });
  Input.update = () => {
    if (k.KeyJ || k.KeyF || ah) Input.atk = 1;   // tahan untuk menyerang terus
    let x = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
    let y = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
    if (!x && !y && jv && Math.hypot(jv.x, jv.y) > 0.15) { x = jv.x; y = jv.y; }
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    Input.x = x; Input.y = y;
  };
})();
