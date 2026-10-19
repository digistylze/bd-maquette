/* Velours — service worker : app installable et consultable hors connexion */
const CACHE = 'velours-v7';
const SHELL = [
"./",
"index.html",
"css/app.css",
"img/logo-b.webp",
"img/logo-b-s.webp",
"manifest.webmanifest",
"js/account.js",
"js/admin.js",
"js/core.js",
"js/data.js",
"js/main.js",
"js/pro.js",
"js/public.js",
"js/ui.js",
"icons/apple-touch-icon.png",
"icons/icon-192.png",
"icons/icon-512.png",
"icons/icon.svg",
"icons/maskable-512.png",
"icons/maskable.svg",
"icons/neutral.svg",
"img/geneve.webp",
"img/p/adrien-s.webp",
"img/p/adrien.webp",
"img/p/alexia-s.webp",
"img/p/alexia.webp",
"img/p/alma-2-s.webp",
"img/p/alma-2.webp",
"img/p/alma-jade-s.webp",
"img/p/alma-jade.webp",
"img/p/alma-s.webp",
"img/p/alma.webp",
"img/p/anya-s.webp",
"img/p/anya.webp",
"img/p/bianca-s.webp",
"img/p/bianca.webp",
"img/p/camille-s.webp",
"img/p/camille.webp",
"img/p/clara-hugo-s.webp",
"img/p/clara-hugo.webp",
"img/p/daria-s.webp",
"img/p/daria-selfie-s.webp",
"img/p/daria.webp",
"img/p/elena-s.webp",
"img/p/elena.webp",
"img/p/ines-s.webp",
"img/p/ines.webp",
"img/p/jade-s.webp",
"img/p/jade.webp",
"img/p/kiara-s.webp",
"img/p/kiara.webp",
"img/p/leila-s.webp",
"img/p/leila.webp",
"img/p/lina-s.webp",
"img/p/lina.webp",
"img/p/luna-s.webp",
"img/p/luna.webp",
"img/p/marco-s.webp",
"img/p/marco.webp",
"img/p/maya-s.webp",
"img/p/maya.webp",
"img/p/nina-sasha-s.webp",
"img/p/nina-sasha.webp",
"img/p/nora-s.webp",
"img/p/nora.webp",
"img/p/samuel-s.webp",
"img/p/samuel.webp",
"img/p/sofia-s.webp",
"img/p/sofia.webp",
"img/p/valentina-2-s.webp",
"img/p/valentina-2.webp",
"img/p/valentina-s.webp",
"img/p/valentina.webp",
"img/p/zoe-s.webp",
"img/p/zoe.webp"
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // navigation : réseau d'abord, sinon la page en cache
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put('index.html', cp)); return r; }).catch(() => caches.match('index.html')));
    return;
  }
  // code de l'app : réseau d'abord (toujours à jour), cache si hors connexion
  if (url.origin === location.origin && !/\.(webp|png|svg)$/.test(url.pathname)) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return r; }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  // images et polices : cache d'abord, mise à jour en arrière-plan
  if (url.origin === location.origin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    e.respondWith(caches.match(req).then((hit) => {
      const net = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
