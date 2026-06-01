<template>
  <AppPageShell>
    <template #header>
      <button class="back-btn" @click="router.push({ name: 'session-pick' })">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="page-title">{{ isNew ? 'New Plan' : 'Edit Plan' }}</span>
    </template>

    <div class="edit-content">
      <!-- Plan name -->
      <section class="edit-section">
        <AppInput v-model="planName" label="Plan name" placeholder="e.g. PPL Split" :error="nameError" @input="nameError = ''" />
      </section>

      <!-- Entries -->
      <section class="edit-section">
        <div class="section-header">
          <span class="section-title">Workouts</span>
          <AppButton variant="ghost" size="sm" @click="showAddEntry = true">+ Add</AppButton>
        </div>

        <div v-if="!localEntries.length" class="entries-empty">
          No workouts yet. Tap <strong>+ Add</strong> to assign routines to this plan.
        </div>

        <div class="entry-list">
          <div v-for="entry in localEntries" :key="entry.id" class="entry-row">
            <div class="entry-day">
              <button
                v-for="(label, idx) in DAYS"
                :key="idx"
                :class="['day-btn', { 'day-btn--active': entry.dayOfWeek === idx }]"
                @click="entry.dayOfWeek = entry.dayOfWeek === idx ? null : idx"
                type="button"
              >{{ label }}</button>
            </div>
            <span class="entry-name">{{ entry.routineName }}</span>
            <button class="entry-del" @click="removeEntry(entry)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      </section>

      <!-- Danger zone for existing plans -->
      <section v-if="!isNew" class="edit-section">
        <div class="settings-card">
          <div class="settings-row" @click="confirmDelete = true">
            <span class="settings-row__label" style="color:var(--color-danger)">Delete plan</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Add routine bottom sheet -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showAddEntry" class="sheet-backdrop" @click.self="showAddEntry = false">
          <div class="sheet">
            <div class="sheet-handle" />
            <div class="sheet-search-row">
              <input v-model="routineSearch" ref="routineSearchRef" class="sheet-search" type="text" placeholder="Search routines…" />
              <button class="sheet-cancel" @click="showAddEntry = false">Cancel</button>
            </div>
            <div class="sheet-list">
              <button
                v-for="r in filteredRoutines"
                :key="r.id"
                class="sheet-option"
                @click="addEntry(r)"
              >
                <span class="sheet-option__name">{{ r.name }}</span>
                <span class="sheet-option__meta">{{ routineExerciseCounts[r.id] || 0 }} exercises</span>
              </button>
              <div v-if="!filteredRoutines.length" class="sheet-empty">No routines found</div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete confirm -->
    <AppModal v-model="confirmDelete" title="Delete plan?">
      <p style="color:var(--color-text-2)">This will remove the plan and all its entries. Sessions already logged are not affected.</p>
      <template #actions>
        <AppButton variant="danger" full @click="doDelete">Delete</AppButton>
        <AppButton variant="ghost" full @click="confirmDelete = false">Cancel</AppButton>
      </template>
    </AppModal>

    <AppFab @click="save" :disabled="isSaving">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      {{ isSaving ? 'Saving…' : 'Save' }}
    </AppFab>
  </AppPageShell>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppFab from '@/components/ui/AppFab.vue'
import { usePlansStore } from '../stores/usePlansStore.js'
import { useRoutinesStore } from '@/features/routines/stores/useRoutinesStore.js'
import { DAYS } from '../db/plansRepository.js'
import { db } from '@/db/index.js'

const props = defineProps({ id: { type: String, default: null } })
const router = useRouter()
const plansStore = usePlansStore()
const routinesStore = useRoutinesStore()

const isNew = computed(() => !props.id)
const planName     = ref('')
const nameError    = ref('')
const localEntries = ref([])
const isSaving     = ref(false)
const confirmDelete = ref(false)
const showAddEntry  = ref(false)
const routineSearch = ref('')
const routineSearchRef = ref(null)
const routineExerciseCounts = ref({})

watch(showAddEntry, async v => {
  if (v) { await nextTick(); routineSearchRef.value?.focus() }
})

const filteredRoutines = computed(() => {
  const q = routineSearch.value.trim().toLowerCase()
  return routinesStore.routines.filter(r => !q || r.name.toLowerCase().includes(q))
})

onMounted(async () => {
  await routinesStore.loadRoutines()
  const counts = {}
  for (const r of routinesStore.routines) {
    counts[r.id] = await db.routineExercises.where('routineId').equals(r.id).count()
  }
  routineExerciseCounts.value = counts

  if (props.id) {
    const plan = await db.plans.get(props.id)
    if (plan) {
      planName.value = plan.name
      localEntries.value = (plansStore.entries[props.id] || await plansStore.loadAll().then(() => plansStore.entries[props.id]) || [])
        .map(e => ({ ...e }))
        .sort((a, b) => a.order - b.order)
    }
  }
})

function addEntry(routine) {
  localEntries.value.push({
    id:          crypto.randomUUID(),
    planId:      props.id || null,
    routineId:   routine.id,
    routineName: routine.name,
    dayOfWeek:   null,
    order:       localEntries.value.length,
    _new:        true,
  })
  showAddEntry.value = false
  routineSearch.value = ''
}

