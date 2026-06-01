<template>
  <button class="fab" @click="$emit('click')" :disabled="disabled">
    <slot />
  </button>
</template>

<script setup>
defineProps({ disabled: { type: Boolean, default: false } })
defineEmits(['click'])
</script>

<style scoped>
.fab {
  position: fixed;
  left: var(--space-4);
  bottom: calc(var(--nav-height) + var(--safe-bottom) + var(--space-4));
  z-index: 100;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-5);
  height: 48px;
  background-color: var(--color-accent);
  color: #0f0f0f;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  border-radius: var(--radius-full);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  transition: background-color var(--transition-fast), opacity var(--transition-fast);
}
.fab:active   { background-color: var(--color-accent-dim); }
.fab:disabled { opacity: 0.4; }
</style>
