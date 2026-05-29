<template>
  <div
    class="exercise-item"
    :class="{
      'exercise-item--dragging': isDragging,
      'exercise-item--drop-above': dropIndicator === 'above',
      'exercise-item--drop-below': dropIndicator === 'below',
    }"
  >
    <ExerciseOrderHandle
      @dragstart="y => $emit('dragstart', { index, y })"
    />
    <div class="exercise-item__info" @click="$emit('edit')">
      <span class="exercise-item__name">{{ exercise.name }}</span>
      <span class="exercise-item__meta">
        {{ exercise.sets?.length || 0 }} sets ·
        {{ exercise.sets?.map(s => s.type === 'cardio' ? `${s.duration}min lvl${s.level}` : `${s.reps}×${s.weight === 0 ? 'BW' : s.weight + s.weightUnit}`).join(', ') }}
      </span>
      <span v-if="exercise.notes" class="exercise-item__notes">{{ exercise.notes }}</span>
    </div>
    <button class="exercise-item__delete" @click.stop="$emit('delete')" aria-label="Delete exercise">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import ExerciseOrderHandle from './ExerciseOrderHandle.vue'

defineProps({
  exercise:      { type: Object, required: true },
  index:         { type: Number, required: true },
  isDragging:    { type: Boolean, default: false },
  dropIndicator: { type: String, default: null }, // 'above' | 'below' | null
})
defineEmits(['edit', 'delete', 'dragstart'])
</script>

<style scoped>
.exercise-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-2);
  background-color: var(--color-surface-1);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: opacity var(--transition-fast), background-color var(--transition-fast);
}

.exercise-item--dragging {
  opacity: 0.3;
}

/* Drop indicators as pseudo-element lines */
.exercise-item--drop-above::before,
.exercise-item--drop-below::after {
  content: '';
  position: absolute;
  left: 0; right: 0;
  height: 2px;
  background-color: var(--color-accent);
  border-radius: var(--radius-full);
}
.exercise-item--drop-above::before { top: -5px; }
.exercise-item--drop-below::after  { bottom: -5px; }

.exercise-item__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  cursor: pointer;
}

.exercise-item__name {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.exercise-item__meta {
  font-size: var(--text-sm);
  color: var(--color-text-2);
}

.exercise-item__notes {
  font-size: var(--text-xs);
  color: var(--color-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.exercise-item__delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-target-min);
  height: var(--touch-target-min);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}
.exercise-item__delete:active { opacity: 1; }
</style>
