import { reactive, ref, computed } from 'vue'
import { useRoutinesStore } from '../stores/useRoutinesStore.js'

export function useRoutineEditor() {
  const store = useRoutinesStore()

  const form = reactive({ name: '', notes: '' })
  const errors = reactive({})
  const isDirty = ref(false)
  const isSaving = ref(false)

  function loadFromStore() {
    if (store.currentRoutine) {
      form.name = store.currentRoutine.name
      form.notes = store.currentRoutine.notes || ''
    } else {
      form.name = ''
      form.notes = ''
    }
    isDirty.value = false
    Object.keys(errors).forEach(k => delete errors[k])
  }

  function markDirty() {
    isDirty.value = true
  }

  function validate() {
    Object.keys(errors).forEach(k => delete errors[k])
    if (!form.name.trim()) errors.name = 'Routine name is required'
    return Object.keys(errors).length === 0
  }

  async function save() {
    if (!validate()) return null
    isSaving.value = true
    try {
      const id = await store.saveRoutine({
        id: store.currentRoutine?.id || null,
        name: form.name.trim(),
        notes: form.notes.trim(),
      })
      isDirty.value = false
      return id
    } finally {
      isSaving.value = false
    }
  }

  return { form, errors, isDirty, isSaving, loadFromStore, markDirty, validate, save }
}
