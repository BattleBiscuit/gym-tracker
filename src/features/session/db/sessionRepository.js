import { db } from '@/db/index.js'

export const sessionRepository = {
  async createSession(routineId, routineName) {
    const session = {
      id: crypto.randomUUID(),
      routineId,
      routineName,
      startedAt: Date.now(),
      completedAt: null,
      status: 'active',
      totalVolumeKg: 0,
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
    const existing = await db.workoutSets
      .where('[sessionId+exercisePosition+setIndex]')
      .equals([setData.sessionId, setData.exercisePosition, setData.setIndex])
      .first()
    if (existing) {
      await db.workoutSets.update(existing.id, setData)
    } else {
      const { id: _ignored, ...rest } = setData
      await db.workoutSets.add({ id: crypto.randomUUID(), ...rest })
    }
  },

  async getLastActuals(exerciseName, setCount) {
    // Find the most recent completed session that contains this exercise
    const recentSets = await db.workoutSets
      .filter(s =>
        s.exerciseName === exerciseName &&
        s.completedAt !== null &&
        !s.skipped
      )
      .toArray()

    if (!recentSets.length) return []

    // Find the most recent session among those sets
    const sessionIds = [...new Set(recentSets.map(s => s.sessionId))]
    const sessions = await db.workoutSessions
      .where('id').anyOf(sessionIds)
      .filter(s => s.status === 'completed')
      .toArray()

    if (!sessions.length) return []

    const lastSession = sessions.sort((a, b) => b.startedAt - a.startedAt)[0]
    const lastSets = recentSets
      .filter(s => s.sessionId === lastSession.id)
      .sort((a, b) => a.setIndex - b.setIndex)

    // Return actuals indexed by setIndex — exact match only, null if no match
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
      .filter(s => s.completedAt !== null && !s.skipped)
      .toArray()
    return sets.reduce((sum, s) => sum + (s.actualReps || 0) * (s.actualWeight || 0), 0)
  },
}
