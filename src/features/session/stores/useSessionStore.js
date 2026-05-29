import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sessionRepository } from '../db/sessionRepository.js'
import { routinesRepository } from '@/features/routines/db/routinesRepository.js'

export const useSessionStore = defineStore('session', () => {
  const activeSessionId = ref(null)
  const activeSession = ref(null)
  const exercises = ref([])   // snapshotted RoutineExercise[]
  const sets = ref([])        // sets[exerciseIdx][setIdx] — WorkoutSet objects
  const currentExerciseIndex = ref(0)
  const currentSetIndex = ref(0)
  const restTimerActive = ref(false)
  const restTimerRemaining = ref(0)
  const restTimerTotal = ref(0)
  const elapsedSeconds = ref(0)

  // --- Getters ---

  const currentExercise = computed(() => exercises.value[currentExerciseIndex.value] || null)

  const currentSet = computed(() =>
    sets.value[currentExerciseIndex.value]?.[currentSetIndex.value] || null
  )

  const completedSetsCount = computed(() =>
    sets.value.flat().filter(s => s.completedAt !== null || s.skipped).length
  )

  const totalSetsCount = computed(() =>
    sets.value.flat().length
  )

  const progressPercent = computed(() =>
    totalSetsCount.value === 0 ? 0 : Math.round((completedSetsCount.value / totalSetsCount.value) * 100)
  )

  const isLastSet = computed(() => {
    const exIdx = currentExerciseIndex.value
    const setIdx = currentSetIndex.value
    const lastEx = exercises.value.length - 1
    const lastSet = (sets.value[lastEx]?.length || 0) - 1
    return exIdx === lastEx && setIdx === lastSet
  })

  // --- Actions ---

  async function startSession(routineId) {
    const routine = await routinesRepository.getById(routineId)
    const exerciseList = await routinesRepository.getExercisesForRoutine(routineId)
    const sortedExercises = exerciseList.sort((a, b) => a.position - b.position)

    const session = await sessionRepository.createSession(routineId, routine.name)

    exercises.value = sortedExercises
    sets.value = sortedExercises.map(ex =>
      (ex.sets || []).map((s, setIdx) => ({
        id: null,
        sessionId: session.id,
        exercisePosition: ex.position,
        exerciseName: ex.name,
        setIndex: setIdx,
        type: s.type || 'strength',
        // strength fields
        plannedReps:   s.reps   ?? null,
        plannedWeight: s.weight ?? null,
        actualReps:    null,
        actualWeight:  null,
        weightUnit:    s.weightUnit || 'kg',
        // cardio fields
        plannedDuration: s.duration ?? null,
        plannedLevel:    s.level    ?? null,
        actualDuration:  null,
        actualLevel:     null,
        restSeconds: s.restSeconds,
        completedAt: null,
        skipped: false,
      }))
    )

    activeSessionId.value = session.id
    activeSession.value = session
    currentExerciseIndex.value = 0
    currentSetIndex.value = 0
    restTimerActive.value = false
    restTimerRemaining.value = 0
    elapsedSeconds.value = 0
  }

  async function loadActiveSession() {
    const session = await sessionRepository.findActiveSession()
    if (!session) return false

    const exerciseList = await routinesRepository.getExercisesForRoutine(session.routineId)
    const sortedExercises = exerciseList.sort((a, b) => a.position - b.position)
    const savedSets = await sessionRepository.getSetsForSession(session.id)

    exercises.value = sortedExercises
    sets.value = sortedExercises.map(ex =>
      (ex.sets || []).map((s, setIdx) => {
        const saved = savedSets.find(
          sv => sv.exercisePosition === ex.position && sv.setIndex === setIdx
        )
        return saved || {
          id: null,
          sessionId: session.id,
          exercisePosition: ex.position,
          exerciseName: ex.name,
          setIndex: setIdx,
          type: s.type || 'strength',
          plannedReps:     s.reps     ?? null,
          plannedWeight:   s.weight   ?? null,
          actualReps:      null,
          actualWeight:    null,
          weightUnit:      s.weightUnit || 'kg',
          plannedDuration: s.duration ?? null,
          plannedLevel:    s.level    ?? null,
          actualDuration:  null,
          actualLevel:     null,
          restSeconds: s.restSeconds,
          completedAt: null,
          skipped: false,
        }
      })
    )

    activeSessionId.value = session.id
    activeSession.value = session
    elapsedSeconds.value = Math.floor((Date.now() - session.startedAt) / 1000)

    // Find first incomplete set
    let found = false
    for (let exIdx = 0; exIdx < sets.value.length; exIdx++) {
      for (let setIdx = 0; setIdx < sets.value[exIdx].length; setIdx++) {
        const s = sets.value[exIdx][setIdx]
        if (!s.completedAt && !s.skipped) {
          currentExerciseIndex.value = exIdx
          currentSetIndex.value = setIdx
          found = true
          break
        }
      }
      if (found) break
    }
    if (!found) {
      currentExerciseIndex.value = sets.value.length - 1
      currentSetIndex.value = (sets.value[sets.value.length - 1]?.length || 1) - 1
    }
    return true
  }

  async function markSetComplete(actualPrimary, actualSecondary) {
    const exIdx = currentExerciseIndex.value
    const setIdx = currentSetIndex.value
    const current = sets.value[exIdx][setIdx]
    const isCardio = current.type === 'cardio'
    const setData = {
      ...current,
      ...(isCardio
        ? { actualDuration: Number(actualPrimary), actualLevel: Number(actualSecondary) }
        : { actualReps: Number(actualPrimary), actualWeight: Number(actualSecondary) }
      ),
      completedAt: Date.now(),
      skipped: false,
    }
    sets.value[exIdx].splice(setIdx, 1, setData)
    await sessionRepository.saveSet(setData)
  }

  async function skipSet() {
    const exIdx = currentExerciseIndex.value
    const setIdx = currentSetIndex.value
    const setData = {
      ...sets.value[exIdx][setIdx],
      skipped: true,
      completedAt: null,
      actualReps: null,
      actualWeight: null,
    }
    sets.value[exIdx].splice(setIdx, 1, setData)
    await sessionRepository.saveSet(setData)
  }

  function advanceToNextSet() {
    const exIdx = currentExerciseIndex.value
    const setIdx = currentSetIndex.value
    const currentExSets = sets.value[exIdx]

    if (setIdx + 1 < currentExSets.length) {
      currentSetIndex.value = setIdx + 1
    } else if (exIdx + 1 < exercises.value.length) {
      currentExerciseIndex.value = exIdx + 1
      currentSetIndex.value = 0
    }
    // If we're already at the last set, keep position (session will finish)
  }

  function startRestTimer(seconds) {
    restTimerTotal.value = seconds
    restTimerRemaining.value = seconds
    restTimerActive.value = true
  }

  function cancelRestTimer() {
    restTimerActive.value = false
    restTimerRemaining.value = 0
  }

  function tickRestTimer(delta) {
    if (!restTimerActive.value) return
    restTimerRemaining.value = Math.max(0, restTimerRemaining.value - delta)
    if (restTimerRemaining.value === 0) {
      restTimerActive.value = false
    }
  }

  async function addExerciseToSession(data) {
    const position = exercises.value.length
    const exercise = {
      id: crypto.randomUUID(),
      routineId: activeSession.value.routineId,
      position,
      name: data.name,
      sets: data.sets,
      notes: data.notes,
    }
    exercises.value.push(exercise)
    sets.value.push(
      data.sets.map((s, setIdx) => ({
        id: null,
        sessionId: activeSessionId.value,
        exercisePosition: position,
        exerciseName: data.name,
        setIndex: setIdx,
        type: s.type || 'strength',
        plannedReps:     s.reps     ?? null,
        plannedWeight:   s.weight   ?? null,
        actualReps:      null,
        actualWeight:    null,
        weightUnit:      s.weightUnit || 'kg',
        plannedDuration: s.duration ?? null,
        plannedLevel:    s.level    ?? null,
        actualDuration:  null,
        actualLevel:     null,
        restSeconds: s.restSeconds,
        completedAt: null,
        skipped: false,
      }))
    )
  }

  function jumpToExercise(exIdx, setIdx) {
    currentExerciseIndex.value = exIdx
    currentSetIndex.value = setIdx
  }

  function tickElapsed() {
    elapsedSeconds.value += 1
  }

  async function finishSession() {
    const volume = await sessionRepository.computeTotalVolume(activeSessionId.value)
    await sessionRepository.updateSession(activeSessionId.value, {
      status: 'completed',
      completedAt: Date.now(),
      totalVolumeKg: volume,
    })
    _clearSession()
  }

  async function abandonSession() {
    if (activeSessionId.value) {
      await sessionRepository.deleteSession(activeSessionId.value)
    }
    _clearSession()
  }

  function _clearSession() {
    activeSessionId.value = null
    activeSession.value = null
    exercises.value = []
    sets.value = []
    currentExerciseIndex.value = 0
    currentSetIndex.value = 0
    restTimerActive.value = false
    restTimerRemaining.value = 0
    elapsedSeconds.value = 0
  }

  return {
    activeSessionId,
    activeSession,
    exercises,
    sets,
    currentExerciseIndex,
    currentSetIndex,
    restTimerActive,
    restTimerRemaining,
    restTimerTotal,
    elapsedSeconds,
    currentExercise,
    currentSet,
    completedSetsCount,
    totalSetsCount,
    progressPercent,
    isLastSet,
    startSession,
    loadActiveSession,
    markSetComplete,
    skipSet,
    advanceToNextSet,
    startRestTimer,
    cancelRestTimer,
    tickRestTimer,
    tickElapsed,
    addExerciseToSession,
    jumpToExercise,
    finishSession,
    abandonSession,
  }
})
