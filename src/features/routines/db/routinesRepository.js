import Dexie from 'dexie'
import { db } from '@/db/index.js'

export const routinesRepository = {
  async getAll() {
    return db.routines.orderBy('updatedAt').reverse().toArray()
  },

  async getById(id) {
    return db.routines.get(id)
  },

  async getExercisesForRoutine(routineId) {
    return db.routineExercises
      .where('[routineId+position]')
      .between([routineId, Dexie.minKey], [routineId, Dexie.maxKey])
      .toArray()
  },

  async create(data) {
    const now = Date.now()
    const routine = {
      id: crypto.randomUUID(),
      name: data.name,
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now,
    }
    await db.routines.add(routine)
    return routine
  },

  async update(id, data) {
    const updates = { ...data, updatedAt: Date.now() }
    await db.routines.update(id, updates)
  },

  async delete(id) {
    await db.transaction('rw', db.routines, db.routineExercises, async () => {
      await db.routineExercises.where('routineId').equals(id).delete()
      await db.routines.delete(id)
    })
  },

  async addExercise(routineId, data, position) {
    const exercise = {
      id: crypto.randomUUID(),
      routineId,
      position,
      name: data.name,
      exerciseLibraryId: data.exerciseLibraryId || null,
      sets: data.sets,
      notes: data.notes || '',
    }
    await db.routineExercises.add(exercise)
    await db.routines.update(routineId, { updatedAt: Date.now() })
    return exercise
  },

  async updateExercise(id, data) {
    await db.routineExercises.update(id, data)
  },

  async deleteExercise(id) {
    await db.routineExercises.delete(id)
  },

  async reorderExercises(updates) {
    // updates: Array<{ id, position }>
    await db.transaction('rw', db.routineExercises, async () => {
      for (const { id, position } of updates) {
        await db.routineExercises.update(id, { position })
      }
    })
  },
}
