<template>
  <div class="session-active-page">
    <!-- Fixed top: progress bar + routine name + timer -->
    <div class="session-top-fixed">
      <SessionProgressBar :percent="store.progressPercent" />
      <SessionHeader
        :routineName="store.activeSession?.routineName || ''"
        :elapsedSeconds="store.elapsedSeconds"
        @finish="onFinishEarly"
        @quit="abandonModal = true"
      />
    </div>

    <!-- Scrollable exercise list -->
    <div class="session-scroll-area scroll">

      <div
        v-for="(exercise, exIdx) in store.exercises"
        :key="exercise.id"
        class="exercise-block"
        :class="{ 'exercise-block--current': exIdx === store.currentExerciseIndex }"
      >
        <div class="exercise-block__name-row">
          <span class="exercise-block__name">{{ exercise.name }}</span>
          <button
            class="exercise-block__info-btn"
            @click.stop="notesModal = exercise.notes || ''; notesExIdx = exIdx; showNotesModal = true"
            aria-label="Edit notes"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </button>
        </div>
        <ExercisePanel
          :sets="store.sets[exIdx] || []"
          :exerciseIndex="exIdx"
          :isCurrentExercise="exIdx === store.currentExerciseIndex"
          :currentSetIndex="exIdx === store.currentExerciseIndex ? store.currentSetIndex : -1"
          @update:primary="v => localPrimary = v"
          @update:secondary="v => localSecondary = v"
          @update:bw="v => localBW = v"
          @select="({ exIdx, setIdx }) => selectSet(exIdx, setIdx)"
          @confirm="onComplete"
          @uncheck="({ exIdx, setIdx }) => uncheckSet(exIdx, setIdx)"
        />
      </div>

      <div class="add-exercise-btn-wrap">
        <button class="add-exercise-btn" @click="showAddExercise = true">+ Add exercise</button>
      </div>
    </div>

    <!-- Fixed bottom panel: always visible -->
    <div class="session-bottom-fixed">
      <div class="bottom-panel-content">
        <div class="current-set-summary" v-if="store.currentSet && !store.restTimerActive">
          <span class="current-set-planned">
            Target:
            <template v-if="store.currentSet.type === 'cardio'">
              {{ store.currentSet.plannedDuration }}min · lvl{{ store.currentSet.plannedLevel }}
            </template>
            <template v-else>
              {{ store.currentSet.plannedReps }} reps · {{ formatWeight(store.currentSet.plannedWeight, store.currentSet.isBodyweight) }}
            </template>
          </span>
        </div>
        <div class="action-row">
          <button
            class="action-done"
            @click="store.restTimerActive ? onSkipRest() : onComplete()"
          >
            <!-- Animated border rect during rest — viewBox matches button dimensions -->
            <svg v-if="store.restTimerActive" class="action-done__timer-svg" viewBox="0 0 300 52" preserveAspectRatio="none">
              <rect class="action-done__timer-track" x="2" y="2" width="296" height="48" rx="7" ry="7"/>
              <rect class="action-done__timer-fill" x="2" y="2" width="296" height="48" rx="7" ry="7"
                :style="{ strokeDashoffset: timerDashOffset }"
              />
            </svg>
            <span class="action-done__text">
              <template v-if="store.restTimerActive">
                Rest {{ Math.ceil(store.restTimerRemaining) }}s
              </template>
              <template v-else>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {{ store.isLastSet ? 'Finish' : 'Done' }}
              </template>
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Finish confirmation (shown after last set) -->
    <AppModal v-model="finishModal" title="Finish workout?" :closeOnBackdrop="false">
      <p style="color: var(--color-text-2)">
        All sets complete! Save this workout to history?
      </p>
      <template #actions>
        <AppButton variant="accent" full @click="doFinish">Save to history</AppButton>
        <AppButton variant="ghost" full @click="finishModal = false">Keep going</AppButton>
      </template>
    </AppModal>

    <!-- Add exercise during session -->
    <ExerciseForm
      v-model="showAddExercise"
      :form="exEditor.form"
      :errors="exEditor.errors"
      :editingId="null"
      :addSet="exEditor.addSet"
      :removeSet="exEditor.removeSet"
      :setExerciseType="exEditor.setExerciseType"
      @submit="submitAddExercise"
    />

    <!-- Exercise notes -->
    <AppModal v-model="showNotesModal" title="Notes">
      <textarea
        v-model="notesModal"
        class="notes-editor"
        placeholder="Add notes for this exercise…"
        rows="5"
      />
      <template #actions>
        <AppButton variant="accent" full @click="saveNotes">Save</AppButton>
        <AppButton variant="ghost" full @click="showNotesModal = false">Cancel</AppButton>
      </template>
    </AppModal>

    <!-- Abandon confirmation -->
    <AppModal v-model="abandonModal" title="Abandon workout?">
      <p style="color: var(--color-text-2)">
        This workout will not be saved to history.
      </p>
      <template #actions>
        <AppButton variant="danger" full @click="doAbandon">Abandon</AppButton>
        <AppButton variant="ghost" full @click="abandonModal = false">Continue workout</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { routinesRepository } from '@/features/routines/db/routinesRepository.js'
