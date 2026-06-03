import Dexie from 'dexie'
import { db } from '@/db/index.js'

export const METRIC_TYPES = [
  { key: 'weight',   label: 'Bodyweight', unit: 'kg',  icon: '⚖️' },
  { key: 'bodyfat',  label: 'Body fat',   unit: '%',   icon: '📊' },
  { key: 'waist',    label: 'Waist',      unit: 'cm',  icon: '📏' },
  { key: 'chest',    label: 'Chest',      unit: 'cm',  icon: '📏' },
  { key: 'arms',     label: 'Arms',       unit: 'cm',  icon: '📏' },
  { key: 'legs',     label: 'Legs',       unit: 'cm',  icon: '📏' },
]

export const bodyRepository = {
  // Most recent entry per type
  async getLatest() {
    const results = {}
    for (const { key } of METRIC_TYPES) {
      const entry = await db.bodyMetrics
        .where('[type+loggedAt]')
        .between([key, Dexie.minKey], [key, Dexie.maxKey])
        .last()
      if (entry) results[key] = entry
    }
    return results
  },

  // All entries for a type, sorted ascending (for charts)
  async getHistory(type, days = 90) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    return db.bodyMetrics
      .where('[type+loggedAt]')
      .between([type, cutoff], [type, Dexie.maxKey])
      .toArray()
  },

  async log(type, value) {
    const entry = {
      id:       crypto.randomUUID(),
      type,
      value:    Number(value),
      loggedAt: Date.now(),
    }
    await db.bodyMetrics.add(entry)
    return entry
  },

  async delete(id) {
    await db.bodyMetrics.delete(id)
  },
}
