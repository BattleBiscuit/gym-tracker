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
    <!-- Workout in progress banner -->
    <div v-if="showWorkoutBanner" class="workout-banner" @click="router.push({ name: 'session-active' })">
      <span class="workout-banner__dot" />
      <span class="workout-banner__label">Workout in progress</span>
      <span class="workout-banner__name">{{ sessionStore.activeSession?.routineName }}</span>
      <span class="workout-banner__arrow">→</span>
    </div>

    <main class="page-shell__content scroll" @scroll="onScroll">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onScroll } from '@/composables/useScrollDirection.js'
import { useSessionStore } from '@/features/session/stores/useSessionStore.js'

defineProps({ scrollable: { type: Boolean, default: true } })

const route        = useRoute()
const router       = useRouter()
const sessionStore = useSessionStore()

const showWorkoutBanner = computed(() =>
  sessionStore.activeSessionId && route.name !== 'session-active'
)
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


.workout-banner {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: rgba(232, 255, 71, 0.08);
  border-bottom: 1px solid rgba(232, 255, 71, 0.2);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.workout-banner:active { background: rgba(232, 255, 71, 0.14); }

.workout-banner__dot {
  width: 7px; height: 7px;
  border-radius: var(--radius-full);
  background: var(--color-accent);
  flex-shrink: 0;
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

.workout-banner__label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-accent);
  flex-shrink: 0;
}

.workout-banner__name {
  font-size: var(--text-xs);
  color: var(--color-text-2);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.workout-banner__arrow { font-size: var(--text-sm); color: var(--color-accent); flex-shrink: 0; }

.page-shell__content {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
