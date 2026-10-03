// Bump when bundled UI/gesture code changes so installed PWAs refresh offline assets.
const CACHE_NAME = 'boggle-v34';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/lib/peerjs.min.js',
    './js/lib/qrcode.min.js',
    './js/lib/html5-qrcode.min.js',
    './js/game.min.js',
    './manifest.json',
    './dictionaries/it.bin',
    './dictionaries/en.bin',
    './dictionaries/es.bin'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    // Network first, fallback to cache for freshest local changes
    e.respondWith(
        fetch(e.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
                }
                return networkResponse;
            })
            .catch(() => caches.match(e.request))
    );
});
