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
    relatedRoutes: ['session-pick', 'session-active'],
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`,
  },
  {
    name: 'routines',
    to: '/routines',
    label: 'Routines',
    relatedRoutes: ['routines', 'routine-create', 'routine-edit'],
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>`,
  },
  {
    name: 'library',
    to: '/library',
    label: 'Exercises',
    relatedRoutes: ['library'],
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  },
  {
    name: 'history',
    to: '/history',
    label: 'History',
    relatedRoutes: ['history', 'history-detail'],
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><polyline points="12 7 12 12 16 14"/></svg>`,
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
