<template>
  <AppPageShell>
    <template #header>
      <span class="page-title">Routines</span>
      <div style="flex:1" />
      <AppButton variant="accent" size="sm" @click="router.push({ name: 'routine-create' })">
        + New
      </AppButton>
    </template>

    <div class="routines-list">
      <template v-if="store.isLoading">
        <div class="routines-skeleton" v-for="n in 3" :key="n" />
      </template>

      <template v-else-if="store.sortedRoutines.length === 0">
        <div class="routines-empty">
          <p class="routines-empty__heading">No routines yet</p>
          <p class="routines-empty__sub">Tap <strong>+ New</strong> to create your first routine.</p>
        </div>
      </template>

      <template v-else>
        <RoutineCard
          v-for="routine in store.sortedRoutines"
          :key="routine.id"
          :routine="routine"
          :exerciseCount="exerciseCounts[routine.id] || 0"
          @open="router.push({ name: 'routine-edit', params: { id: routine.id } })"
          @delete="confirmDelete(routine)"
        />
      </template>
    </div>

    <AppModal v-model="deleteModal" title="Delete routine?">
      <p style="color: var(--color-text-2)">
        "{{ pendingDelete?.name }}" and all its exercises will be permanently removed.
      </p>
      <template #actions>
        <AppButton variant="danger" full @click="doDelete">Delete</AppButton>
        <AppButton variant="ghost" full @click="deleteModal = false">Cancel</AppButton>
      </template>
    </AppModal>
  </AppPageShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import RoutineCard from '../components/RoutineCard.vue'
import { useRoutinesStore } from '../stores/useRoutinesStore.js'
import { db } from '@/db/index.js'

const store = useRoutinesStore()
const router = useRouter()

const deleteModal = ref(false)
const pendingDelete = ref(null)
const exerciseCounts = ref({})

onMounted(async () => {
  await store.loadRoutines()
  // Load exercise counts for all routines
  const counts = {}
  for (const r of store.routines) {
    counts[r.id] = await db.routineExercises.where('routineId').equals(r.id).count()
  }
  exerciseCounts.value = counts
})

function confirmDelete(routine) {
  pendingDelete.value = routine
  deleteModal.value = true
}

async function doDelete() {
  if (!pendingDelete.value) return
  await store.deleteRoutine(pendingDelete.value.id)
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

.routines-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  padding-bottom: var(--scroll-pb);
}

.routines-skeleton {
  height: 80px;
  background-color: var(--color-surface-1);
  border-radius: var(--radius-lg);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.routines-empty {
  text-align: center;
  padding: var(--space-12) var(--space-6);
}

.routines-empty__heading {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-2);
  margin-bottom: var(--space-2);
}

.routines-empty__sub {
  font-size: var(--text-base);
  color: var(--color-text-3);
}
</style>
