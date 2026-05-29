<template>
  <div class="complete-wrap">
    <button class="complete-btn" @click="$emit('complete')" :disabled="disabled">
      {{ isLastSet ? 'Finish workout' : 'Done — next set' }}
    </button>
    <button class="skip-btn" @click="$emit('skip')">Skip set</button>
  </div>
</template>

<script setup>
defineProps({
  isLastSet: { type: Boolean, default: false },
  disabled:  { type: Boolean, default: false },
})
defineEmits(['complete', 'skip'])
</script>

<style scoped>
.complete-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.complete-btn {
  width: 100%;
  min-height: 56px;
  background-color: var(--color-accent);
  color: #0f0f0f;
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  border-radius: var(--radius-lg);
  transition: background-color var(--transition-fast), opacity var(--transition-fast);
}
.complete-btn:active { background-color: var(--color-accent-dim); }
.complete-btn:disabled { opacity: 0.4; }

.skip-btn {
  width: 100%;
  min-height: 44px;
  background-color: transparent;
  color: var(--color-text-3);
  font-size: var(--text-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}
.skip-btn:active { color: var(--color-text-2); }
</style>
