<template>
  <nav class="bottom-nav" v-if="!isFlexMode">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="{ name: tab.name }"
      class="bottom-nav__tab"
      :class="{ 'bottom-nav__tab--active': isActive(tab) }"
      :aria-label="tab.label"
    >
      <span class="bottom-nav__icon" v-html="tab.icon" />
      <span class="bottom-nav__label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { isFlexMode } from '@/composables/useFlexMode.js'

const route = useRoute()

const tabs = [
  {
    name: 'session-pick',
    to: '/session',
    label: 'Workout',
    relatedRoutes: ['session-pick', 'session-active', 'routines', 'routine-create', 'routine-edit'],
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`,
  },
  {
    name: 'library',
    to: '/library',
    label: 'Exercises',
    relatedRoutes: ['library'],
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  },
  {
    name: 'body',
    to: '/body',
    label: 'Body',
    relatedRoutes: ['body'],
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  },
  {
    name: 'progress',
    to: '/progress',
    label: 'Progress',
    relatedRoutes: ['progress', 'history', 'history-detail'],
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  },
  {
    name: 'settings',
    to: '/settings',
    label: 'Settings',
    relatedRoutes: ['settings'],
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  },
]

function isActive(tab) {
  return tab.relatedRoutes.includes(route.name)
}
</script>

<style scoped>
.bottom-nav {
  flex-shrink: 0;
  display: flex;
  height: calc(var(--nav-height) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  background-color: var(--color-surface-1);
  border-top: 1px solid var(--color-border);
}

.bottom-nav__tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--color-text-3);
  transition: color var(--transition-fast);
  min-height: var(--touch-target-min);
}

.bottom-nav__tab--active {
  color: var(--color-accent);
}

.bottom-nav__label {
  font-size: 10px;
  font-weight: var(--font-medium);
}
</style>
