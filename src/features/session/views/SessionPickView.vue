<template>
  <AppPageShell>
    <template #header>
      <span class="page-title">Workout</span>
    </template>

    <!-- Resume banner -->
    <div v-if="sessionStore.activeSessionId" class="resume-banner" @click="router.push({ name: 'session-active' })">
      <div class="resume-banner__text">
        <span class="resume-banner__label">Workout in progress</span>
        <span class="resume-banner__sub">{{ sessionStore.activeSession?.routineName }}</span>
      </div>
      <span class="resume-banner__arrow">→</span>
    </div>

    <div class="workout-list">

      <!-- Plan containers -->
      <div v-for="plan in plansStore.plans.filter(p => p.status === 'active')" :key="plan.id" class="plan-block">
        <div class="plan-header">
          <span class="plan-name">{{ plan.name }}</span>
          <span v-if="plansStore.streaks[plan.id]" class="plan-streak">
            🔥 {{ plansStore.streaks[plan.id] }}
          </span>
          <button class="plan-edit-btn" @click="router.push({ name: 'plan-edit', params: { id: plan.id } })">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>

        <div class="plan-entries">
          <div
            v-for="entry in (plansStore.entries[plan.id] || []).slice().sort((a,b) => a.order - b.order)"
            :key="entry.id"
            class="entry-row"
          >
            <span class="entry-day">{{ entry.dayOfWeek !== null ? DAYS[entry.dayOfWeek] : '·' }}</span>
            <span class="entry-routine" @click="router.push({ name: 'routine-edit', params: { id: entry.routineId } })">{{ entry.routineName }}</span>
            <span :class="['entry-done', plansStore.isDoneThisWeek(entry.id) ? 'entry-done--yes' : 'entry-done--no']">
              {{ plansStore.isDoneThisWeek(entry.id) ? '✓' : '·' }}
            </span>
            <button
              class="entry-start"
              :disabled="!!sessionStore.activeSessionId"
              @click="startFromPlan(entry)"
              title="Start"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Unplanned routines -->
      <div v-if="unplannedRoutines.length" class="plan-block plan-block--unplanned">
        <div class="plan-header">
          <span class="plan-name plan-name--dim">Unplanned</span>
        </div>
        <div class="plan-entries">
          <div v-for="routine in unplannedRoutines" :key="routine.id" class="entry-row">
            <span class="entry-day">·</span>
            <span class="entry-routine" @click="router.push({ name: 'routine-edit', params: { id: routine.id } })">
              {{ routine.name }}
            </span>
            <span class="entry-done entry-done--no">·</span>
            <button
              class="entry-start"
              :disabled="!!sessionStore.activeSessionId"
              @click="startUnplanned(routine)"
              title="Start"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!plansStore.plans.length && !routinesStore.routines.length" class="workout-empty">
        <p class="workout-empty__heading">Nothing here yet</p>
        <p class="workout-empty__sub">Tap <strong>+</strong> to create a plan or routine.</p>
      </div>
    </div>

    <!-- FAB: Add sheet trigger -->
    <AppFab @click="addSheet = true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add
    </AppFab>

    <!-- Add sheet: plan or routine -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="addSheet" class="sheet-backdrop" @click.self="addSheet = false">
          <div class="sheet sheet--small">
            <div class="sheet-handle" />
            <div class="add-options">
              <button class="add-option" @click="addSheet = false; router.push({ name: 'plan-create' })">
                <div class="add-option__icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div class="add-option__body">
                  <span class="add-option__label">New plan</span>
                  <span class="add-option__sub">Schedule routines across the week</span>
                </div>
              </button>
              <div class="add-option-divider" />
              <button class="add-option" @click="addSheet = false; router.push({ name: 'routine-create' })">
                <div class="add-option__icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
                </div>
                <div class="add-option__body">
                  <span class="add-option__label">New routine</span>
                  <span class="add-option__sub">Create a set of exercises</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppPageShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import AppFab from '@/components/ui/AppFab.vue'
import { useRoutinesStore } from '@/features/routines/stores/useRoutinesStore.js'
import { useSessionStore } from '../stores/useSessionStore.js'
import { usePlansStore } from '@/features/plans/stores/usePlansStore.js'
import { DAYS } from '@/features/plans/db/plansRepository.js'

const router = useRouter()
const routinesStore = useRoutinesStore()
const sessionStore  = useSessionStore()
const plansStore    = usePlansStore()

const addSheet = ref(false)

