import { defineStore } from 'pinia'
import { ref } from 'vue'
import { libraryRepository } from '../db/libraryRepository.js'
import { db } from '@/db/index.js'

export const useLibraryStore = defineStore('library', () => {
  const exercises = ref([])
  const isLoading = ref(false)

  async function loadAll() {
    isLoading.value = true
    try {
      exercises.value = await libraryRepository.getAll()
    } finally {
      isLoading.value = false
    }
  }

  async function search(query) {
    return libraryRepository.search(query)
  }

  async function create(data) {
    const entry = await libraryRepository.create(data)
    exercises.value.push(entry)
    exercises.value.sort((a, b) => a.name.localeCompare(b.name))
    return entry
  }

  async function update(id, data) {
    const prev = exercises.value.find(e => e.id === id)
    await libraryRepository.update(id, data)
    const idx = exercises.value.findIndex(e => e.id === id)
    if (idx !== -1) exercises.value[idx] = { ...exercises.value[idx], ...data }

    // Propagate name change to all routineExercises linked to this library entry
    if (data.name && prev && data.name !== prev.name) {
      const linked = await db.routineExercises
        .where('exerciseLibraryId').equals(id)
        .toArray()
      if (linked.length) {
        await db.transaction('rw', db.routineExercises, db.routines, async () => {
          for (const re of linked) {
            await db.routineExercises.update(re.id, { name: data.name })
            // Touch the routine's updatedAt so lists refresh
            await db.routines.update(re.routineId, { updatedAt: Date.now() })
          }
        })
      }
    }
  }

  async function remove(id) {
    await libraryRepository.delete(id)
    exercises.value = exercises.value.filter(e => e.id !== id)
  }

  return { exercises, isLoading, loadAll, search, create, update, remove }
})
