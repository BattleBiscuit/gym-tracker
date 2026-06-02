import { db } from '@/db/index.js'

// Wipe all tables between tests
export async function resetDb() {
  await db.transaction('rw',
    db.routines,
    db.routineExercises,
    db.workoutSessions,
    db.workoutSets,
    db.exerciseLibrary,
    db.config,
    db.plans,
    db.planEntries,
    async () => {
      await Promise.all([
        db.routines.clear(),
        db.routineExercises.clear(),
        db.workoutSessions.clear(),
        db.workoutSets.clear(),
        db.exerciseLibrary.clear(),
        db.config.clear(),
        db.plans.clear(),
        db.planEntries.clear(),
      ])
    }
  )
}

// Seed a minimal routine with exercises
export async function seedRoutine(overrides = {}) {
  const routine = {
    id: crypto.randomUUID(),
    name: 'Test Routine',
    notes: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
  await db.routines.add(routine)

  // Deep clone to plain JS — fake-indexeddb can't clone Vue reactive proxies
  const exercise = JSON.parse(JSON.stringify({
    id: crypto.randomUUID(),
    routineId: routine.id,
    position: 0,
    name: 'Bench Press',
    exerciseLibraryId: null,
    sets: [
      { type: 'strength', reps: 5, weight: 80, isBodyweight: false, restSeconds: 180 },
      { type: 'strength', reps: 5, weight: 80, isBodyweight: false, restSeconds: 180 },
      { type: 'strength', reps: 5, weight: 80, isBodyweight: false, restSeconds: 180 },
    ],
    notes: '',
  }))
  await db.routineExercises.add(exercise)
  return { routine, exercise }
}

// Seed a completed session with sets
export async function seedSession(routineId, routineName, sets = [], overrides = {}) {
  const session = {
    id: crypto.randomUUID(),
    routineId,
    routineName,
    startedAt: Date.now() - 3600000,
    completedAt: Date.now(),
    status: 'completed',
    totalVolumeKg: 0,
    planId: null,
    planEntryId: null,
    ...overrides,
  }
  await db.workoutSessions.add(session)

  for (const set of sets) {
    await db.workoutSets.add({
      id: crypto.randomUUID(),
      sessionId: session.id,
      ...set,
    })
  }
  return session
}
