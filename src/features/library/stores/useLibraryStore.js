import { defineStore } from 'pinia'
import { ref } from 'vue'
import { libraryRepository } from '../db/libraryRepository.js'

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
    await libraryRepository.update(id, data)
    const idx = exercises.value.findIndex(e => e.id === id)
    if (idx !== -1) exercises.value[idx] = { ...exercises.value[idx], ...data }
  }

  async function remove(id) {
    await libraryRepository.delete(id)
    exercises.value = exercises.value.filter(e => e.id !== id)
  }

  return { exercises, isLoading, loadAll, search, create, update, remove }
})
