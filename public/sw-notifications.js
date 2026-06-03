// Bring app to foreground when a notification is tapped
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) if (c.url && 'focus' in c) return c.focus()
      if (clients.openWindow) return clients.openWindow('/')
    })
  )
})
