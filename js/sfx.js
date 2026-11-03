// Efek suara sintesis (WebAudio): tanpa file audio, 0 KB aset. Aktif setelah sentuhan/klik pertama.
const Sfx = (() => {
  let c = null, on = true;
  try { on = localStorage.getItem('dusun_senja_snd') !== '0'; } catch (e) {}
  function ac() {
    if (!c) { try { c = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (c && c.state === 'suspended') c.resume();
    return c;
  }
  function tone(f, f2, d, type, v, delay) {
    const x = ac(); if (!x) return;
    const t = x.currentTime + (delay || 0), o = x.createOscillator(), g = x.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(x.destination); o.start(t); o.stop(t + d + 0.02);
  }
  const S = {
    swing: () => tone(420, 200, 0.06, 'triangle', 0.04),
    hit: () => tone(220, 90, 0.1, 'square', 0.07),
    kill: () => { tone(320, 70, 0.2, 'sawtooth', 0.07); tone(180, 60, 0.25, 'square', 0.05, 0.05); },
    hurt: () => tone(170, 60, 0.22, 'sawtooth', 0.09),
    coin: () => { tone(880, 1320, 0.08, 'square', 0.04); tone(1320, 1760, 0.1, 'square', 0.04, 0.07); },
    plant: () => tone(300, 190, 0.09, 'triangle', 0.09),
    water: () => tone(520, 240, 0.16, 'sine', 0.07),
    build: () => tone(150, 95, 0.09, 'square', 0.07),
    cast: () => tone(500, 1300, 0.22, 'sine', 0.07),
    heal: () => { tone(520, 780, 0.12, 'sine', 0.07); tone(780, 1040, 0.16, 'sine', 0.07, 0.1); },
    level: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, f * 1.01, 0.16, 'square', 0.05, i * 0.1)),
    death: () => tone(300, 50, 0.7, 'sawtooth', 0.09),
    thunder: () => { tone(90, 35, 0.7, 'sawtooth', 0.1); tone(160, 50, 0.45, 'square', 0.05, 0.06); }
  };
  const unlock = () => ac();
  addEventListener('pointerdown', unlock, { once: true });
  addEventListener('keydown', unlock, { once: true });
  return {
    play(n) { if (on && S[n]) { try { S[n](); } catch (e) {} } },
    toggle() { on = !on; try { localStorage.setItem('dusun_senja_snd', on ? '1' : '0'); } catch (e) {} return on; },
    get on() { return on; }
  };
})();
