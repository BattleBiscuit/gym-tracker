<template>
  <div class="routine-card" @click="$emit('open')">
    <div class="routine-card__body">
      <span class="routine-card__name">{{ routine.name }}</span>
      <span class="routine-card__meta">
        {{ exerciseCount }} exercise{{ exerciseCount !== 1 ? 's' : '' }}
        <span class="routine-card__dot">·</span>
        Updated {{ relativeDate }}
      </span>
      <p v-if="routine.notes" class="routine-card__notes">{{ routine.notes }}</p>
    </div>
    <div class="routine-card__actions" @click.stop>
      <button class="routine-card__action" @click="$emit('delete')" aria-label="Delete routine">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  routine:       { type: Object, required: true },
  exerciseCount: { type: Number, default: 0 },
})
defineEmits(['open', 'delete'])

const relativeDate = computed(() => {
  const diff = Date.now() - props.routine.updatedAt
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(props.routine.updatedAt).toLocaleDateString()
})
</script>

<style scoped>
.routine-card {
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
.routine-card:active { background-color: var(--color-surface-2); }

.routine-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.routine-card__name {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.routine-card__meta {
  font-size: var(--text-sm);
  color: var(--color-text-2);
}

.routine-card__dot {
  margin: 0 var(--space-1);
}

.routine-card__notes {
  font-size: var(--text-sm);
  color: var(--color-text-3);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.routine-card__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.routine-card__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--color-text-3);
  border-radius: var(--radius-md);
  transition: color var(--transition-fast);
}
.routine-card__action:active { color: var(--color-danger); }
</style>
