<template>
  <div
    :class="['set-row', {
      'set-row--locked':   isLocked,
      'set-row--active':   isActive,
      'set-row--skipped':  set.skipped && !isActive,
      'set-row--upcoming': isUpcoming,
    }]"
    @click="isUpcoming && $emit('select')"
  >
    <span class="set-row__num">{{ setNumber }}</span>

    <!-- LOCKED (checked) — read-only display -->
    <template v-if="(set.completedAt || set.skipped) && !isActive">
      <span class="set-row__actual">
        <template v-if="isCardio">{{ set.actualDuration }}min · lvl{{ set.actualLevel }}</template>
        <template v-else>{{ set.actualReps }}×{{ formatWeight(set.actualWeight, set.isBodyweight) }}</template>
      </span>
      <span v-if="set.isPR" class="set-row__pr">🏆</span>
      <span :class="['set-row__delta', `set-row__delta--${deltaDir}`]">{{ deltaLabel }}</span>
      <label class="set-row__check" @click.stop>
        <input type="checkbox" checked @change="$emit('uncheck')" />
        <span class="set-row__check-box set-row__check-box--checked" />
      </label>
    </template>

    <!-- ACTIVE (unchecked, editable) -->
    <template v-else-if="isActive">
      <!-- Planned value shown as ghost label -->
      <span class="set-row__planned-ghost">
        <template v-if="isCardio">{{ set.plannedDuration }}min · lvl{{ set.plannedLevel }}</template>
        <template v-else>{{ set.plannedReps }}×{{ formatWeight(set.plannedWeight, set.isBodyweight) }}</template>
      </span>

      <div class="set-row__inputs">
        <template v-if="isCardio">
          <input class="set-row__input" type="text" inputmode="numeric"
            v-model="localPrimary" :placeholder="set.plannedDuration" />
          <span class="set-row__sep">min</span>
          <input class="set-row__input" type="text" inputmode="numeric"
            v-model="localSecondary" :placeholder="set.plannedLevel"
            @keydown.enter="$emit('confirm')" />
          <span class="set-row__unit">lvl</span>
        </template>
        <template v-else>
          <input class="set-row__input" type="text" inputmode="numeric"
            v-model="localPrimary" :placeholder="set.plannedReps" />
          <span class="set-row__sep">×</span>
          <!-- BW toggle -->
          <button :class="['set-row__bw-btn', { 'set-row__bw-btn--active': localBW }]"
            @click="localBW = !localBW" type="button">BW</button>
          <input class="set-row__input" type="text" inputmode="decimal"
            v-model="localSecondary"
            :placeholder="localBW ? (set.plannedWeight || '±kg') : set.plannedWeight"
            @keydown.enter="$emit('confirm')" />
          <span class="set-row__unit">kg</span>
        </template>
      </div>

      <!-- Unchecked checkbox — tap to confirm/lock -->
      <label class="set-row__check" @click.stop="$emit('confirm')">
        <span class="set-row__check-box" />
      </label>
    </template>

    <!-- UPCOMING (not yet active) -->
    <template v-else>
      <span class="set-row__planned set-row__planned--future">
        <template v-if="isCardio">{{ set.plannedDuration }}min · lvl{{ set.plannedLevel }}</template>
        <template v-else>{{ set.plannedReps }}×{{ formatWeight(set.plannedWeight, set.isBodyweight) }}</template>
      </span>
      <label class="set-row__check" @click.stop>
        <span class="set-row__check-box" />
      </label>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { formatWeight } from '@/utils/formatWeight.js'
import { resolveWeight } from '@/utils/formatWeight.js'
import { bodyweight } from '@/composables/useConfig.js'

function setVolume(reps, weight, isBodyweight) {
  if (!reps) return 0
  return reps * resolveWeight(weight, isBodyweight, bodyweight.value || 0)
}

const props = defineProps({
  set:       { type: Object, required: true },
  setNumber: { type: Number, required: true },
  isActive:  { type: Boolean, default: false },
})

const emit = defineEmits(['update:primary', 'update:secondary', 'update:bw', 'select', 'confirm', 'uncheck'])

const isCardio   = computed(() => props.set.type === 'cardio')
const isLocked   = computed(() => (props.set.completedAt || props.set.skipped) && !props.isActive)
const isUpcoming = computed(() => !props.isActive && !isLocked.value)

// Inputs pre-filled with routine planned values
const localPrimary   = ref(isCardio.value ? (props.set.plannedDuration ?? '') : (props.set.plannedReps ?? ''))
const localSecondary = ref(isCardio.value ? (props.set.plannedLevel ?? '') : (props.set.plannedWeight ?? ''))
const localBW        = ref(props.set.isBodyweight ?? false)

