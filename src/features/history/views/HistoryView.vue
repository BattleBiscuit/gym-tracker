<template>
  <AppPageShell>
    <template #header>
      <span class="page-title">History</span>
    </template>

    <div class="history-list">
      <template v-if="store.isLoading && store.sessions.length === 0">
        <div class="history-skeleton" v-for="n in 5" :key="n" />
      </template>

      <template v-else-if="store.sessions.length === 0">
        <div class="history-empty">
          <p class="history-empty__heading">No workouts yet</p>
          <p class="history-empty__sub">Complete a workout to see it here.</p>
        </div>
      </template>

      <template v-else>
        <template v-for="(items, month) in store.groupedByMonth" :key="month">
          <div class="month-header">{{ month }}</div>
          <HistoryCard
            v-for="session in items"
            :key="session.id"
            :session="session"
            @open="router.push({ name: 'history-detail', params: { id: session.id } })"
            @delete="confirmDelete(session)"
          />
        </template>

        <!-- Infinite scroll sentinel -->
        <div v-if="store.hasMore" ref="sentinel" class="sentinel" />
      </template>
    </div>

    <AppModal v-model="deleteModal" title="Delete workout?">
      <p style="color: var(--color-text-2)">
        This workout log will be permanently removed.
      </p>
      <template #actions>
        <AppButton variant="danger" full @click="doDelete">Delete</AppButton>
        <AppButton variant="ghost" full @click="deleteModal = false">Cancel</AppButton>
      </template>
    </AppModal>
  </AppPageShell>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import HistoryCard from '../components/HistoryCard.vue'
import { useHistoryStore } from '../stores/useHistoryStore.js'

const store = useHistoryStore()
const router = useRouter()

const deleteModal = ref(false)
const pendingDelete = ref(null)
const sentinel = ref(null)
let observer = null

onMounted(async () => {
  await store.loadHistory(1)
  setupInfiniteScroll()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

function setupInfiniteScroll() {
  watch(sentinel, el => {
    if (observer) observer.disconnect()
    if (!el) return
    observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && store.hasMore && !store.isLoading) {
        store.loadHistory(store.page + 1)
      }
    }, { threshold: 0.1 })
    observer.observe(el)
  })
}

function confirmDelete(session) {
  pendingDelete.value = session
  deleteModal.value = true
}

async function doDelete() {
  if (!pendingDelete.value) return
  await store.deleteSession(pendingDelete.value.id)
  deleteModal.value = false
  pendingDelete.value = null
}
</script>

<style scoped>
.page-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text-1);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  padding-bottom: var(--scroll-pb);
}

.month-header {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: var(--space-2) 0;
  margin-top: var(--space-2);
}

.history-skeleton {
  height: 76px;
  background-color: var(--color-surface-1);
  border-radius: var(--radius-lg);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.history-empty {
  text-align: center;
  padding: var(--space-12) var(--space-6);
}

.history-empty__heading {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-2);
  margin-bottom: var(--space-2);
}

.history-empty__sub {
  font-size: var(--text-base);
  color: var(--color-text-3);
}

.sentinel {
  height: 1px;
  margin-bottom: var(--space-4);
}
</style>
