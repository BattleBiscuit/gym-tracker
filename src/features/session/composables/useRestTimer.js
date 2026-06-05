import { watch, onUnmounted } from 'vue'
import { useSessionStore } from '../stores/useSessionStore.js'
import { triggerTimerAlert } from '@/composables/useTimerAlert.js'
import { scheduleRestNotification, cancelRestNotification } from '@/composables/useNative.js'

// rAF-based timer — pauses when tab is backgrounded, no drift.
// On native Android, also schedules a LocalNotification so the alert fires
// even if the user locks the screen mid-rest.
export function useRestTimer() {
  const store = useSessionStore()
  let rafId = null
  let lastTimestamp = null

  function tick(timestamp) {
    if (lastTimestamp === null) lastTimestamp = timestamp
    const delta = (timestamp - lastTimestamp) / 1000
    lastTimestamp = timestamp

    const wasActive = store.restTimerActive
    store.tickRestTimer(delta)

    if (wasActive && !store.restTimerActive) {
      cancelRestNotification()
      triggerTimerAlert()
      rafId = null
      lastTimestamp = null
      return
    }

    if (store.restTimerActive) {
      rafId = requestAnimationFrame(tick)
    } else {
      rafId = null
      lastTimestamp = null
    }
  }

  watch(() => store.restTimerActive, active => {
    if (active && rafId === null) {
      // Schedule a native notification for the full rest duration.
      // If the app is foregrounded when it fires, the rAF timer will have
      // already triggered the alert and we cancel the notification first.
      scheduleRestNotification(store.restTimerTotal)
      lastTimestamp = null
      rafId = requestAnimationFrame(tick)
    } else if (!active && rafId !== null) {
      cancelRestNotification()
      cancelAnimationFrame(rafId)
      rafId = null
      lastTimestamp = null
    }
  })

  onUnmounted(() => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  })
}
