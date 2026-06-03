import { defineStore } from 'pinia'
import { ref } from 'vue'
import { bodyRepository, METRIC_TYPES } from '../db/bodyRepository.js'
import { bodyweight, setBodyweight } from '@/composables/useConfig.js'

export const useBodyStore = defineStore('body', () => {
  const latest  = ref({})   // type → latest entry
  const history = ref({})   // type → entry[]
  const isLoading = ref(false)

  async function loadLatest() {
    latest.value = await bodyRepository.getLatest()
    // Sync bodyweight config with latest logged weight
    if (latest.value.weight) {
      await setBodyweight(latest.value.weight.value)
    }
  }

  async function loadHistory(type, days = 90) {
    history.value[type] = await bodyRepository.getHistory(type, days)
  }

  async function log(type, value) {
    const entry = await bodyRepository.log(type, value)
    latest.value[type] = entry
    // Keep history in sync if loaded
    if (history.value[type]) {
      history.value[type].push(entry)
    }
    // Sync bodyweight config when weight is logged
    if (type === 'weight') {
      await setBodyweight(value)
    }
    return entry
  }

  async function remove(type, id) {
    await bodyRepository.delete(id)
    if (history.value[type]) {
      history.value[type] = history.value[type].filter(e => e.id !== id)
    }
    // Refresh latest for this type
    const remaining = await bodyRepository.getHistory(type)
    latest.value[type] = remaining[remaining.length - 1] ?? null
  }

  return { latest, history, isLoading, loadLatest, loadHistory, log, remove }
})
