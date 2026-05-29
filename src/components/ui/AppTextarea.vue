<template>
  <div class="app-textarea-wrap">
    <label v-if="label" :for="taId" class="app-textarea-label">{{ label }}</label>
    <textarea
      :id="taId"
      class="app-textarea"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      v-bind="$attrs"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label:      { type: String, default: '' },
  placeholder:{ type: String, default: '' },
  rows:       { type: Number, default: 3 },
  disabled:   { type: Boolean, default: false },
  id:         { type: String, default: '' },
})
defineEmits(['update:modelValue'])

const taId = computed(() => props.id || `ta-${Math.random().toString(36).slice(2)}`)
</script>

<style scoped>
.app-textarea-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.app-textarea-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-2);
}

.app-textarea {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-1);
  font-size: var(--text-base);
  resize: vertical;
  transition: border-color var(--transition-fast);
}

.app-textarea:focus {
  border-color: var(--color-border-focus);
}

.app-textarea:disabled {
  opacity: 0.4;
}
</style>
