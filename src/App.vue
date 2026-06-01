<template>
  <div id="app-root" :class="{ 'flex-mode': isFlexMode }">
    <div v-if="!isSessionActive" class="app-brand-clip">
    <div class="app-brand">
      <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 9.17 25.31 A 10 10 0 1 1 25.31 9.17" stroke="#e8ff47" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M 18.83 13.17 A 4 4 0 1 1 13.17 18.83" stroke="#e8ff47" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
      </svg>
      <span class="app-brand__name">PR<span class="app-brand__accent">sonal</span></span>
      <div style="flex:1" />
      <RouterLink :to="{ name: 'settings' }" class="app-brand__settings" aria-label="Settings">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </RouterLink>
    </div>
    </div>
    <RouterView />
    <AppBottomNav />
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppBottomNav from '@/components/ui/AppBottomNav.vue'
import { isFlexMode } from '@/composables/useFlexMode.js'
import { useSessionStore } from '@/features/session/stores/useSessionStore.js'
import { useRoutinesStore } from '@/features/routines/stores/useRoutinesStore.js'
import { loadConfig } from '@/composables/useConfig.js'

const router = useRouter()
const route  = useRoute()
const sessionStore = useSessionStore()
const routinesStore = useRoutinesStore()

const isSessionActive = computed(() => route.name === 'session-active')

onMounted(async () => {
  // Request persistent storage so the OS never auto-evicts our IndexedDB
  if (navigator.storage?.persist) navigator.storage.persist()
  await loadConfig()

  // Always pre-load routines into the store so they're available immediately
  await routinesStore.loadRoutines()

  // Crash recovery — only redirect if there's no active session already in the store
  // (avoids double-redirect on HMR reloads)
  if (!sessionStore.activeSessionId) {
    const recovered = await sessionStore.loadActiveSession()
    if (recovered) {
      router.push({ name: 'session-active' })
    }
  }
})
</script>

<style>
#app-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--color-bg);
}

.app-brand-clip {
  flex-shrink: 0;
}

.app-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 6px;
  padding-top: calc(10px + var(--safe-top));
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.app-brand__name {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-1);
  letter-spacing: 0.02em;
}

.app-brand__accent {
  color: var(--color-accent);
}

.app-brand__settings {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--color-text-3);
  border-radius: var(--radius-full);
  transition: color var(--transition-fast);
}
.app-brand__settings:active { color: var(--color-text-1); }
</style>
