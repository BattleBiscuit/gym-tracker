<template>
  <AppPageShell>
    <template #header>
      <span class="page-title">Analytics</span>
      <div style="flex:1" />
      <!-- Range selector -->
      <div class="range-toggle">
        <button
          v-for="r in ranges" :key="r.days"
          :class="['range-btn', { 'range-btn--active': store.rangeDays === r.days }]"
          @click="store.setRange(r.days)"
        >{{ r.label }}</button>
      </div>
    </template>

    <div class="analytics-content">

      <!-- Summary cards -->
      <div class="stat-cards">
        <div class="stat-card">
          <span class="stat-card__value">{{ store.summaryStats.totalSessions }}</span>
          <span class="stat-card__label">Workouts</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__value">{{ formatVolume(store.summaryStats.totalVolume) }}</span>
          <span class="stat-card__label">Total volume</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__value">{{ store.summaryStats.prCount }}</span>
          <span class="stat-card__label">Volume PRs</span>
        </div>
      </div>

      <!-- Weekly volume bar chart -->
      <section class="chart-section">
        <h2 class="chart-title">Weekly volume</h2>
        <div v-if="!store.weeklyData.length" class="chart-empty">No data for this period</div>
        <BarChart v-else :data="store.weeklyData" unit="kg" />
      </section>

      <!-- Muscle group volume -->
      <section class="chart-section">
        <h2 class="chart-title">Volume by muscle group</h2>
        <div v-if="!store.muscleVolume.length" class="chart-empty">No muscle data for this period — make sure exercises in your library have muscle groups set</div>
        <BarChart v-else :data="store.muscleVolume" color="#e8ff47" unit="kg" />
      </section>

      <!-- Muscle group frequency -->
      <section class="chart-section">
        <h2 class="chart-title">Sessions per muscle group</h2>
        <div v-if="!store.muscleFrequency.length" class="chart-empty">No data for this period</div>
        <BarChart v-else :data="store.muscleFrequency" color="#4caf50" unit="sessions" />
      </section>

      <!-- Exercise progress -->
      <section class="chart-section">
        <h2 class="chart-title">Exercise progress</h2>

        <!-- Exercise picker -->
        <button class="exercise-picker" @click="sheetOpen = true">
          <span :class="store.selectedExercise ? 'picker-filled' : 'picker-placeholder'">
            {{ store.selectedExercise?.name || 'Select an exercise…' }}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>

        <template v-if="store.selectedExercise">
          <div v-if="store.isLoading" class="chart-empty">Loading…</div>

          <template v-else-if="!store.oneRMData.length && !store.volumeData.length">
            <div class="chart-empty">No logged sets for "{{ store.selectedExercise.name }}" in this period</div>
          </template>

          <template v-else>
            <div v-if="store.oneRMData.length" class="chart-subsection">
              <h3 class="chart-subtitle">Estimated 1RM</h3>
              <LineChart :data="store.oneRMData" color="#e8ff47" unit="kg" />
            </div>

            <div v-if="store.volumeData.length" class="chart-subsection">
              <h3 class="chart-subtitle">Volume per session</h3>
              <LineChart :data="store.volumeData" color="#4caf50" unit="kg" />
            </div>
          </template>
        </template>

        <div v-else class="chart-empty chart-empty--hint">
          Pick an exercise above to see its progression charts
        </div>
      </section>
    </div>

    <!-- Exercise picker bottom sheet -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="sheetOpen" class="sheet-backdrop" @click.self="sheetOpen = false">
          <div class="sheet">
            <div class="sheet-handle" />
            <div class="sheet-search-row">
              <input
                ref="sheetInputRef"
                v-model="searchQuery"
                class="sheet-search"
                type="text"
                placeholder="Search exercises…"
                autocomplete="off"
              />
              <button class="sheet-cancel" @click="sheetOpen = false">Cancel</button>
            </div>
            <div class="sheet-list">
              <button
                v-for="ex in filteredExercises"
                :key="ex.id"
                class="sheet-option"
                :class="{ 'sheet-option--active': store.selectedExercise?.id === ex.id }"
                @click="selectExercise(ex)"
              >
                <span class="sheet-option__name">{{ ex.name }}</span>
                <span class="sheet-option__meta">{{ ex.type }}<template v-if="ex.primaryMuscles?.length"> · {{ ex.primaryMuscles.slice(0,2).join(', ') }}</template></span>
              </button>
              <div v-if="!filteredExercises.length" class="sheet-empty">No exercises found</div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppPageShell>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import LineChart from '../components/LineChart.vue'
