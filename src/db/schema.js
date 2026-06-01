import Dexie from 'dexie'

export const db = new Dexie('gymapp')

db.version(1).stores({
  routines:         'id, name, createdAt',
  routineExercises: 'id, routineId, [routineId+position]',
  workoutSessions:  'id, routineId, startedAt, status',
  workoutSets:      'id, sessionId, [sessionId+exercisePosition+setIndex]',
})

db.version(2).stores({
  routines: 'id, name, createdAt, updatedAt',
})

// Per-set targets: routineExercises now stores a `sets` JSON array
db.version(3).stores({
  routineExercises: 'id, routineId, [routineId+position]',
}).upgrade(async tx => {
  await tx.table('routineExercises').toCollection().modify(exercise => {
    if (!exercise.sets) {
      const count = exercise.plannedSets || 3
      exercise.sets = Array.from({ length: count }, () => ({
        reps:        exercise.plannedReps   || 10,
        weight:      exercise.plannedWeight || 0,
        weightUnit:  exercise.weightUnit    || 'kg',
        restSeconds: exercise.restSeconds   || 90,
      }))
    }
  })
})

db.version(4).stores({
  exerciseLibrary: 'id, name, type',
})

db.version(5).stores({
  workoutSets: 'id, sessionId, [sessionId+exercisePosition+setIndex]',
})

db.version(6).stores({
  config: 'key',
})

db.version(10).stores({
  plans:            'id, status, order',
  planEntries:      'id, planId, routineId, dayOfWeek, [planId+order]',
  workoutSessions:  'id, routineId, startedAt, status, planId, planEntryId',
})

db.version(8).stores({
  routines:         'id, createdAt, updatedAt',
  routineExercises: 'id, routineId, exerciseLibraryId, [routineId+position]',
  workoutSets:      'id, sessionId, exerciseName, isPR, [sessionId+exercisePosition+setIndex]',
})

db.version(9).stores({
  // Add startedAt for direct range scans without joining sessions
  // Add compound indexes for analytics queries
  // Add muscleGroups snapshot for muscle group analytics without joining library
  workoutSets: 'id, sessionId, exerciseName, isPR, startedAt, [exerciseName+startedAt], [exerciseName+isPR], [sessionId+exercisePosition+setIndex]',
}).upgrade(async tx => {
  // Backfill startedAt from parent session for existing sets
  const sessions = await tx.table('workoutSessions').toArray()
  const sessionMap = Object.fromEntries(sessions.map(s => [s.id, s.startedAt]))

  // Backfill muscleGroups from exerciseLibrary via exerciseName
  const library = await tx.table('exerciseLibrary').toArray()
  const musclesByName = Object.fromEntries(library.map(e => [e.name, e.primaryMuscles || []]))

  await tx.table('workoutSets').toCollection().modify(set => {
    set.startedAt    = sessionMap[set.sessionId] ?? null
    set.muscleGroups = musclesByName[set.exerciseName] ?? []
  })
})

// Remove lbs, add isBodyweight per set, add effectiveWeight to workoutSets
db.version(7).stores({
  routineExercises: 'id, routineId, [routineId+position]',
  workoutSets:      'id, sessionId, [sessionId+exercisePosition+setIndex]',
}).upgrade(async tx => {
  await tx.table('routineExercises').toCollection().modify(exercise => {
    if (!exercise.sets) return
    exercise.sets = exercise.sets.map(s => {
      let weight = s.weight ?? 0
      if (s.weightUnit === 'lbs') weight = Math.round(weight * 0.453592 * 4) / 4
      const isBodyweight = weight === 0
      const { weightUnit, ...rest } = s
      return { ...rest, weight: isBodyweight ? 0 : weight, isBodyweight }
    })
  })

  await tx.table('workoutSets').toCollection().modify(set => {
    if (set.type === 'cardio') {
      set.effectiveWeight = null
      return
    }
    let planned = set.plannedWeight ?? 0
    let actual  = set.actualWeight  ?? null
    if (set.weightUnit === 'lbs') {
      planned = Math.round(planned * 0.453592 * 4) / 4
      if (actual != null) actual = Math.round(actual * 0.453592 * 4) / 4
    }
    set.plannedWeight   = planned
    set.actualWeight    = actual
    set.isBodyweight    = planned === 0
    set.effectiveWeight = actual
    delete set.weightUnit
  })
})
