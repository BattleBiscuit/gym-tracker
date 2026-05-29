import { defineStore } from 'pinia'
import { ref } from 'vue'
import { analyticsRepository } from '../db/analyticsRepository.js'

export const useAnalyticsStore = defineStore('analytics', () => {
  const selectedExercise = ref(null)   // { id, name } from library
  const rangeDays        = ref(30)

  const oneRMData       = ref([])
  const volumeData      = ref([])
  const weeklyData      = ref([])
  const muscleVolume    = ref([])
  const muscleFrequency = ref([])
  const summaryStats    = ref({ totalSessions: 0, totalVolume: 0, prCount: 0 })
  const isLoading       = ref(false)

  async function loadExerciseData() {
    if (!selectedExercise.value) return
    isLoading.value = true
    try {
      const { oneRM, volume } = await analyticsRepository.getExerciseProgressData(
        selectedExercise.value.id,
        selectedExercise.value.name,
        rangeDays.value,
      )
      oneRMData.value  = oneRM
      volumeData.value = volume
    } finally {
      isLoading.value = false
    }
  }

  async function loadWeeklyData() {
    weeklyData.value = await analyticsRepository.getWeeklyVolumeData(rangeDays.value)
  }

  async function loadMuscleData() {
    const { volume, frequency } = await analyticsRepository.getMuscleGroupData(rangeDays.value)
    muscleVolume.value    = volume
    muscleFrequency.value = frequency
  }

  async function loadSummary() {
    summaryStats.value = await analyticsRepository.getSummaryStats(rangeDays.value)
  }

  async function loadAll() {
    await Promise.all([
      loadSummary(),
      loadWeeklyData(),
      loadMuscleData(),
      selectedExercise.value ? loadExerciseData() : Promise.resolve(),
    ])
  }

  function setExercise(exercise) {
    selectedExercise.value = exercise
    loadExerciseData()
  }

  function setRange(days) {
    rangeDays.value = days
    loadAll()
  }

  return {
    selectedExercise,
    rangeDays,
    oneRMData,
    volumeData,
    weeklyData,
    muscleVolume,
    muscleFrequency,
    summaryStats,
    isLoading,
    loadAll,
    loadExerciseData,
    loadWeeklyData,
    loadMuscleData,
    setExercise,
    setRange,
  }
})
