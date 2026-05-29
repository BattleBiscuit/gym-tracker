import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { routinesRepository } from '../db/routinesRepository.js'

export const useRoutinesStore = defineStore('routines', () => {
  const routines = ref([])
  const currentRoutine = ref(null)
  const currentExercises = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const sortedRoutines = computed(() =>
    [...routines.value].sort((a, b) => b.updatedAt - a.updatedAt)
  )

  function exerciseCount(routineId) {
    // Used when full exercise list is loaded into currentExercises for a specific routine.
    // For the list view, each card re-queries or we track counts separately.
    return currentRoutine.value?.id === routineId ? currentExercises.value.length : 0
  }

  async function loadRoutines() {
    isLoading.value = true
    error.value = null
    try {
      routines.value = await routinesRepository.getAll()
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  async function loadRoutineForEdit(id) {
    isLoading.value = true
    error.value = null
    try {
      const [routine, exercises] = await Promise.all([
        routinesRepository.getById(id),
        routinesRepository.getExercisesForRoutine(id),
      ])
      currentRoutine.value = routine || null
      currentExercises.value = exercises.sort((a, b) => a.position - b.position)
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  async function saveRoutine(data) {
    error.value = null
    try {
      if (data.id) {
        await routinesRepository.update(data.id, { name: data.name, notes: data.notes })
        const idx = routines.value.findIndex(r => r.id === data.id)
        if (idx !== -1) {
          routines.value[idx] = { ...routines.value[idx], name: data.name, notes: data.notes, updatedAt: Date.now() }
        }
        return data.id
      } else {
        const routine = await routinesRepository.create(data)
        routines.value.unshift(routine)
        currentRoutine.value = routine
        currentExercises.value = []
        return routine.id
      }
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  async function deleteRoutine(id) {
    await routinesRepository.delete(id)
    routines.value = routines.value.filter(r => r.id !== id)
    if (currentRoutine.value?.id === id) {
      currentRoutine.value = null
      currentExercises.value = []
    }
  }

  async function addExercise(routineId, data) {
    const position = currentExercises.value.length
    const exercise = await routinesRepository.addExercise(routineId, data, position)
    currentExercises.value.push(exercise)
  }

  async function updateExercise(id, data) {
    await routinesRepository.updateExercise(id, data)
    const idx = currentExercises.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      currentExercises.value[idx] = { ...currentExercises.value[idx], ...data }
    }
  }

  async function removeExercise(id) {
    await routinesRepository.deleteExercise(id)
    const idx = currentExercises.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      currentExercises.value.splice(idx, 1)
      // Re-number positions
      await reorderExercises(currentExercises.value.map((e, i) => ({ id: e.id, position: i })))
    }
  }

  async function reorderExercises(updates) {
    await routinesRepository.reorderExercises(updates)
    for (const { id, position } of updates) {
      const ex = currentExercises.value.find(e => e.id === id)
      if (ex) ex.position = position
    }
    currentExercises.value.sort((a, b) => a.position - b.position)
  }

  function clearCurrent() {
    currentRoutine.value = null
    currentExercises.value = []
  }

  return {
    routines,
    currentRoutine,
    currentExercises,
    isLoading,
    error,
    sortedRoutines,
    exerciseCount,
    loadRoutines,
    loadRoutineForEdit,
    saveRoutine,
    deleteRoutine,
    addExercise,
    updateExercise,
    removeExercise,
    reorderExercises,
    clearCurrent,
  }
})
