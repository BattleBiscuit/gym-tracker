import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { resetDb, seedRoutine } from './helpers.js'
import { db } from '@/db/index.js'

// Mock composables that aren't relevant to unit tests
vi.mock('@/composables/useConfig.js', () => ({
  bodyweight: { value: 80 },
  violentMode: { value: false },
  loadConfig: vi.fn(),
}))
vi.mock('@/composables/useFlexMode.js', () => ({
  isFlexMode: { value: false },
}))
vi.mock('@/composables/useScrollDirection.js', () => ({
  scrolledDown: { value: false },
  onScroll: vi.fn(),
}))

beforeEach(async () => {
  setActivePinia(createPinia())
  await resetDb()
})

describe('Session store — startSession', () => {
  it('creates an active session in DB', async () => {
    const { useSessionStore } = await import('@/features/session/stores/useSessionStore.js')
    const { routine } = await seedRoutine()
    const store = useSessionStore()

    await store.startSession(routine.id)

    const session = await db.workoutSessions.where('status').equals('active').first()
    expect(session).toBeTruthy()
    expect(session.routineId).toBe(routine.id)
    expect(session.routineName).toBe('Test Routine')
  })

  it('builds sets matrix from routine exercises', async () => {
    const { useSessionStore } = await import('@/features/session/stores/useSessionStore.js')
    const { routine } = await seedRoutine()
    const store = useSessionStore()

    await store.startSession(routine.id)

    expect(store.exercises).toHaveLength(1)
    expect(store.sets).toHaveLength(1)
    expect(store.sets[0]).toHaveLength(3) // 3 sets defined in seedRoutine
    expect(store.sets[0][0].plannedReps).toBe(5)
    expect(store.sets[0][0].plannedWeight).toBe(80)
  })

  it('links session to plan when planId and planEntryId provided', async () => {
    const { useSessionStore } = await import('@/features/session/stores/useSessionStore.js')
    const { routine } = await seedRoutine()
    const store = useSessionStore()

    const planId = crypto.randomUUID()
    const planEntryId = crypto.randomUUID()
    await store.startSession(routine.id, planId, planEntryId)

    const session = await db.workoutSessions.where('status').equals('active').first()
    expect(session.planId).toBe(planId)
    expect(session.planEntryId).toBe(planEntryId)
  })
})

describe('Session store — markSetComplete', () => {
  it('saves actual reps and weight to DB', async () => {
    const { useSessionStore } = await import('@/features/session/stores/useSessionStore.js')
    const { routine } = await seedRoutine()
    const store = useSessionStore()

    await store.startSession(routine.id)
    await store.markSetComplete(5, 82.5)

    const sets = await db.workoutSets.where('sessionId').equals(store.activeSessionId).toArray()
    const completed = sets.find(s => s.completedAt !== null)
    expect(completed).toBeTruthy()
    expect(completed.actualReps).toBe(5)
    expect(completed.actualWeight).toBe(82.5)
    expect(completed.effectiveWeight).toBe(82.5)
  })

  it('computes effectiveWeight as bodyweight + weight for BW sets', async () => {
    const { useSessionStore } = await import('@/features/session/stores/useSessionStore.js')
    const { routine } = await seedRoutine()
    const store = useSessionStore()

    await store.startSession(routine.id)
    await store.markSetComplete(10, 10, true) // BW + 10kg, bodyweight=80

    const sets = await db.workoutSets.where('sessionId').equals(store.activeSessionId).toArray()
    const completed = sets.find(s => s.completedAt !== null)
    expect(completed.effectiveWeight).toBe(90) // 80 + 10
  })

  it('marks isPR when beating all-time best 1RM', async () => {
    const { useSessionStore } = await import('@/features/session/stores/useSessionStore.js')
    const { routine } = await seedRoutine()
    const store = useSessionStore()

    await store.startSession(routine.id)
    await store.markSetComplete(5, 100) // Epley: 100*(1+5/30) ≈ 117kg — first ever, should be PR

    const sets = await db.workoutSets.where('sessionId').equals(store.activeSessionId).toArray()
    const completed = sets.find(s => s.completedAt !== null)
    expect(completed.isPR).toBe(true)
  })

  it('does not mark isPR when not beating previous best', async () => {
    const { useSessionStore } = await import('@/features/session/stores/useSessionStore.js')
    const { routine } = await seedRoutine()

    // Seed a previous session with a higher 1RM
    const prevSession = await db.workoutSessions.add({
      id: crypto.randomUUID(), routineId: routine.id, routineName: 'Test Routine',
      startedAt: Date.now() - 86400000, completedAt: Date.now() - 82800000,
      status: 'completed', totalVolumeKg: 1000, planId: null, planEntryId: null,
    })
    await db.workoutSets.add({
      id: crypto.randomUUID(), sessionId: prevSession, exerciseName: 'Bench Press',
      exercisePosition: 0, setIndex: 0, type: 'strength',
      plannedReps: 5, plannedWeight: 100, isBodyweight: false,
      actualReps: 5, actualWeight: 100, effectiveWeight: 100,
      startedAt: Date.now() - 86400000, muscleGroups: [],
      completedAt: Date.now() - 86400000, skipped: false, isPR: true,
    })

    const store = useSessionStore()
    await store.startSession(routine.id)
    await store.markSetComplete(5, 80) // lower than previous 100kg

    const sets = await db.workoutSets.where('sessionId').equals(store.activeSessionId).toArray()
    const completed = sets.find(s => s.completedAt !== null)
    expect(completed.isPR).toBe(false)
  })
})

describe('Session store — finishSession', () => {
  it('marks session as completed with correct volume', async () => {
    const { useSessionStore } = await import('@/features/session/stores/useSessionStore.js')
    const { routine } = await seedRoutine()
    const store = useSessionStore()

    await store.startSession(routine.id)
    await store.markSetComplete(5, 80)   // 400kg
    await store.advanceToNextSet()
    await store.markSetComplete(5, 80)   // 400kg
    await store.advanceToNextSet()
    await store.markSetComplete(5, 80)   // 400kg
    await store.finishSession()

    const session = await db.workoutSessions.orderBy('startedAt').last()
    expect(session.status).toBe('completed')
    expect(session.totalVolumeKg).toBe(1200)
  })

  it('updates routine exercise sets with actuals after finish', async () => {
    const { useSessionStore } = await import('@/features/session/stores/useSessionStore.js')
    const { routine, exercise } = await seedRoutine()
    const store = useSessionStore()

    await store.startSession(routine.id)
    await store.markSetComplete(6, 85)  // better than planned 5×80
    await store.finishSession()

    const updated = await db.routineExercises.get(exercise.id)
    expect(updated.sets[0].reps).toBe(6)
    expect(updated.sets[0].weight).toBe(85)
  })
})
