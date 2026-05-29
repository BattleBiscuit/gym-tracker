<template>
  <div id="app-root" :class="{ 'flex-mode': isFlexMode }">
    <RouterView />
    <AppBottomNav />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppBottomNav from '@/components/ui/AppBottomNav.vue'
import { isFlexMode } from '@/composables/useFlexMode.js'
import { useSessionStore } from '@/features/session/stores/useSessionStore.js'
import { useRoutinesStore } from '@/features/routines/stores/useRoutinesStore.js'

const router = useRouter()
const sessionStore = useSessionStore()
const routinesStore = useRoutinesStore()

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
</style>
