import Dexie from 'dexie'
import { db } from '@/db/index.js'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export { DAYS }

export const plansRepository = {
  async getAll() {
    return db.plans.orderBy('order').toArray()
  },

  async getById(id) {
    return db.plans.get(id)
  },

  async getEntriesForPlan(planId) {
    return db.planEntries
      .where('[planId+order]')
      .between([planId, Dexie.minKey], [planId, Dexie.maxKey])
      .toArray()
  },

  async create(data) {
    const count = await db.plans.count()
    const plan = {
      id:        crypto.randomUUID(),
      name:      data.name.trim(),
      status:    'active',
      createdAt: Date.now(),
      order:     count,
    }
    await db.plans.add(plan)
    return plan
  },

  async update(id, data) {
    await db.plans.update(id, data)
  },

  async delete(id) {
    await db.transaction('rw', db.plans, db.planEntries, async () => {
      await db.planEntries.where('planId').equals(id).delete()
      await db.plans.delete(id)
    })
  },

  async addEntry(planId, data) {
    const existing = await db.planEntries.where('planId').equals(planId).toArray()
    const entry = {
      id:          crypto.randomUUID(),
      planId,
      routineId:   data.routineId,
      routineName: data.routineName,
      dayOfWeek:   data.dayOfWeek ?? null,
      order:       existing.length,
    }
    await db.planEntries.add(entry)
    return entry
  },

  async updateEntry(id, data) {
    await db.planEntries.update(id, data)
  },

  async deleteEntry(id) {
    await db.planEntries.delete(id)
  },

  async reorderEntries(updates) {
    await db.transaction('rw', db.planEntries, async () => {
      for (const { id, order } of updates) {
        await db.planEntries.update(id, { order })
      }
    })
  },

  // Get all planEntryIds completed this calendar week (Mon 00:00 to now)
  async getCompletedEntryIdsThisWeek() {
    const now = new Date()
    const day = now.getDay() || 7  // 1=Mon, 7=Sun
    const monday = new Date(now)
    monday.setDate(now.getDate() - day + 1)
    monday.setHours(0, 0, 0, 0)

    const sessions = await db.workoutSessions
      .where('startedAt').aboveOrEqual(monday.getTime())
      .filter(s => s.status === 'completed' && s.planEntryId)
      .toArray()

    return new Set(sessions.map(s => s.planEntryId))
  },

  async getStreak(planId, entries) {
    // Only count entries that have a specific day assigned
    const required = entries.filter(e => e.dayOfWeek !== null)
    if (!required.length) return 0

    const requiredIds = new Set(required.map(e => e.id))
    let streak = 0
    const now = new Date()

    // Walk back week by week
    for (let weeksAgo = 0; weeksAgo < 52; weeksAgo++) {
      // Compute Mon 00:00 and Sun 23:59:59 of this week
      const ref = new Date(now)
      ref.setDate(now.getDate() - weeksAgo * 7)
      const day = ref.getDay() || 7
      const monday = new Date(ref)
      monday.setDate(ref.getDate() - day + 1)
      monday.setHours(0, 0, 0, 0)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)

      // Skip current incomplete week only if no sessions yet this week
      // (don't penalise for days not yet reached)
      const isCurrentWeek = weeksAgo === 0

      const sessions = await db.workoutSessions
        .where('startedAt').between(monday.getTime(), sunday.getTime())
        .filter(s => s.status === 'completed' && s.planEntryId && requiredIds.has(s.planEntryId))
        .toArray()

      const doneIds = new Set(sessions.map(s => s.planEntryId))

      // For current week: only check days that have already passed
      const todayDow = (new Date().getDay() || 7) - 1  // 0=Mon 6=Sun
      const toCheck = isCurrentWeek
        ? required.filter(e => e.dayOfWeek <= todayDow)
        : required

      if (toCheck.length === 0) {
        // Current week — no required days have passed yet, skip
        continue
      }

      const allDone = toCheck.every(e => doneIds.has(e.id))
      if (allDone) {
        streak++
      } else {
        break
      }
    }
    return streak
  },

  // Get routineIds that are already in at least one active plan
  async getPlannedRoutineIds() {
    const activePlans = await db.plans.where('status').equals('active').toArray()
    if (!activePlans.length) return new Set()
    const entries = await db.planEntries
      .where('planId').anyOf(activePlans.map(p => p.id))
      .toArray()
    return new Set(entries.map(e => e.routineId))
  },
}
