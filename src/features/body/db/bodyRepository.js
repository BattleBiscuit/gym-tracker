import Dexie from 'dexie'
import { db } from '@/db/index.js'

export const METRIC_TYPES = [
  { key: 'weight',  label: 'Bodyweight', unit: 'kg', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="4" x2="12" y2="8"/></svg>` },
  { key: 'bodyfat', label: 'Body fat',   unit: '%',  icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>` },
  { key: 'waist',   label: 'Waist',      unit: 'cm', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="8 8 3 12 8 16"/><polyline points="16 8 21 12 16 16"/></svg>` },
  { key: 'chest',   label: 'Chest',      unit: 'cm', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="8 8 3 12 8 16"/><polyline points="16 8 21 12 16 16"/></svg>` },
  { key: 'arms',    label: 'Arms',       unit: 'cm', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="8 8 3 12 8 16"/><polyline points="16 8 21 12 16 16"/></svg>` },
  { key: 'legs',    label: 'Legs',       unit: 'cm', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="8 8 3 12 8 16"/><polyline points="16 8 21 12 16 16"/></svg>` },
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
