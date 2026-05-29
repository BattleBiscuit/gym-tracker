<template>
  <div
    :class="['set-row', { 'set-row--active': isActive, 'set-row--done': set.completedAt && !isActive, 'set-row--skipped': set.skipped && !isActive }]"
    @click="$emit('select')"
  >
    <span class="set-row__num">{{ setNumber }}</span>

    <!-- Active: inputs -->
    <template v-if="isActive">
      <div class="set-row__inputs">
        <template v-if="isCardio">
          <input class="set-row__input" type="number" inputmode="numeric"
            :value="localPrimary" :placeholder="set.plannedDuration" :min="0"
            @input="localPrimary = $event.target.value" />
          <span class="set-row__sep">min</span>
          <input class="set-row__input" type="number" inputmode="numeric"
            :value="localSecondary" :placeholder="set.plannedLevel" :min="0"
            @input="localSecondary = $event.target.value"
            @keydown.enter="$emit('confirm')" />
          <span class="set-row__unit">lvl</span>
        </template>
        <template v-else>
          <input class="set-row__input" type="number" inputmode="numeric"
            :value="localPrimary" :placeholder="set.plannedReps" :min="0"
            @input="localPrimary = $event.target.value" />
          <span class="set-row__sep">×</span>
          <input class="set-row__input" type="number" inputmode="decimal"
            :value="localSecondary" :placeholder="set.plannedWeight" :min="0" :step="0.5"
            @input="localSecondary = $event.target.value"
            @keydown.enter="$emit('confirm')" />
          <span class="set-row__unit">{{ set.weightUnit }}</span>
        </template>
      </div>
      <AppBadge v-if="set.completedAt" variant="success">✓</AppBadge>
      <AppBadge v-else-if="set.skipped" variant="default">—</AppBadge>
    </template>

    <!-- Completed -->
    <template v-else-if="set.completedAt">
      <span class="set-row__actual">
        <template v-if="isCardio">{{ set.actualDuration }}min · lvl{{ set.actualLevel }}</template>
        <template v-else>{{ set.actualReps }}×{{ formatWeight(set.actualWeight, set.weightUnit) }}</template>
      </span>
      <span :class="['set-row__delta', `set-row__delta--${deltaDir}`]">{{ deltaLabel }}</span>
      <AppBadge variant="success">✓</AppBadge>
    </template>

    <!-- Skipped -->
    <template v-else-if="set.skipped">
      <span class="set-row__planned">
        <template v-if="isCardio">{{ set.plannedDuration }}min · lvl{{ set.plannedLevel }}</template>
        <template v-else>{{ set.plannedReps }}×{{ formatWeight(set.plannedWeight, set.weightUnit) }}</template>
      </span>
      <AppBadge variant="default">—</AppBadge>
    </template>

    <!-- Upcoming -->
    <template v-else>
      <span class="set-row__planned set-row__planned--future">
        <template v-if="isCardio">{{ set.plannedDuration }}min · lvl{{ set.plannedLevel }}</template>
        <template v-else>{{ set.plannedReps }}×{{ formatWeight(set.plannedWeight, set.weightUnit) }}</template>
      </span>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { formatWeight } from '@/utils/formatWeight.js'

function setVolume(reps, weight) {
  if (!reps) return 0
  if (!weight) return reps   // bodyweight — use reps as volume
  return reps * weight
}

const props = defineProps({
  set:       { type: Object, required: true },
  setNumber: { type: Number, required: true },
  isActive:  { type: Boolean, default: false },
})

const emit = defineEmits(['update:primary', 'update:secondary', 'select', 'confirm'])

const isCardio = computed(() => props.set.type === 'cardio')

// Compare actual vs planned (planned = last session's actuals after first workout)
const deltaDir = computed(() => {
  const s = props.set
  if (!s.completedAt) return 'neutral'
  let actual, planned
  if (isCardio.value) {
    actual  = (s.actualDuration  || 0) + (s.actualLevel  || 0)
    planned = (s.plannedDuration || 0) + (s.plannedLevel || 0)
  } else {
    actual  = setVolume(s.actualReps,  s.actualWeight)
    planned = setVolume(s.plannedReps, s.plannedWeight)
  }
  if (!planned) return 'neutral'
  if (actual > planned) return 'up'
  if (actual < planned) return 'down'
  return 'equal'
})

const deltaLabel = computed(() => {
  const s = props.set
  if (!s.completedAt) return ''
  let actual, planned
  if (isCardio.value) {
    actual  = (s.actualDuration  || 0) + (s.actualLevel  || 0)
    planned = (s.plannedDuration || 0) + (s.plannedLevel || 0)
  } else {
    actual  = setVolume(s.actualReps,  s.actualWeight)
    planned = setVolume(s.plannedReps, s.plannedWeight)
  }
  if (!planned) return '='
  const diff = actual - planned
  if (diff === 0) return '='
  return diff > 0 ? '▲' : '▼'
})

const localPrimary   = ref('')
const localSecondary = ref('')

watch(() => [props.set, props.isActive], () => {
  localPrimary.value   = ''
  localSecondary.value = ''
})

watch(localPrimary,   v => emit('update:primary', v))
watch(localSecondary, v => emit('update:secondary', v))
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
  min-height: 36px;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
}

.set-row--active { border-color: var(--color-accent); background-color: rgba(232, 255, 71, 0.04); }
.set-row--done { opacity: 0.6; }
.set-row--skipped { opacity: 1; }

.set-row__num {
  width: 18px; font-size: var(--text-xs); font-weight: var(--font-bold);
  color: var(--color-text-3); text-align: center; flex-shrink: 0;
}
.set-row--active .set-row__num { color: var(--color-accent); }

.set-row__planned { flex: 1; font-size: var(--text-sm); color: var(--color-text-2); }
.set-row__planned--future { color: var(--color-text-3); }
.set-row__actual { flex: 1; font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--color-success); }

.set-row__inputs { flex: 1; display: flex; align-items: center; gap: var(--space-1); }

.set-row__input {
  width: 56px; text-align: center;
  font-size: var(--text-sm); font-weight: var(--font-semibold);
  color: var(--color-text-1);
  background-color: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 4px var(--space-1); height: 28px;
  user-select: text; -webkit-user-select: text;
}
.set-row__input:focus { border-color: var(--color-accent); outline: none; }

.set-row__sep { font-size: var(--text-sm); color: var(--color-text-3); }
.set-row__unit { font-size: var(--text-xs); color: var(--color-text-3); }

.set-row__delta {
  font-size: 10px;
  font-weight: var(--font-bold);
  flex-shrink: 0;
}
.set-row__delta--up      { color: var(--color-success); }
.set-row__delta--down    { color: var(--color-danger); }
.set-row__delta--equal   { color: var(--color-text-3); }
.set-row__delta--neutral { display: none; }
</style>
