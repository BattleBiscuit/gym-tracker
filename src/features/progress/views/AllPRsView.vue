<template>
  <AppPageShell>
    <template #header>
      <button class="back-btn" @click="router.back()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="page-title">All PRs</span>
    </template>

    <div class="pr-content">
      <div v-if="isLoading" class="pr-skeleton" v-for="n in 5" :key="n" />

      <div v-else-if="!prs.length" class="pr-empty">
        <p>No personal records yet.</p>
        <p class="pr-empty__sub">PRs are set when you beat your previous best estimated 1RM.</p>
      </div>

      <div v-else class="pr-list">
        <div v-for="pr in prs" :key="pr.exerciseName" class="pr-row">
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
      </div>
    </div>
  </AppPageShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import { progressRepository } from '../db/progressRepository.js'
import { formatWeight } from '@/utils/formatWeight.js'

const router   = useRouter()
const prs      = ref([])
const isLoading = ref(true)

onMounted(async () => {
  prs.value = await progressRepository.getAllPRs()
  isLoading.value = false
})

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.back-btn {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; color: var(--color-text-2);
  border-radius: var(--radius-md); margin-left: calc(-1 * var(--space-2));
}
.back-btn:active { color: var(--color-text-1); }

.page-title { font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--color-text-1); }

.pr-content {
  display: flex; flex-direction: column; gap: var(--space-2);
  padding: var(--space-4); padding-bottom: var(--scroll-pb);
}

.pr-skeleton {
  height: 60px; background: var(--color-surface-1);
  border-radius: var(--radius-lg); animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

.pr-empty { text-align: center; padding: var(--space-12) var(--space-6); color: var(--color-text-3); }
.pr-empty__sub { font-size: var(--text-sm); margin-top: var(--space-2); }

.pr-list { display: flex; flex-direction: column; gap: var(--space-2); }

.pr-row {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-1); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.pr-trophy { font-size: 18px; flex-shrink: 0; }

.pr-body  { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pr-name  { font-size: var(--text-base); font-weight: var(--font-semibold); color: var(--color-text-1); }
.pr-lift  { font-size: var(--text-xs); color: var(--color-text-3); }
.pr-date  { font-size: var(--text-xs); color: var(--color-text-3); }

.pr-right    { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.pr-value    { font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--color-accent); }
.pr-sublabel { font-size: 9px; color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.06em; }
</style>
