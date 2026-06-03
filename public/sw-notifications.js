// Handles REST_DONE message from the app to show background notifications
self.addEventListener('message', event => {
  if (event.data?.type === 'REST_DONE') {
    event.waitUntil(
      self.registration.showNotification('Rest done — time to lift! 💪', {
        icon: '/icon-192.png',
        silent: true,
        tag: 'rest-timer',
        renotify: true,
      }).catch(() => {})
    )
  }
})
