/**
 * Native bridge — wraps Capacitor plugins with browser fallbacks.
 * Works in both the PWA (browser) and the Capacitor Android WebView.
 * Import from here; never import Capacitor plugins directly in components.
 */

import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

// ─── Lazy plugin imports ───────────────────────────────────────────────────

let _haptics = null
let _notif   = null
let _awake   = null

async function haptics() {
  if (!isNative) return null
  if (!_haptics) ({ Haptics: _haptics } = await import('@capacitor/haptics'))
  return _haptics
}

async function notifications() {
  if (!isNative) return null
  if (!_notif) ({ LocalNotifications: _notif } = await import('@capacitor/local-notifications'))
  return _notif
}

async function keepAwake() {
  if (!isNative) return null
  if (!_awake) ({ KeepAwake: _awake } = await import('@capacitor-community/keep-awake'))
  return _awake
}

// ─── Haptics ──────────────────────────────────────────────────────────────

/** Light tap — set confirmation, button presses */
export async function hapticTap() {
  const h = await haptics()
  if (h) {
    const { ImpactStyle } = await import('@capacitor/haptics')
    await h.impact({ style: ImpactStyle.Light })
  }
}

/** Heavy pulse — PR achieved */
export async function hapticPR() {
  const h = await haptics()
  if (h) {
    const { ImpactStyle } = await import('@capacitor/haptics')
    await h.impact({ style: ImpactStyle.Heavy })
    setTimeout(() => h.impact({ style: ImpactStyle.Heavy }), 120)
  } else {
    navigator.vibrate?.([100, 60, 100])
  }
}

/** Success vibration pattern — session complete */
export async function hapticSuccess() {
  const h = await haptics()
  if (h) {
    const { NotificationType } = await import('@capacitor/haptics')
    await h.notification({ type: NotificationType.Success })
  } else {
    navigator.vibrate?.([200, 100, 200, 100, 200])
  }
}

// ─── Local Notifications (rest timer) ─────────────────────────────────────

let _notifPermission = null

async function ensureNotifPermission() {
  const n = await notifications()
  if (!n) return false
  if (_notifPermission === true) return true
  const { display } = await n.checkPermissions()
  if (display === 'granted') { _notifPermission = true; return true }
  const { display: after } = await n.requestPermissions()
  _notifPermission = after === 'granted'
  return _notifPermission
}

const REST_NOTIF_ID = 1001

/**
 * Schedule a "Rest complete" notification `seconds` from now.
 * On browser, falls back to a no-op (the rAF timer handles it when foregrounded).
 */
export async function scheduleRestNotification(seconds) {
  const ok = await ensureNotifPermission()
  if (!ok) return
  const n = await notifications()
  if (!n) return

  // Cancel any pending rest notification first
  await n.cancel({ notifications: [{ id: REST_NOTIF_ID }] })

  const at = new Date(Date.now() + seconds * 1000)
  await n.schedule({
    notifications: [{
      id:    REST_NOTIF_ID,
      title: 'Rest complete',
      body:  'Time to hit the next set 💪',
      schedule: { at, allowWhileIdle: true },
      sound: null,
      smallIcon: 'ic_stat_notify',
      iconColor: '#e8ff47',
    }],
  })
}

/** Cancel the pending rest notification (timer dismissed manually). */
export async function cancelRestNotification() {
  const n = await notifications()
  if (!n) return
  await n.cancel({ notifications: [{ id: REST_NOTIF_ID }] })
}

// ─── Keep awake ───────────────────────────────────────────────────────────

/** Prevent screen from sleeping during an active session. */
export async function keepScreenAwake() {
  const k = await keepAwake()
  if (k) {
    await k.keepAwake()
  } else {
    // Browser fallback: WakeLock API
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen')
        return () => lock.release()
      }
    } catch {}
  }
  return () => releaseScreenAwake()
}

/** Allow screen to sleep again. */
export async function releaseScreenAwake() {
  const k = await keepAwake()
  if (k) await k.allowSleep()
}
