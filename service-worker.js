const CACHE_NAME = 'pwa-sample-cache';
const RESOURCES_TO_PRELOAD = [
    'index.html',
    'register-worker.js',
    'manifest.json',
    'offline.html'
];
const offlineUrl = 'offline.html';
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(RESOURCES_TO_PRELOAD);
            // if any item isn't successfully added to
            // cache, the whole operation fails.
        }).catch(function(error) {
            console.error(error);
        })
    );
});

// Delete obsolete caches during activate
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keyList) {
            return Promise.all(keyList.map(function(key) {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});

// During runtime, get files from cache or -> fetch, then save to cache
this.addEventListener('fetch', event => {
    // request.mode = navigate isn't supported in all browsers
    // so include a check for Accept: text/html header.
    if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
        event.respondWith(
            fetch(event.request.url).catch(error => {
                // Return the offline page
                return caches.match(offlineUrl);
            })
        );
    } else {
        // Respond with everything else if we can
        event.respondWith(caches.match(event.request)
            .then(function(response) {
                return response || fetch(event.request);
            })
        );
    }
});