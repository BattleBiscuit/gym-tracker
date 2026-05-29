<template>
  <div class="rest-timer">
    <div class="rest-timer__ring-wrap">
      <svg class="rest-timer__svg" viewBox="0 0 100 100">
        <circle class="rest-timer__track" cx="50" cy="50" r="44" />
        <circle
          class="rest-timer__fill"
          cx="50" cy="50" r="44"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
        />
      </svg>
    </div>
    <div class="rest-timer__info">
      <span class="rest-timer__seconds">{{ Math.ceil(remaining) }}</span>
      <span class="rest-timer__label">rest</span>
    </div>
    <button class="rest-timer__skip" @click="$emit('skip')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12 12 5 19 12"/><polyline points="5 19 12 12 19 19"/></svg>
      <span>Skip</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  remaining: { type: Number, default: 0 },
  total:     { type: Number, default: 90 },
})
defineEmits(['skip'])

const circumference = 2 * Math.PI * 44 // ~276.46

const dashOffset = computed(() => {
  const ratio = props.total > 0 ? props.remaining / props.total : 0
  return circumference * (1 - ratio)
})
</script>

<style scoped>
.rest-timer {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 52px;
}

.rest-timer__ring-wrap {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
}

.rest-timer__svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.rest-timer__track {
  fill: none;
  stroke: var(--color-surface-2);
  stroke-width: 10;
}

.rest-timer__fill {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 10;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.4s linear;
}

.rest-timer__info {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.rest-timer__seconds {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text-1);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.rest-timer__label {
  font-size: var(--text-sm);
  color: var(--color-text-3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.rest-timer__skip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 64px;
  height: 52px;
  background-color: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-2);
  font-size: 10px;
  font-weight: var(--font-medium);
  transition: color var(--transition-fast);
}
.rest-timer__skip:active { color: var(--color-text-1); }
</style>
