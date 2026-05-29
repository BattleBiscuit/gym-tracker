import { watch, onUnmounted } from 'vue'
import { useSessionStore } from '../stores/useSessionStore.js'

// rAF-based timer — pauses when tab is backgrounded, no drift
export function useRestTimer() {
  const store = useSessionStore()
  let rafId = null
  let lastTimestamp = null

  function tick(timestamp) {
    if (lastTimestamp === null) {
      lastTimestamp = timestamp
    }
    const delta = (timestamp - lastTimestamp) / 1000
    lastTimestamp = timestamp
    store.tickRestTimer(delta)

    if (store.restTimerActive) {
      rafId = requestAnimationFrame(tick)
    } else {
      rafId = null
      lastTimestamp = null
    }
  }

  watch(() => store.restTimerActive, active => {
    if (active && rafId === null) {
      lastTimestamp = null
      rafId = requestAnimationFrame(tick)
    } else if (!active && rafId !== null) {
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
