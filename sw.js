const CACHE = 'meduca-2026-v28';

// Al instalar: guardar el index.html en caché
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(cache => {
            return cache.addAll([
                './',
                './index.html'
            ]);
        })
    );
    self.skipWaiting();
});

// Al activar: borrar cachés viejos
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Cada petición: primero intentar red, si falla usar caché
self.addEventListener('fetch', e => {
    // Solo manejar peticiones GET
    if (e.request.method !== 'GET') return;

    // Para el Apps Script (sync) — solo red, nunca caché
    if (e.request.url.includes('script.google.com')) return;

    e.respondWith(
        fetch(e.request)
            .then(response => {
                // Guardar respuesta fresca en caché
                const clone = response.clone();
                caches.open(CACHE).then(cache => cache.put(e.request, clone));
                return response;
            })
            .catch(() => {
                // Sin internet — servir desde caché
                return caches.match(e.request)
                    .then(cached => cached || caches.match('./index.html'));
            })
    );
});
