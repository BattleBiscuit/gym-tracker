<template>
  <div class="app-input-wrap">
    <label v-if="label" :for="inputId" class="app-input-label">{{ label }}</label>
    <input
      :id="inputId"
      :class="['app-input', { 'app-input--error': error }]"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      :inputmode="inputmode"
      v-bind="$attrs"
      @input="$emit('update:modelValue', type === 'number' ? ($event.target.value === '' ? null : parseFloat($event.target.value)) : $event.target.value)"
    />
    <span v-if="error" class="app-input-error">{{ error }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { default: null },
  label:      { type: String, default: '' },
  type:       { type: String, default: 'text' },
  placeholder:{ type: String, default: '' },
  disabled:   { type: Boolean, default: false },
  error:      { type: String, default: '' },
  min:        { default: undefined },
  max:        { default: undefined },
  step:       { default: undefined },
  inputmode:  { type: String, default: undefined },
  id:         { type: String, default: '' },
})
defineEmits(['update:modelValue'])

const inputId = computed(() => props.id || `input-${Math.random().toString(36).slice(2)}`)
</script>

<style scoped>
.app-input-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.app-input-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-2);
}

.app-input {
  width: 100%;
  min-height: var(--touch-target-min);
  padding: 0 var(--space-4);
  background-color: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-1);
  font-size: var(--text-base);
  transition: border-color var(--transition-fast);
}

.app-input:focus {
  border-color: var(--color-border-focus);
}

.app-input--error {
  border-color: var(--color-danger);
}

.app-input:disabled {
  opacity: 0.4;
}

.app-input-error {
  font-size: var(--text-xs);
  color: var(--color-danger);
}
</style>
