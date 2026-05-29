export function formatDuration(startedAt, completedAt) {
  if (!completedAt) return '—'
  const ms = completedAt - startedAt
  const m = Math.floor(ms / 60000)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m}m`
}

export function formatVolume(volumeKg) {
  if (!volumeKg) return '—'
  return `${Math.round(volumeKg).toLocaleString()} kg`
}

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
