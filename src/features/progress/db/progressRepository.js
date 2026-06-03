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

  // Volume per session, returns [{label, volume}] sorted asc
  async getSessionVolume(days) {
    const sessions = await this.getSessions(days)
    if (!sessions.length) return []

    return sessions
      .sort((a, b) => a.startedAt - b.startedAt)
      .map(s => ({
        week:        new Date(s.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume:      Math.round(s.totalVolumeKg || 0),
        routineName: s.routineName || '',
      }))
  },

  // Volume per week for the range (kept for volume change calculation)
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
    return this.getAllPRs(from)
  },

  // All PRs ever, optionally filtered from a timestamp
  async getAllPRs(from = 0) {
    const prSets = await db.workoutSets
      .where('startedAt').aboveOrEqual(from)
      .filter(s => s.isPR === true && s.completedAt && !s.skipped)
      .toArray()

    // Deduplicate: keep best per exercise
    const best = {}
    for (const s of prSets) {
      const weight = s.effectiveWeight || 0
      const rm = s.actualReps === 1
        ? weight
        : Math.round(weight * (1 + (s.actualReps || 1) / 30))
      if (!best[s.exerciseName] || rm > best[s.exerciseName].rm) {
        best[s.exerciseName] = {
          exerciseName:   s.exerciseName,
          rm,
          actualReps:     s.actualReps,
          actualWeight:   s.actualWeight,
          effectiveWeight: weight,
          isBodyweight:   s.isBodyweight,
          date:           s.startedAt,
        }
      }
    }

    return Object.values(best).sort((a, b) => b.date - a.date)
  },

  // Muscle group frequency: mode = 'exercise' (unique exercises) or 'session' (unique sessions)
  async getMuscleFrequency(days, mode = 'exercise') {
    const sessions = await this.getSessions(days)
    if (!sessions.length) return []

    const sessionIds = sessions.map(s => s.id)

    const sets = await db.workoutSets
      .where('sessionId').anyOf(sessionIds)
      .filter(s => s.completedAt && !s.skipped && s.type !== 'cardio')
      .toArray()

    // Build exerciseName → primary + secondary muscles from library
    const library = await db.exerciseLibrary.toArray()
    const libByName = Object.fromEntries(library.map(e => [e.name, e]))

    // Use a weighted map: muscle → weighted count (primary=1, secondary=0.5)
    const weightByMuscle = {}
    const seenKeys = {}  // muscle → Set of keys already counted this weight

    for (const set of sets) {
      const lib = libByName[set.exerciseName]
      const primary   = (set.muscleGroups?.length ? set.muscleGroups : lib?.primaryMuscles)   || []
      const secondary = lib?.secondaryMuscles || []
      const key = mode === 'exercise' ? set.exerciseName : set.sessionId

      for (const muscle of primary) {
        if (!seenKeys[muscle]) seenKeys[muscle] = new Set()
        if (!seenKeys[muscle].has(key)) {
          seenKeys[muscle].add(key)
          weightByMuscle[muscle] = (weightByMuscle[muscle] || 0) + 1
        }
      }
      for (const muscle of secondary) {
        const halfKey = `${key}__secondary`
        if (!seenKeys[muscle]) seenKeys[muscle] = new Set()
        if (!seenKeys[muscle].has(halfKey)) {
          seenKeys[muscle].add(halfKey)
          weightByMuscle[muscle] = (weightByMuscle[muscle] || 0) + 0.5
        }
      }
    }

    return Object.entries(weightByMuscle)
      .map(([muscle, count]) => ({ muscle, count: Math.round(count * 10) / 10 }))
      .sort((a, b) => b.count - a.count)
  },

  // Best lifts: all-time highest 1RM per exercise (top N by 1RM)
  async getBestLifts(limit = 5) {
    const prSets = await db.workoutSets
      .filter(s => s.isPR === true && s.completedAt && !s.skipped && s.type !== 'cardio' && s.effectiveWeight > 0)
      .toArray()

    const best = {}
    for (const s of prSets) {
      const weight = s.effectiveWeight || 0
      const rm = s.actualReps === 1
        ? weight
        : Math.round(weight * (1 + (s.actualReps || 1) / 30))
      if (!best[s.exerciseName] || rm > best[s.exerciseName].rm) {
        best[s.exerciseName] = {
          exerciseName: s.exerciseName,
          rm,
          actualReps:   s.actualReps,
          actualWeight: s.actualWeight,
          isBodyweight: s.isBodyweight,
          date:         s.startedAt,
        }
      }
    }

    return Object.values(best)
      .sort((a, b) => b.rm - a.rm)
      .slice(0, limit)
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
