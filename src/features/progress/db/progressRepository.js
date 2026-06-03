import { db } from '@/db/index.js'

function cutoff(days) {
  return Date.now() - days * 24 * 60 * 60 * 1000
}

function weekStart(ts) {
  const d = new Date(ts)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const progressRepository = {
  // Sessions in range
  async getSessions(days) {
    const from = cutoff(days)
    return db.workoutSessions
      .where('startedAt').aboveOrEqual(from)
      .filter(s => s.status === 'completed')
      .toArray()
  },

  // Volume per week for the range, returns [{week, volume}] sorted asc
  async getWeeklyVolume(days) {
    const sessions = await this.getSessions(days)
    if (!sessions.length) return []
    const sessionMap = Object.fromEntries(sessions.map(s => [s.id, s]))

    const sets = await db.workoutSets
      .where('sessionId').anyOf(sessions.map(s => s.id))
      .filter(s => s.completedAt && !s.skipped && s.type !== 'cardio')
      .toArray()

    const byWeek = {}
    for (const set of sets) {
      const session = sessionMap[set.sessionId]
      if (!session) continue
      const w = weekStart(session.startedAt)
      byWeek[w] = (byWeek[w] || 0) + (set.actualReps || 0) * (set.effectiveWeight ?? set.actualWeight ?? 0)
    }

    return Object.entries(byWeek)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([ts, volume]) => ({
        week: new Date(Number(ts)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: Math.round(volume),
      }))
  },

  // Volume % change: compare first half vs second half of range
  async getVolumeChange(days) {
    const weeks = await this.getWeeklyVolume(days)
    if (weeks.length < 2) return null
    const half = Math.floor(weeks.length / 2)
    const firstHalf  = weeks.slice(0, half).reduce((s, w) => s + w.volume, 0)
    const secondHalf = weeks.slice(half).reduce((s, w) => s + w.volume, 0)
    if (!firstHalf) return null
    return Math.round(((secondHalf - firstHalf) / firstHalf) * 100)
  },

  // Recent PRs in range
  async getRecentPRs(days) {
    const from = cutoff(days)
    const prSets = await db.workoutSets
      .where('startedAt').aboveOrEqual(from)
      .filter(s => s.isPR === true && s.completedAt && !s.skipped)
      .toArray()

    // Deduplicate: keep best per exercise
    const best = {}
    for (const s of prSets) {
      const rm = s.actualReps === 1
        ? s.effectiveWeight
        : Math.round((s.effectiveWeight ?? 0) * (1 + (s.actualReps || 1) / 30))
      if (!best[s.exerciseName] || rm > best[s.exerciseName].rm) {
        best[s.exerciseName] = { exerciseName: s.exerciseName, rm, date: s.startedAt }
      }
    }

    return Object.values(best).sort((a, b) => b.date - a.date)
  },

  // Plan adherence: % of required entries done this range
  async getPlanAdherence(days) {
    const from = cutoff(days)
    const activePlans = await db.plans.where('status').equals('active').toArray()
    if (!activePlans.length) return null

    const entries = await db.planEntries
      .where('planId').anyOf(activePlans.map(p => p.id))
      .filter(e => e.dayOfWeek !== null)
      .toArray()

    if (!entries.length) return null

    const now = new Date()
    const todayDow = (now.getDay() || 7) - 1  // 0=Mon … 6=Sun

    // For each plan, count only past occurrences (completed weeks + past days in current week)
    let totalRequired = 0
    for (const plan of activePlans) {
      const planFrom = Math.max(from, plan.createdAt)
      const planEntries = entries.filter(e => e.planId === plan.id)

      // Full completed weeks since plan start
      const msElapsed = Date.now() - planFrom
      const fullWeeks = Math.floor(msElapsed / (7 * 24 * 60 * 60 * 1000))
      totalRequired += planEntries.length * fullWeeks

      // Partial current week: only count entries whose dayOfWeek < today
      for (const entry of planEntries) {
        if (entry.dayOfWeek !== null && entry.dayOfWeek < todayDow) {
          totalRequired += 1
        }
      }
    }

    if (totalRequired === 0) return null

    const sessions = await db.workoutSessions
      .where('startedAt').aboveOrEqual(from)
      .filter(s => s.status === 'completed' && s.planEntryId != null)
      .toArray()

    const entryIds = new Set(entries.map(e => e.id))
    const done = sessions.filter(s => entryIds.has(s.planEntryId)).length

    return Math.min(100, Math.round((done / totalRequired) * 100))
  },
}
