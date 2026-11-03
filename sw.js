// Service worker: network-first, cache sebagai cadangan offline. Naikkan V saat rilis baru.
const V = 'dusun-senja-v16', FILES = ["./", "index.html", "style.css", "icon.svg", "manifest.webmanifest", "js/battle.js", "js/build.js", "js/config.js", "js/data.js", "js/dungeon.js", "js/farm.js", "js/fx.js", "js/sprites.js", "js/game.js", "js/gear.js", "js/input.js", "js/layout.js", "js/sfx.js", "js/skills.js", "js/ui.js", "js/village.js", "js/quest.js", "js/fish.js", "js/cook.js", "js/animal.js", "js/weather.js", "js/world.js"];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
