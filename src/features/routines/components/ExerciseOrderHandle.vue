<template>
  <div
    class="order-handle"
    @touchstart.prevent="onTouchStart"
    @mousedown.prevent="onMouseDown"
    aria-label="Drag to reorder"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="8" y1="6" x2="16" y2="6"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
      <line x1="8" y1="18" x2="16" y2="18"/>
    </svg>
  </div>
</template>

<script setup>
const emit = defineEmits(['dragstart', 'drag', 'dragend'])

function onTouchStart(e) {
  emit('dragstart', e.touches[0].clientY)

  function onMove(e) { emit('drag', e.touches[0].clientY) }
  function onEnd() {
    emit('dragend')
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
  }
  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('touchend', onEnd)
}

function onMouseDown(e) {
  emit('dragstart', e.clientY)

  function onMove(e) { emit('drag', e.clientY) }
  function onEnd() {
    emit('dragend')
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
}
</script>

<style scoped>
.order-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-target-min);
  height: var(--touch-target-min);
  color: var(--color-text-3);
  cursor: grab;
  touch-action: none;
}
.order-handle:active { cursor: grabbing; }
</style>
