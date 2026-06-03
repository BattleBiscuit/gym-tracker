<template>
  <AppPageShell>
    <template #header>
      <span class="page-title">Progress</span>
      <div class="range-toggle">
        <button v-for="r in ranges" :key="r.days"
          :class="['range-btn', { 'range-btn--active': rangeDays === r.days }]"
          @click="setRange(r.days)">{{ r.label }}</button>
      </div>
    </template>

    <div class="progress-content">

      <!-- Metric cards -->
      <div class="metric-grid">
        <!-- Sessions -->
        <div class="metric-card">
          <span class="metric-value">{{ data.sessionCount }}</span>
          <span class="metric-label">Workouts</span>
        </div>

        <!-- Volume trend -->
        <div class="metric-card">
          <span class="metric-value" :class="volumeChangeClass">
            {{ volumeChangeLabel }}
          </span>
          <span class="metric-label">Volume trend</span>
        </div>

        <!-- Plan adherence -->
        <div v-if="data.adherence !== null" class="metric-card">
          <span class="metric-value" :class="adherenceClass">{{ data.adherence }}%</span>
          <span class="metric-label">Plan adherence</span>
        </div>

        <!-- Best streak across all active plans -->
        <div v-if="data.bestStreak > 0" class="metric-card">
          <span class="metric-value metric-value--streak">🔥 {{ data.bestStreak }}</span>
          <span class="metric-label">Best streak (weeks)</span>
        </div>
      </div>

      <!-- Chart slider -->
      <ChartSlider :slides="chartSlides">
        <!-- Slide 0: Muscle balance -->
        <template #controls-0>
          <div class="mode-toggle">
            <button :class="['mode-btn', { 'mode-btn--active': muscleMode === 'exercise' }]" @click="muscleMode = 'exercise'">Exercise</button>
            <button :class="['mode-btn', { 'mode-btn--active': muscleMode === 'session' }]" @click="muscleMode = 'session'">Session</button>
          </div>
        </template>
        <template #slide-0>
          <RadarChart :data="data.muscleFrequency" />
        </template>

        <!-- Slide 1: Weekly volume -->
        <template #slide-1>
          <VolumeChart :data="data.weeklyVolume" />
        </template>
      </ChartSlider>

      <!-- Recent PRs -->
      <section class="progress-section">
        <div class="section-header">
          <h2 class="section-title">Recent PRs</h2>
          <button v-if="data.prs.length > 3" class="section-expand" @click="showAllPRs = !showAllPRs">
            {{ showAllPRs ? 'Show less' : `Show all ${data.prs.length}` }}
          </button>
        </div>
        <div v-if="!data.prs.length" class="section-empty">
          No PRs in this period. Keep pushing!
        </div>
        <div v-else class="pr-list">
          <div v-for="pr in visiblePRs" :key="pr.exerciseName" class="pr-row">
            <span class="pr-trophy">🏆</span>
            <div class="pr-body">
              <span class="pr-name">{{ pr.exerciseName }}</span>
              <span class="pr-date">{{ formatDate(pr.date) }}</span>
            </div>
            <div class="pr-right">
              <span class="pr-value" v-if="pr.actualReps">{{ pr.actualReps }}×{{ formatWeight(pr.actualWeight, pr.isBodyweight) }}</span>
              <span class="pr-sublabel">est. 1RM: {{ pr.rm }}kg</span>
            </div>
          </div>
          <RouterLink :to="{ name: 'all-prs' }" class="history-all">
            View all PRs →
          </RouterLink>
        </div>
      </section>

      <!-- History link -->
      <section class="progress-section">
        <h2 class="section-title">Workout history</h2>
        <div class="history-preview">
          <div v-for="session in data.recentSessions" :key="session.id"
            class="history-row"
            @click="router.push({ name: 'history-detail', params: { id: session.id } })">
            <div class="history-row__body">
              <span class="history-row__name">{{ session.routineName }}</span>
              <span class="history-row__date">{{ formatDate(session.startedAt) }}</span>
            </div>
            <span class="history-row__vol">{{ formatVol(session.totalVolumeKg) }}</span>
          </div>
          <RouterLink :to="{ name: 'history' }" class="history-all">
            View all history →
          </RouterLink>
        </div>
      </section>

    </div>
  </AppPageShell>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import { progressRepository } from '../db/progressRepository.js'
import { formatWeight } from '@/utils/formatWeight.js'
import { plansRepository } from '@/features/plans/db/plansRepository.js'
import { db } from '@/db/index.js'
import RadarChart from '../components/RadarChart.vue'
import VolumeChart from '../components/VolumeChart.vue'
import ChartSlider from '../components/ChartSlider.vue'

const router = useRouter()

const ranges = [
  { label: '4w',  days: 28  },
  { label: '8w',  days: 56  },
  { label: 'All', days: null },
]
const rangeDays   = ref(28)
const showAllPRs  = ref(false)
const muscleMode  = ref('exercise')

const visiblePRs = computed(() =>
  showAllPRs.value ? data.value.prs : data.value.prs.slice(0, 3)
)

const data = ref({
  sessionCount:    0,
  volumeChange:    null,
  adherence:       null,
  bestStreak:      0,
  prs:             [],
  muscleFrequency: [],
  weeklyVolume:    [],
  recentSessions:  [],
})

const chartSlides = [
  { title: 'Muscle balance' },
  { title: 'Weekly volume' },
]

const isLoading = ref(false)