import SessionProgressBar from '../components/SessionProgressBar.vue'
import SessionHeader from '../components/SessionHeader.vue'
import SessionFlexLayout from '../components/SessionFlexLayout.vue'
import ExercisePanel from '../components/ExercisePanel.vue'
import { useSessionStore } from '../stores/useSessionStore.js'
import { useRestTimer } from '../composables/useRestTimer.js'
import { formatWeight, resolveWeight } from '@/utils/formatWeight.js'
import { useSessionRunner } from '../composables/useSessionRunner.js'
import { bodyweight } from '@/composables/useConfig.js'
import ExerciseForm from '@/features/routines/components/ExerciseForm.vue'
import { useExerciseEditor } from '@/features/routines/composables/useExerciseEditor.js'

const store = useSessionStore()
const router = useRouter()

// Start elapsed ticker and rest timer watcher
useSessionRunner()
useRestTimer()

// Perimeter of the 296×48 rect: 2*(296+48) = 688
const TIMER_PERIMETER = 688
const timerDashOffset = computed(() => {
  if (!store.restTimerTotal) return TIMER_PERIMETER
  const ratio = store.restTimerRemaining / store.restTimerTotal
  return TIMER_PERIMETER * (1 - ratio)
})

const localPrimary   = ref('')
const localSecondary = ref('')
const localBW        = ref(false)

const finishModal  = ref(false)
const abandonModal = ref(false)
const notesModal      = ref('')
const notesExIdx      = ref(-1)
const showNotesModal  = ref(false)

async function saveNotes() {
  if (notesExIdx.value >= 0) {
    const ex = store.exercises[notesExIdx.value]
    if (ex?.id) {
      await routinesRepository.updateExercise(ex.id, { notes: notesModal.value })
      store.exercises[notesExIdx.value] = { ...ex, notes: notesModal.value }
    }
  }
  showNotesModal.value = false
}
const showAddExercise = ref(false)
const exEditor = useExerciseEditor()

async function submitAddExercise() {
  if (!exEditor.validate()) return
  const data = exEditor.getData()
  await store.addExerciseToSession(data)
  showAddExercise.value = false
  exEditor.reset()
}
function selectSet(exIdx, setIdx) {
  store.cancelRestTimer()
  localPrimary.value   = ''
  localSecondary.value = ''
  store.jumpToExercise(exIdx, setIdx)
}

async function uncheckSet(exIdx, setIdx) {
  store.cancelRestTimer()
  const s = store.sets[exIdx]?.[setIdx]
  if (!s) return
  // Reset in-memory state
  const setData = { ...s, completedAt: null, skipped: false, actualReps: null, actualWeight: null, effectiveWeight: null, isPR: false }
  store.sets[exIdx].splice(setIdx, 1, setData)
  // Delete from DB so next saveSet creates it fresh without conflicts
  await store.deleteSetFromDb(setData)
  store.jumpToExercise(exIdx, setIdx)
}


// Guard: warn if navigating away during active session

