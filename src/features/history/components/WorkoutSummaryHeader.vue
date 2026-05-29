<template>
  <div class="summary-header">
    <div class="summary-header__date">{{ dateStr }}</div>
    <div class="summary-header__routine">{{ session.routineName }}</div>
    <div class="summary-header__stats">
      <div class="stat">
        <span class="stat__value">{{ duration }}</span>
        <span class="stat__label">Duration</span>
      </div>
      <div class="stat">
        <span class="stat__value">{{ volume }}</span>
        <span class="stat__label">Total volume</span>
      </div>
      <div class="stat">
        <span class="stat__value">{{ statusLabel }}</span>
        <span class="stat__label">Status</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDuration, formatVolume, formatDate, formatTime } from '../composables/useHistorySummary.js'

const props = defineProps({
  session: { type: Object, required: true },
})

const dateStr   = computed(() => `${formatDate(props.session.startedAt)} at ${formatTime(props.session.startedAt)}`)
const duration  = computed(() => formatDuration(props.session.startedAt, props.session.completedAt))
const volume    = computed(() => formatVolume(props.session.totalVolumeKg))
const statusLabel = computed(() => {
  if (props.session.status === 'completed') return 'Completed'
  if (props.session.status === 'abandoned') return 'Abandoned'
  return props.session.status
})
</script>

<style scoped>
.summary-header {
  padding: var(--space-5) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.summary-header__date {
  font-size: var(--text-sm);
  color: var(--color-text-2);
  margin-bottom: var(--space-1);
}

.summary-header__routine {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text-1);
  margin-bottom: var(--space-4);
}

.summary-header__stats {
  display: flex;
  gap: var(--space-6);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat__value {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-1);
}

.stat__label {
  font-size: var(--text-xs);
  color: var(--color-text-3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
