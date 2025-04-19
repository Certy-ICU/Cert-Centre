/**
 * Cert Centre PWA Service Worker
 * 
 * This service worker handles:
 * - Cache management for offline access
 * - Push notifications
 * - Background sync
 */

const CACHE_NAME = 'cert-centre-cache-v1';
const OFFLINE_PAGE = '/offline.html';
const OFFLINE_IMAGE = '/images/offline-image.svg';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  OFFLINE_PAGE,
  OFFLINE_IMAGE,
  '/favicon.ico',
  '/manifest.json',
  '/css/main.css',
  '/js/main.js',
  '/images/logo.svg'
];

// Install event - precache key resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Install completed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.filter(cacheName => {
            return cacheName !== CACHE_NAME;
          }).map(cacheName => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache if available or fetch and cache
self.addEventListener('fetch', (event) => {
  // Don't cache API requests - they should be handled by the offline sync system
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses or non-GET requests
            if (!response || response.status !== 200 || event.request.method !== 'GET') {
              return response;
            }
            
            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch((error) => {
            console.log('[Service Worker] Fetch failed:', error);
            
            // For navigation requests, serve the offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_PAGE);
            }
            
            // For image requests, serve the offline image
            if (event.request.destination === 'image') {
              return caches.match(OFFLINE_IMAGE);
            }
            
            // Otherwise just throw the error
            throw error;
          });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  let notificationData = {};
  
  try {
    notificationData = event.data.json();
  } catch (e) {
    // If it's not JSON, use text
    notificationData = {
      title: 'Cert Centre',
      body: event.data.text(),
      icon: '/images/logo.svg'
    };
  }
  
  const title = notificationData.title || 'Cert Centre';
  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: notificationData.icon || '/images/logo.svg',
    badge: '/images/badge.png',
    tag: notificationData.tag || 'default',
    data: {
      url: notificationData.url || '/'
    },
    actions: notificationData.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event - open the app to the relevant page
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event.notification.tag);
  
  event.notification.close();
  
  // Get URL from the notification data or default to home
  const url = event.notification.data?.url || '/';
  
  // Focus an existing tab if it exists, otherwise open a new one
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  // Process different sync tags
  if (event.tag.startsWith('sync-')) {
    event.waitUntil(
      // Send a message to the client to process the sync
      // The client will use the offline-sync module to handle the actual sync
      processSync(event.tag)
        .then(() => {
          console.log('[Service Worker] Sync processed successfully:', event.tag);
          // Notify all clients that sync is completed
          return notifyClientsOfSyncComplete(event.tag);
        })
        .catch(error => {
          console.error('[Service Worker] Sync failed:', event.tag, error);
          return Promise.reject(error);
        })
    );
  }
});

/**
 * Process a sync tag by sending a message to all clients
 */
async function processSync(tag) {
  // First try to find an active client
  const clients = await self.clients.matchAll({ type: 'window' });
  
  if (clients.length > 0) {
    // If we have active clients, send a message to process the sync
    clients[0].postMessage({
      type: 'process-sync',
      tag: tag
    });
    
    // Return a promise that resolves after a timeout
    // This is a simple approach; in a real app you might want to
    // set up a more sophisticated message response system
    return new Promise(resolve => {
      setTimeout(resolve, 3000); // Allow 3 seconds for processing
    });
  } else {
    // If there are no active clients, try to fetch from all pending URLs
    // This assumes the offline-sync module stored the URLs to sync
    return fetch('/api/sync/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tag })
    });
  }
}

/**
 * Notify all clients that a sync operation has completed
 */
async function notifyClientsOfSyncComplete(tag) {
  const clients = await self.clients.matchAll({ type: 'window' });
  
  for (const client of clients) {
    client.postMessage({
      type: 'sync-completed',
      tag: tag
    });
  }
}

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 