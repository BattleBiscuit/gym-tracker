<template>
  <AppPageShell>
    <template #header>
      <button class="back-btn" @click="router.back()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <span class="page-title">Workout Detail</span>
    </template>

    <template v-if="store.isLoading">
      <div class="detail-loading">Loading…</div>
    </template>

    <template v-else-if="store.selectedSession">
      <WorkoutSummaryHeader :session="store.selectedSession" />

      <!-- PR summary -->
      <div v-if="sessionPRs.length" class="pr-banner">
        <span class="pr-banner__title">🏆 PRs this session</span>
        <div class="pr-banner__list">
          <span v-for="pr in sessionPRs" :key="pr" class="pr-banner__item">{{ pr }}</span>
        </div>
      </div>

      <div class="detail-sets">
        <HistorySetTable
          v-for="(sets, position) in store.selectedSets"
          :key="position"
          :exerciseName="sets[0]?.exerciseName || `Exercise ${Number(position) + 1}`"
          :sets="sets"
        />
      </div>
    </template>
  </AppPageShell>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import WorkoutSummaryHeader from '../components/WorkoutSummaryHeader.vue'
import HistorySetTable from '../components/HistorySetTable.vue'
import { useHistoryStore } from '../stores/useHistoryStore.js'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()
const store = useHistoryStore()

onMounted(() => store.loadSessionDetail(props.id))

// Collect unique exercise names where isPR was set
const sessionPRs = computed(() => {
  const names = new Set()
  for (const sets of Object.values(store.selectedSets)) {
    for (const set of sets) {
      if (set.isPR) names.add(set.exerciseName)
    }
  }
  return [...names]
})
</script>

<style scoped>
.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--color-text-2);
  border-radius: var(--radius-md);
  margin-left: calc(-1 * var(--space-2));
}
.back-btn:active { color: var(--color-text-1); }

.page-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-1);
}

.detail-loading {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-text-3);
}

.pr-banner {
  margin: var(--space-4) var(--space-4) 0;
  padding: var(--space-3) var(--space-4);
  background: rgba(232, 255, 71, 0.06);
  border: 1px solid rgba(232, 255, 71, 0.2);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.pr-banner__title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-accent);
}

.pr-banner__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.pr-banner__item {
  font-size: var(--text-sm);
  color: var(--color-text-1);
  background: rgba(232, 255, 71, 0.08);
  padding: 2px var(--space-3);
  border-radius: var(--radius-full);
}

.detail-sets {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  padding-bottom: var(--scroll-pb);
}
</style>
