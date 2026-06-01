import { db } from '@/db/index.js'

// Epley 1RM formula using pre-resolved effectiveWeight
function epley1RM(effectiveWeight, reps) {
  if (!effectiveWeight || effectiveWeight <= 0) return 0
  if (reps === 1) return effectiveWeight
  return Math.round(effectiveWeight * (1 + reps / 30))
}

function startOfDay(ts) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function isoWeekKey(ts) {
  const d = new Date(ts)
  // Get Monday of the week
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return `${d.getFullYear()}-W${String(Math.ceil(d.getDate() / 7)).padStart(2, '0')}-${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

function cutoffTs(rangeDays) {
  if (!rangeDays) return 0
  return Date.now() - rangeDays * 24 * 60 * 60 * 1000
}

export const analyticsRepository = {
  // --- Per-exercise: 1RM and volume per session ---
  async getExerciseProgressData(exerciseLibraryId, exerciseName, rangeDays) {
    const cutoff = cutoffTs(rangeDays)

    // Get all completed sessions in range
    const sessions = await db.workoutSessions
      .where('status').equals('completed')
      .filter(s => s.startedAt >= cutoff)
      .toArray()

    if (!sessions.length) return { oneRM: [], volume: [] }

    const sessionMap = Object.fromEntries(sessions.map(s => [s.id, s]))

    // Get all sets for these sessions matching the exercise
    const sessionIds = sessions.map(s => s.id)
    const allSets = await db.workoutSets
      .where('sessionId').anyOf(sessionIds)
      .filter(s => {
        if (s.skipped || !s.completedAt) return false
        if (s.type === 'cardio') return false
        // Match by library ID if available, fall back to name
        if (exerciseLibraryId) {
          // workoutSets don't store libraryId, match by name
        }
        return s.exerciseName === exerciseName
      })
      .toArray()

    // Group by session date
    const bySession = {}
    for (const set of allSets) {
      const session = sessionMap[set.sessionId]
      if (!session) continue
      const dateKey = startOfDay(session.startedAt)
      if (!bySession[dateKey]) bySession[dateKey] = { date: session.startedAt, sets: [] }
      bySession[dateKey].sets.push(set)
    }

    const oneRM = []
    const volume = []

    for (const { date, sets } of Object.values(bySession).sort((a, b) => a.date - b.date)) {
      const label = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      const eff = s => s.effectiveWeight ?? s.actualWeight ?? 0
      const maxOneRM = Math.max(...sets.map(s => epley1RM(eff(s), s.actualReps || 0)))
      const totalVol = sets.reduce((sum, s) => sum + (s.actualReps || 0) * eff(s), 0)

      if (maxOneRM > 0) oneRM.push({ label, value: maxOneRM, date })
      volume.push({ label, value: Math.round(totalVol), date })
    }

    return { oneRM, volume }
  },

  // --- Weekly overall volume ---
  async getWeeklyVolumeData(rangeDays) {
    const cutoff = cutoffTs(rangeDays)

    const sessions = await db.workoutSessions
      .where('status').equals('completed')
      .filter(s => s.startedAt >= cutoff)
      .toArray()

    if (!sessions.length) return []

    const sessionMap = Object.fromEntries(sessions.map(s => [s.id, s]))

    const allSets = await db.workoutSets
      .where('sessionId').anyOf(sessions.map(s => s.id))
      .filter(s => !s.skipped && s.completedAt && s.type !== 'cardio')
      .toArray()

    const byWeek = {}
    for (const set of allSets) {
      const session = sessionMap[set.sessionId]
      if (!session) continue
      const week = isoWeekKey(session.startedAt)
      if (!byWeek[week]) byWeek[week] = { weekTs: session.startedAt, volume: 0 }
      byWeek[week].volume += (set.actualReps || 0) * (set.effectiveWeight ?? set.actualWeight ?? 0)
    }

    return Object.entries(byWeek)
      .sort((a, b) => a[1].weekTs - b[1].weekTs)
      .map(([label, { volume }]) => ({ label: label.split('-').pop(), value: Math.round(volume) }))
  },

  // --- Muscle group breakdown ---
  async getMuscleGroupData(rangeDays) {
    const cutoff = cutoffTs(rangeDays)

    const sessions = await db.workoutSessions
      .where('status').equals('completed')
      .filter(s => s.startedAt >= cutoff)
      .toArray()

    if (!sessions.length) return { volume: [], frequency: [] }

    const sessionIds = sessions.map(s => s.id)
    const sessionMap = Object.fromEntries(sessions.map(s => [s.id, s]))

    // Get all strength sets with weight
    const allSets = await db.workoutSets
      .where('sessionId').anyOf(sessionIds)
      .filter(s => !s.skipped && s.completedAt && s.type !== 'cardio')
      .toArray()

    if (!allSets.length) return { volume: [], frequency: [] }

    // Build a map of exerciseName → primaryMuscles from the library
    // via routineExercises (which has exerciseLibraryId + name)
    const exerciseNames = [...new Set(allSets.map(s => s.exerciseName))]
    const libraryEntries = await db.exerciseLibrary.toArray()
    const musclesByName = {}
    for (const entry of libraryEntries) {
      musclesByName[entry.name] = entry.primaryMuscles || []
    }
    // Also check via routineExercises for exercises linked by name
    const routineExercises = await db.routineExercises.toArray()
    for (const re of routineExercises) {
      if (!musclesByName[re.name] && re.exerciseLibraryId) {
        const lib = libraryEntries.find(l => l.id === re.exerciseLibraryId)
        if (lib) musclesByName[re.name] = lib.primaryMuscles || []
      }
    }

    const volumeByMuscle = {}
    // frequency: sessions per muscle (count unique sessions per muscle)
    const sessionsByMuscle = {}

    for (const set of allSets) {
      const muscles = musclesByName[set.exerciseName] || []
      if (!muscles.length) continue
      const vol = (set.actualReps || 0) * (set.effectiveWeight ?? set.actualWeight ?? 0)
      const sessionId = set.sessionId

      for (const muscle of muscles) {
        volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + vol
        if (!sessionsByMuscle[muscle]) sessionsByMuscle[muscle] = new Set()
        sessionsByMuscle[muscle].add(sessionId)
      }
    }

    const volume = Object.entries(volumeByMuscle)
      .map(([label, value]) => ({ label, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)

    const frequency = Object.entries(sessionsByMuscle)
      .map(([label, sessions]) => ({ label, value: sessions.size }))
      .sort((a, b) => b.value - a.value)

    return { volume, frequency }
  },

  // --- Summary stats ---
  async getSummaryStats(rangeDays) {
    const cutoff = cutoffTs(rangeDays)
    const sessions = await db.workoutSessions
      .where('status').equals('completed')
      .filter(s => s.startedAt >= cutoff)
      .toArray()

    const totalVolume = sessions.reduce((sum, s) => sum + (s.totalVolumeKg || 0), 0)
    const totalSessions = sessions.length

    // Count PRs: sessions where totalVolumeKg is highest up to that date
    let prCount = 0
    const sorted = [...sessions].sort((a, b) => a.startedAt - b.startedAt)
    let maxVol = 0
    for (const s of sorted) {
      if (s.totalVolumeKg > maxVol) { maxVol = s.totalVolumeKg; prCount++ }
    }

    return { totalSessions, totalVolume: Math.round(totalVolume), prCount }
  },
}
