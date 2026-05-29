import { ref } from 'vue'
import { db } from '@/db/index.js'

// Module-level singleton — shared across all consumers
export const bodyweight = ref(80) // default 80kg until loaded from DB

let loaded = false

export async function loadConfig() {
  if (loaded) return
  loaded = true
  const bw = await db.config.get('bodyweight')
  if (bw?.value != null) bodyweight.value = bw.value
}

export async function setBodyweight(kg) {
  bodyweight.value = kg
  await db.config.put({ key: 'bodyweight', value: kg })
}