async function load() {
  isLoading.value = true
  try {
    const days = rangeDays.value || 3650
    const [sessions, volumeChange, prs, adherence, muscleFrequency, weeklyVolume] = await Promise.all([
      progressRepository.getSessions(days),
      progressRepository.getVolumeChange(days),
      progressRepository.getRecentPRs(days),
      progressRepository.getPlanAdherence(days),
      progressRepository.getMuscleFrequency(days, muscleMode.value),
      progressRepository.getWeeklyVolume(days),
    ])

    // Best streak across all active plans
    const activePlans = await db.plans.where('status').equals('active').toArray()
    const streaks = await Promise.all(
      activePlans.map(async p => {
        const entries = await plansRepository.getEntriesForPlan(p.id)
        return plansRepository.getStreak(p.id, entries)
      })
    )
    const bestStreak = streaks.length ? Math.max(...streaks) : 0

    data.value = {
      sessionCount: sessions.length,
      volumeChange,
      adherence,
      bestStreak,
      prs,
      muscleFrequency,
      weeklyVolume,
      recentSessions: sessions
        .sort((a, b) => b.startedAt - a.startedAt)
        .slice(0, 5),
    }
  } finally {
    isLoading.value = false
  }
}

function setRange(days) {
  rangeDays.value = days
  showAllPRs.value = false
}

watch(rangeDays, load)
watch(muscleMode, load)
onMounted(load)

// Computed display
const volumeChangeLabel = computed(() => {
  const v = data.value.volumeChange
  if (v === null) return '—'
  if (v === 0) return '='
  return v > 0 ? `+${v}%` : `${v}%`
})

const volumeChangeClass = computed(() => {
  const v = data.value.volumeChange
  if (v === null || v === 0) return ''
  return v > 0 ? 'metric-value--up' : 'metric-value--down'
})

const adherenceClass = computed(() => {
  const a = data.value.adherence
  if (a === null) return ''
  if (a >= 80) return 'metric-value--up'
  if (a < 50)  return 'metric-value--down'
  return ''
})

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatVol(kg) {
  if (!kg) return '—'
  if (kg >= 1000) return `${(kg/1000).toFixed(1)}t`
  return `${Math.round(kg)}kg`
}
</script>

<style scoped>
.page-title { font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--color-text-1); flex: 1; }

.range-toggle { display: flex; gap: 2px; }
.range-btn {
  padding: var(--space-1) var(--space-2); font-size: var(--text-xs); font-weight: var(--font-medium);
  color: var(--color-text-3); border-radius: var(--radius-sm); border: 1px solid transparent;
  transition: all var(--transition-fast);
}
.range-btn--active { color: var(--color-accent); border-color: rgba(232,255,71,0.3); background: rgba(232,255,71,0.06); }

.progress-content {
  display: flex; flex-direction: column; gap: var(--space-6);
  padding: var(--space-4); padding-bottom: var(--scroll-pb);
}

/* Metric cards */
.metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }

.metric-card {
  background: var(--color-surface-1); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: var(--space-4);
  display: flex; flex-direction: column; gap: var(--space-1); align-items: center;
}
.metric-card--wide { grid-column: 1 / -1; }

.metric-value { font-size: var(--text-3xl); font-weight: var(--font-bold); color: var(--color-text-1); line-height: 1; }
.metric-value--up     { color: var(--color-success); }
.metric-value--down   { color: var(--color-danger); }
.metric-value--streak { color: var(--color-warning); }

.metric-label { font-size: 10px; color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.08em; text-align: center; }

/* Sections */
.progress-section { display: flex; flex-direction: column; gap: var(--space-3); }

.section-header { display: flex; align-items: center; justify-content: space-between; }
.section-title { font-size: var(--text-xs); font-weight: var(--font-semibold); color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.1em; }
.section-expand { font-size: var(--text-xs); color: var(--color-accent); font-weight: var(--font-medium); }
.section-expand:active { opacity: 0.7; }

.mode-toggle { display: flex; border: 1px solid var(--color-border); border-radius: var(--radius-full); overflow: hidden; }
.mode-btn { padding: 3px var(--space-3); font-size: 10px; font-weight: var(--font-medium); color: var(--color-text-3); background: transparent; transition: all var(--transition-fast); }
.mode-btn--active { background: var(--color-accent); color: #0f0f0f; }

.section-empty { font-size: var(--text-sm); color: var(--color-text-3); padding: var(--space-4); text-align: center; background: var(--color-surface-1); border-radius: var(--radius-lg); border: 1px dashed var(--color-border); }

/* PR list */
.pr-list { display: flex; flex-direction: column; gap: var(--space-2); }
.pr-row {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-1); border: 1px solid var(--color-border); border-radius: var(--radius-lg);
}
.pr-trophy { font-size: 16px; flex-shrink: 0; }
.pr-body   { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pr-name   { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--color-text-1); }
.pr-lift   { font-size: var(--text-xs); color: var(--color-text-3); }
.pr-right  { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.pr-value  { font-size: var(--text-base); font-weight: var(--font-bold); color: var(--color-accent); }
.pr-sublabel { font-size: 9px; color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.06em; }
.pr-date   { font-size: var(--text-xs); color: var(--color-text-3); }

/* History preview */
.history-preview { display: flex; flex-direction: column; gap: var(--space-2); }
.history-row {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-1); border: 1px solid var(--color-border); border-radius: var(--radius-lg);
  cursor: pointer; transition: background var(--transition-fast);
}
.history-row:active { background: var(--color-surface-2); }
.history-row__body  { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.history-row__name  { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--color-text-1); }
.history-row__date  { font-size: var(--text-xs); color: var(--color-text-3); }
.history-row__vol   { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--color-text-2); flex-shrink: 0; }
.history-all { display: block; text-align: center; font-size: var(--text-sm); color: var(--color-accent); padding: var(--space-3); }
</style>
