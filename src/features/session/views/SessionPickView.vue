<template>
  <AppPageShell>
    <template #header>
      <span class="page-title">Start Workout</span>
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
      <p v-if="routinesStore.isLoading" class="pick-hint">Loading…</p>
      <p v-else-if="routinesStore.sortedRoutines.length === 0" class="pick-hint">
        No routines yet. Create one in the Routines tab first.
      </p>

      <div
        v-for="routine in routinesStore.sortedRoutines"
        :key="routine.id"
        class="pick-card"
        @click="startRoutine(routine)"
      >
        <div class="pick-card__body">
          <span class="pick-card__name">{{ routine.name }}</span>
          <span class="pick-card__sub">{{ exerciseCounts[routine.id] || 0 }} exercises</span>
          <p v-if="routine.notes" class="pick-card__notes">{{ routine.notes }}</p>
        </div>
        <span class="pick-card__go">▶</span>
      </div>
    </div>

    <!-- Confirm start modal -->
    <AppModal v-model="confirmModal" :title="`Start ${pendingRoutine?.name}?`">
      <p style="color: var(--color-text-2)">
        This will begin a new workout session for <strong>{{ pendingRoutine?.name }}</strong>.
      </p>
      <template #actions>
        <AppButton variant="accent" full @click="doStart">Start workout</AppButton>
        <AppButton variant="ghost" full @click="confirmModal = false">Cancel</AppButton>
      </template>
    </AppModal>
  </AppPageShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { useRoutinesStore } from '@/features/routines/stores/useRoutinesStore.js'
import { useSessionStore } from '../stores/useSessionStore.js'
import { db } from '@/db/index.js'

const router = useRouter()
const routinesStore = useRoutinesStore()
const sessionStore = useSessionStore()

const confirmModal = ref(false)
const pendingRoutine = ref(null)
const exerciseCounts = ref({})

onMounted(async () => {
  await routinesStore.loadRoutines()
  const counts = {}
  for (const r of routinesStore.routines) {
    counts[r.id] = await db.routineExercises.where('routineId').equals(r.id).count()
  }
  exerciseCounts.value = counts
})

function startRoutine(routine) {
  if (sessionStore.activeSessionId) {
    router.push({ name: 'session-active' })
    return
  }
  pendingRoutine.value = routine
  confirmModal.value = true
}

async function doStart() {
  if (!pendingRoutine.value) return
  confirmModal.value = false
  await sessionStore.startSession(pendingRoutine.value.id)
  router.push({ name: 'session-active' })
}
</script>

<style scoped>
.page-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text-1);
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

.resume-banner__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.resume-banner__label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-accent);
}

.resume-banner__sub {
  font-size: var(--text-sm);
  color: var(--color-text-2);
}

.resume-banner__arrow {
  color: var(--color-accent);
  font-size: var(--text-lg);
}

.pick-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  padding-bottom: var(--scroll-pb);
}

.pick-hint {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-3);
  font-size: var(--text-sm);
}

.pick-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background-color: var(--color-surface-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}
.pick-card:active {
  background-color: var(--color-surface-2);
  border-color: var(--color-accent);
}

.pick-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.pick-card__name {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-1);
}

.pick-card__sub {
  font-size: var(--text-sm);
  color: var(--color-text-2);
}

.pick-card__notes {
  font-size: var(--text-sm);
  color: var(--color-text-3);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.pick-card__go {
  color: var(--color-accent);
  font-size: var(--text-xl);
}
</style>
