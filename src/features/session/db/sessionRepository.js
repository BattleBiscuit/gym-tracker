import { db } from '@/db/index.js'

export const sessionRepository = {
  async createSession(routineId, routineName, planId = null, planEntryId = null) {
    const session = {
      id: crypto.randomUUID(),
      routineId,
      routineName,
      startedAt: Date.now(),
      completedAt: null,
      status: 'active',
      totalVolumeKg: 0,
      planId,
      planEntryId,
    }
    await db.workoutSessions.add(session)
    return session
  },

  async findActiveSession() {
    return db.workoutSessions.where('status').equals('active').first()
  },

  async updateSession(id, data) {
    await db.workoutSessions.update(id, data)
  },

  async saveSet(setData) {
    // Deep clone to plain JS to avoid issues with Vue reactive proxies
    const plain = JSON.parse(JSON.stringify(setData))
    const existing = await db.workoutSets
      .where('[sessionId+exercisePosition+setIndex]')
      .equals([plain.sessionId, plain.exercisePosition, plain.setIndex])
      .first()
    if (existing) {
      await db.workoutSets.update(existing.id, plain)
    } else {
      const { id: _ignored, ...rest } = plain
      await db.workoutSets.add({ id: crypto.randomUUID(), ...rest })
    }
  },

  async getLastActuals(exerciseName, setCount) {
    // Find the most recent completed session containing this exercise
    // Use exerciseName index for fast lookup
    const setsWithName = await db.workoutSets
      .where('exerciseName').equals(exerciseName)
      .filter(s => s.completedAt !== null && !s.skipped)
      .toArray()

    if (!setsWithName.length) return []

    // Find the most recent completed session among those
    const sessionIds = [...new Set(setsWithName.map(s => s.sessionId))]
    const lastSession = await db.workoutSessions
      .where('id').anyOf(sessionIds)
      .filter(s => s.status === 'completed')
      .toArray()
      .then(sessions => sessions.sort((a, b) => b.startedAt - a.startedAt)[0])

    if (!lastSession) return []

    const lastSets = setsWithName
      .filter(s => s.sessionId === lastSession.id)
      .sort((a, b) => a.setIndex - b.setIndex)

    return Array.from({ length: setCount }, (_, i) => {
      const match = lastSets.find(s => s.setIndex === i)
      if (!match) return null
      return {
        reps:     match.actualReps,
        weight:   match.actualWeight,
        duration: match.actualDuration,
        level:    match.actualLevel,
      }
    })
  },

  async getBest1RM(exerciseName, excludeSessionId) {
    const sets = await db.workoutSets
      .where('exerciseName').equals(exerciseName)
      .filter(s =>
        s.completedAt !== null &&
        !s.skipped &&
        s.type !== 'cardio' &&
        s.sessionId !== excludeSessionId &&
        s.effectiveWeight > 0
      )
      .toArray()
    if (!sets.length) return 0
    return Math.max(...sets.map(s => {
      const w = s.effectiveWeight || 0
      const r = s.actualReps || 1
      return r === 1 ? w : Math.round(w * (1 + r / 30))
    }))
  },

  async deleteSession(id) {
    await db.transaction('rw', db.workoutSessions, db.workoutSets, async () => {
      await db.workoutSets.where('sessionId').equals(id).delete()
      await db.workoutSessions.delete(id)
    })
  },

  async getSetsForSession(sessionId) {
    return db.workoutSets.where('sessionId').equals(sessionId).toArray()
  },

  async computeTotalVolume(sessionId) {
    const sets = await db.workoutSets
      .where('sessionId')
      .equals(sessionId)
      .filter(s => s.completedAt !== null && !s.skipped && s.type !== 'cardio')
      .toArray()
    return sets.reduce((sum, s) => sum + (s.actualReps || 0) * (s.effectiveWeight ?? s.actualWeight ?? 0), 0)
  },
}
