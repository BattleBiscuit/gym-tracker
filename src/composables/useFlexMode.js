import { ref } from 'vue'

// Module-level singleton — all consumers share one matchMedia listener
const query = window.matchMedia('(screen-fold-posture: tabletop)')
export const isFlexMode = ref(query.matches)
query.addEventListener('change', e => { isFlexMode.value = e.matches })
