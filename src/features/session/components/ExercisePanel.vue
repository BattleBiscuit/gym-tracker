<template>
  <div class="exercise-panel">
    <div v-for="(set, setIdx) in sets" :key="setIdx">
      <SetRow
        :set="set"
        :setNumber="setIdx + 1"
        :isActive="isCurrentExercise && setIdx === currentSetIndex"
        @update:primary="v => $emit('update:primary', v)"
        @update:secondary="v => $emit('update:secondary', v)"
        @update:bw="v => $emit('update:bw', v)"
        @select="$emit('select', { exIdx: exerciseIndex, setIdx })"
        @confirm="$emit('confirm')"
        @uncheck="$emit('uncheck', { exIdx: exerciseIndex, setIdx })"
      />
    </div>
  </div>
</template>

<script setup>
import SetRow from './SetRow.vue'

defineProps({
  sets:              { type: Array, required: true },
  exerciseIndex:     { type: Number, required: true },
  isCurrentExercise: { type: Boolean, default: false },
  currentSetIndex:   { type: Number, default: 0 },
})
defineEmits(['update:primary', 'update:secondary', 'update:bw', 'select', 'confirm', 'uncheck'])
</script>

<style scoped>
.exercise-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: 0 var(--space-3) var(--space-3);
}
</style>
