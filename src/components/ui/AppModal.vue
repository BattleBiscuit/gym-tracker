<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="onBackdropClick">
        <div class="modal-card" role="dialog" :aria-label="title">
          <div v-if="title" class="modal-header">
            <span class="modal-title">{{ title }}</span>
            <button class="modal-close" @click="$emit('update:modelValue', false)" aria-label="Close">✕</button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.actions" class="modal-actions">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue:    { type: Boolean, required: true },
  title:         { type: String, default: '' },
  closeOnBackdrop: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

function onBackdropClick() {
  if (props.closeOnBackdrop) emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
}

.modal-card {
  background-color: var(--color-surface-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-5) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-1);
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: var(--color-text-2);
  font-size: var(--text-sm);
  transition: background-color var(--transition-fast);
}
.modal-close:active { background-color: var(--color-surface-3); }

.modal-body {
  padding: var(--space-5);
}

.modal-actions {
  padding: var(--space-4) var(--space-5) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border-top: 1px solid var(--color-border);
}

/* Transition */
.modal-enter-active, .modal-leave-active {
  transition: opacity var(--transition-normal);
}
.modal-enter-active .modal-card, .modal-leave-active .modal-card {
  transition: transform var(--transition-normal);
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-card {
  transform: translateY(40px);
}
.modal-leave-to .modal-card {
  transform: translateY(40px);
}
</style>