const unplannedRoutines = computed(() =>
  routinesStore.sortedRoutines.filter(r => !plansStore.plannedRoutineIds.has(r.id))
)

onMounted(async () => {
  await Promise.all([
    routinesStore.loadRoutines(),
    plansStore.loadAll(),
  ])
})

async function startFromPlan(entry) {
  if (sessionStore.activeSessionId) { router.push({ name: 'session-active' }); return }
  await sessionStore.startSession(entry.routineId, entry.planId, entry.id)
  router.push({ name: 'session-active' })
}

async function startUnplanned(routine) {
  if (sessionStore.activeSessionId) { router.push({ name: 'session-active' }); return }
  await sessionStore.startSession(routine.id)
  router.push({ name: 'session-active' })
}
</script>

<style scoped>
.page-title { font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--color-text-1); flex: 1; }

.resume-banner { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4); background-color: rgba(232,255,71,0.08); border-bottom: 1px solid rgba(232,255,71,0.2); cursor: pointer; }
.resume-banner__text { display: flex; flex-direction: column; gap: 2px; }
.resume-banner__label { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--color-accent); }
.resume-banner__sub   { font-size: var(--text-sm); color: var(--color-text-2); }
.resume-banner__arrow { color: var(--color-accent); font-size: var(--text-lg); }

.workout-list { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4); padding-bottom: var(--scroll-pb); }

.plan-block {
  background: var(--color-surface-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.plan-block--unplanned { border-style: dashed; }

.plan-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-2);
}

.plan-name { font-size: var(--text-sm); font-weight: var(--font-bold); color: var(--color-text-1); text-transform: uppercase; letter-spacing: 0.06em; }
.plan-name--dim { color: var(--color-text-3); }

.plan-streak {
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--color-warning);
  margin-left: auto;
  margin-right: var(--space-2);
}

.plan-edit-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; color: var(--color-text-3); border-radius: var(--radius-md); }
.plan-edit-btn:active { color: var(--color-text-1); }

.plan-entries { display: flex; flex-direction: column; }

.entry-row {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.entry-row:last-child { border-bottom: none; }

.entry-day { width: 28px; font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--color-text-3); flex-shrink: 0; }
.entry-routine { flex: 1; font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--color-text-1); cursor: pointer; }
.entry-routine:active { opacity: 0.6; }

.entry-done { width: 20px; text-align: center; font-size: var(--text-sm); font-weight: var(--font-bold); flex-shrink: 0; }
.entry-done--yes { color: var(--color-success); }
.entry-done--no  { color: var(--color-text-3); }

.entry-start {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; flex-shrink: 0;
  background: var(--color-accent); color: #0f0f0f;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast), opacity var(--transition-fast);
}
.entry-start:active  { background: var(--color-accent-dim); }
.entry-start:disabled { opacity: 0.3; }

.workout-empty { text-align: center; padding: var(--space-12) var(--space-6); }
.workout-empty__heading { font-size: var(--text-xl); font-weight: var(--font-semibold); color: var(--color-text-2); margin-bottom: var(--space-2); }
.workout-empty__sub { font-size: var(--text-base); color: var(--color-text-3); }

/* Add sheet */
.sheet-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 2000; display: flex; align-items: flex-end; }
.sheet { width: 100%; max-height: 85dvh; background: var(--color-surface-1); border-radius: var(--radius-xl) var(--radius-xl) 0 0; display: flex; flex-direction: column; padding-bottom: env(safe-area-inset-bottom,0px); }
.sheet--small { max-height: 50dvh; }
.sheet-handle { width: 36px; height: 4px; background: var(--color-surface-3); border-radius: var(--radius-full); margin: var(--space-3) auto var(--space-1); flex-shrink: 0; }

.add-options { display: flex; flex-direction: column; padding: var(--space-2) 0; }
.add-option { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4) var(--space-5); text-align: left; transition: background var(--transition-fast); }
.add-option:active { background: var(--color-surface-2); }
.add-option__icon { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: var(--color-surface-2); border-radius: var(--radius-lg); color: var(--color-accent); flex-shrink: 0; }
.add-option__body { display: flex; flex-direction: column; gap: 2px; }
.add-option__label { font-size: var(--text-base); font-weight: var(--font-semibold); color: var(--color-text-1); }
.add-option__sub   { font-size: var(--text-sm); color: var(--color-text-3); }
.add-option-divider { height: 1px; background: var(--color-border); margin: 0 var(--space-4); }

.sheet-enter-active, .sheet-leave-active { transition: opacity 200ms ease; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform 200ms ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(100%); }
</style>
