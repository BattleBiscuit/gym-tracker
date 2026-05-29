<template>
  <button
    :class="['app-btn', `app-btn--${variant}`, { 'app-btn--full': full, 'app-btn--sm': size === 'sm' }]"
    :disabled="disabled"
    :type="type"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // primary | ghost | danger | accent
  size:    { type: String, default: 'md' },       // md | sm
  full:    { type: Boolean, default: false },
  disabled:{ type: Boolean, default: false },
  type:    { type: String, default: 'button' },
})
</script>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--touch-target-min);
  padding: 0 var(--space-5);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  transition: background-color var(--transition-fast), opacity var(--transition-fast);
  cursor: pointer;
  white-space: nowrap;
}

.app-btn--sm {
  min-height: 36px;
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
}

.app-btn--full {
  width: 100%;
}

.app-btn--primary {
  background-color: var(--color-surface-2);
  color: var(--color-text-1);
  border: 1px solid var(--color-border);
}
.app-btn--primary:active { background-color: var(--color-surface-3); }

.app-btn--accent {
  background-color: var(--color-accent);
  color: #0f0f0f;
  border: none;
}
.app-btn--accent:active { background-color: var(--color-accent-dim); }

.app-btn--ghost {
  background-color: transparent;
  color: var(--color-text-2);
  border: 1px solid var(--color-border);
}
.app-btn--ghost:active { background-color: var(--color-surface-2); }

.app-btn--danger {
  background-color: transparent;
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}
.app-btn--danger:active { background-color: rgba(244, 67, 54, 0.1); }

.app-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
