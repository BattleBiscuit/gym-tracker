<template>
  <div class="history-card" @click="$emit('open')">
    <div class="history-card__body">
      <span class="history-card__routine">{{ session.routineName }}</span>
      <span class="history-card__meta">
        {{ dateStr }}
        <span v-if="session.status === 'abandoned'" class="history-card__abandoned"> · Abandoned</span>
      </span>
      <div class="history-card__stats">
        <span>{{ duration }}</span>
        <span class="history-card__dot">·</span>
        <span>{{ volume }}</span>
      </div>
    </div>
    <button class="history-card__del" @click.stop="$emit('delete')" aria-label="Delete session">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDuration, formatVolume, formatDate } from '../composables/useHistorySummary.js'

const props = defineProps({
  session: { type: Object, required: true },
})
defineEmits(['open', 'delete'])

const dateStr  = computed(() => formatDate(props.session.startedAt))
const duration = computed(() => formatDuration(props.session.startedAt, props.session.completedAt))
const volume   = computed(() => formatVolume(props.session.totalVolumeKg))
</script>

<style scoped>
.history-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--color-surface-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}
.history-card:active { background-color: var(--color-surface-2); }

.history-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.history-card__routine {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-1);
}

.history-card__meta {
  font-size: var(--text-sm);
  color: var(--color-text-2);
}

.history-card__abandoned {
  color: var(--color-warning);
}

.history-card__stats {
  font-size: var(--text-sm);
  color: var(--color-text-3);
  display: flex;
  gap: var(--space-2);
}

.history-card__dot {
  opacity: 0.4;
}

.history-card__del {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--color-text-3);
  border-radius: var(--radius-md);
  transition: color var(--transition-fast);
  flex-shrink: 0;
}
.history-card__del:active { color: var(--color-danger); }
</style>
