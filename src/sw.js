import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { createHandlerBoundToURL } from 'workbox-precaching'

// Precache all assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Navigation fallback for hash router
const handler = createHandlerBoundToURL('/index.html')
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/^\/api/],
})
registerRoute(navigationRoute)

// Skip waiting when told to
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
    return
  }

  // Rest timer finished — show notification from SW context so it works in background
  if (event.data?.type === 'REST_DONE') {
    self.registration.showNotification('Rest done — time to lift! 💪', {
      icon: '/icon-192.png',
      silent: true,
      tag: 'rest-timer',
      renotify: true,
    })
  }
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})
