import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { historyRepository } from '../db/historyRepository.js'

export const useHistoryStore = defineStore('history', () => {
  const sessions = ref([])
  const selectedSession = ref(null)
  const selectedSets = ref([])   // grouped: selectedSets[exercisePosition] = WorkoutSet[]
  const totalCount = ref(0)
  const page = ref(1)
  const pageSize = 20
  const isLoading = ref(false)

  const hasMore = computed(() => page.value * pageSize < totalCount.value)

  const groupedByMonth = computed(() => {
    const groups = {}
    for (const s of sessions.value) {
      const key = new Date(s.startedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      if (!groups[key]) groups[key] = []
      groups[key].push(s)
    }
    return groups
  })

  async function loadHistory(targetPage = 1) {
    if (isLoading.value) return
    isLoading.value = true
    try {
      totalCount.value = await historyRepository.getCount()
      const results = await historyRepository.getPage(targetPage, pageSize)
      if (targetPage === 1) {
        sessions.value = results
      } else {
        sessions.value = [...sessions.value, ...results]
      }
      page.value = targetPage
    } finally {
      isLoading.value = false
    }
  }

  async function loadSessionDetail(id) {
    selectedSession.value = await historyRepository.getById(id)
    const sets = await historyRepository.getSetsForSession(id)

    // Group sets by exercisePosition
    const grouped = {}
    for (const s of sets.sort((a, b) => a.setIndex - b.setIndex)) {
      if (!grouped[s.exercisePosition]) grouped[s.exercisePosition] = []
      grouped[s.exercisePosition].push(s)
    }
    selectedSets.value = grouped
  }

  async function deleteSession(id) {
    await historyRepository.deleteSession(id)
    sessions.value = sessions.value.filter(s => s.id !== id)
    totalCount.value = Math.max(0, totalCount.value - 1)
    if (selectedSession.value?.id === id) {
      selectedSession.value = null
      selectedSets.value = []
    }
  }

  return {
    sessions,
    selectedSession,
    selectedSets,
    totalCount,
    page,
    pageSize,
    isLoading,
    hasMore,
    groupedByMonth,
    loadHistory,
    loadSessionDetail,
    deleteSession,
  }
})
