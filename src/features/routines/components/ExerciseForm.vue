<template>
  <AppModal v-model="show" :title="editingId ? 'Edit Exercise' : 'Add Exercise'">
    <div class="exercise-form">

      <ExerciseSearchInput
        v-model="form.exerciseLibraryId"
        v-model:displayValue="form.name"
        label="Exercise"
        :error="errors.name"
        @select="onLibrarySelect"
      />

      <div class="sets-section">
        <div class="sets-header">
          <span class="sets-label">Sets</span>
          <AppBadge :variant="form.exerciseType === 'cardio' ? 'warning' : 'default'">{{ form.exerciseType }}</AppBadge>
          <span v-if="errors.sets" class="sets-error">{{ errors.sets }}</span>
        </div>

        <!-- Strength columns -->
        <template v-if="form.exerciseType !== 'cardio'">
          <div class="set-row-header">
            <span class="set-col-num">#</span>
            <span class="set-col">Reps</span>
            <span class="set-col">Weight</span>
            <span class="set-col">Unit</span>
            <span class="set-col">Rest (s)</span>
            <span class="set-col-del" />
          </div>
          <div v-for="(set, idx) in form.sets" :key="idx" class="set-row">
            <span class="set-col-num">{{ idx + 1 }}</span>
            <input class="set-input" type="number" inputmode="numeric"
              :value="set.reps" :min="1"
              :class="{ 'set-input--error': errors[`set_${idx}_reps`] }"
              @input="set.reps = $event.target.value === '' ? null : Number($event.target.value)" />
            <input class="set-input" type="number" inputmode="decimal"
              :value="set.weight" :min="0" :step="0.5"
              :class="{ 'set-input--error': errors[`set_${idx}_weight`] }"
              @input="set.weight = $event.target.value === '' ? null : Number($event.target.value)" />
            <div class="unit-toggle">
              <button type="button" :class="['unit-btn', { 'unit-btn--active': set.weightUnit === 'kg' }]" @click="set.weightUnit = 'kg'">kg</button>
              <button type="button" :class="['unit-btn', { 'unit-btn--active': set.weightUnit === 'lbs' }]" @click="set.weightUnit = 'lbs'">lb</button>
            </div>
            <input class="set-input" type="number" inputmode="numeric"
              :value="set.restSeconds" :min="0" :step="5"
              :class="{ 'set-input--error': errors[`set_${idx}_rest`] }"
              @input="set.restSeconds = $event.target.value === '' ? null : Number($event.target.value)" />
            <button class="set-del" @click="removeSet(idx)" :disabled="form.sets.length === 1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </template>

        <!-- Cardio columns -->
        <template v-else>
          <div class="set-row-header">
            <span class="set-col-num">#</span>
            <span class="set-col">Min</span>
            <span class="set-col">Level</span>
            <span class="set-col">Rest (s)</span>
            <span class="set-col-del" />
          </div>
          <div v-for="(set, idx) in form.sets" :key="idx" class="set-row set-row--cardio">
            <span class="set-col-num">{{ idx + 1 }}</span>
            <input class="set-input" type="number" inputmode="numeric"
              :value="set.duration" :min="1"
              :class="{ 'set-input--error': errors[`set_${idx}_duration`] }"
              @input="set.duration = $event.target.value === '' ? null : Number($event.target.value)" />
            <input class="set-input" type="number" inputmode="numeric"
              :value="set.level" :min="0"
              :class="{ 'set-input--error': errors[`set_${idx}_level`] }"
              @input="set.level = $event.target.value === '' ? null : Number($event.target.value)" />
            <input class="set-input" type="number" inputmode="numeric"
              :value="set.restSeconds" :min="0" :step="5"
              :class="{ 'set-input--error': errors[`set_${idx}_rest`] }"
              @input="set.restSeconds = $event.target.value === '' ? null : Number($event.target.value)" />
            <button class="set-del" @click="removeSet(idx)" :disabled="form.sets.length === 1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </template>

        <button class="add-set-btn" type="button" @click="addSet">+ Add set</button>
      </div>

      <AppTextarea v-model="form.notes" label="Notes (optional)" :rows="2" />
    </div>

    <template #actions>
      <AppButton variant="accent" full @click="submit">
        {{ editingId ? 'Save changes' : 'Add exercise' }}
      </AppButton>
      <AppButton variant="ghost" full @click="show = false">Cancel</AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { computed } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import ExerciseSearchInput from '@/features/library/components/ExerciseSearchInput.vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  form:       { type: Object, required: true },
  errors:     { type: Object, required: true },
  editingId:  { type: String, default: null },
  addSet:     { type: Function, required: true },
  removeSet:  { type: Function, required: true },
  setExerciseType: { type: Function, required: true },
})
const emit = defineEmits(['update:modelValue', 'submit'])

const show = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

function onLibrarySelect(item) {
  if (item?.type && item.type !== props.form.exerciseType) {
    props.setExerciseType(item.type)
  }
}

function submit() { emit('submit') }
</script>

<style scoped>
.exercise-form { display: flex; flex-direction: column; gap: var(--space-4); }

.sets-section { display: flex; flex-direction: column; gap: var(--space-2); }

.sets-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.sets-label { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--color-text-2); }
.sets-error { font-size: var(--text-xs); color: var(--color-danger); margin-left: auto; }

.set-row-header {
  display: grid;
  grid-template-columns: 20px 1fr 1fr 52px 1fr 24px;
  gap: var(--space-1);
  padding: 0 var(--space-1);
}

.set-row-header span {
  font-size: 10px;
  color: var(--color-text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: center;
}

.set-col-num { text-align: center; }
.set-col { text-align: center; }
.set-col-del { width: 24px; }

.set-row {
  display: grid;
  grid-template-columns: 20px 1fr 1fr 52px 1fr 24px;
  gap: var(--space-1);
  align-items: center;
}

/* Cardio: no unit toggle column */
.set-row--cardio,
.set-row--cardio + .set-row-header {
  grid-template-columns: 20px 1fr 1fr 1fr 24px;
}

.set-col-num {
  font-size: var(--text-xs);
  color: var(--color-text-3);
  text-align: center;
  font-weight: var(--font-bold);
}

.set-input {
  width: 100%;
  text-align: center;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-1);
  background-color: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-1);
  height: 36px;
  user-select: text;
  -webkit-user-select: text;
}

.set-input:focus { border-color: var(--color-border-focus); outline: none; }
.set-input--error { border-color: var(--color-danger); }

.unit-toggle {
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  height: 36px;
}

.unit-btn {
  flex: 1;
  font-size: 10px;
  font-weight: var(--font-medium);
  color: var(--color-text-2);
  background: transparent;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.unit-btn--active { background-color: var(--color-accent); color: #0f0f0f; }

.set-del {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  color: var(--color-text-3); border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}
.set-del:active { color: var(--color-danger); }
.set-del:disabled { opacity: 0.2; }

.add-set-btn {
  width: 100%; height: 32px;
  background: transparent;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-3); font-size: var(--text-sm);
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.add-set-btn:active { color: var(--color-text-1); border-color: var(--color-text-2); }
</style>
