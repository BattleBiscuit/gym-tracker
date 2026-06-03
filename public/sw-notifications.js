// Scheduled rest timer notification
let notifyTimer = null

self.addEventListener('message', event => {
  if (event.data?.type === 'SCHEDULE_NOTIFICATION') {
    // Clear any previous pending notification
    if (notifyTimer) { clearTimeout(notifyTimer); notifyTimer = null }

    const delay = event.data.delayMs
    // Use event.waitUntil to keep SW alive for the duration
    event.waitUntil(
      new Promise(resolve => {
        notifyTimer = setTimeout(async () => {
          notifyTimer = null
          await self.registration.showNotification('Rest done — time to lift! 💪', {
            icon: '/icon-192.png',
            silent: true,
            tag: 'rest-timer',
            renotify: true,
            body: 'Tap to return to your workout',
          }).catch(() => {})
          resolve()
        }, delay)
      })
    )
  }

  if (event.data?.type === 'CANCEL_NOTIFICATION') {
    if (notifyTimer) { clearTimeout(notifyTimer); notifyTimer = null }
    // Also close any displayed rest-timer notification
    self.registration.getNotifications({ tag: 'rest-timer' }).then(notifications => {
      notifications.forEach(n => n.close())
    })
  }
})

// Bring app to foreground when notification is tapped
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow('/')
    })
  )
})
