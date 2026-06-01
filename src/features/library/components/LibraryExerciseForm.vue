<template>
  <AppModal v-model="show" :title="editingId ? 'Edit Exercise' : 'New Exercise'">
    <div class="lib-form">
      <AppInput v-model="form.name" label="Name" placeholder="e.g. Leg Press" :error="errors.name" />

      <div class="field">
        <label class="field-label">Type</label>
        <div class="type-toggle">
          <button
            v-for="t in types" :key="t.value" type="button"
            :class="['type-btn', { 'type-btn--active': form.type === t.value }]"
            @click="form.type = t.value"
          >{{ t.label }}</button>
        </div>
      </div>

      <div class="field">
        <label class="field-label">Primary muscles</label>
        <div class="muscle-chips">
          <button
            v-for="m in MUSCLES" :key="m" type="button"
            :class="['muscle-chip', { 'muscle-chip--active': form.primaryMuscles.includes(m) }]"
            @click="toggleMuscle('primaryMuscles', m)"
          >{{ m }}</button>
        </div>
      </div>

      <div class="field">
        <label class="field-label">Secondary muscles <span class="optional">(optional)</span></label>
        <div class="muscle-chips">
          <button
            v-for="m in MUSCLES" :key="m" type="button"
            :class="['muscle-chip', { 'muscle-chip--active': form.secondaryMuscles.includes(m) }]"
            @click="toggleMuscle('secondaryMuscles', m)"
          >{{ m }}</button>
        </div>
      </div>

      <AppTextarea v-model="form.notes" label="Notes (optional)" :rows="2" />
    </div>
    <template #actions>
      <AppButton variant="accent" full @click="submit">{{ editingId ? 'Save' : 'Add to library' }}</AppButton>
      <AppButton variant="ghost" full @click="show = false">Cancel</AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'

const MUSCLES = [
  'Chest', 'Shoulders', 'Arms', 'Back', 'Core', 'Legs', 'Glutes',
]

const types = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio',   label: 'Cardio'   },
]

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  initial:    { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'save'])

const show = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const editingId = ref(null)
const form = reactive({ name: '', type: 'strength', primaryMuscles: [], secondaryMuscles: [], notes: '' })
const errors = reactive({})

function open(exercise = null) {
  editingId.value = exercise?.id || null
  form.name             = exercise?.name             || ''
  form.type             = exercise?.type             || 'strength'
  form.primaryMuscles   = (exercise?.primaryMuscles   || []).filter(m => MUSCLES.includes(m))
  form.secondaryMuscles = (exercise?.secondaryMuscles || []).filter(m => MUSCLES.includes(m))
  form.notes            = exercise?.notes            || ''
  Object.keys(errors).forEach(k => delete errors[k])
}

function toggleMuscle(field, muscle) {
  const arr = form[field]
  const idx = arr.indexOf(muscle)
  if (idx === -1) arr.push(muscle)
  else arr.splice(idx, 1)
}

function submit() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.name.trim()) { errors.name = 'Name is required'; return }
  emit('save', {
    id:               editingId.value,
    name:             form.name.trim(),
    type:             form.type,
    primaryMuscles:   [...form.primaryMuscles],
    secondaryMuscles: [...form.secondaryMuscles],
    notes:            form.notes.trim(),
  })
  show.value = false
}

defineExpose({ open })
</script>

<style scoped>
.lib-form { display: flex; flex-direction: column; gap: var(--space-4); }

.field { display: flex; flex-direction: column; gap: var(--space-2); }

.field-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-2);
}

.optional { color: var(--color-text-3); font-weight: var(--font-normal); }

.type-toggle { display: flex; gap: var(--space-2); }

.type-btn {
  flex: 1;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text-2);
  background: transparent;
  transition: all var(--transition-fast);
}
.type-btn--active { background: var(--color-accent); color: #0f0f0f; border-color: var(--color-accent); font-weight: var(--font-semibold); }

.muscle-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }

.muscle-chip {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--color-text-2);
  background: transparent;
  transition: all var(--transition-fast);
}
.muscle-chip--active { background: var(--color-surface-3); color: var(--color-text-1); border-color: var(--color-text-2); }
</style>
