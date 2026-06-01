import { db } from '@/db/index.js'

export const historyRepository = {
  async getCount() {
    return db.workoutSessions
      .where('status').equals('completed')
      .count()
  },

  async getPage(page, pageSize) {
    const offset = (page - 1) * pageSize
    // orderBy startedAt descending, filter completed, skip offset, take pageSize
    return db.workoutSessions
      .orderBy('startedAt')
      .reverse()
      .filter(s => s.status === 'completed')
      .offset(offset)
      .limit(pageSize)
      .toArray()
  },

  async getById(id) {
    return db.workoutSessions.get(id)
  },

  async getSetsForSession(sessionId) {
    return db.workoutSets.where('sessionId').equals(sessionId).toArray()
  },

  async deleteSession(id) {
    await db.transaction('rw', db.workoutSessions, db.workoutSets, async () => {
      await db.workoutSets.where('sessionId').equals(id).delete()
      await db.workoutSessions.delete(id)
    })
  },
}
