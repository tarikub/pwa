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
self.addEventListener('fetch', function (event) {
    // only process GET requests
    if (event.request.method === 'GET') {
        event.respondWith(
            fetch(event.request.url).catch(error => {
                // Return the offline page
                return caches.match(offlineUrl);
            }));
    }

    let requestCopy = event.request.clone();
    return fetch(requestCopy).then(function (response) {
        // opaque responses cannot be examined, they will just error
        if (response.type === 'opaque') {
            // don't cache opaque response, you cannot validate it's status/success
            return response;
            // response.ok => response.status == 2xx ? true : false;
        } else if (!response.ok) {
            console.error(response.statusText);
        } else {
            return caches.open(CACHE_NAME).then(function (cache) {
                cache.put(event.request, response.clone());
                return response;
                // if the response fails to cache, catch the error
            }).catch(function (error) {
                console.error(error);
                return error;
            });
        }
    }).catch(function (error) {
        // fetch will fail if server cannot be reached,
        // this means that either the client or server is offline
        console.log("Client or server is offline");
        return caches.match(offlineUrl);
    });
});