// Reset to planned values when active set changes
watch(() => [props.set.id, props.isActive], ([, active]) => {
  if (active) {
    localPrimary.value   = isCardio.value ? (props.set.plannedDuration ?? '') : (props.set.plannedReps ?? '')
    localSecondary.value = isCardio.value ? (props.set.plannedLevel ?? '') : (props.set.plannedWeight ?? '')
    localBW.value        = props.set.isBodyweight ?? false
  }
})

watch(localPrimary,   v => emit('update:primary', v))
watch(localSecondary, v => emit('update:secondary', v))
watch(localBW,        v => emit('update:bw', v))

// Delta indicator for locked sets
const deltaDir = computed(() => {
  const s = props.set
  if (!s.completedAt || s.skipped) return 'neutral'
  const actual  = setVolume(s.actualReps,  s.actualWeight,  s.isBodyweight)
  const planned = setVolume(s.plannedReps, s.plannedWeight, s.isBodyweight)
  if (!planned) return 'neutral'
  if (actual > planned) return 'up'
  if (actual < planned) return 'down'
  return 'equal'
})

const deltaLabel = computed(() => {
  const s = props.set
  if (!s.completedAt || s.skipped) return ''
  const actual  = setVolume(s.actualReps,  s.actualWeight,  s.isBodyweight)
  const planned = setVolume(s.plannedReps, s.plannedWeight, s.isBodyweight)
  if (!planned) return ''
  const diff = actual - planned
  if (diff === 0) return '='
  return diff > 0 ? '▲' : '▼'
})
</script>

<style scoped>
.set-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-1);
  border: 1px solid transparent;
  min-height: 40px;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
}

.set-row--active   { border-color: var(--color-accent); background: rgba(232,255,71,0.04); }
.set-row--locked   { opacity: 0.65; }
.set-row--skipped  { opacity: 0.35; }
.set-row--upcoming { cursor: pointer; }
.set-row--upcoming:active { background: var(--color-surface-2); }

.set-row__num {
  width: 18px; font-size: var(--text-xs); font-weight: var(--font-bold);
  color: var(--color-text-3); text-align: center; flex-shrink: 0;
}
.set-row--active .set-row__num { color: var(--color-accent); }

/* Read-only display */
.set-row__actual { flex: 1; font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--color-success); }
.set-row__planned { flex: 1; font-size: var(--text-sm); color: var(--color-text-2); }
.set-row__planned--future { color: var(--color-text-3); }
.set-row__pr { font-size: 11px; flex-shrink: 0; }

.set-row__delta { font-size: 10px; font-weight: var(--font-bold); flex-shrink: 0; }
.set-row__delta--up    { color: var(--color-success); }
.set-row__delta--down  { color: var(--color-danger); }
.set-row__delta--equal { color: var(--color-text-3); }
.set-row__delta--neutral { display: none; }

/* Ghost planned label above inputs */
.set-row__planned-ghost {
  font-size: 10px;
  color: var(--color-text-3);
  white-space: nowrap;
  flex-shrink: 0;
}

/* Input row */
.set-row__inputs { display: flex; align-items: center; gap: var(--space-1); flex: 1; }

.set-row__input {
  width: 48px; text-align: center;
  font-size: var(--text-sm); font-weight: var(--font-semibold);
  color: var(--color-text-1);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 4px var(--space-1); height: 28px;
  user-select: text; -webkit-user-select: text;
}
.set-row__input:focus { border-color: var(--color-accent); outline: none; }

.set-row__sep  { font-size: var(--text-sm); color: var(--color-text-3); flex-shrink: 0; }
.set-row__unit { font-size: var(--text-xs); color: var(--color-text-3); flex-shrink: 0; }

.set-row__bw-btn {
  height: 28px; padding: 0 5px;
  font-size: 10px; font-weight: var(--font-bold);
  color: var(--color-text-3); background: transparent;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  flex-shrink: 0; transition: all var(--transition-fast);
}
.set-row__bw-btn--active { background: var(--color-accent); color: #0f0f0f; border-color: var(--color-accent); }

/* Checkbox */
.set-row__check {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; flex-shrink: 0; cursor: pointer;
}
.set-row__check input { display: none; }

.set-row__check-box {
  width: 20px; height: 20px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  transition: all var(--transition-fast);
}

.set-row__check-box--checked {
  background: var(--color-accent);
  border-color: var(--color-accent);
}
.set-row__check-box--checked::after {
  content: '';
  width: 5px; height: 9px;
  border: 2px solid #0f0f0f;
  border-top: none; border-left: none;
  transform: rotate(45deg) translateY(-1px);
  display: block;
}
</style>
