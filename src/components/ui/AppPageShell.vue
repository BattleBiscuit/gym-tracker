<template>
  <div class="page-shell">
    <header class="page-shell__header">
      <!-- Brand prefix: logo + PRsonal -->
      <RouterLink :to="{ name: 'session-pick' }" class="page-shell__brand">
        <svg width="14" height="14" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 9.17 25.31 A 10 10 0 1 1 25.31 9.17" stroke="#e8ff47" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M 18.83 13.17 A 4 4 0 1 1 13.17 18.83" stroke="#e8ff47" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
        </svg>
        <span class="page-shell__brand-name">PR<span class="page-shell__brand-accent">sonal</span></span>
      </RouterLink>

      <span class="page-shell__divider" v-if="$slots.header">·</span>

      <!-- Page-specific header content -->
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
}

.page-shell__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  min-height: var(--header-height);
  padding: 0 var(--space-4);
  padding-top: var(--safe-top);
  gap: var(--space-2);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg);
}

.page-shell__brand {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  text-decoration: none;
}

.page-shell__brand-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-1);
  letter-spacing: 0.02em;
}

.page-shell__brand-accent { color: var(--color-accent); }

.page-shell__divider {
  color: var(--color-text-3);
  font-size: var(--text-sm);
  flex-shrink: 0;
}


.page-shell__content {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
