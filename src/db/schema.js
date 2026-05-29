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
