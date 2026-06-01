import { reactive, ref } from 'vue'

export const DEFAULT_STRENGTH_SET = () => ({ type: 'strength', reps: 10, weight: 0, isBodyweight: false, restSeconds: 90 })
export const DEFAULT_CARDIO_SET   = () => ({ type: 'cardio', duration: 20, level: 1, restSeconds: 0 })

export function useExerciseEditor() {
  const form = reactive({
    name: '',
    exerciseLibraryId: null,
    exerciseType: 'strength',
    notes: '',
    sets: [DEFAULT_STRENGTH_SET()],
  })
  const errors = reactive({})
  const editingId = ref(null)

  function load(exercise) {
    editingId.value = exercise?.id || null
    form.name              = exercise?.name              || ''
    form.exerciseLibraryId = exercise?.exerciseLibraryId || null
    form.exerciseType      = exercise?.exerciseType      || exercise?.sets?.[0]?.type || 'strength'
    form.notes             = exercise?.notes             || ''
    form.sets              = exercise?.sets?.map(s => ({ ...s })) || [DEFAULT_STRENGTH_SET()]
    Object.keys(errors).forEach(k => delete errors[k])
  }

  function reset() {
    editingId.value = null
    form.name              = ''
    form.exerciseLibraryId = null
    form.exerciseType      = 'strength'
    form.notes             = ''
    form.sets              = [DEFAULT_STRENGTH_SET()]
    Object.keys(errors).forEach(k => delete errors[k])
  }

  function setExerciseType(type) {
    form.exerciseType = type
    // Rebuild sets with correct defaults when type changes
    const count = form.sets.length || 1
    form.sets = Array.from({ length: count }, type === 'cardio' ? DEFAULT_CARDIO_SET : DEFAULT_STRENGTH_SET)
  }

  function addSet() {
    const last = form.sets[form.sets.length - 1]
    form.sets.push({ ...last })
  }

  function defaultSet() {
    return form.exerciseType === 'cardio' ? DEFAULT_CARDIO_SET() : DEFAULT_STRENGTH_SET()
  }

  function removeSet(idx) {
    if (form.sets.length > 1) form.sets.splice(idx, 1)
  }

  function validate() {
    Object.keys(errors).forEach(k => delete errors[k])
    if (!form.name.trim()) errors.name = 'Select or create an exercise'
    if (!form.sets.length) errors.sets = 'At least 1 set required'
    form.sets.forEach((s, i) => {
      if (s.type === 'cardio') {
        if (s.duration == null || s.duration < 1) errors[`set_${i}_duration`] = 'Min 1'
        if (s.level == null || s.level < 0)       errors[`set_${i}_level`]    = '≥ 0'
      } else {
        if (s.reps == null || s.reps < 1)         errors[`set_${i}_reps`]     = 'Min 1'
        if (s.weight == null || s.weight < 0)     errors[`set_${i}_weight`]   = '≥ 0'
      }
      if (s.restSeconds == null || s.restSeconds < 0) errors[`set_${i}_rest`] = '≥ 0'
    })
    return Object.keys(errors).length === 0
  }

  function getData() {
    return {
      name:              form.name.trim(),
      exerciseLibraryId: form.exerciseLibraryId || null,
      exerciseType:      form.exerciseType,
      notes:             form.notes.trim(),
      sets:              form.sets.map(s =>
        s.type === 'cardio'
          ? { type: 'cardio', duration: Number(s.duration), level: Number(s.level), restSeconds: Number(s.restSeconds) }
          : { type: 'strength', reps: Number(s.reps), weight: Number(s.weight), isBodyweight: !!s.isBodyweight, restSeconds: Number(s.restSeconds) }
      ),
    }
  }

  return { form, errors, editingId, load, reset, addSet, removeSet, setExerciseType, validate, getData }
}
