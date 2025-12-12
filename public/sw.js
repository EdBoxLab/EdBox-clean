const CACHE_NAME = 'edbox-v1';
const RUNTIME_CACHE = 'edbox-runtime-v1';
const IMAGE_CACHE = 'edbox-images-v1';
const API_CACHE = 'edbox-api-v1';

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json'
];

const API_CACHE_ROUTES = [
  '/api/skill-graph/list',
  '/api/my-study-sets',
  '/api/notes',
  '/api/circles',
  '/api/study-circles',
  '/api/creators',
  '/api/feed'
];

const CACHE_DURATION = {
  api: 5 * 60 * 1000,
  image: 7 * 24 * 60 * 60 * 1000,
  static: 30 * 24 * 60 * 60 * 1000
};

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('edbox-') && 
                   name !== CACHE_NAME && 
                   name !== RUNTIME_CACHE && 
                   name !== IMAGE_CACHE &&
                   name !== API_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/static/')) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, CACHE_DURATION.image));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    const shouldCache = API_CACHE_ROUTES.some(route => url.pathname.startsWith(route));
    if (shouldCache) {
      event.respondWith(networkFirstWithCache(request, API_CACHE, CACHE_DURATION.api));
    } else {
      event.respondWith(fetch(request));
    }
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});

async function cacheFirst(request, cacheName, maxAge = CACHE_DURATION.static) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const cachedTime = new Date(cached.headers.get('sw-cache-time') || 0).getTime();
    const now = Date.now();
    
    if (maxAge && now - cachedTime > maxAge) {
      console.log('[SW] Cache expired, fetching fresh:', request.url);
      try {
        const fresh = await fetch(request);
        if (fresh.ok) {
          const cloned = fresh.clone();
          const headers = new Headers(cloned.headers);
          headers.set('sw-cache-time', new Date().toISOString());
          
          const responseWithTime = new Response(await cloned.blob(), {
            status: cloned.status,
            statusText: cloned.statusText,
            headers: headers
          });
          
          await cache.put(request, responseWithTime);
          return fresh;
        }
      } catch (error) {
        console.log('[SW] Fetch failed, returning stale cache:', error);
        return cached;
      }
    }
    return cached;
  }

  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cloned = fresh.clone();
      const headers = new Headers(cloned.headers);
      headers.set('sw-cache-time', new Date().toISOString());
      
      const responseWithTime = new Response(await cloned.blob(), {
        status: cloned.status,
        statusText: cloned.statusText,
        headers: headers
      });
      
      await cache.put(request, responseWithTime);
    }
    return fresh;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

async function networkFirstWithCache(request, cacheName, maxAge = CACHE_DURATION.api) {
  const cache = await caches.open(cacheName);

  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cloned = fresh.clone();
      const headers = new Headers(cloned.headers);
      headers.set('sw-cache-time', new Date().toISOString());
      
      const responseWithTime = new Response(await cloned.blob(), {
        status: cloned.status,
        statusText: cloned.statusText,
        headers: headers
      });
      
      await cache.put(request, responseWithTime);
    }
    return fresh;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    
    if (cached) {
      const cachedTime = new Date(cached.headers.get('sw-cache-time') || 0).getTime();
      const now = Date.now();
      
      if (maxAge && now - cachedTime > maxAge) {
        console.log('[SW] Cache expired but returning due to network failure');
      }
      return cached;
    }
    
    throw error;
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name.startsWith('edbox-')) {
              return caches.delete(name);
            }
          })
        );
      })
    );
  }
});
