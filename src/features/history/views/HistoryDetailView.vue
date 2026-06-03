<template>
  <AppPageShell>
    <template #header>
      <button class="back-btn" @click="router.back()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <span class="page-title">Workout Detail</span>
      <button class="edit-toggle" @click="toggleEdit">
        {{ editing ? 'Cancel' : 'Edit' }}
      </button>
    </template>

    <template v-if="store.isLoading">
      <div class="detail-loading">Loading…</div>
    </template>

    <template v-else-if="store.selectedSession">
      <WorkoutSummaryHeader :session="store.selectedSession" />

      <div v-if="sessionPRs.length" class="pr-banner">
        <span class="pr-banner__title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>PRs this session
        </span>
        <div class="pr-banner__list">
          <span v-for="pr in sessionPRs" :key="pr" class="pr-banner__item">{{ pr }}</span>
        </div>
      </div>

      <div class="detail-sets">
        <HistorySetTable
          v-for="(sets, position) in store.selectedSets"
          :key="position"
          :ref="el => tableRefs[position] = el"
          :exerciseName="sets[0]?.exerciseName || `Exercise ${Number(position) + 1}`"
          :sets="sets"
          :editing="editing"
        />
      </div>
    </template>

    <!-- Save FAB when editing -->
    <AppFab v-if="editing" @click="saveEdits" :disabled="isSaving">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      {{ isSaving ? 'Saving…' : 'Save changes' }}
    </AppFab>
  </AppPageShell>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import AppFab from '@/components/ui/AppFab.vue'
import WorkoutSummaryHeader from '../components/WorkoutSummaryHeader.vue'
import HistorySetTable from '../components/HistorySetTable.vue'
import { useHistoryStore } from '../stores/useHistoryStore.js'
import { db } from '@/db/index.js'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()
const store = useHistoryStore()

const editing  = ref(false)
const isSaving = ref(false)
const tableRefs = ref({})

onMounted(() => store.loadSessionDetail(props.id))

const sessionPRs = computed(() => {
  const names = new Set()
  for (const sets of Object.values(store.selectedSets)) {
    for (const set of sets) {
      if (set.isPR) names.add(set.exerciseName)
    }
  }
  return [...names]
})

function toggleEdit() {
  if (editing.value) {
    // Cancel — reset all table edits
    Object.values(tableRefs.value).forEach(t => t?.resetEdits())
  }
  editing.value = !editing.value
}

async function saveEdits() {
  isSaving.value = true
  try {
    const allChanges = []
    for (const tableRef of Object.values(tableRefs.value)) {
      if (tableRef) allChanges.push(...tableRef.getChanges())
    }

    await db.transaction('rw', db.workoutSets, async () => {
      for (const change of allChanges) {
        const { id, ...updates } = change
        await db.workoutSets.update(id, updates)
      }
    })

    // Recompute totalVolumeKg on session
    const sets = await db.workoutSets.where('sessionId').equals(props.id).toArray()
    const totalVol = sets
      .filter(s => s.completedAt && !s.skipped && s.type !== 'cardio')
      .reduce((sum, s) => sum + (s.actualReps || 0) * (s.effectiveWeight ?? s.actualWeight ?? 0), 0)
    await db.workoutSessions.update(props.id, { totalVolumeKg: Math.round(totalVol) })

    // Reload to show updated values
    await store.loadSessionDetail(props.id)
    editing.value = false
  } finally {
    isSaving.value = false
  }
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

.edit-toggle {
  font-size: var(--text-sm); font-weight: var(--font-medium);
  color: var(--color-accent); padding: var(--space-1) var(--space-3);
  border: 1px solid rgba(232,255,71,0.3); border-radius: var(--radius-full);
  transition: background var(--transition-fast);
}
.edit-toggle:active { background: rgba(232,255,71,0.1); }

.detail-loading { padding: var(--space-8); text-align: center; color: var(--color-text-3); }

.pr-banner {
  margin: var(--space-4) var(--space-4) 0;
  padding: var(--space-3) var(--space-4);
  background: rgba(232,255,71,0.06); border: 1px solid rgba(232,255,71,0.2);
  border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: var(--space-2);
}
.pr-banner__title { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--color-accent); }
.pr-banner__list  { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.pr-banner__item  { font-size: var(--text-sm); color: var(--color-text-1); background: rgba(232,255,71,0.08); padding: 2px var(--space-3); border-radius: var(--radius-full); }

.detail-sets {
  display: flex; flex-direction: column; gap: var(--space-4);
  padding: var(--space-4); padding-bottom: var(--scroll-pb);
}
</style>