async function onComplete() {
  const isLast = store.isLastSet
  const restSeconds = store.currentSet?.restSeconds || 0
  const isCardio = store.currentSet?.type === 'cardio'
  const s = store.currentSet
  const primary   = (localPrimary.value   !== '' && localPrimary.value   !== null)
    ? parseFloat(localPrimary.value)   : (isCardio ? s?.plannedDuration : s?.plannedReps)    ?? 0
  const secondary = (localSecondary.value !== '' && localSecondary.value !== null)
    ? parseFloat(localSecondary.value) : (isCardio ? s?.plannedLevel    : s?.plannedWeight)  ?? 0

  // Capture indices before advancing — we need the set we just completed
  const completedExIdx  = store.currentExerciseIndex
  const completedSetIdx = store.currentSetIndex

  await store.markSetComplete(primary, secondary, localBW.value)

  // Always advance and clear inputs so the completed set renders as locked
  store.advanceToNextSet()
  localPrimary.value   = ''
  localSecondary.value = ''
  localBW.value        = store.currentSet?.isBodyweight ?? false

  if (isLast) {
    finishModal.value = true
    return
  }

  const next = store.currentSet
  localPrimary.value   = isCardio ? (next?.plannedDuration ?? '') : (next?.plannedReps ?? '')
  localSecondary.value = isCardio ? (next?.plannedLevel    ?? '') : (next?.plannedWeight ?? '')
  localBW.value        = next?.isBodyweight ?? false

  if (restSeconds > 0) {
    store.startRestTimer(restSeconds)
  }
}


function onSkipRest() {
  store.cancelRestTimer()
}

async function onFinishEarly() {
  // Skip all sets that haven't been completed or skipped yet
  await store.skipAllRemaining()
  finishModal.value = true
}

async function doFinish() {
  finishModal.value = false
  await store.finishSession()
  router.push({ name: 'history' })
}

async function doAbandon() {
  abandonModal.value = false
  await store.abandonSession()
  router.push({ name: 'session-pick' })
}
</script>

<style scoped>
.session-active-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.session-top-fixed {
  flex-shrink: 0;
  background-color: var(--color-bg);
}

.session-scroll-area {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-bottom: var(--space-4);
}

.session-bottom-fixed {
  flex-shrink: 0;
  background-color: var(--color-bg);
  border-top: 1px solid var(--color-border);
  padding-bottom: var(--safe-bottom);
}

.exercise-block {
  margin-bottom: var(--space-2);
}

.exercise-block--current .exercise-block__name {
  color: var(--color-accent);
}

.exercise-block__name-row {
  padding: var(--space-3) var(--space-4) var(--space-2);
}

.exercise-block__name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.bottom-panel-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
}

.current-set-planned {
  font-size: var(--text-sm);
  color: var(--color-text-3);
  text-align: center;
}

.current-set-summary {
  text-align: center;
}

.action-row {
  display: flex;
  gap: var(--space-2);
  align-items: stretch;
}

.action-done {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  background-color: var(--color-accent);
  color: #0f0f0f;
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  border-radius: var(--radius-lg);
  transition: background-color var(--transition-fast);
}
.action-done:active { background-color: var(--color-accent-dim); }

/* During rest: dark background, timer SVG as border */
.action-done:has(.action-done__timer-svg) {
  background-color: var(--color-surface-1);
  color: var(--color-text-1);
}

.action-done__timer-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  border-radius: var(--radius-lg);
  overflow: visible;
}

.action-done__timer-track {
  fill: none;
  stroke: var(--color-surface-3);
  stroke-width: 3;
}

.action-done__timer-fill {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 688;
  transition: stroke-dashoffset 0.4s linear;
}

.action-done__text {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  z-index: 1;
  font-variant-numeric: tabular-nums;
}


.exercise-block__name-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.exercise-block__info-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  color: var(--color-text-3);
  border-radius: var(--radius-full);
  transition: color var(--transition-fast);
}
.exercise-block__info-btn:active { color: var(--color-accent); }

.add-exercise-btn-wrap {
  padding: var(--space-3) var(--space-4) var(--space-4);
}

.add-exercise-btn {
  width: 100%;
  min-height: 40px;
  background-color: transparent;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-3);
  font-size: var(--text-sm);
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.add-exercise-btn:active {
  color: var(--color-text-1);
  border-color: var(--color-text-2);
}



.notes-editor {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-1);
  font-size: var(--text-base);
  resize: vertical;
  min-height: 100px;
  user-select: text;
  -webkit-user-select: text;
}
.notes-editor:focus { border-color: var(--color-border-focus); outline: none; }
</style>
