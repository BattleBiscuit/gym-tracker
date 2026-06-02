import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetDb } from './helpers.js'
import { db } from '@/db/index.js'
import { plansRepository } from '@/features/plans/db/plansRepository.js'

beforeEach(async () => {
  await resetDb()
})

function mondayOf(weeksAgo = 0) {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1 - weeksAgo * 7)
  monday.setHours(0, 0, 0, 0)
  return monday.getTime()
}

async function seedPlanWithEntry(dayOfWeek = 1) {
  const plan = { id: crypto.randomUUID(), name: 'Test Plan', status: 'active', createdAt: Date.now(), order: 0 }
  const entry = { id: crypto.randomUUID(), planId: plan.id, routineId: 'r1', routineName: 'Push Day', dayOfWeek, order: 0 }
  await db.plans.add(plan)
  await db.planEntries.add(entry)
  return { plan, entry }
}

async function seedCompletedSession(planId, planEntryId, weeksAgo = 0) {
  const base = mondayOf(weeksAgo) + 86400000  // Tuesday of that week
  await db.workoutSessions.add({
    id: crypto.randomUUID(),
    routineId: 'r1', routineName: 'Push Day',
    startedAt: base, completedAt: base + 3600000,
    status: 'completed', totalVolumeKg: 1000,
    planId, planEntryId,
  })
}

describe('Streak calculation', () => {
  it('returns 0 when no sessions logged', async () => {
    const { plan, entry } = await seedPlanWithEntry()
    const streak = await plansRepository.getStreak(plan.id, [entry])
    expect(streak).toBe(0)
  })

  it('returns 1 after completing this week', async () => {
    const { plan, entry } = await seedPlanWithEntry()
    await seedCompletedSession(plan.id, entry.id, 0)
    const streak = await plansRepository.getStreak(plan.id, [entry])
    expect(streak).toBe(1)
  })

  it('counts consecutive weeks correctly', async () => {
    const { plan, entry } = await seedPlanWithEntry()
    await seedCompletedSession(plan.id, entry.id, 0)
    await seedCompletedSession(plan.id, entry.id, 1)
    await seedCompletedSession(plan.id, entry.id, 2)
    const streak = await plansRepository.getStreak(plan.id, [entry])
    expect(streak).toBe(3)
  })

  it('stops at first missed week', async () => {
    const { plan, entry } = await seedPlanWithEntry()
    await seedCompletedSession(plan.id, entry.id, 0) // this week ✓
    await seedCompletedSession(plan.id, entry.id, 1) // last week ✓
    // week 2 ago: missing ✗
    await seedCompletedSession(plan.id, entry.id, 3) // 3 weeks ago ✓ (doesn't count)
    const streak = await plansRepository.getStreak(plan.id, [entry])
    expect(streak).toBe(2)
  })

  it('returns 0 for entries with no dayOfWeek assigned', async () => {
    const { plan } = await seedPlanWithEntry()
    const undayedEntry = { id: crypto.randomUUID(), planId: plan.id, routineId: 'r1', routineName: 'Push Day', dayOfWeek: null, order: 0 }
    const streak = await plansRepository.getStreak(plan.id, [undayedEntry])
    expect(streak).toBe(0) // no required days = no streak
  })
})
