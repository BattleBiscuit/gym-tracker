<template>
  <div id="app-root" :class="{ 'flex-mode': isFlexMode }">
    <div class="app-brand" v-if="!isSessionActive">
      <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 9.17 25.31 A 10 10 0 1 1 25.31 9.17" stroke="#e8ff47" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M 18.83 13.17 A 4 4 0 1 1 13.17 18.83" stroke="#e8ff47" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
      </svg>
      <span class="app-brand__name">PR<span class="app-brand__accent">sonal</span></span>
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

const router = useRouter()
const route  = useRoute()
const sessionStore = useSessionStore()
const routinesStore = useRoutinesStore()

const isSessionActive = computed(() => route.name === 'session-active')

onMounted(async () => {
  // Request persistent storage so the OS never auto-evicts our IndexedDB
  if (navigator.storage?.persist) navigator.storage.persist()

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

.app-brand {
  flex-shrink: 0;
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
</style>
