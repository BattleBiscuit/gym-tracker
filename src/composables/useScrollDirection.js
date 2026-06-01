import { ref } from 'vue'

// Module-level singleton — shared between AppPageShell and App.vue
export const scrolledDown = ref(false)

let lastY = 0

export function onScroll(e) {
  const y = e.target.scrollTop
  if (Math.abs(y - lastY) < 8) return  // ignore tiny movements
  scrolledDown.value = y > lastY && y > 40
  lastY = y
}
