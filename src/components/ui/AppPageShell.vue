<template>
  <div class="page-shell">
    <header v-if="$slots.header" class="page-shell__header">
      <slot name="header" />
    </header>
    <main class="page-shell__content scroll" @scroll="onScroll">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { onScroll } from '@/composables/useScrollDirection.js'
defineProps({
  scrollable: { type: Boolean, default: true },
})
</script>

<style scoped>
.page-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: var(--safe-top);
}

.page-shell__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  min-height: var(--header-height);
  padding: 0 var(--space-4);
  gap: var(--space-3);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg);
}

.page-shell__content {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
