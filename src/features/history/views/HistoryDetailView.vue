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
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import WorkoutSummaryHeader from '../components/WorkoutSummaryHeader.vue'
import HistorySetTable from '../components/HistorySetTable.vue'
import { useHistoryStore } from '../stores/useHistoryStore.js'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()
const store = useHistoryStore()

onMounted(() => store.loadSessionDetail(props.id))
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

.detail-sets {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  padding-bottom: var(--scroll-pb);
}
</style>
