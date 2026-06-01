import { ref } from 'vue'
import { db } from '@/db/index.js'

// Module-level singleton — shared across all consumers
export const bodyweight = ref(80)
export const violentMode = ref(false)

let loaded = false

export async function loadConfig() {
  if (loaded) return
  loaded = true
  const bw = await db.config.get('bodyweight')
  if (bw?.value != null) bodyweight.value = bw.value
  const vm = await db.config.get('violentMode')
  if (vm?.value != null) violentMode.value = vm.value
}

export async function setBodyweight(kg) {
  bodyweight.value = kg
  await db.config.put({ key: 'bodyweight', value: kg })
}

export async function setViolentMode(enabled) {
  violentMode.value = enabled
  await db.config.put({ key: 'violentMode', value: enabled })
}
