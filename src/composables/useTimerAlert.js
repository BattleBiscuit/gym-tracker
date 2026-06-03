// Triggers vibration + beep when the rest timer ends.
// Vibration: Web Vibration API (Android). Silent on iOS.
// Beep: Web Audio API synthesized tone. Works on both platforms
//        if not on silent — no audio file needed.

export function triggerTimerAlert() {
  vibrate()
  beep()
  notify()
}

export async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

async function notify() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      // showNotification via SW works even when app is backgrounded
      reg.showNotification('Rest done — time to lift! 💪', {
        icon: '/icon-192.png',
        silent: true,   // beep already played
        tag: 'rest-timer',
        renotify: true,
      })
    } else {
      new Notification('Rest done — time to lift! 💪', { icon: '/icon-192.png', silent: true })
    }
  } catch {
    // Silently ignore
  }
}

function vibrate() {
  if (!navigator.vibrate) return
  // Three short pulses: 200ms on, 100ms off, 200ms on, 100ms off, 200ms on
  navigator.vibrate([200, 100, 200, 100, 200])
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    // Two-tone beep: 880Hz then 1100Hz
    const tones = [
      { freq: 880,  start: 0,    duration: 0.12 },
      { freq: 1100, start: 0.15, duration: 0.12 },
    ]

    for (const { freq, start, duration } of tones) {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.value = freq

      // Fade in/out to avoid clicks
      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + start + 0.01)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration)

      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration + 0.05)
    }

    // Close context after all tones finish
    setTimeout(() => ctx.close(), 600)
  } catch {
    // Audio context unavailable — silently ignore
  }
}
