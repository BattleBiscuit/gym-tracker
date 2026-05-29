<template>
  <span :class="['app-badge', `app-badge--${variant}`]">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'default' }, // default | success | danger | warning | accent
})
</script>

<style scoped>
.app-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  white-space: nowrap;
}

.app-badge--default  { background-color: var(--color-surface-3); color: var(--color-text-2); }
.app-badge--success  { background-color: rgba(76, 175, 80, 0.2); color: var(--color-success); }
.app-badge--danger   { background-color: rgba(244, 67, 54, 0.2); color: var(--color-danger); }
.app-badge--warning  { background-color: rgba(255, 152, 0, 0.2); color: var(--color-warning); }
.app-badge--accent   { background-color: rgba(232, 255, 71, 0.15); color: var(--color-accent); }
</style>
