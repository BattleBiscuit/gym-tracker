import { defineStore } from 'pinia'
import { ref } from 'vue'
import { plansRepository } from '../db/plansRepository.js'

export const usePlansStore = defineStore('plans', () => {
  const plans       = ref([])
  const entries     = ref({})
  const streaks     = ref({})   // planId → streak count
  const doneThisWeek = ref(new Set())
  const plannedRoutineIds = ref(new Set())
  const isLoading   = ref(false)

  async function loadAll() {
    isLoading.value = true
    try {
      plans.value = await plansRepository.getAll()
      // Load entries for all plans in parallel
      const results = await Promise.all(
        plans.value.map(p => plansRepository.getEntriesForPlan(p.id))
      )
      const map = {}
      plans.value.forEach((p, i) => { map[p.id] = results[i] })
      entries.value = map

      doneThisWeek.value    = await plansRepository.getCompletedEntryIdsThisWeek()
      plannedRoutineIds.value = await plansRepository.getPlannedRoutineIds()

      // Compute streaks for all plans in parallel
      const streakResults = await Promise.all(
        plans.value.map(p => plansRepository.getStreak(p.id, map[p.id] || []))
      )
      const streakMap = {}
      plans.value.forEach((p, i) => { streakMap[p.id] = streakResults[i] })
      streaks.value = streakMap
    } finally {
      isLoading.value = false
    }
  }

  async function createPlan(name) {
    const plan = await plansRepository.create({ name })
    plans.value.push(plan)
    entries.value[plan.id] = []
    return plan
  }

  async function updatePlan(id, data) {
    await plansRepository.update(id, data)
    const idx = plans.value.findIndex(p => p.id === id)
    if (idx !== -1) plans.value[idx] = { ...plans.value[idx], ...data }
  }

  async function deletePlan(id) {
    await plansRepository.delete(id)
    plans.value = plans.value.filter(p => p.id !== id)
    delete entries.value[id]
  }

  async function addEntry(planId, data) {
    const entry = await plansRepository.addEntry(planId, data)
    if (!entries.value[planId]) entries.value[planId] = []
    entries.value[planId].push(entry)
    plannedRoutineIds.value.add(data.routineId)
    return entry
  }

  async function updateEntry(planId, entryId, data) {
    await plansRepository.updateEntry(entryId, data)
    const list = entries.value[planId] || []
    const idx = list.findIndex(e => e.id === entryId)
    if (idx !== -1) list[idx] = { ...list[idx], ...data }
  }

  async function deleteEntry(planId, entryId) {
    await plansRepository.deleteEntry(entryId)
    entries.value[planId] = (entries.value[planId] || []).filter(e => e.id !== entryId)
  }

  async function reorderEntries(planId, updates) {
    await plansRepository.reorderEntries(updates)
    for (const { id, order } of updates) {
      const e = (entries.value[planId] || []).find(e => e.id === id)
      if (e) e.order = order
    }
    entries.value[planId]?.sort((a, b) => a.order - b.order)
  }

  function isDoneThisWeek(entryId) {
    return doneThisWeek.value.has(entryId)
  }

  return {
    plans,
    entries,
    streaks,
    doneThisWeek,
    plannedRoutineIds,
    isLoading,
    loadAll,
    createPlan,
    updatePlan,
    deletePlan,
    addEntry,
    updateEntry,
    deleteEntry,
    reorderEntries,
    isDoneThisWeek,
  }
})
