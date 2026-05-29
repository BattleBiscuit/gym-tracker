<template>
  <div
    :class="['set-row', { 'set-row--active': isActive, 'set-row--done': set.completedAt && !isActive, 'set-row--skipped': set.skipped && !isActive }]"
    @click="$emit('select')"
  >
    <span class="set-row__num">{{ setNumber }}</span>

    <!-- Active: inputs take priority -->
    <template v-if="isActive">
      <div class="set-row__inputs">
        <template v-if="isCardio">
          <input class="set-row__input" type="number" inputmode="numeric"
            :value="localPrimary"
            :placeholder="set.lastDuration ?? set.plannedDuration"
            :min="0"
            @input="localPrimary = $event.target.value" />
          <span class="set-row__sep">min</span>
          <input class="set-row__input" type="number" inputmode="numeric"
            :value="localSecondary"
            :placeholder="set.lastLevel ?? set.plannedLevel"
            :min="0"
            @input="localSecondary = $event.target.value"
            @keydown.enter="$emit('confirm')" />
          <span class="set-row__unit">lvl</span>
        </template>
        <template v-else>
          <input class="set-row__input" type="number" inputmode="numeric"
            :value="localPrimary"
            :placeholder="set.lastReps ?? set.plannedReps"
            :min="0"
            @input="localPrimary = $event.target.value" />
          <span class="set-row__sep">×</span>
          <input class="set-row__input" type="number" inputmode="decimal"
            :value="localSecondary"
            :placeholder="set.lastWeight ?? set.plannedWeight"
            :min="0" :step="0.5"
            @input="localSecondary = $event.target.value"
            @keydown.enter="$emit('confirm')" />
          <span class="set-row__unit">{{ set.weightUnit }}</span>
        </template>
      </div>
      <div class="set-row__active-last" v-if="isCardio ? set.lastDuration != null : set.lastReps != null">
        <template v-if="isCardio">↑ {{ set.lastDuration }}min · lvl{{ set.lastLevel }}</template>
        <template v-else>↑ {{ set.lastReps }}×{{ formatWeight(set.lastWeight, set.weightUnit) }}</template>
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
      <div class="set-row__info">
        <span class="set-row__planned set-row__planned--future">
          <template v-if="isCardio">{{ set.plannedDuration }}min · lvl{{ set.plannedLevel }}</template>
          <template v-else>{{ set.plannedReps }}×{{ formatWeight(set.plannedWeight, set.weightUnit) }}</template>
        </span>
        <span v-if="isCardio ? set.lastDuration != null : set.lastReps != null" class="set-row__last">
          <template v-if="isCardio">↑ {{ set.lastDuration }}min · lvl{{ set.lastLevel }}</template>
          <template v-else>↑ {{ set.lastReps }}×{{ formatWeight(set.lastWeight, set.weightUnit) }}</template>
        </span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { formatWeight } from '@/utils/formatWeight.js'

const props = defineProps({
  set:       { type: Object, required: true },
  setNumber: { type: Number, required: true },
  isActive:  { type: Boolean, default: false },
})

const emit = defineEmits(['update:primary', 'update:secondary', 'select', 'confirm'])

const isCardio = computed(() => props.set.type === 'cardio')

const localPrimary   = ref('')
const localSecondary = ref('')

// Reset to empty when the active set changes so typing works immediately
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
.set-row__actual--skip { color: var(--color-text-3); }

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

.set-row__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.set-row__last {
  font-size: 10px;
  color: var(--color-text-3);
}

.set-row__active-last {
  font-size: 10px;
  color: var(--color-text-3);
  white-space: nowrap;
}
</style>
