<template>
  <div class="session-header">
    <span class="session-header__routine">{{ routineName }}</span>
    <span class="session-header__elapsed">{{ formattedElapsed }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  routineName:   { type: String, default: '' },
  exerciseName:  { type: String, default: '' },
  exerciseNotes: { type: String, default: '' },
  exerciseIndex: { type: Number, default: 0 },
  exerciseTotal: { type: Number, default: 1 },
  setIndex:      { type: Number, default: 0 },
  setTotal:      { type: Number, default: 1 },
  elapsedSeconds:{ type: Number, default: 0 },
})

const formattedElapsed = computed(() => {
  const h = Math.floor(props.elapsedSeconds / 3600)
  const m = Math.floor((props.elapsedSeconds % 3600) / 60)
  const s = props.elapsedSeconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})
</script>

<style scoped>
.session-header {
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
}

.session-header__routine {
  font-size: var(--text-sm);
  color: var(--color-text-2);
  font-weight: var(--font-medium);
}

.session-header__elapsed {
  font-size: var(--text-sm);
  color: var(--color-text-3);
  font-variant-numeric: tabular-nums;
}
</style>
