import { onMounted, onUnmounted } from 'vue'
import { useSessionStore } from '../stores/useSessionStore.js'

// Orchestrates the elapsed timer tick. Called once from SessionActiveView.
export function useSessionRunner() {
  const store = useSessionStore()
  let elapsedInterval = null

  onMounted(() => {
    elapsedInterval = setInterval(() => {
      store.tickElapsed()
    }, 1000)
  })

  onUnmounted(() => {
    if (elapsedInterval) {
      clearInterval(elapsedInterval)
      elapsedInterval = null
    }
  })
}
