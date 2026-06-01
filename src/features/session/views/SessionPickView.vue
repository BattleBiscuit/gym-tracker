<template>
  <AppPageShell>
    <template #header>
      <span class="page-title">Workout</span>
      <AppButton variant="accent" size="sm" @click="router.push({ name: 'routine-create' })">+ New</AppButton>
    </template>

    <!-- Resume banner -->
    <div v-if="sessionStore.activeSessionId" class="resume-banner" @click="router.push({ name: 'session-active' })">
      <div class="resume-banner__text">
        <span class="resume-banner__label">Workout in progress</span>
        <span class="resume-banner__sub">{{ sessionStore.activeSession?.routineName }}</span>
      </div>
      <span class="resume-banner__arrow">→</span>
    </div>

    <div class="pick-list">
      <div v-if="routinesStore.isLoading" class="pick-skeleton" v-for="n in 3" :key="n" />

      <div v-else-if="routinesStore.sortedRoutines.length === 0" class="pick-empty">
        <p class="pick-empty__heading">No routines yet</p>
        <p class="pick-empty__sub">Tap <strong>+ New</strong> to create your first routine.</p>
      </div>

      <div
        v-else
        v-for="routine in routinesStore.sortedRoutines"
        :key="routine.id"
        class="pick-card"
      >
        <div class="pick-card__body" @click="openEdit(routine)">
          <span class="pick-card__name">{{ routine.name }}</span>
          <span class="pick-card__sub">
            {{ exerciseCounts[routine.id] || 0 }} exercises
            <span class="pick-card__dot">·</span>
            {{ relativeDate(routine.updatedAt) }}
          </span>
          <p v-if="routine.notes" class="pick-card__notes">{{ routine.notes }}</p>
        </div>
        <button class="pick-card__start" @click="startRoutine(routine)" :disabled="!!sessionStore.activeSessionId" title="Start workout">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
      </div>
    </div>
  </AppPageShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useRoutinesStore } from '@/features/routines/stores/useRoutinesStore.js'
import { useSessionStore } from '../stores/useSessionStore.js'
import { db } from '@/db/index.js'

const router = useRouter()
const routinesStore = useRoutinesStore()
const sessionStore = useSessionStore()
const exerciseCounts = ref({})

onMounted(async () => {
  await routinesStore.loadRoutines()
  const counts = {}
  for (const r of routinesStore.routines) {
    counts[r.id] = await db.routineExercises.where('routineId').equals(r.id).count()
  }
  exerciseCounts.value = counts
})

function relativeDate(ts) {
  const diff = Date.now() - ts
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(ts).toLocaleDateString()
}

function openEdit(routine) {
  router.push({ name: 'routine-edit', params: { id: routine.id } })
}

async function startRoutine(routine) {
  if (sessionStore.activeSessionId) {
    router.push({ name: 'session-active' })
    return
  }
  await sessionStore.startSession(routine.id)
  router.push({ name: 'session-active' })
}
</script>

<style scoped>
.page-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text-1);
  flex: 1;
}

.resume-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  background-color: rgba(232, 255, 71, 0.08);
  border-bottom: 1px solid rgba(232, 255, 71, 0.2);
  cursor: pointer;
}

.resume-banner__text { display: flex; flex-direction: column; gap: 2px; }
.resume-banner__label { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--color-accent); }
.resume-banner__sub   { font-size: var(--text-sm); color: var(--color-text-2); }
.resume-banner__arrow { color: var(--color-accent); font-size: var(--text-lg); }

.pick-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  padding-bottom: var(--scroll-pb);
}

.pick-skeleton {
  height: 76px;
  background-color: var(--color-surface-1);
  border-radius: var(--radius-lg);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

.pick-empty { text-align: center; padding: var(--space-12) var(--space-6); }
.pick-empty__heading { font-size: var(--text-xl); font-weight: var(--font-semibold); color: var(--color-text-2); margin-bottom: var(--space-2); }
.pick-empty__sub { font-size: var(--text-base); color: var(--color-text-3); }

.pick-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--color-surface-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: background-color var(--transition-fast);
}

.pick-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  cursor: pointer;
}
.pick-card__body:active { opacity: 0.7; }

.pick-card__name { font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--color-text-1); }
.pick-card__sub  { font-size: var(--text-sm); color: var(--color-text-2); }
.pick-card__dot  { margin: 0 var(--space-1); }

.pick-card__notes {
  font-size: var(--text-sm);
  color: var(--color-text-3);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.pick-card__start {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background-color: var(--color-accent);
  color: #0f0f0f;
  border-radius: var(--radius-lg);
  flex-shrink: 0;
  transition: background-color var(--transition-fast), opacity var(--transition-fast);
}
.pick-card__start:active  { background-color: var(--color-accent-dim); }
.pick-card__start:disabled { opacity: 0.3; }
</style>
