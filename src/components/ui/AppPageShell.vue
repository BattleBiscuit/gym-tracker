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

      <!-- Settings link always on the right -->
      <div style="flex:1" />
      <RouterLink :to="{ name: 'settings' }" class="page-shell__settings" aria-label="Settings">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </RouterLink>
    </header>
    <main class="page-shell__content scroll" @scroll="onScroll">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { onScroll } from '@/composables/useScrollDirection.js'
import { RouterLink } from 'vue-router'
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

.page-shell__settings {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-text-3);
  border-radius: var(--radius-full);
  flex-shrink: 0;
  transition: color var(--transition-fast);
}
.page-shell__settings:active { color: var(--color-text-1); }

.page-shell__content {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
