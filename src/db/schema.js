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

db.version(4).stores({
  exerciseLibrary: 'id, name, type',
})

db.version(5).stores({
  workoutSets: 'id, sessionId, [sessionId+exercisePosition+setIndex]',
})

// App config key-value store
db.version(6).stores({
  config: 'key',
})

// Remove lbs, add isBodyweight per set, add effectiveWeight to workoutSets
db.version(7).stores({
  routineExercises: 'id, routineId, [routineId+position]',
  workoutSets:      'id, sessionId, [sessionId+exercisePosition+setIndex]',
}).upgrade(async tx => {
  // Migrate routineExercises: convert lbs→kg, 0-weight→isBodyweight, drop weightUnit
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

  // Migrate workoutSets: convert lbs→kg, add isBodyweight, add effectiveWeight
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
    // effectiveWeight: store as-is (no bodyweight snapshot available for old sets)
    set.effectiveWeight = actual
    delete set.weightUnit
  })
})
// No structural index change — just adds duration/level fields to existing records (nullable, added on use)

// Per-set targets: routineExercises now stores a `sets` JSON array
// instead of flat plannedSets/plannedReps/plannedWeight fields.
// Migration converts existing exercises to the new format.
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
