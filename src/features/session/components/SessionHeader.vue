<template>
  <div class="session-header">
    <span class="session-header__routine">{{ routineName }}</span>
    <span class="session-header__elapsed">{{ formattedElapsed }}</span>
    <span v-if="growthLabel" :class="['session-header__growth', `session-header__growth--${growthDir}`]">
      {{ growthLabel }}
    </span>
    <div class="session-header__actions">
      <button class="session-header__btn session-header__btn--quit" @click="$emit('quit')" title="Abandon workout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <button class="session-header__btn session-header__btn--finish" @click="$emit('finish')" title="Finish workout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { resolveWeight } from '@/utils/formatWeight.js'
import { bodyweight } from '@/composables/useConfig.js'

defineEmits(['finish', 'quit'])

const props = defineProps({
  routineName:   { type: String, default: '' },
  elapsedSeconds:{ type: Number, default: 0 },
  sets:          { type: Array, default: () => [] }, // flat array of all sets
})

const formattedElapsed = computed(() => {
  const h = Math.floor(props.elapsedSeconds / 3600)
  const m = Math.floor((props.elapsedSeconds % 3600) / 60)
  const s = props.elapsedSeconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function vol(reps, weight, isBodyweight) {
  if (!reps) return 0
  return reps * resolveWeight(weight, isBodyweight, bodyweight.value || 0)
}

const growthDir = computed(() => {
  let planned = 0, actual = 0
  for (const s of props.sets) {
    if (s.type === 'cardio') continue
    const p = vol(s.plannedReps, s.plannedWeight, s.isBodyweight)
    planned += p
    if (s.skipped) {
      // skipped = 0 actual
    } else if (s.completedAt) {
      actual += vol(s.actualReps, s.actualWeight, s.isBodyweight)
    } else {
      actual += p  // untouched = neutral (same as planned)
    }
  }
  if (!planned) return 'neutral'
  if (actual > planned) return 'up'
  if (actual < planned) return 'down'
  return 'equal'
})

const growthLabel = computed(() => {
  let planned = 0, actual = 0
  for (const s of props.sets) {
    if (s.type === 'cardio') continue
    const p = vol(s.plannedReps, s.plannedWeight, s.isBodyweight)
    planned += p
    if (s.skipped) {
      // 0
    } else if (s.completedAt) {
      actual += vol(s.actualReps, s.actualWeight, s.isBodyweight)
    } else {
      actual += p
    }
  }
  if (!planned) return ''
  const pct = Math.round(((actual - planned) / planned) * 100)
  if (pct === 0) return '='
  return pct > 0 ? `+${pct}%` : `${pct}%`
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

.session-header__growth {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  font-variant-numeric: tabular-nums;
}
.session-header__growth--up    { color: var(--color-success); }
.session-header__growth--down  { color: var(--color-danger); }
.session-header__growth--equal { color: var(--color-text-3); }
.session-header__growth--neutral { display: none; }

.session-header__actions {
  display: flex;
  gap: var(--space-2);
}

.session-header__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.session-header__btn--finish {
  color: var(--color-accent);
  border-color: rgba(232, 255, 71, 0.3);
}
.session-header__btn--finish:active { background: rgba(232, 255, 71, 0.1); }

.session-header__btn--quit {
  color: var(--color-danger);
  border-color: rgba(244, 67, 54, 0.3);
  opacity: 0.7;
}
.session-header__btn--quit:active { background: rgba(244, 67, 54, 0.1); opacity: 1; }
</style>
