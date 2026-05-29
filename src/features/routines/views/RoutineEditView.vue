<template>
  <AppPageShell>
    <template #header>
      <button class="back-btn" @click="handleBack">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <span class="page-title">{{ isNew ? 'New Routine' : 'Edit Routine' }}</span>
      <div style="flex:1" />
      <AppButton variant="accent" size="sm" :disabled="editor.isSaving.value" @click="handleSave">
        {{ editor.isSaving.value ? 'Saving…' : 'Save' }}
      </AppButton>
    </template>

    <div class="edit-content">
      <!-- Routine metadata -->
      <section class="edit-section">
        <AppInput
          v-model="editor.form.name"
          label="Routine name"
          placeholder="e.g. Push Day"
          :error="editor.errors.name"
          @input="editor.markDirty()"
        />
        <AppTextarea
          v-model="editor.form.notes"
          label="Notes (optional)"
          placeholder="e.g. Mon / Wed / Fri…"
          :rows="2"
          @input="editor.markDirty()"
        />
      </section>

      <!-- Exercise list -->
      <section class="edit-section">
        <div class="section-header">
          <span class="section-title">Exercises</span>
          <AppButton variant="ghost" size="sm" @click="openAddExercise">+ Add</AppButton>
        </div>

        <div v-if="store.currentExercises.length === 0" class="exercises-empty">
          No exercises yet. Tap <strong>+ Add</strong> to begin.
        </div>

        <div class="exercise-list" ref="listRef">
          <ExerciseListItem
            v-for="(exercise, index) in store.currentExercises"
            :key="exercise.id"
            :exercise="exercise"
            :index="index"
            :isDragging="dragState.sourceIndex === index"
            :dropIndicator="getDropIndicator(index)"
            @edit="openEditExercise(exercise)"
            @delete="removeExercise(exercise)"
            @dragstart="onDragStart"
          />
        </div>

        <!-- Ghost clone follows finger -->
        <Teleport to="body">
          <div
            v-if="dragState.active"
            class="drag-ghost"
            :style="{ top: dragState.ghostY + 'px', left: dragState.ghostX + 'px', width: dragState.ghostW + 'px' }"
          >
            {{ store.currentExercises[dragState.sourceIndex]?.name }}
          </div>
        </Teleport>
      </section>
    </div>

    <!-- Exercise form modal -->
    <ExerciseForm
      v-model="showExerciseForm"
      :form="exEditor.form"
      :errors="exEditor.errors"
      :editingId="exEditor.editingId.value"
      :addSet="exEditor.addSet"
      :removeSet="exEditor.removeSet"
      :setExerciseType="exEditor.setExerciseType"
      @submit="submitExercise"
    />

    <!-- Discard changes modal -->
    <AppModal v-model="discardModal" title="Discard changes?">
      <p style="color: var(--color-text-2)">You have unsaved changes to this routine.</p>
      <template #actions>
        <AppButton variant="danger" full @click="doDiscard">Discard</AppButton>
        <AppButton variant="ghost" full @click="discardModal = false">Keep editing</AppButton>
      </template>
    </AppModal>
  </AppPageShell>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import AppModal from '@/components/ui/AppModal.vue'
import ExerciseListItem from '../components/ExerciseListItem.vue'
import ExerciseForm from '../components/ExerciseForm.vue'
import { useRoutinesStore } from '../stores/useRoutinesStore.js'
import { useRoutineEditor } from '../composables/useRoutineEditor.js'
import { useExerciseEditor } from '../composables/useExerciseEditor.js'

const props = defineProps({ id: { type: String, default: null } })

const router = useRouter()
const store = useRoutinesStore()
const editor = useRoutineEditor()
const exEditor = useExerciseEditor()

const isNew = computed(() => !props.id)
const showExerciseForm = ref(false)
const discardModal = ref(false)
let discardCallback = null

const listRef = ref(null)
const dragState = reactive({
  active: false,
  sourceIndex: -1,
  targetIndex: -1,
  ghostY: 0,
  ghostX: 0,
  ghostW: 300,
  startY: 0,
})

onMounted(async () => {
  if (props.id) {
    await store.loadRoutineForEdit(props.id)
  } else {
    store.clearCurrent()
  }
  editor.loadFromStore()
})

onBeforeRouteLeave((to, from, next) => {
  if (editor.isDirty.value) {
    discardModal.value = true
    discardCallback = next
    next(false)
  } else {
    next()
  }
})

function doDiscard() {
  discardModal.value = false
  editor.isDirty.value = false
  if (discardCallback) discardCallback()
}

function handleBack() {
  router.push({ name: 'routines' })
}

async function handleSave() {
  const id = await editor.save()
  if (id) router.push({ name: 'routines' })
}

function openAddExercise() {
  exEditor.reset()
  showExerciseForm.value = true
}

function openEditExercise(exercise) {
  exEditor.load(exercise)
  showExerciseForm.value = true
}

async function submitExercise() {
  if (!exEditor.validate()) return
  const data = exEditor.getData()
  if (exEditor.editingId.value) {
    await store.updateExercise(exEditor.editingId.value, data)
  } else {
    // Save routine first if it's new
    if (!store.currentRoutine) {
      const id = await editor.save()
      if (!id) return
    }
    await store.addExercise(store.currentRoutine.id, data)
  }
  showExerciseForm.value = false
  exEditor.reset()
}

async function removeExercise(exercise) {
  await store.removeExercise(exercise.id)
}

function getDropIndicator(index) {
  if (!dragState.active || index === dragState.sourceIndex) return null
  if (index === dragState.targetIndex) {
    return index < dragState.sourceIndex ? 'above' : 'below'
  }
  return null
}

function onDragStart({ index, y }) {
  const listEl = listRef.value
  const rect = listEl?.getBoundingClientRect()
  dragState.active = true
  dragState.sourceIndex = index
  dragState.targetIndex = index
  dragState.startY = y
  dragState.ghostY = y - 24
  dragState.ghostX = rect ? rect.left + 12 : 16
  dragState.ghostW = rect ? rect.width - 24 : 300

  function onMove(e) {
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    dragState.ghostY = clientY - 24

    // Hit-test each item to find drop target
    if (!listEl) return
    const items = listEl.querySelectorAll('.exercise-item')
    let target = dragState.sourceIndex
    items.forEach((el, i) => {
      const r = el.getBoundingClientRect()
      const mid = r.top + r.height / 2
      if (clientY > mid) target = i
    })
    dragState.targetIndex = target
  }

  function onEnd() {
    if (dragState.targetIndex !== dragState.sourceIndex) {
      const exercises = [...store.currentExercises]
      const [item] = exercises.splice(dragState.sourceIndex, 1)
      exercises.splice(dragState.targetIndex, 0, item)
      const updates = exercises.map((e, i) => ({ id: e.id, position: i }))
      store.reorderExercises(updates)
    }
    dragState.active = false
    dragState.sourceIndex = -1
    dragState.targetIndex = -1
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
  }

  document.addEventListener('touchmove', onMove, { passive: true })
  document.addEventListener('touchend', onEnd)
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
}
</script>

<style scoped>
.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--color-text-2);
  border-radius: var(--radius-md);
  margin-left: calc(-1 * var(--space-2));
}
.back-btn:active { color: var(--color-text-1); }

.page-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-1);
  flex: 1;
}

.edit-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-4);
  padding-bottom: var(--scroll-pb);
}

.edit-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: var(--text-xs);
}

.exercises-empty {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-3);
  font-size: var(--text-sm);
  background-color: var(--color-surface-1);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border);
}

.exercise-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
