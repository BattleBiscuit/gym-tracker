<template>
  <div class="progress-root">
    <div class="progress-tabs">
      <button
        :class="['progress-tab', { 'progress-tab--active': activeTab === 'history' }]"
        @click="activeTab = 'history'"
      >History</button>
      <button
        :class="['progress-tab', { 'progress-tab--active': activeTab === 'analytics' }]"
        @click="activeTab = 'analytics'"
      >Analytics</button>
    </div>

    <HistoryView v-if="activeTab === 'history'" />
    <AnalyticsView v-else />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import HistoryView from '@/features/history/views/HistoryView.vue'
import AnalyticsView from '@/features/analytics/views/AnalyticsView.vue'

const activeTab = ref('history')
</script>

<style scoped>
.progress-root {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.progress-tabs {
  flex-shrink: 0;
  display: flex;
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  padding: 0 var(--space-4);
  gap: var(--space-1);
}

.progress-tab {
  flex: 1;
  padding: var(--space-3) 0;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-3);
  border-bottom: 2px solid transparent;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.progress-tab--active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}
</style>