import BarChart from '../components/BarChart.vue'
import { useAnalyticsStore } from '../stores/useAnalyticsStore.js'
import { useLibraryStore } from '@/features/library/stores/useLibraryStore.js'

const store        = useAnalyticsStore()
const libraryStore = useLibraryStore()

const sheetOpen    = ref(false)
const searchQuery  = ref('')
const sheetInputRef = ref(null)

const ranges = [
  { label: '30d',  days: 30  },
  { label: '90d',  days: 90  },
  { label: '1y',   days: 365 },
  { label: 'All',  days: null },
]

const filteredExercises = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return libraryStore.exercises
  return libraryStore.exercises.filter(e => e.name.toLowerCase().includes(q))
})

function formatVolume(kg) {
  if (!kg) return '0 kg'
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  return `${kg.toLocaleString()} kg`
}

function selectExercise(ex) {
  store.setExercise({ id: ex.id, name: ex.name })
  sheetOpen.value  = false
  searchQuery.value = ''
}

watch(sheetOpen, async v => {
  if (v) { await nextTick(); sheetInputRef.value?.focus() }
})

onMounted(async () => {
  if (!libraryStore.exercises.length) await libraryStore.loadAll()
  await store.loadAll()
})
</script>

<style scoped>
.page-title { font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--color-text-1); }

.range-toggle { display: flex; gap: 2px; }

.range-btn {
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-3);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}
.range-btn--active { color: var(--color-accent); border-color: rgba(232,255,71,0.3); background: rgba(232,255,71,0.06); }

.analytics-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-4);
  padding-bottom: var(--scroll-pb);
}

/* Summary cards */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.stat-card {
  background: var(--color-surface-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.stat-card__value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text-1);
  line-height: 1;
}

.stat-card__label {
  font-size: 10px;
  color: var(--color-text-3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-align: center;
}

/* Chart sections */
.chart-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.chart-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: var(--text-xs);
}

.chart-subsection { display: flex; flex-direction: column; gap: var(--space-2); }

.chart-subtitle {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-2);
}

.chart-empty {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-text-3);
  font-size: var(--text-sm);
  background: var(--color-surface-1);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border);
}
.chart-empty--hint { border-style: dashed; }

/* Exercise picker */
.exercise-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: var(--touch-target-min);
  padding: 0 var(--space-4);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}
.exercise-picker:active { border-color: var(--color-border-focus); }

.picker-filled    { font-size: var(--text-base); color: var(--color-text-1); font-weight: var(--font-medium); }
.picker-placeholder { font-size: var(--text-base); color: var(--color-text-3); }

/* Bottom sheet — shared style with ExerciseSearchInput */
.sheet-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 2000;
  display: flex; align-items: flex-end;
}
.sheet {
  width: 100%; max-height: 85dvh;
  background: var(--color-surface-1);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  display: flex; flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.sheet-handle {
  width: 36px; height: 4px;
  background: var(--color-surface-3);
  border-radius: var(--radius-full);
  margin: var(--space-3) auto var(--space-1);
  flex-shrink: 0;
}
.sheet-search-row {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-2) var(--space-4) var(--space-3);
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border);
}
.sheet-search {
  flex: 1; height: 40px; padding: 0 var(--space-4);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text-1); font-size: var(--text-sm);
  user-select: text; -webkit-user-select: text;
}
.sheet-search:focus { border-color: var(--color-border-focus); outline: none; }
.sheet-cancel { font-size: var(--text-sm); color: var(--color-text-2); white-space: nowrap; }
.sheet-cancel:active { color: var(--color-text-1); }
.sheet-list { flex: 1; overflow-y: auto; overscroll-behavior: contain; }
.sheet-option {
  width: 100%; display: flex; flex-direction: column; gap: 2px;
  padding: var(--space-4); text-align: left;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}
.sheet-option:last-child { border-bottom: none; }
.sheet-option:active { background: var(--color-surface-2); }
.sheet-option--active { background: rgba(232,255,71,0.05); }
.sheet-option__name { font-size: var(--text-base); font-weight: var(--font-medium); color: var(--color-text-1); }
.sheet-option__meta { font-size: var(--text-xs); color: var(--color-text-3); }
.sheet-empty { padding: var(--space-8) var(--space-4); text-align: center; color: var(--color-text-3); font-size: var(--text-sm); }

.sheet-enter-active, .sheet-leave-active { transition: opacity 200ms ease; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform 200ms ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(100%); }
</style>
