import { db } from '@/db/index.js'

export const libraryRepository = {
  async getAll() {
    return db.exerciseLibrary.orderBy('name').toArray()
  },

  async search(query) {
    const q = query.trim().toLowerCase()
    if (!q) return db.exerciseLibrary.orderBy('name').toArray()
    // Use name index for prefix matches, fall back to filter for mid-string matches
    const all = await db.exerciseLibrary.orderBy('name').toArray()
    return all.filter(e => e.name.toLowerCase().includes(q))
  },

  async getById(id) {
    return db.exerciseLibrary.get(id)
  },

  async getByName(name) {
    // Try exact match via index first, fall back to case-insensitive filter
    const exact = await db.exerciseLibrary.where('name').equals(name.trim()).first()
    if (exact) return exact
    return db.exerciseLibrary
      .filter(e => e.name.toLowerCase() === name.trim().toLowerCase())
      .first()
  },

  async create(data) {
    const entry = {
      id:               crypto.randomUUID(),
      name:             data.name.trim(),
      type:             data.type || 'strength',
      primaryMuscles:   data.primaryMuscles   || [],
      secondaryMuscles: data.secondaryMuscles || [],
      notes:            data.notes || '',
      createdAt:        Date.now(),
    }
    await db.exerciseLibrary.add(entry)
    return entry
  },

  async update(id, data) {
    await db.exerciseLibrary.update(id, data)
  },

  async delete(id) {
    await db.exerciseLibrary.delete(id)
  },
}
