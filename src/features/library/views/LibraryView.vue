<template>
  <AppPageShell>
    <template #header>
      <span class="page-title">Exercises</span>
      <div style="flex:1" />
      <AppButton variant="accent" size="sm" @click="openCreate">+ New</AppButton>
    </template>

    <!-- Search -->
    <div class="library-search-wrap">
      <input
        v-model="searchQuery"
        class="library-search"
        type="text"
        placeholder="Search exercises…"
      />
    </div>

    <div class="library-list">
      <template v-if="store.isLoading">
        <div class="lib-skeleton" v-for="n in 5" :key="n" />
      </template>

      <template v-else-if="filtered.length === 0">
        <div class="lib-empty">
          <p>{{ searchQuery ? 'No matches' : 'No exercises yet' }}</p>
          <p class="lib-empty__sub">Tap <strong>+ New</strong> to add your first exercise.</p>
        </div>
      </template>

      <div
        v-for="exercise in filtered"
        :key="exercise.id"
        class="lib-card"
        @click="openEdit(exercise)"
      >
        <div class="lib-card__body">
          <span class="lib-card__name">{{ exercise.name }}</span>
          <div class="lib-card__meta">
            <AppBadge :variant="exercise.type === 'cardio' ? 'warning' : 'default'">{{ exercise.type }}</AppBadge>
            <span v-if="exercise.primaryMuscles?.length" class="lib-card__muscles">
              {{ exercise.primaryMuscles.join(', ') }}
            </span>
            <span v-if="exercisePRs[exercise.name]" class="lib-card__pr">
              🏆 {{ exercisePRs[exercise.name] }}kg
            </span>
          </div>
        </div>
        <button class="lib-card__del" @click.stop="confirmDelete(exercise)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>

    <LibraryExerciseForm
      ref="formRef"
      v-model="showForm"
      @save="onSave"
    />

    <AppModal v-model="deleteModal" title="Delete exercise?">
      <p style="color:var(--color-text-2)">"{{ pendingDelete?.name }}" will be removed from the library.</p>
      <template #actions>
        <AppButton variant="danger" full @click="doDelete">Delete</AppButton>
        <AppButton variant="ghost" full @click="deleteModal = false">Cancel</AppButton>
      </template>
    </AppModal>
  </AppPageShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '@/db/index.js'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import LibraryExerciseForm from '../components/LibraryExerciseForm.vue'
import { useLibraryStore } from '../stores/useLibraryStore.js'

const store = useLibraryStore()
const searchQuery = ref('')
const showForm = ref(false)
const formRef = ref(null)
const deleteModal = ref(false)
const pendingDelete = ref(null)

const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return store.exercises
  return store.exercises.filter(e => e.name.toLowerCase().includes(q))
})

const exercisePRs = ref({})  // exerciseName → best 1RM kg

onMounted(async () => {
  await store.loadAll()
  // Load best 1RM per exercise name
  const sets = await db.workoutSets
    .filter(s => s.isPR && !s.skipped && s.completedAt && s.type !== 'cardio' && s.effectiveWeight > 0)
    .toArray()
  const bests = {}
  for (const s of sets) {
    const rm = s.actualReps === 1 ? s.effectiveWeight : Math.round(s.effectiveWeight * (1 + s.actualReps / 30))
    if (!bests[s.exerciseName] || rm > bests[s.exerciseName]) bests[s.exerciseName] = rm
  }
  exercisePRs.value = bests
})

function openCreate() {
  formRef.value?.open(null)
  showForm.value = true
}

function openEdit(exercise) {
  formRef.value?.open(exercise)
  showForm.value = true
}

async function onSave(data) {
  if (data.id) await store.update(data.id, data)
  else await store.create(data)
}

function confirmDelete(exercise) {
  pendingDelete.value = exercise
  deleteModal.value = true
}

async function doDelete() {
  await store.remove(pendingDelete.value.id)
  deleteModal.value = false
}
</script>

<style scoped>
.page-title { font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--color-text-1); }

.library-search-wrap { padding: var(--space-3) var(--space-4) 0; }

.library-search {
  width: 100%;
  height: 40px;
  padding: 0 var(--space-4);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text-1);
  font-size: var(--text-sm);
  user-select: text;
  -webkit-user-select: text;
}
.library-search:focus { border-color: var(--color-border-focus); outline: none; }

.library-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4) var(--space-12);
}

.lib-skeleton {
  height: 60px;
  background: var(--color-surface-1);
  border-radius: var(--radius-lg);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

.lib-empty { text-align: center; padding: var(--space-12) var(--space-6); color: var(--color-text-3); }
.lib-empty__sub { font-size: var(--text-sm); margin-top: var(--space-2); }

.lib-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.lib-card:active { background: var(--color-surface-2); }

.lib-card__body { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); min-width: 0; }

.lib-card__name { font-size: var(--text-base); font-weight: var(--font-semibold); color: var(--color-text-1); }

.lib-card__meta { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }

.lib-card__muscles { font-size: var(--text-xs); color: var(--color-text-3); }
.lib-card__pr { font-size: var(--text-xs); color: var(--color-accent); font-weight: var(--font-semibold); }

.lib-card__del {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; color: var(--color-text-3);
  border-radius: var(--radius-md); transition: color var(--transition-fast);
}
.lib-card__del:active { color: var(--color-danger); }
</style>
