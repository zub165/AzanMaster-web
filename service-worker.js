// Service Worker for Adhan Master
const CACHE_NAME = 'adhan-master-v2';

// Assets to cache
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/modules/app-init.js',
  './js/modules/prayer-calculator.js',
  './js/modules/adhan-player.js',
  './js/modules/qibla-compass.js',
  './js/modules/islamic-calendar.js',
  './js/modules/theme-manager.js',
  './js/modules/location-manager.js',
  './js/modules/dst-manager.js',
  './js/modules/notification-manager.js',
  './assets/icons/favicon.svg',
  './assets/icons/islamic-pattern.svg',
  './assets/adhans/default/adhan1.mp3',
  './assets/adhans/default/adhan2.mp3',
  './assets/adhans/default/adhan3.mp3',
  'https://cdn.jsdelivr.net/npm/adhan@4.4.3/dist/adhan.min.js',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
];

function isCacheableResponse(response) {
  if (!response) return false;
  if (response.status !== 200) return false;
  if (response.headers.get('content-range')) return false;
  return true;
}

async function putInCacheSafely(request, response) {
  if (!isCacheableResponse(response)) return;

  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch (error) {
    console.warn('[Service Worker] Skipping cache.put for request:', request.url, error);
  }
}

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell and content');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(error => {
        console.error('[Service Worker] Cache failure:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker...');
  
  // Claim clients to ensure the SW is in control immediately
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('fonts.googleapis.com') && 
      !event.request.url.includes('cdn.jsdelivr.net')) {
    return;
  }
  
  // For API requests, use network first, then cache
  if (event.request.url.includes('api.aladhan.com') || 
      event.request.url.includes('api.pray.zone')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          event.waitUntil(putInCacheSafely(event.request, response));
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For audio files, use cache first, then network
  if (event.request.url.includes('.mp3') || event.request.url.includes('.ogg')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              event.waitUntil(putInCacheSafely(event.request, response));
              return response;
            });
        })
    );
    return;
  }
  
  // For all other requests, use cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            event.waitUntil(putInCacheSafely(event.request, response));
            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch failed:', error);
            
            // For HTML requests when offline, return the offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
            
            return new Response('Network error', { status: 408, headers: { 'Content-Type': 'text/plain' } });
          });
      })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  console.log('[Service Worker] Push received:', event);
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: 'Adhan Master',
        body: event.data.text(),
        icon: './assets/icons/favicon.svg'
      };
    }
  } else {
    notificationData = {
      title: 'Adhan Master',
      body: 'Prayer time notification',
      icon: './assets/icons/favicon.svg'
    };
  }
  
  const options = {
    body: notificationData.body || 'Prayer time notification',
    icon: notificationData.icon || './assets/icons/favicon.svg',
    badge: './assets/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'Adhan Master', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click:', event);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(clientList => {
          // If a window client is already open, focus it
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Otherwise, open a new window
          if (clients.openWindow) {
            return clients.openWindow('./');
          }
        })
    );
  }
}); 