function removeEntry(entry) {
  localEntries.value = localEntries.value.filter(e => e.id !== entry.id)
}

async function save() {
  if (!planName.value.trim()) { nameError.value = 'Plan name is required'; return }
  isSaving.value = true
  try {
    let planId = props.id
    if (isNew.value) {
      const plan = await plansStore.createPlan(planName.value)
      planId = plan.id
    } else {
      await plansStore.updatePlan(planId, { name: planName.value.trim() })
      // Delete existing entries and re-add (simplest approach for edit)
      for (const e of plansStore.entries[planId] || []) {
        await plansStore.deleteEntry(planId, e.id)
      }
    }
    // Add all local entries
    for (let i = 0; i < localEntries.value.length; i++) {
      const e = localEntries.value[i]
      await plansStore.addEntry(planId, {
        routineId:   e.routineId,
        routineName: e.routineName,
        dayOfWeek:   e.dayOfWeek,
      })
    }
    router.push({ name: 'session-pick' })
  } finally {
    isSaving.value = false
  }
}

async function doDelete() {
  await plansStore.deletePlan(props.id)
  router.push({ name: 'session-pick' })
}
</script>

<style scoped>
.back-btn {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; color: var(--color-text-2);
  border-radius: var(--radius-md); margin-left: calc(-1 * var(--space-2));
}
.back-btn:active { color: var(--color-text-1); }

.page-title { font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--color-text-1); flex: 1; }

.edit-content { display: flex; flex-direction: column; gap: var(--space-6); padding: var(--space-4); padding-bottom: var(--scroll-pb); }

.edit-section { display: flex; flex-direction: column; gap: var(--space-3); }

.section-header { display: flex; align-items: center; justify-content: space-between; }
.section-title { font-size: var(--text-xs); font-weight: var(--font-semibold); color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.1em; }

.entries-empty {
  text-align: center; padding: var(--space-8); color: var(--color-text-3);
  font-size: var(--text-sm); background: var(--color-surface-1);
  border-radius: var(--radius-lg); border: 1px dashed var(--color-border);
}

.entry-list { display: flex; flex-direction: column; gap: var(--space-2); }

.entry-row {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3); background: var(--color-surface-1);
  border: 1px solid var(--color-border); border-radius: var(--radius-lg);
  flex-wrap: wrap;
}

.entry-day { display: flex; gap: 4px; flex-wrap: wrap; }

.day-btn {
  width: 32px; height: 28px; font-size: 10px; font-weight: var(--font-medium);
  color: var(--color-text-3); background: var(--color-surface-2);
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}
.day-btn--active { background: var(--color-accent); color: #0f0f0f; border-color: var(--color-accent); font-weight: var(--font-bold); }

.entry-name { flex: 1; font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--color-text-1); min-width: 0; }

.entry-del { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; color: var(--color-danger); opacity: 0.7; border-radius: var(--radius-md); }
.entry-del:active { opacity: 1; }

/* Settings card style reuse */
.settings-card { background: var(--color-surface-1); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
.settings-row { padding: var(--space-4); cursor: pointer; }
.settings-row:active { background: var(--color-surface-2); }
.settings-row__label { font-size: var(--text-base); font-weight: var(--font-medium); }

/* Bottom sheet */
.sheet-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 2000; display: flex; align-items: flex-end; }
.sheet { width: 100%; max-height: 85dvh; background: var(--color-surface-1); border-radius: var(--radius-xl) var(--radius-xl) 0 0; display: flex; flex-direction: column; padding-bottom: env(safe-area-inset-bottom,0px); }
.sheet-handle { width: 36px; height: 4px; background: var(--color-surface-3); border-radius: var(--radius-full); margin: var(--space-3) auto var(--space-1); flex-shrink: 0; }
.sheet-search-row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-4) var(--space-3); flex-shrink: 0; border-bottom: 1px solid var(--color-border); }
.sheet-search { flex: 1; height: 40px; padding: 0 var(--space-4); background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-full); color: var(--color-text-1); font-size: var(--text-sm); user-select: text; -webkit-user-select: text; }
.sheet-search:focus { border-color: var(--color-border-focus); outline: none; }
.sheet-cancel { font-size: var(--text-sm); color: var(--color-text-2); white-space: nowrap; }
.sheet-cancel:active { color: var(--color-text-1); }
.sheet-list { flex: 1; overflow-y: auto; overscroll-behavior: contain; }
.sheet-option { width: 100%; display: flex; flex-direction: column; gap: 2px; padding: var(--space-4); text-align: left; border-bottom: 1px solid var(--color-border); }
.sheet-option:last-child { border-bottom: none; }
.sheet-option:active { background: var(--color-surface-2); }
.sheet-option__name { font-size: var(--text-base); font-weight: var(--font-medium); color: var(--color-text-1); }
.sheet-option__meta { font-size: var(--text-xs); color: var(--color-text-3); }
.sheet-empty { padding: var(--space-8) var(--space-4); text-align: center; color: var(--color-text-3); font-size: var(--text-sm); }

.sheet-enter-active, .sheet-leave-active { transition: opacity 200ms ease; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform 200ms ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(100%); }
</style>
