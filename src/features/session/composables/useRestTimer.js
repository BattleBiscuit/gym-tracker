import { watch, onUnmounted } from 'vue'
import { useSessionStore } from '../stores/useSessionStore.js'
import { triggerTimerAlert } from '@/composables/useTimerAlert.js'

export function useRestTimer() {
  const store = useSessionStore()
  let intervalId = null
  let endTime    = null

  function start() {
    if (intervalId) clearInterval(intervalId)
    endTime = Date.now() + store.restTimerRemaining * 1000

    // Tell the SW to schedule a notification at the exact end time
    scheduleSwNotification(store.restTimerRemaining)

    intervalId = setInterval(() => {
      const remaining = (endTime - Date.now()) / 1000
      if (remaining <= 0) {
        store.setRestTimerRemaining(0)
        stop()
        triggerTimerAlert()
      } else {
        store.setRestTimerRemaining(remaining)
      }
    }, 250)
  }

  function stop() {
    if (intervalId) { clearInterval(intervalId); intervalId = null }
    endTime = null
    cancelSwNotification()
  }

  async function scheduleSwNotification(seconds) {
    cancelSwNotification()
    try {
      const reg = await navigator.serviceWorker?.getRegistration()
      reg?.active?.postMessage({ type: 'SCHEDULE_NOTIFICATION', delayMs: Math.round(seconds * 1000) })
    } catch {}
  }

  function cancelSwNotification() {
    navigator.serviceWorker?.getRegistration().then(reg => {
      reg?.active?.postMessage({ type: 'CANCEL_NOTIFICATION' })
    }).catch(() => {})
  }

  watch(() => store.restTimerActive, active => {
    if (active) start()
    else stop()
  })

  onUnmounted(() => stop())
}
