<template>
  <div class="session-active-page">
    <!-- Fixed top: progress bar + routine name + timer -->
    <div class="session-top-fixed">
      <SessionProgressBar :percent="store.progressPercent" />
      <SessionHeader
        :routineName="store.activeSession?.routineName || ''"
        :elapsedSeconds="store.elapsedSeconds"
        :sets="store.sets.flat()"
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
            v-if="exercise.notes?.trim()"
            class="exercise-block__info-btn"
            @click.stop="notesModal = exercise.notes"
            aria-label="Show notes"
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
            <!-- Border ring: only renders during rest -->
            <svg v-if="store.restTimerActive" class="action-done__border-ring" viewBox="0 0 100 16">
              <!-- drawn as a rounded rect outline that drains -->
            </svg>
            <span :class="['action-done__label', { 'action-done__label--resting': store.restTimerActive }]">
              <template v-if="store.restTimerActive">
                Rest {{ Math.ceil(store.restTimerRemaining) }}s
              </template>
              <template v-else>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {{ store.isLastSet ? 'Finish' : 'Done' }}
              </template>
            </span>
            <!-- CSS animated border ring via conic-gradient -->
            <div v-if="store.restTimerActive" class="action-done__timer-border" :style="timerBorderStyle" />
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
      <p style="color: var(--color-text-2); white-space: pre-wrap; line-height: 1.6;">{{ notesModal }}</p>
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
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import SessionProgressBar from '../components/SessionProgressBar.vue'
import SessionHeader from '../components/SessionHeader.vue'
import SessionFlexLayout from '../components/SessionFlexLayout.vue'
import ExercisePanel from '../components/ExercisePanel.vue'
import { useSessionStore } from '../stores/useSessionStore.js'
import { useRestTimer } from '../composables/useRestTimer.js'
import { formatWeight } from '@/utils/formatWeight.js'
import { useSessionRunner } from '../composables/useSessionRunner.js'
import ExerciseForm from '@/features/routines/components/ExerciseForm.vue'
import { useExerciseEditor } from '@/features/routines/composables/useExerciseEditor.js'

const store = useSessionStore()
const router = useRouter()

// Start elapsed ticker and rest timer watcher
useSessionRunner()
useRestTimer()

const timerBorderStyle = computed(() => {
  const pct = store.restTimerTotal
    ? Math.round((store.restTimerRemaining / store.restTimerTotal) * 100)
    : 0
  // conic-gradient sweeps accent colour clockwise as timer counts down
  return {
    background: `conic-gradient(var(--color-accent) ${pct}%, transparent ${pct}%)`,
  }
})

const localPrimary   = ref('')
const localSecondary = ref('')
const localBW        = ref(false)
const finishModal  = ref(false)
const abandonModal = ref(false)
const notesModal   = ref('')
const showNotesModal = computed({ get: () => !!notesModal.value, set: v => { if (!v) notesModal.value = '' } })
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


// Guard: warn if navigating away during active session
onBeforeRouteLeave((to, from, next) => {
  if (store.activeSessionId && to.name !== 'session-active') {
    abandonModal.value = true
    next(false)
  } else {
    next()
  }
})

async function onComplete() {
  const isLast = store.isLastSet
  const restSeconds = store.currentSet?.restSeconds || 0
  const isCardio = store.currentSet?.type === 'cardio'
  const s = store.currentSet
  const primary   = localPrimary.value   !== '' ? Number(localPrimary.value)   : (isCardio ? s?.plannedDuration : s?.plannedReps)    ?? 0
  const secondary = localSecondary.value !== '' ? Number(localSecondary.value) : (isCardio ? s?.plannedLevel    : s?.plannedWeight)  ?? 0

  await store.markSetComplete(primary, secondary, localBW.value)

  if (isLast) {
    finishModal.value = true
    return
  }

  store.advanceToNextSet()

  localPrimary.value   = ''
  localSecondary.value = ''
  localBW.value        = store.currentSet?.isBodyweight ?? false

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
  overflow: hidden;
  padding: 3px;
}
.action-done:active { background-color: var(--color-accent-dim); }

/* Timer border: conic-gradient layer behind button content */
.action-done__timer-border {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-lg);
  transition: background 0.4s linear;
  z-index: 0;
}

/* Normal label (not resting) */
.action-done__label {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  z-index: 2;
  font-variant-numeric: tabular-nums;
}

/* Resting: label becomes the inner fill layer */
.action-done__label--resting {
  background-color: var(--color-surface-1);
  width: 100%;
  height: 100%;
  border-radius: calc(var(--radius-lg) - 3px);
  justify-content: center;
  color: var(--color-text-1);
  padding: 0 var(--space-4);
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


</style>
