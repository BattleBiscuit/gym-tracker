import { db } from '@/db/index.js'

export const libraryRepository = {
  async getAll() {
    return db.exerciseLibrary.orderBy('name').toArray()
  },

  async search(query) {
    const q = query.trim().toLowerCase()
    if (!q) return db.exerciseLibrary.orderBy('name').toArray()
    return db.exerciseLibrary
      .filter(e => e.name.toLowerCase().includes(q))
      .sortBy('name')
  },

  async getById(id) {
    return db.exerciseLibrary.get(id)
  },

  async getByName(name) {
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
